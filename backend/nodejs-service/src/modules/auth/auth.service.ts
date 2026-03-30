import { createHash, randomInt, randomUUID } from "crypto";

import type { AuthProvider, UserRole } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

import { env } from "../../config/env";
import { AppError } from "../../common/errors/app-error";
import { hashPassword, verifyPassword } from "../../common/security/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../common/security/jwt";
import { AuditService } from "../../common/audit/audit.service";
import { EmailService } from "../../infrastructure/communications/email.service";
import { ClerkService } from "../../infrastructure/auth/clerk.service";
import { GoogleAuthService } from "../../infrastructure/auth/google-auth.service";
import { AuthRepository } from "./auth.repository";
import { AuthSecurityService } from "./auth-security.service";

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
    private readonly db: PrismaClient,
    private readonly repository: AuthRepository,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
    private readonly clerkService: ClerkService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly authSecurityService: AuthSecurityService
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
    await this.authSecurityService.assertRegistrationAllowed(input.ipAddress);
    await this.authSecurityService.recordRegistrationAttempt(input.ipAddress);
    this.requireStrongPassword(input.password, [email, username, input.fullName]);

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

    const sessionUser = await this.ensureCreatorProfileIfNeeded(user);
    const verification = await this.sendEmailVerificationCode(sessionUser);
    const tokens = await this.issueTokens(sessionUser.id, sessionUser.email, sessionUser.role, input.ipAddress, input.userAgent);

    await this.auditService.record({
      actorId: sessionUser.id,
      actorRole: sessionUser.role,
      action: "auth.register",
      resource: "user",
      resourceId: sessionUser.id,
      ipAddress: input.ipAddress,
      metadata: {
        authProvider: "local",
        username: sessionUser.username
      }
    });

    return this.buildSessionResponse(sessionUser, tokens, verification);
  }

  async login(input: { identifier: string; password: string; ipAddress?: string; userAgent?: string }) {
    const normalizedIdentifier = input.identifier.trim().toLowerCase();
    await this.authSecurityService.assertLoginAllowed(normalizedIdentifier, input.ipAddress);

    const user = await this.findUserByIdentifier(normalizedIdentifier);
    if (!user || !user.passwordHash || !(await verifyPassword(user.passwordHash, input.password))) {
      await this.authSecurityService.recordLoginFailure(normalizedIdentifier, input.ipAddress);
      throw new AppError("Invalid credentials.", 401);
    }

    if (user.isSuspended) {
      throw new AppError("Account is suspended.", 403);
    }

    await this.authSecurityService.clearLoginFailures(normalizedIdentifier, input.ipAddress);
    await this.repository.updateLastLogin(user.id);
    const sessionUser = await this.ensureCreatorProfileIfNeeded(user);
    const tokens = await this.issueTokens(sessionUser.id, sessionUser.email, sessionUser.role, input.ipAddress, input.userAgent);

    await this.auditService.record({
      actorId: sessionUser.id,
      actorRole: sessionUser.role,
      action: "auth.login",
      resource: "user",
      resourceId: sessionUser.id,
      ipAddress: input.ipAddress,
      metadata: {
        authProvider: "local"
      }
    });

    return this.buildSessionResponse(sessionUser, tokens);
  }

  async signInWithGoogle(input: {
    idToken?: string;
    clerkToken?: string;
    role?: "viewer" | "creator";
    ipAddress?: string;
    userAgent?: string;
  }) {
    if (input.clerkToken) {
      const clerkSession = await this.clerkService.verifyGoogleSession(input.clerkToken);
      const existingIdentity = await this.repository.findIdentity("google", clerkSession.user.googleProviderUserId);

      const user = await this.clerkService.syncToDatabase(
        {
          id: clerkSession.user.id,
          primaryEmailAddressId: null,
          emailAddresses: [
            {
              emailAddress: clerkSession.user.email,
              verification: {
                status: clerkSession.user.emailVerified ? "verified" : "unverified"
              }
            }
          ],
          firstName: clerkSession.user.firstName,
          lastName: clerkSession.user.lastName,
          imageUrl: clerkSession.user.imageUrl,
          publicMetadata: clerkSession.user.publicMetadata,
          externalAccounts: [
            {
              provider: "google",
              providerUserId: clerkSession.user.googleProviderUserId
            }
          ]
        },
        this.db,
        (input.role ?? "viewer") as UserRole
      );

      if (user.isSuspended) {
        throw new AppError("Account is suspended.", 403);
      }

      await this.repository.updateLastLogin(user.id);
      const sessionUser = await this.ensureCreatorProfileIfNeeded(user);
      const tokens = await this.issueTokens(sessionUser.id, sessionUser.email, sessionUser.role, input.ipAddress, input.userAgent);

      await this.auditService.record({
        actorId: sessionUser.id,
        actorRole: sessionUser.role,
        action: "auth.google.login",
        resource: "user",
        resourceId: sessionUser.id,
        ipAddress: input.ipAddress,
        metadata: {
          authProvider: "google",
          broker: "clerk",
          clerkUserId: clerkSession.user.id,
          clerkSessionId: clerkSession.sessionId,
          linkedByEmail: !existingIdentity
        }
      });

      return this.buildSessionResponse(sessionUser, tokens);
    }

    if (!input.idToken) {
      throw new AppError("Google token is required.", 400);
    }

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
    const sessionUser = await this.ensureCreatorProfileIfNeeded(user);
    const tokens = await this.issueTokens(sessionUser.id, sessionUser.email, sessionUser.role, input.ipAddress, input.userAgent);

    await this.auditService.record({
      actorId: sessionUser.id,
      actorRole: sessionUser.role,
      action: "auth.google.login",
      resource: "user",
      resourceId: sessionUser.id,
      ipAddress: input.ipAddress,
      metadata: {
        authProvider: "google",
        linkedByEmail: !existingIdentity
      }
    });

    return this.buildSessionResponse(sessionUser, tokens);
  }

  async refresh(refreshToken: string, context?: { ipAddress?: string; userAgent?: string }) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError("Refresh token is invalid.", 401);
    }

    const refreshTokenHash = sha256(refreshToken);
    const matched = await this.repository.findActiveRefreshTokenByHash(refreshTokenHash);
    if (!matched || matched.userId !== payload.sub) {
      const existing = await this.repository.findRefreshTokenByHash(refreshTokenHash);
      if (
        existing &&
        existing.userId === payload.sub &&
        existing.revokedAt &&
        existing.expiresAt > new Date()
      ) {
        await this.repository.revokeAllRefreshTokensForUser(existing.userId);
        await this.auditService.record({
          actorId: existing.userId,
          action: "auth.refresh_token.reuse_detected",
          resource: "refresh_token",
          resourceId: existing.id,
          ipAddress: context?.ipAddress
        });
      }

      throw new AppError("Refresh token is invalid.", 401);
    }

    await this.repository.revokeRefreshToken(matched.id);

    const user = await this.repository.findUserById(payload.sub);
    if (!user || user.isSuspended) {
      throw new AppError("Account is unavailable.", 403);
    }

    const sessionUser = await this.ensureCreatorProfileIfNeeded(user);
    const tokens = await this.issueTokens(sessionUser.id, sessionUser.email, sessionUser.role, context?.ipAddress, context?.userAgent);
    return this.buildSessionResponse(sessionUser, tokens);
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

  async requestEmailVerification(userId: string, context?: { ipAddress?: string }) {
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

    await this.authSecurityService.assertEmailVerificationRequestAllowed(userId, context?.ipAddress);
    await this.authSecurityService.recordEmailVerificationRequest(userId, context?.ipAddress);
    const result = await this.sendEmailVerificationCode(user);
    return {
      accepted: true,
      message: "Verification code sent.",
      ...result
    };
  }

  async confirmEmailVerification(input: { email: string; code: string }, context?: { ipAddress?: string }) {
    const normalizedEmail = input.email.trim().toLowerCase();
    await this.authSecurityService.assertEmailVerificationConfirmationAllowed(normalizedEmail, context?.ipAddress);

    const user = await this.repository.findUserByEmail(normalizedEmail);
    if (!user) {
      await this.authSecurityService.recordEmailVerificationConfirmationFailure(normalizedEmail, context?.ipAddress);
      throw new AppError("Verification code is invalid or expired.", 400);
    }

    if (user.emailVerifiedAt) {
      await this.authSecurityService.clearEmailVerificationConfirmationFailures(normalizedEmail, context?.ipAddress);
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
      await this.authSecurityService.recordEmailVerificationConfirmationFailure(normalizedEmail, context?.ipAddress);
      throw new AppError("Verification code is invalid or expired.", 400);
    }

    await this.repository.consumeOneTimeCode(matching.id);
    const updatedUser = await this.repository.updateEmailVerification(user.id, new Date());
    await this.authSecurityService.clearEmailVerificationConfirmationFailures(normalizedEmail, context?.ipAddress);

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

  async requestPasswordReset(email: string, context?: { ipAddress?: string }) {
    const normalizedEmail = email.trim().toLowerCase();
    await this.authSecurityService.assertPasswordResetRequestAllowed(normalizedEmail, context?.ipAddress);
    await this.authSecurityService.recordPasswordResetRequest(normalizedEmail, context?.ipAddress);

    const user = await this.repository.findUserByEmail(normalizedEmail);
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

  async confirmPasswordReset(input: { email: string; code: string; password: string }, context?: { ipAddress?: string }) {
    const normalizedEmail = input.email.trim().toLowerCase();
    await this.authSecurityService.assertPasswordResetConfirmationAllowed(normalizedEmail, context?.ipAddress);

    const user = await this.repository.findUserByEmail(normalizedEmail);
    if (!user) {
      await this.authSecurityService.recordPasswordResetConfirmationFailure(normalizedEmail, context?.ipAddress);
      throw new AppError("Password reset code is invalid or expired.", 400);
    }

    const matching = await this.repository.findValidOneTimeCode(
      user.id,
      "password_reset",
      sha256(input.code.trim())
    );

    if (!matching) {
      await this.authSecurityService.recordPasswordResetConfirmationFailure(normalizedEmail, context?.ipAddress);
      throw new AppError("Password reset code is invalid or expired.", 400);
    }

    this.requireStrongPassword(input.password, [
      user.email,
      user.username,
      `${user.firstName} ${user.lastName}`.trim()
    ]);
    const passwordHash = await hashPassword(input.password);
    await this.repository.updatePassword(user.id, passwordHash);
    await this.ensureLocalIdentity(user);
    await this.repository.consumeOneTimeCode(matching.id);
    await this.repository.revokeAllRefreshTokensForUser(user.id);
    await this.authSecurityService.clearPasswordResetConfirmationFailures(normalizedEmail, context?.ipAddress);

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

  async linkGoogleAccount(userId: string, input: { idToken?: string; clerkToken?: string }) {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    const googleProfile = input.idToken
      ? await this.googleAuthService.verifyIdToken(input.idToken)
      : null;
    const clerkProfile = input.clerkToken
      ? await this.clerkService.verifyGoogleSession(input.clerkToken)
      : null;

    if (!googleProfile && !clerkProfile) {
      throw new AppError("Google token is required.", 400);
    }

    const providerUserId = googleProfile?.providerUserId ?? clerkProfile?.user.googleProviderUserId;
    const email = googleProfile?.email ?? clerkProfile?.user.email;
    const emailVerified = googleProfile?.emailVerified ?? clerkProfile?.user.emailVerified ?? false;

    if (!providerUserId || !email) {
      throw new AppError("Google account could not be verified.", 400);
    }

    const existingIdentity = await this.repository.findIdentity("google", providerUserId);
    if (existingIdentity && existingIdentity.userId !== user.id) {
      throw new AppError("This Google account is already linked to another user.", 409);
    }

    if (email !== user.email) {
      throw new AppError("The Google account email must match your LiveGate account email.", 400);
    }

    const linked = await this.repository.findIdentityForUser(user.id, "google");
    if (!linked) {
      await this.repository.linkIdentity(user.id, {
        provider: "google",
        providerUserId,
        email
      });
    }

    const updatedUser = emailVerified && !user.emailVerifiedAt
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

    this.requireStrongPassword(password, [
      user.email,
      user.username,
      `${user.firstName} ${user.lastName}`.trim()
    ]);
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

  private requireStrongPassword(password: string, disallowedValues: string[] = []) {
    if (
      password.length < 12 ||
      password.length > 72 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/\d/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      throw new AppError(
        "Password must be 12-72 characters and include uppercase, lowercase, number, and symbol.",
        400
      );
    }

    const normalizedPassword = password.toLowerCase();
    const forbiddenFragments = disallowedValues
      .flatMap((value) => value.split(/[^a-zA-Z0-9]+/))
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length >= 3);

    for (const fragment of forbiddenFragments) {
      if (normalizedPassword.includes(fragment)) {
        throw new AppError("Password must not contain your name, email, or username.", 400);
      }
    }
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

  private async ensureCreatorProfileIfNeeded(user: AuthUser) {
    if (user.role !== "creator" || user.creatorProfile) {
      return user;
    }

    return this.repository.ensureCreatorProfile(user.id, {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName
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
