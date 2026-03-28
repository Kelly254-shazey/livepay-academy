"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthSecurityService = void 0;
const crypto_1 = require("crypto");
const app_error_1 = require("../../common/errors/app-error");
const LOGIN_WINDOW_SECONDS = 15 * 60;
const LOGIN_IDENTIFIER_LIMIT = 5;
const LOGIN_IP_LIMIT = 12;
const REGISTRATION_WINDOW_SECONDS = 60 * 60;
const REGISTRATION_IP_LIMIT = 10;
const EMAIL_VERIFICATION_REQUEST_WINDOW_SECONDS = 15 * 60;
const EMAIL_VERIFICATION_REQUEST_USER_LIMIT = 5;
const EMAIL_VERIFICATION_REQUEST_IP_LIMIT = 10;
const EMAIL_VERIFICATION_CONFIRM_WINDOW_SECONDS = 15 * 60;
const EMAIL_VERIFICATION_CONFIRM_IDENTIFIER_LIMIT = 10;
const EMAIL_VERIFICATION_CONFIRM_IP_LIMIT = 20;
const PASSWORD_RESET_REQUEST_WINDOW_SECONDS = 15 * 60;
const PASSWORD_RESET_REQUEST_IDENTIFIER_LIMIT = 5;
const PASSWORD_RESET_REQUEST_IP_LIMIT = 10;
const PASSWORD_RESET_CONFIRM_WINDOW_SECONDS = 15 * 60;
const PASSWORD_RESET_CONFIRM_IDENTIFIER_LIMIT = 10;
const PASSWORD_RESET_CONFIRM_IP_LIMIT = 20;
function sha256(value) {
    return (0, crypto_1.createHash)("sha256").update(value).digest("hex");
}
function normalizeKeyPart(value) {
    return sha256(value.trim().toLowerCase());
}
class AuthSecurityService {
    cache;
    constructor(cache) {
        this.cache = cache;
    }
    async assertLoginAllowed(identifier, ipAddress) {
        const [identifierCount, ipCount] = await Promise.all([
            this.readCounter(this.loginIdentifierKey(identifier)),
            ipAddress ? this.readCounter(this.loginIpKey(ipAddress)) : Promise.resolve(0)
        ]);
        if (identifierCount >= LOGIN_IDENTIFIER_LIMIT || ipCount >= LOGIN_IP_LIMIT) {
            throw new app_error_1.AppError("Too many sign-in attempts. Try again in 15 minutes.", 429);
        }
    }
    async recordLoginFailure(identifier, ipAddress) {
        await Promise.all([
            this.bumpCounter(this.loginIdentifierKey(identifier), LOGIN_WINDOW_SECONDS),
            ipAddress ? this.bumpCounter(this.loginIpKey(ipAddress), LOGIN_WINDOW_SECONDS) : Promise.resolve()
        ]);
    }
    async clearLoginFailures(identifier, ipAddress) {
        const keys = [this.loginIdentifierKey(identifier)];
        if (ipAddress?.trim()) {
            keys.push(this.loginIpKey(ipAddress));
        }
        await this.cache.del(keys);
    }
    async assertRegistrationAllowed(ipAddress) {
        if (!ipAddress?.trim()) {
            return;
        }
        const count = await this.readCounter(this.registrationIpKey(ipAddress));
        if (count >= REGISTRATION_IP_LIMIT) {
            throw new app_error_1.AppError("Too many registration attempts. Try again later.", 429);
        }
    }
    async recordRegistrationAttempt(ipAddress) {
        if (!ipAddress?.trim()) {
            return;
        }
        await this.bumpCounter(this.registrationIpKey(ipAddress), REGISTRATION_WINDOW_SECONDS);
    }
    async assertEmailVerificationRequestAllowed(userId, ipAddress) {
        const [userCount, ipCount] = await Promise.all([
            this.readCounter(this.emailVerificationRequestUserKey(userId)),
            ipAddress ? this.readCounter(this.emailVerificationRequestIpKey(ipAddress)) : Promise.resolve(0)
        ]);
        if (userCount >= EMAIL_VERIFICATION_REQUEST_USER_LIMIT ||
            ipCount >= EMAIL_VERIFICATION_REQUEST_IP_LIMIT) {
            throw new app_error_1.AppError("Too many verification email requests. Try again later.", 429);
        }
    }
    async recordEmailVerificationRequest(userId, ipAddress) {
        await Promise.all([
            this.bumpCounter(this.emailVerificationRequestUserKey(userId), EMAIL_VERIFICATION_REQUEST_WINDOW_SECONDS),
            ipAddress
                ? this.bumpCounter(this.emailVerificationRequestIpKey(ipAddress), EMAIL_VERIFICATION_REQUEST_WINDOW_SECONDS)
                : Promise.resolve()
        ]);
    }
    async assertEmailVerificationConfirmationAllowed(email, ipAddress) {
        const [identifierCount, ipCount] = await Promise.all([
            this.readCounter(this.emailVerificationConfirmIdentifierKey(email)),
            ipAddress ? this.readCounter(this.emailVerificationConfirmIpKey(ipAddress)) : Promise.resolve(0)
        ]);
        if (identifierCount >= EMAIL_VERIFICATION_CONFIRM_IDENTIFIER_LIMIT ||
            ipCount >= EMAIL_VERIFICATION_CONFIRM_IP_LIMIT) {
            throw new app_error_1.AppError("Too many verification attempts. Try again later.", 429);
        }
    }
    async recordEmailVerificationConfirmationFailure(email, ipAddress) {
        await Promise.all([
            this.bumpCounter(this.emailVerificationConfirmIdentifierKey(email), EMAIL_VERIFICATION_CONFIRM_WINDOW_SECONDS),
            ipAddress
                ? this.bumpCounter(this.emailVerificationConfirmIpKey(ipAddress), EMAIL_VERIFICATION_CONFIRM_WINDOW_SECONDS)
                : Promise.resolve()
        ]);
    }
    async clearEmailVerificationConfirmationFailures(email, ipAddress) {
        const keys = [this.emailVerificationConfirmIdentifierKey(email)];
        if (ipAddress?.trim()) {
            keys.push(this.emailVerificationConfirmIpKey(ipAddress));
        }
        await this.cache.del(keys);
    }
    async assertPasswordResetRequestAllowed(email, ipAddress) {
        const [identifierCount, ipCount] = await Promise.all([
            this.readCounter(this.passwordResetRequestIdentifierKey(email)),
            ipAddress ? this.readCounter(this.passwordResetRequestIpKey(ipAddress)) : Promise.resolve(0)
        ]);
        if (identifierCount >= PASSWORD_RESET_REQUEST_IDENTIFIER_LIMIT ||
            ipCount >= PASSWORD_RESET_REQUEST_IP_LIMIT) {
            throw new app_error_1.AppError("Too many password reset requests. Try again later.", 429);
        }
    }
    async recordPasswordResetRequest(email, ipAddress) {
        await Promise.all([
            this.bumpCounter(this.passwordResetRequestIdentifierKey(email), PASSWORD_RESET_REQUEST_WINDOW_SECONDS),
            ipAddress
                ? this.bumpCounter(this.passwordResetRequestIpKey(ipAddress), PASSWORD_RESET_REQUEST_WINDOW_SECONDS)
                : Promise.resolve()
        ]);
    }
    async assertPasswordResetConfirmationAllowed(email, ipAddress) {
        const [identifierCount, ipCount] = await Promise.all([
            this.readCounter(this.passwordResetConfirmIdentifierKey(email)),
            ipAddress ? this.readCounter(this.passwordResetConfirmIpKey(ipAddress)) : Promise.resolve(0)
        ]);
        if (identifierCount >= PASSWORD_RESET_CONFIRM_IDENTIFIER_LIMIT ||
            ipCount >= PASSWORD_RESET_CONFIRM_IP_LIMIT) {
            throw new app_error_1.AppError("Too many reset attempts. Try again later.", 429);
        }
    }
    async recordPasswordResetConfirmationFailure(email, ipAddress) {
        await Promise.all([
            this.bumpCounter(this.passwordResetConfirmIdentifierKey(email), PASSWORD_RESET_CONFIRM_WINDOW_SECONDS),
            ipAddress
                ? this.bumpCounter(this.passwordResetConfirmIpKey(ipAddress), PASSWORD_RESET_CONFIRM_WINDOW_SECONDS)
                : Promise.resolve()
        ]);
    }
    async clearPasswordResetConfirmationFailures(email, ipAddress) {
        const keys = [this.passwordResetConfirmIdentifierKey(email)];
        if (ipAddress?.trim()) {
            keys.push(this.passwordResetConfirmIpKey(ipAddress));
        }
        await this.cache.del(keys);
    }
    async readCounter(key) {
        const raw = await this.cache.get(key);
        const value = Number(raw ?? 0);
        return Number.isFinite(value) ? value : 0;
    }
    async bumpCounter(key, ttlSeconds) {
        const existing = await this.cache.get(key);
        const next = await this.cache.incr(key);
        if (existing === null) {
            await this.cache.set(key, String(next), { EX: ttlSeconds });
        }
        return next;
    }
    loginIdentifierKey(identifier) {
        return `auth:login:identifier:${normalizeKeyPart(identifier)}`;
    }
    loginIpKey(ipAddress) {
        return `auth:login:ip:${normalizeKeyPart(ipAddress)}`;
    }
    registrationIpKey(ipAddress) {
        return `auth:register:ip:${normalizeKeyPart(ipAddress)}`;
    }
    emailVerificationRequestUserKey(userId) {
        return `auth:verify-email:request:user:${normalizeKeyPart(userId)}`;
    }
    emailVerificationRequestIpKey(ipAddress) {
        return `auth:verify-email:request:ip:${normalizeKeyPart(ipAddress)}`;
    }
    emailVerificationConfirmIdentifierKey(email) {
        return `auth:verify-email:confirm:identifier:${normalizeKeyPart(email)}`;
    }
    emailVerificationConfirmIpKey(ipAddress) {
        return `auth:verify-email:confirm:ip:${normalizeKeyPart(ipAddress)}`;
    }
    passwordResetRequestIdentifierKey(email) {
        return `auth:password-reset:request:identifier:${normalizeKeyPart(email)}`;
    }
    passwordResetRequestIpKey(ipAddress) {
        return `auth:password-reset:request:ip:${normalizeKeyPart(ipAddress)}`;
    }
    passwordResetConfirmIdentifierKey(email) {
        return `auth:password-reset:confirm:identifier:${normalizeKeyPart(email)}`;
    }
    passwordResetConfirmIpKey(ipAddress) {
        return `auth:password-reset:confirm:ip:${normalizeKeyPart(ipAddress)}`;
    }
}
exports.AuthSecurityService = AuthSecurityService;
