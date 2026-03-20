"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const crypto_1 = require("crypto");
const env_1 = require("../../config/env");
const app_error_1 = require("../../common/errors/app-error");
const password_1 = require("../../common/security/password");
const jwt_1 = require("../../common/security/jwt");
function sha256(value) {
    return (0, crypto_1.createHash)("sha256").update(value).digest("hex");
}
class AuthService {
    repository;
    auditService;
    constructor(repository, auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }
    async register(input) {
        const existing = await this.repository.findUserByEmail(input.email);
        if (existing) {
            throw new app_error_1.AppError("Email is already registered.", 409);
        }
        const user = await this.repository.createUser({
            email: input.email.toLowerCase(),
            passwordHash: await (0, password_1.hashPassword)(input.password),
            firstName: input.firstName,
            lastName: input.lastName,
            role: input.role
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
    async login(input) {
        const user = await this.repository.findUserByEmail(input.email.toLowerCase());
        if (!user || !(await (0, password_1.verifyPassword)(user.passwordHash, input.password))) {
            throw new app_error_1.AppError("Invalid credentials.", 401);
        }
        if (user.isSuspended) {
            throw new app_error_1.AppError("Account is suspended.", 403);
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
    async refresh(refreshToken) {
        let payload;
        try {
            payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
        }
        catch {
            throw new app_error_1.AppError("Refresh token is invalid.", 401);
        }
        const tokens = await this.repository.listActiveRefreshTokens(payload.sub);
        const matched = tokens.find((token) => token.tokenHash === sha256(refreshToken));
        if (!matched) {
            throw new app_error_1.AppError("Refresh token is invalid.", 401);
        }
        await this.repository.revokeRefreshToken(matched.id);
        const user = await this.repository.findUserById(payload.sub);
        if (!user || user.isSuspended) {
            throw new app_error_1.AppError("Account is unavailable.", 403);
        }
        return this.issueTokens(user.id, user.email, user.role);
    }
    async logout(refreshToken, actor) {
        let payload;
        try {
            payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
        }
        catch {
            throw new app_error_1.AppError("Refresh token is invalid.", 401);
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
    async requestPasswordReset(email) {
        const user = await this.repository.findUserByEmail(email.toLowerCase());
        if (!user) {
            return { accepted: true };
        }
        const rawToken = (0, crypto_1.randomBytes)(24).toString("hex");
        const preview = env_1.env.NODE_ENV === "production" ? undefined : rawToken;
        await this.repository.createPasswordResetToken(user.id, sha256(rawToken), new Date(Date.now() + 1000 * 60 * 30));
        await this.auditService.record({
            actorId: user.id,
            actorRole: user.role,
            action: "auth.password_reset.requested",
            resource: "user",
            resourceId: user.id
        });
        return { accepted: true, previewToken: preview };
    }
    async confirmPasswordReset(token, password) {
        const tokenHash = sha256(token);
        const matching = await this.repository.findValidPasswordResetTokenByHash(tokenHash);
        if (!matching) {
            throw new app_error_1.AppError("Password reset token is invalid or expired.", 400);
        }
        const passwordHash = await (0, password_1.hashPassword)(password);
        await this.repository.updatePassword(matching.userId, passwordHash);
        await this.repository.usePasswordResetToken(matching.id);
        const user = await this.repository.findUserById(matching.userId);
        if (!user) {
            throw new app_error_1.AppError("User not found.", 404);
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
    async issueTokens(userId, email, role) {
        const accessToken = (0, jwt_1.signAccessToken)({ sub: userId, email, role });
        const refreshToken = (0, jwt_1.signRefreshToken)({ sub: userId, email });
        await this.repository.createRefreshToken(userId, sha256(refreshToken), new Date(Date.now() + env_1.env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000));
        return { accessToken, refreshToken };
    }
}
exports.AuthService = AuthService;
