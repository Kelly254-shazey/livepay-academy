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
            include: { creatorProfile: true }
        });
    }
    findUserById(id) {
        return this.db.user.findUnique({
            where: { id },
            include: { creatorProfile: true }
        });
    }
    createUser(data) {
        return this.db.user.create({ data });
    }
    createRefreshToken(userId, tokenHash, expiresAt) {
        return this.db.refreshToken.create({
            data: { userId, tokenHash, expiresAt }
        });
    }
    listActiveRefreshTokens(userId) {
        return this.db.refreshToken.findMany({
            where: {
                userId,
                revokedAt: null,
                expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: "desc" }
        });
    }
    revokeRefreshToken(id) {
        return this.db.refreshToken.update({
            where: { id },
            data: { revokedAt: new Date() }
        });
    }
    createPasswordResetToken(userId, tokenHash, expiresAt) {
        return this.db.passwordResetToken.create({
            data: { userId, tokenHash, expiresAt }
        });
    }
    listActivePasswordResetTokens(userId) {
        return this.db.passwordResetToken.findMany({
            where: {
                userId,
                expiresAt: { gt: new Date() },
                usedAt: null
            },
            orderBy: { createdAt: "desc" }
        });
    }
    findValidPasswordResetTokenByHash(tokenHash) {
        return this.db.passwordResetToken.findFirst({
            where: {
                tokenHash,
                expiresAt: { gt: new Date() },
                usedAt: null
            }
        });
    }
    usePasswordResetToken(id) {
        return this.db.passwordResetToken.update({
            where: { id },
            data: { usedAt: new Date() }
        });
    }
    updatePassword(userId, passwordHash) {
        return this.db.user.update({
            where: { id: userId },
            data: { passwordHash }
        });
    }
}
exports.AuthRepository = AuthRepository;
