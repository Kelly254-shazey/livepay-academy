import type { AuthProvider, OneTimeCodePurpose, PrismaClient, UserRole } from "@prisma/client";

export class AuthRepository {
  constructor(private readonly db: PrismaClient) {}

  findUserByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email },
      include: { identities: true, creatorProfile: true }
    });
  }

  findUserByUsername(username: string) {
    return this.db.user.findUnique({
      where: { username },
      include: { identities: true, creatorProfile: true }
    });
  }

  findUserById(id: string) {
    return this.db.user.findUnique({
      where: { id },
      include: { identities: true, creatorProfile: true }
    });
  }

  findIdentity(provider: AuthProvider, providerUserId: string) {
    return this.db.authIdentity.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId
        }
      },
      include: {
        user: {
          include: { identities: true, creatorProfile: true }
        }
      }
    });
  }

  findIdentityForUser(userId: string, provider: AuthProvider) {
    return this.db.authIdentity.findUnique({
      where: {
        userId_provider: {
          userId,
          provider
        }
      }
    });
  }

  createUserWithIdentity(input: {
    email: string;
    username: string;
    passwordHash?: string | null;
    firstName: string;
    lastName: string;
    role: UserRole;
    avatarUrl?: string | null;
    dateOfBirth?: Date | null;
    gender?: string | null;
    customGender?: string | null;
    country?: string | null;
    emailVerifiedAt?: Date | null;
    profileCompletedAt?: Date | null;
    identity: {
      provider: AuthProvider;
      providerUserId: string;
      email?: string | null;
    };
  }) {
    return this.db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          username: input.username,
          passwordHash: input.passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          role: input.role,
          avatarUrl: input.avatarUrl,
          dateOfBirth: input.dateOfBirth,
          gender: input.gender,
          customGender: input.customGender,
          country: input.country,
          emailVerifiedAt: input.emailVerifiedAt,
          profileCompletedAt: input.profileCompletedAt
        }
      });

      await tx.authIdentity.create({
        data: {
          userId: user.id,
          provider: input.identity.provider,
          providerUserId: input.identity.providerUserId,
          email: input.identity.email
        }
      });

      if (input.role === "creator") {
        await tx.creatorProfile.create({
          data: {
            userId: user.id,
            handle: input.username,
            displayName: `${input.firstName} ${input.lastName}`.trim()
          }
        });
      }

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: { identities: true, creatorProfile: true }
      });
    });
  }

  linkIdentity(userId: string, input: { provider: AuthProvider; providerUserId: string; email?: string | null }) {
    return this.db.authIdentity.create({
      data: {
        userId,
        provider: input.provider,
        providerUserId: input.providerUserId,
        email: input.email
      }
    });
  }

  updateLastLogin(userId: string) {
    return this.db.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date()
      }
    });
  }

  updateEmailVerification(userId: string, verifiedAt: Date) {
    return this.db.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: verifiedAt
      },
      include: { identities: true, creatorProfile: true }
    });
  }

  updateProfileCompletion(
    userId: string,
    data: {
      username: string;
      firstName: string;
      lastName: string;
      dateOfBirth: Date;
      gender: string;
      customGender?: string | null;
    }
  ) {
    return this.db.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          customGender: data.customGender ?? null,
          profileCompletedAt: new Date()
        },
        include: { identities: true, creatorProfile: true }
      });

      if (user.role === "creator" || user.creatorProfile) {
        await tx.creatorProfile.upsert({
          where: { userId },
          update: {
            handle: data.username,
            displayName: `${data.firstName} ${data.lastName}`.trim()
          },
          create: {
            userId,
            handle: data.username,
            displayName: `${data.firstName} ${data.lastName}`.trim()
          }
        });
      }

      return tx.user.findUniqueOrThrow({
        where: { id: userId },
        include: { identities: true, creatorProfile: true }
      });
    });
  }

  ensureCreatorProfile(userId: string, data: { username: string; firstName: string; lastName: string }) {
    return this.db.$transaction(async (tx) => {
      await tx.creatorProfile.upsert({
        where: { userId },
        update: {
          handle: data.username,
          displayName: `${data.firstName} ${data.lastName}`.trim()
        },
        create: {
          userId,
          handle: data.username,
          displayName: `${data.firstName} ${data.lastName}`.trim()
        }
      });

      return tx.user.findUniqueOrThrow({
        where: { id: userId },
        include: { identities: true, creatorProfile: true }
      });
    });
  }

  updatePassword(userId: string, passwordHash: string) {
    return this.db.user.update({
      where: { id: userId },
      data: { passwordHash },
      include: { identities: true, creatorProfile: true }
    });
  }

  createRefreshToken(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    return this.db.refreshToken.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent
      }
    });
  }

  findActiveRefreshTokenByHash(tokenHash: string) {
    return this.db.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      }
    });
  }

  findRefreshTokenByHash(tokenHash: string) {
    return this.db.refreshToken.findFirst({
      where: {
        tokenHash
      }
    });
  }

  revokeRefreshToken(id: string) {
    return this.db.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() }
    });
  }

  revokeAllRefreshTokensForUser(userId: string) {
    return this.db.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  }

  replaceOneTimeCode(userId: string, purpose: OneTimeCodePurpose, codeHash: string, expiresAt: Date) {
    return this.db.$transaction(async (tx) => {
      await tx.oneTimeCode.updateMany({
        where: {
          userId,
          purpose,
          consumedAt: null
        },
        data: {
          consumedAt: new Date()
        }
      });

      return tx.oneTimeCode.create({
        data: {
          userId,
          purpose,
          codeHash,
          expiresAt
        }
      });
    });
  }

  findValidOneTimeCode(userId: string, purpose: OneTimeCodePurpose, codeHash: string) {
    return this.db.oneTimeCode.findFirst({
      where: {
        userId,
        purpose,
        codeHash,
        consumedAt: null,
        expiresAt: { gt: new Date() }
      }
    });
  }

  consumeOneTimeCode(id: string) {
    return this.db.oneTimeCode.update({
      where: { id },
      data: { consumedAt: new Date() }
    });
  }
}
