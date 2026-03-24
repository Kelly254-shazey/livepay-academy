"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAuthService = void 0;
const app_error_1 = require("../../common/errors/app-error");
const env_1 = require("../../config/env");
class GoogleAuthService {
    async verifyIdToken(idToken) {
        if (!env_1.env.GOOGLE_CLIENT_ID) {
            throw new app_error_1.AppError("Google sign-in is not configured.", 503);
        }
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
        if (!response.ok) {
            throw new app_error_1.AppError("Google sign-in token is invalid.", 401);
        }
        const payload = await response.json();
        if (payload.aud !== env_1.env.GOOGLE_CLIENT_ID) {
            throw new app_error_1.AppError("Google sign-in token audience mismatch.", 401);
        }
        if (!payload.sub || !payload.email) {
            throw new app_error_1.AppError("Google sign-in token is incomplete.", 401);
        }
        return {
            providerUserId: payload.sub,
            email: payload.email.toLowerCase(),
            emailVerified: payload.email_verified === "true",
            fullName: payload.name,
            firstName: payload.given_name,
            lastName: payload.family_name,
            avatarUrl: payload.picture
        };
    }
}
exports.GoogleAuthService = GoogleAuthService;
