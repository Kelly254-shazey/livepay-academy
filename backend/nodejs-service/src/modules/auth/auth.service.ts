import { createHash, randomInt, randomUUID } from "crypto";

import type { AuthProvider, UserRole } from "@prisma/client";

import { env } from "../../config/env";
import { AppError } from "../../common/errors/app-error";
import { hashPassword, verifyPassword } from "../../common/security/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../common/security/jwt";
import { AuditService } from "../../common/audit/audit.service";
import { EmailService } from "../../infrastructure/communications/email.service";
import { GoogleAuthService } from "../../infrastructure/auth/google-auth.service";
import { AuthRepository } from "./auth.repository";

type AuthUser = NonNullable<Awaited<ReturnType<AuthRepository["findUserById"]>>>;

const SUPPORTED_GENDERS = new Set(["male", "female", "prefer_not_to_say", "custom"]);

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function splitFullName(fullName: string) {
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  const [firstName, ...rest] = trimmed.split(" ");

  return {
    firstName: firstName || "LiveGate",
    lastName: rest.join(" ") || "User"
  };
}

function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function createNumericCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) {
    return email;
  }

  const visible = local.length <= 2 ? local[0] ?? "*" : `${local[0]}${local[1]}`;
  return `${visible}${"*".repeat(Math.max(local.length - visible.length, 1))}@${domain}`;
}

function toIsoDate(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : undefined;
}

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
    private readonly googleAuthService: GoogleAuthService
  ) {}

  async register(input: {
    email: string;
    password: string;
    fullName: string;
    username: string;
    role: "viewer" | "creator";
    dateOfBirth: string;
    gender: string;
    customGender?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const email = input.email.trim().toLowerCase();
    const username = this.requireUsername(input.username);
    const dateOfBirth = this.requireDateOfBirth(input.dateOfBirth);
    const gender = this.requireGender(input.gender, input.customGender);

    const [existingEmail, existingUsername] = await Promise.all([
      this.repository.findUserByEmail(email),
      this.repository.findUserByUsername(username)
    ]);

    if (existingEmail) {
      throw new AppError("Email is already registered.", 409);
    }

    if (existingUsername) {
      throw new AppError("Username is already taken.", 409);
    }

    const names = splitFullName(input.fullName);
    const user = await this.repository.createUserWithIdentity({
      email,
      username,
      passwordHash: await hashPassword(input.password),
      firstName: names.firstName,
      lastName: names.lastName,
      role: input.role as UserRole,
      dateOfBirth,
      gender: gender.gender,
      customGender: gender.customGender,
      profileCompletedAt: new Date(),
      identity: {
        provider: "local",
        providerUserId: email,
        email
      }
    });

    const verification = await this.sendEmailVerificationCode(user);
    const tokens = await this.issueTokens(user.id, user.email, user.role, input.ipAddress, input.userAgent);

    await this.auditService.record({
      actorId: user.id,
      actorRole: user.role,
      action: "auth.register",
      resource: "user",
      resourceId: user.id,
      ipAddress: input.ipAddress,
      metadata: {
        authProvider: "local",
        username: user.username
      }
    });

    return this.buildSessionResponse(user, tokens, verification);
  }

  async login(input: { identifier: string; password: string; ipAddress?: string; userAgent?: string }) {
    const user = await this.findUserByIdentifier(input.identifier);
    if (!user || !user.passwordHash || !(await verifyPassword(user.passwordHash, input.password))) {
      throw new AppError("Invalid credentials.", 401);
    }

    if (user.isSuspended) {
      throw new AppError("Account is suspended.", 403);
    }

    await this.repository.updateLastLogin(user.id);
    const tokens = await this.issueTokens(user.id, user.email, user.role, input.ipAddress, input.userAgent);

    await this.auditService.record({
      actorId: user.id,
      actorRole: user.role,
      action: "auth.login",
      resource: "user",
      resourceId: user.id,
      ipAddress: input.ipAddress,
      metadata: {
        authProvider: "local"
      }
    });

    return this.buildSessionResponse(user, tokens);
  }

  async signInWithGoogle(input: {
    idToken: string;
    role?: "viewer" | "creator";
    ipAddress?: string;
    userAgent?: string;
  }) {
    const googleProfile = await this.googleAuthService.verifyIdToken(input.idToken);
    const existingIdentity = await this.repository.findIdentity("google", googleProfile.providerUserId);

    let user = existingIdentity?.user ?? null;

    if (!user) {
      const emailMatch = await this.repository.findUserByEmail(googleProfile.email);
      if (emailMatch) {
        if (emailMatch.isSuspended) {
          throw new AppError("Account is suspended.", 403);
        }

        const linked = await this.repository.findIdentityForUser(emailMatch.id, "google");
        if (!linked) {
          await this.repository.linkIdentity(emailMatch.id, {
            provider: "google",
            providerUserId: googleProfile.providerUserId,
            email: googleProfile.email
          });
        }

        user = googleProfile.emailVerified && !emailMatch.emailVerifiedAt
          ? await this.repository.updateEmailVerification(emailMatch.id, new Date())
          : await this.repository.findUserById(emailMatch.id);
      } else {
        const generatedUsername = await this.generateAvailableUsername(
          googleProfile.email.split("@")[0] || googleProfile.fullName || "livegate"
        );
        const names = splitFullName(googleProfile.fullName ?? `${googleProfile.firstName ?? ""} ${googleProfile.lastName ?? ""}`);

        user = await this.repository.createUserWithIdentity({
          email: googleProfile.email,
          username: generatedUsername,
          firstName: names.firstName,
          lastName: names.lastName,
          role: (input.role ?? "viewer") as UserRole,
          avatarUrl: googleProfile.avatarUrl,
          emailVerifiedAt: googleProfile.emailVerified ? new Date() : null,
          profileCompletedAt: null,
          identity: {
            provider: "google",
            providerUserId: googleProfile.providerUserId,
            email: googleProfile.email
          }
        });
      }
    }

    if (!user) {
      throw new AppError("Google sign-in could not be completed.", 500);
    }

    if (user.isSuspended) {
      throw new AppError("Account is suspended.", 403);
    }

    await this.repository.updateLastLogin(user.id);
    const tokens = await this.issueTokens(user.id, user.email, user.role, input.ipAddress, input.userAgent);

    await this.auditService.record({
      actorId: user.id,
      actorRole: user.role,
      action: "auth.google.login",
      resource: "user",
      resourceId: user.id,
      ipAddress: input.ipAddress,
      metadata: {
        authProvider: "google",
        linkedByEmail: !existingIdentity
      }
    });

    return this.buildSessionResponse(user, tokens);
  }

  async refresh(refreshToken: string, context?: { ipAddress?: string; userAgent?: string }) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError("Refresh token is invalid.", 401);
    }

    const matched = await this.repository.findActiveRefreshTokenByHash(sha256(refreshToken));
    if (!matched || matched.userId !== payload.sub) {
      throw new AppError("Refresh token is invalid.", 401);
    }

    await this.repository.revokeRefreshToken(matched.id);

    const user = await this.repository.findUserById(payload.sub);
    if (!user || user.isSuspended) {
      throw new AppError("Account is unavailable.", 403);
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role, context?.ipAddress, context?.userAgent);
    return this.buildSessionResponse(user, tokens);
  }

  async logout(refreshToken: string, actor?: { userId: string; role: UserRole; ipAddress?: string }) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError("Refresh token is invalid.", 401);
    }

    const matched = await this.repository.findActiveRefreshTokenByHash(sha256(refreshToken));
    if (matched && matched.userId === payload.sub) {
      await this.repository.revokeRefreshToken(matched.id);
    }

    if (actor) {
      await this.auditService.record({
        actorId: actor.userId,
        actorRole: actor.role,
        action: "auth.logout",
        resource: "refresh_token",
        resourceId: matched?.id,
        ipAddress: actor.ipAddress
      });
    }
  }

  async requestEmailVerification(userId: string) {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    if (user.emailVerifiedAt) {
      return {
        accepted: true,
        message: "Email is already verified."
      };
    }

    const result = await this.sendEmailVerificationCode(user);
    return {
      accepted: true,
      message: "Verification code sent.",
      ...result
    };
  }

  async confirmEmailVerification(input: { email: string; code: string }) {
    const user = await this.repository.findUserByEmail(input.email.trim().toLowerCase());
    if (!user) {
      throw new AppError("Verification code is invalid or expired.", 400);
    }

    if (user.emailVerifiedAt) {
      return {
        accepted: true,
        message: "Email is already verified.",
        user: this.toSessionUser(user),
        nextStep: this.getNextStep(user)
      };
    }

    const matching = await this.repository.findValidOneTimeCode(
      user.id,
      "email_verification",
      sha256(input.code.trim())
    );

    if (!matching) {
      throw new AppError("Verification code is invalid or expired.", 400);
    }

    await this.repository.consumeOneTimeCode(matching.id);
    const updatedUser = await this.repository.updateEmailVerification(user.id, new Date());

    await this.auditService.record({
      actorId: updatedUser.id,
      actorRole: updatedUser.role,
      action: "auth.email.verified",
      resource: "user",
      resourceId: updatedUser.id
    });

    return {
      accepted: true,
      message: "Email verified successfully.",
      user: this.toSessionUser(updatedUser),
      nextStep: this.getNextStep(updatedUser)
    };
  }

  async requestPasswordReset(email: string) {
    const user = await this.repository.findUserByEmail(email.trim().toLowerCase());
    if (!user) {
      return {
        accepted: true,
        message: "If the email exists, reset instructions were sent."
      };
    }

    const result = await this.sendPasswordResetCode(user);

    await this.auditService.record({
      actorId: user.id,
      actorRole: user.role,
      action: "auth.password_reset.requested",
      resource: "user",
      resourceId: user.id
    });

    return {
      accepted: true,
      message: "Password reset instructions sent.",
      ...result
    };
  }

  async confirmPasswordReset(input: { email: string; code: string; password: string }) {
    const user = await this.repository.findUserByEmail(input.email.trim().toLowerCase());
    if (!user) {
      throw new AppError("Password reset code is invalid or expired.", 400);
    }

    const matching = await this.repository.findValidOneTimeCode(
      user.id,
      "password_reset",
      sha256(input.code.trim())
    );

    if (!matching) {
      throw new AppError("Password reset code is invalid or expired.", 400);
    }

    const passwordHash = await hashPassword(input.password);
    await this.repository.updatePassword(user.id, passwordHash);
    await this.ensureLocalIdentity(user);
    await this.repository.consumeOneTimeCode(matching.id);
    await this.repository.revokeAllRefreshTokensForUser(user.id);

    const updatedUser = await this.repository.findUserById(user.id);
    if (!updatedUser) {
      throw new AppError("User not found.", 404);
    }

    await this.auditService.record({
      actorId: updatedUser.id,
      actorRole: updatedUser.role,
      action: "auth.password_reset.completed",
      resource: "user",
      resourceId: updatedUser.id
    });

    return {
      accepted: true,
      message: "Password reset successful."
    };
  }

  async completeProfile(
    userId: string,
    input: {
      fullName: string;
      username: string;
      dateOfBirth: string;
      gender: string;
      customGender?: string;
    }
  ) {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    const username = this.requireUsername(input.username);
    const existingUsername = await this.repository.findUserByUsername(username);
    if (existingUsername && existingUsername.id !== user.id) {
      throw new AppError("Username is already taken.", 409);
    }

    const names = splitFullName(input.fullName);
    const gender = this.requireGender(input.gender, input.customGender);
    const updatedUser = await this.repository.updateProfileCompletion(user.id, {
      username,
      firstName: names.firstName,
      lastName: names.lastName,
      dateOfBirth: this.requireDateOfBirth(input.dateOfBirth),
      gender: gender.gender,
      customGender: gender.customGender
    });

    await this.auditService.record({
      actorId: updatedUser.id,
      actorRole: updatedUser.role,
      action: "auth.profile.completed",
      resource: "user",
      resourceId: updatedUser.id
    });

    return {
      accepted: true,
      message: "Profile completed successfully.",
      user: this.toSessionUser(updatedUser),
      nextStep: this.getNextStep(updatedUser)
    };
  }

  async linkGoogleAccount(userId: string, idToken: string) {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    const googleProfile = await this.googleAuthService.verifyIdToken(idToken);
    const existingIdentity = await this.repository.findIdentity("google", googleProfile.providerUserId);
    if (existingIdentity && existingIdentity.userId !== user.id) {
      throw new AppError("This Google account is already linked to another user.", 409);
    }

    if (googleProfile.email !== user.email) {
      throw new AppError("The Google account email must match your LiveGate account email.", 400);
    }

    const linked = await this.repository.findIdentityForUser(user.id, "google");
    if (!linked) {
      await this.repository.linkIdentity(user.id, {
        provider: "google",
        providerUserId: googleProfile.providerUserId,
        email: googleProfile.email
      });
    }

    const updatedUser = googleProfile.emailVerified && !user.emailVerifiedAt
      ? await this.repository.updateEmailVerification(user.id, new Date())
      : await this.repository.findUserById(user.id);

    if (!updatedUser) {
      throw new AppError("User not found.", 404);
    }

    await this.auditService.record({
      actorId: updatedUser.id,
      actorRole: updatedUser.role,
      action: "auth.google.linked",
      resource: "user",
      resourceId: updatedUser.id
    });

    return {
      accepted: true,
      message: "Google sign-in linked successfully.",
      user: this.toSessionUser(updatedUser)
    };
  }

  async linkPassword(userId: string, password: string) {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    const existingLocalIdentity = await this.repository.findIdentityForUser(user.id, "local");
    if (existingLocalIdentity && user.passwordHash) {
      throw new AppError("Password sign-in is already enabled for this account.", 409);
    }

    await this.repository.updatePassword(user.id, await hashPassword(password));
    if (!existingLocalIdentity) {
      await this.repository.linkIdentity(user.id, {
        provider: "local",
        providerUserId: user.email,
        email: user.email
      });
    }

    const updatedUser = await this.repository.findUserById(user.id);
    if (!updatedUser) {
      throw new AppError("User not found.", 404);
    }

    await this.auditService.record({
      actorId: updatedUser.id,
      actorRole: updatedUser.role,
      action: "auth.password.linked",
      resource: "user",
      resourceId: updatedUser.id
    });

    return {
      accepted: true,
      message: "Password sign-in enabled.",
      user: this.toSessionUser(updatedUser)
    };
  }

  private async sendEmailVerificationCode(user: AuthUser) {
    const code = createNumericCode();
    await this.repository.replaceOneTimeCode(
      user.id,
      "email_verification",
      sha256(code),
      new Date(Date.now() + env.EMAIL_CODE_TTL_MINUTES * 60 * 1000)
    );

    const link = `${env.APP_BASE_URL}/auth/verify-email?email=${encodeURIComponent(user.email)}&code=${encodeURIComponent(code)}`;
    const delivery = await this.emailService.send({
      to: user.email,
      subject: "Verify your LiveGate email",
      text: [
        `Hi ${user.firstName},`,
        "",
        `Your LiveGate verification code is ${code}.`,
        `You can also verify using this link: ${link}`,
        "",
        `This code expires in ${env.EMAIL_CODE_TTL_MINUTES} minutes.`
      ].join("\n"),
      html: [
        `<p>Hi ${this.escapeHtml(user.firstName)},</p>`,
        `<p>Your LiveGate verification code is <strong>${code}</strong>.</p>`,
        `<p><a href="${link}">Verify your email</a></p>`,
        `<p>This code expires in ${env.EMAIL_CODE_TTL_MINUTES} minutes.</p>`
      ].join("")
    });

    return {
      verification: {
        email: maskEmail(user.email),
        previewCode: delivery.preview ? code : undefined
      }
    };
  }

  private async sendPasswordResetCode(user: AuthUser) {
    const code = createNumericCode();
    await this.repository.replaceOneTimeCode(
      user.id,
      "password_reset",
      sha256(code),
      new Date(Date.now() + env.PASSWORD_RESET_CODE_TTL_MINUTES * 60 * 1000)
    );

    const link = `${env.APP_BASE_URL}/auth/reset-password?email=${encodeURIComponent(user.email)}&code=${encodeURIComponent(code)}`;
    const delivery = await this.emailService.send({
      to: user.email,
      subject: "Reset your LiveGate password",
      text: [
        `Hi ${user.firstName},`,
        "",
        `Your LiveGate password reset code is ${code}.`,
        `You can also reset your password using this link: ${link}`,
        "",
        `This code expires in ${env.PASSWORD_RESET_CODE_TTL_MINUTES} minutes.`
      ].join("\n"),
      html: [
        `<p>Hi ${this.escapeHtml(user.firstName)},</p>`,
        `<p>Your LiveGate password reset code is <strong>${code}</strong>.</p>`,
        `<p><a href="${link}">Reset your password</a></p>`,
        `<p>This code expires in ${env.PASSWORD_RESET_CODE_TTL_MINUTES} minutes.</p>`
      ].join("")
    });

    return {
      reset: {
        email: maskEmail(user.email),
        previewCode: delivery.preview ? code : undefined
      }
    };
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: UserRole,
    ipAddress?: string,
    userAgent?: string
  ) {
    const accessToken = signAccessToken({ sub: userId, email, role });
    const refreshToken = signRefreshToken({ sub: userId, email });
    const accessExpiresAt = new Date(Date.now() + env.ACCESS_TOKEN_TTL_MINUTES * 60 * 1000);
    const refreshExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await this.repository.createRefreshToken({
      userId,
      tokenHash: sha256(refreshToken),
      expiresAt: refreshExpiresAt,
      ipAddress,
      userAgent
    });

    return {
      accessToken,
      refreshToken,
      expiresAt: accessExpiresAt.toISOString(),
      refreshExpiresAt: refreshExpiresAt.toISOString()
    };
  }

  private buildSessionResponse(
    user: AuthUser,
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresAt: string;
      refreshExpiresAt: string;
    },
    extra?: Record<string, unknown>
  ) {
    return {
      user: this.toSessionUser(user),
      tokens,
      nextStep: this.getNextStep(user),
      ...extra
    };
  }

  private toSessionUser(user: AuthUser) {
    return {
      id: user.id,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      username: user.username,
      role: user.role,
      roles: [user.role],
      avatarUrl: user.avatarUrl,
      emailVerified: Boolean(user.emailVerifiedAt),
      profileCompleted: Boolean(user.profileCompletedAt),
      dateOfBirth: toIsoDate(user.dateOfBirth),
      gender: user.gender ?? undefined,
      customGender: user.customGender ?? undefined,
      authProviders: user.identities.map((identity) => identity.provider)
    };
  }

  private getNextStep(user: AuthUser) {
    if (!user.emailVerifiedAt) {
      return "verify-email";
    }

    if (!user.profileCompletedAt) {
      return "complete-profile";
    }

    return null;
  }

  private requireUsername(username: string) {
    const normalized = normalizeUsername(username);
    if (normalized.length < 3 || normalized.length > 32) {
      throw new AppError("Username must be between 3 and 32 characters.", 400);
    }

    return normalized;
  }

  private requireDateOfBirth(value: string) {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      throw new AppError("Date of birth is invalid.", 400);
    }

    return parsed;
  }

  private requireGender(gender: string, customGender?: string) {
    const normalized = gender.trim().toLowerCase();
    if (!SUPPORTED_GENDERS.has(normalized)) {
      throw new AppError("Gender is invalid.", 400);
    }

    if (normalized === "custom") {
      const value = customGender?.trim();
      if (!value) {
        throw new AppError("Custom gender is required when gender is custom.", 400);
      }

      return {
        gender: normalized,
        customGender: value
      };
    }

    return {
      gender: normalized,
      customGender: null
    };
  }

  private async findUserByIdentifier(identifier: string) {
    const normalized = identifier.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    return normalized.includes("@")
      ? this.repository.findUserByEmail(normalized)
      : this.repository.findUserByUsername(normalized);
  }

  private async generateAvailableUsername(seed: string) {
    const normalizedSeed = normalizeUsername(seed);
    const base = this.requireUsername(
      normalizedSeed.length >= 3 ? normalizedSeed : `user_${randomUUID().replace(/-/g, "").slice(0, 8)}`
    );

    let candidate = base;
    let attempt = 0;

    while (await this.repository.findUserByUsername(candidate)) {
      attempt += 1;
      const suffix = randomUUID().replace(/-/g, "").slice(0, 6);
      candidate = `${base.slice(0, Math.max(3, 32 - suffix.length - 1))}_${suffix}`;

      if (attempt > 20) {
        throw new AppError("Could not allocate a unique username.", 500);
      }
    }

    return candidate;
  }

  private async ensureLocalIdentity(user: AuthUser) {
    const existing = await this.repository.findIdentityForUser(user.id, "local");
    if (existing) {
      return existing;
    }

    return this.repository.linkIdentity(user.id, {
      provider: "local",
      providerUserId: user.email,
      email: user.email
    });
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
}
