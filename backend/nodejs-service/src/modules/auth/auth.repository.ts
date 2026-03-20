import type { PrismaClient, UserRole } from "@prisma/client";

export class AuthRepository {
  constructor(private readonly db: PrismaClient) {}

  findUserByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email },
      include: { creatorProfile: true }
    });
  }

  findUserById(id: string) {
    return this.db.user.findUnique({
      where: { id },
      include: { creatorProfile: true }
    });
  }

  createUser(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  }) {
    return this.db.user.create({ data });
  }

  createRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    return this.db.refreshToken.create({
      data: { userId, tokenHash, expiresAt }
    });
  }

  listActiveRefreshTokens(userId: string) {
    return this.db.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  revokeRefreshToken(id: string) {
    return this.db.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() }
    });
  }

  createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    return this.db.passwordResetToken.create({
      data: { userId, tokenHash, expiresAt }
    });
  }

  listActivePasswordResetTokens(userId: string) {
    return this.db.passwordResetToken.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
        usedAt: null
      },
      orderBy: { createdAt: "desc" }
    });
  }

  findValidPasswordResetTokenByHash(tokenHash: string) {
    return this.db.passwordResetToken.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
        usedAt: null
      }
    });
  }

  usePasswordResetToken(id: string) {
    return this.db.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() }
    });
  }

  updatePassword(userId: string, passwordHash: string) {
    return this.db.user.update({
      where: { id: userId },
      data: { passwordHash }
    });
  }
}
