import { createHash, randomBytes } from "crypto";

import type { UserRole } from "@prisma/client";

import { env } from "../../config/env";
import { AppError } from "../../common/errors/app-error";
import { hashPassword, verifyPassword } from "../../common/security/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../common/security/jwt";
import { AuditService } from "../../common/audit/audit.service";
import { AuthRepository } from "./auth.repository";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly auditService: AuditService
  ) {}

  async register(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: "viewer" | "creator";
    ipAddress?: string;
  }) {
    const existing = await this.repository.findUserByEmail(input.email);
    if (existing) {
      throw new AppError("Email is already registered.", 409);
    }

    const user = await this.repository.createUser({
      email: input.email.toLowerCase(),
      passwordHash: await hashPassword(input.password),
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role as UserRole
    });

    const tokens = await this.issueTokens(user.id, user.email, user.role);

    await this.auditService.record({
      actorId: user.id,
      actorRole: user.role,
      action: "auth.register",
      resource: "user",
      resourceId: user.id,
      ipAddress: input.ipAddress
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      ...tokens
    };
  }

  async login(input: { email: string; password: string; ipAddress?: string }) {
    const user = await this.repository.findUserByEmail(input.email.toLowerCase());
    if (!user || !(await verifyPassword(user.passwordHash, input.password))) {
      throw new AppError("Invalid credentials.", 401);
    }

    if (user.isSuspended) {
      throw new AppError("Account is suspended.", 403);
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role);

    await this.auditService.record({
      actorId: user.id,
      actorRole: user.role,
      action: "auth.login",
      resource: "user",
      resourceId: user.id,
      ipAddress: input.ipAddress
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      ...tokens
    };
  }

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError("Refresh token is invalid.", 401);
    }
    const tokens = await this.repository.listActiveRefreshTokens(payload.sub);
    const matched = tokens.find((token) => token.tokenHash === sha256(refreshToken));
    if (!matched) {
      throw new AppError("Refresh token is invalid.", 401);
    }

    await this.repository.revokeRefreshToken(matched.id);

    const user = await this.repository.findUserById(payload.sub);
    if (!user || user.isSuspended) {
      throw new AppError("Account is unavailable.", 403);
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  async logout(refreshToken: string, actor?: { userId: string; role: UserRole; ipAddress?: string }) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError("Refresh token is invalid.", 401);
    }
    const tokens = await this.repository.listActiveRefreshTokens(payload.sub);
    const matched = tokens.find((token) => token.tokenHash === sha256(refreshToken));

    if (matched) {
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

  async requestPasswordReset(email: string) {
    const user = await this.repository.findUserByEmail(email.toLowerCase());
    if (!user) {
      return { accepted: true };
    }

    const rawToken = randomBytes(24).toString("hex");
    const preview = env.NODE_ENV === "production" ? undefined : rawToken;
    await this.repository.createPasswordResetToken(
      user.id,
      sha256(rawToken),
      new Date(Date.now() + 1000 * 60 * 30)
    );

    await this.auditService.record({
      actorId: user.id,
      actorRole: user.role,
      action: "auth.password_reset.requested",
      resource: "user",
      resourceId: user.id
    });

    return { accepted: true, previewToken: preview };
  }

  async confirmPasswordReset(token: string, password: string) {
    const tokenHash = sha256(token);
    const matching = await this.repository.findValidPasswordResetTokenByHash(tokenHash);
    if (!matching) {
      throw new AppError("Password reset token is invalid or expired.", 400);
    }

    const passwordHash = await hashPassword(password);
    await this.repository.updatePassword(matching.userId, passwordHash);
    await this.repository.usePasswordResetToken(matching.id);
    const user = await this.repository.findUserById(matching.userId);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    await this.auditService.record({
      actorId: user.id,
      actorRole: user.role,
      action: "auth.password_reset.completed",
      resource: "user",
      resourceId: user.id
    });

    return { accepted: true };
  }

  private async issueTokens(userId: string, email: string, role: UserRole) {
    const accessToken = signAccessToken({ sub: userId, email, role });
    const refreshToken = signRefreshToken({ sub: userId, email });
    await this.repository.createRefreshToken(
      userId,
      sha256(refreshToken),
      new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
    );

    return { accessToken, refreshToken };
  }
}
