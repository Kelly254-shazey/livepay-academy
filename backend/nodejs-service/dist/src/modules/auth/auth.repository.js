"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
class AuthRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    findUserByEmail(email) {
        return this.db.user.findUnique({
            where: { email },
            include: { identities: true, creatorProfile: true }
        });
    }
    findUserByUsername(username) {
        return this.db.user.findUnique({
            where: { username },
            include: { identities: true, creatorProfile: true }
        });
    }
    findUserById(id) {
        return this.db.user.findUnique({
            where: { id },
            include: { identities: true, creatorProfile: true }
        });
    }
    findIdentity(provider, providerUserId) {
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
    findIdentityForUser(userId, provider) {
        return this.db.authIdentity.findUnique({
            where: {
                userId_provider: {
                    userId,
                    provider
                }
            }
        });
    }
    createUserWithIdentity(input) {
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
            return tx.user.findUniqueOrThrow({
                where: { id: user.id },
                include: { identities: true, creatorProfile: true }
            });
        });
    }
    linkIdentity(userId, input) {
        return this.db.authIdentity.create({
            data: {
                userId,
                provider: input.provider,
                providerUserId: input.providerUserId,
                email: input.email
            }
        });
    }
    updateLastLogin(userId) {
        return this.db.user.update({
            where: { id: userId },
            data: {
                lastLoginAt: new Date()
            }
        });
    }
    updateEmailVerification(userId, verifiedAt) {
        return this.db.user.update({
            where: { id: userId },
            data: {
                emailVerifiedAt: verifiedAt
            },
            include: { identities: true, creatorProfile: true }
        });
    }
    updateProfileCompletion(userId, data) {
        return this.db.user.update({
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
    }
    updatePassword(userId, passwordHash) {
        return this.db.user.update({
            where: { id: userId },
            data: { passwordHash },
            include: { identities: true, creatorProfile: true }
        });
    }
    createRefreshToken(input) {
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
    findActiveRefreshTokenByHash(tokenHash) {
        return this.db.refreshToken.findFirst({
            where: {
                tokenHash,
                revokedAt: null,
                expiresAt: { gt: new Date() }
            }
        });
    }
    revokeRefreshToken(id) {
        return this.db.refreshToken.update({
            where: { id },
            data: { revokedAt: new Date() }
        });
    }
    revokeAllRefreshTokensForUser(userId) {
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
    replaceOneTimeCode(userId, purpose, codeHash, expiresAt) {
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
    findValidOneTimeCode(userId, purpose, codeHash) {
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
    consumeOneTimeCode(id) {
        return this.db.oneTimeCode.update({
            where: { id },
            data: { consumedAt: new Date() }
        });
    }
}
exports.AuthRepository = AuthRepository;
