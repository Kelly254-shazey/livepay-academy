"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaAccessService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_error_1 = require("../../common/errors/app-error");
const ssrf_protection_1 = require("../../common/security/ssrf-protection");
const env_1 = require("../../config/env");
const MEDIA_TOKEN_AUDIENCE = "livegate-media";
const MEDIA_TOKEN_ISSUER = "livegate-nodejs-service";
const MEDIA_TOKEN_TTL = "5m";
class MediaAccessService {
    createDeliveryUrl(input) {
        if (!input.assetUrl) {
            return undefined;
        }
        const token = jsonwebtoken_1.default.sign({
            kind: "media_delivery",
            assetUrl: this.validateSourceUrl(input.assetUrl),
            resourceType: input.resourceType,
            resourceId: input.resourceId
        }, env_1.env.JWT_ACCESS_SECRET, {
            issuer: MEDIA_TOKEN_ISSUER,
            audience: MEDIA_TOKEN_AUDIENCE,
            algorithm: "HS256",
            expiresIn: MEDIA_TOKEN_TTL
        });
        const apiBaseUrl = (env_1.env.PUBLIC_API_BASE_URL ?? env_1.env.APP_BASE_URL).replace(/\/+$/, "");
        return `${apiBaseUrl}/api/media/access/${encodeURIComponent(token)}`;
    }
    resolveDeliveryUrl(token) {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET, {
            issuer: MEDIA_TOKEN_ISSUER,
            audience: MEDIA_TOKEN_AUDIENCE,
            algorithms: ["HS256"]
        });
        if (payload["kind"] !== "media_delivery" ||
            typeof payload["assetUrl"] !== "string" ||
            typeof payload["resourceType"] !== "string" ||
            typeof payload["resourceId"] !== "string") {
            throw new app_error_1.AppError("Invalid media access token.", 400);
        }
        return {
            assetUrl: this.validateSourceUrl(payload["assetUrl"]),
            resourceType: payload["resourceType"],
            resourceId: payload["resourceId"]
        };
    }
    validateSourceUrl(assetUrl) {
        try {
            return (0, ssrf_protection_1.validateUrl)(assetUrl).toString();
        }
        catch (error) {
            throw new app_error_1.AppError(error instanceof Error ? error.message : "Invalid media URL.", 400);
        }
    }
}
exports.MediaAccessService = MediaAccessService;
