"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
const crypto_1 = require("crypto");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const JWT_ISSUER = "livegate-nodejs-service";
const JWT_AUDIENCE = "livegate-clients";
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign({
        email: payload.email,
        role: payload.role,
        tokenType: "access"
    }, env_1.env.JWT_ACCESS_SECRET, {
        subject: payload.sub,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        jwtid: (0, crypto_1.randomUUID)(),
        algorithm: "HS256",
        expiresIn: `${env_1.env.ACCESS_TOKEN_TTL_MINUTES}m`
    });
}
function signRefreshToken(payload) {
    return jsonwebtoken_1.default.sign({
        email: payload.email,
        tokenType: "refresh"
    }, env_1.env.JWT_REFRESH_SECRET, {
        subject: payload.sub,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        jwtid: (0, crypto_1.randomUUID)(),
        algorithm: "HS256",
        expiresIn: `${env_1.env.REFRESH_TOKEN_TTL_DAYS}d`
    });
}
function verifyAccessToken(token) {
    const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        algorithms: ["HS256"]
    });
    // Enforce tokenType BEFORE returning — prevents refresh tokens being used as access tokens
    if (typeof payload.sub !== "string" ||
        typeof payload.email !== "string" ||
        typeof payload.role !== "string" ||
        payload["tokenType"] !== "access") {
        throw new Error("Invalid access token payload.");
    }
    return {
        sub: payload.sub,
        email: payload.email,
        role: payload.role
    };
}
function verifyRefreshToken(token) {
    const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        algorithms: ["HS256"]
    });
    // Enforce tokenType — prevents access tokens being used as refresh tokens
    if (typeof payload.sub !== "string" ||
        typeof payload.email !== "string" ||
        payload["tokenType"] !== "refresh") {
        throw new Error("Invalid refresh token payload.");
    }
    return {
        sub: payload.sub,
        email: payload.email
    };
}
