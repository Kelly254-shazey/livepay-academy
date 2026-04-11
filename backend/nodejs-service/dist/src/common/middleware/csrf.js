"use strict";
/**
 * CSRF Protection Middleware
 * Implements token-based CSRF protection for state-changing requests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCsrfToken = generateCsrfToken;
exports.storeCsrfToken = storeCsrfToken;
exports.verifyCsrfToken = verifyCsrfToken;
exports.csrfProtection = csrfProtection;
exports.addCsrfTokenToResponse = addCsrfTokenToResponse;
const crypto_1 = require("crypto");
const app_error_1 = require("../errors/app-error");
const redis_1 = require("../../infrastructure/cache/redis");
const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_TTL = 86400; // 24 hours
const EXCLUDED_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
/**
 * Generate a new CSRF token
 */
function generateCsrfToken() {
    return (0, crypto_1.randomBytes)(CSRF_TOKEN_LENGTH).toString('hex');
}
function shouldProtectAgainstCsrf(req) {
    const hasSession = Boolean(req.sessionID);
    const cookieHeader = typeof req.headers.cookie === "string" ? req.headers.cookie.trim() : "";
    const hasBearerAuth = req.header("authorization")?.startsWith("Bearer ");
    if (hasBearerAuth) {
        return false;
    }
    return hasSession || cookieHeader.length > 0;
}
/**
 * Store CSRF token in Redis with session association
 */
async function storeCsrfToken(sessionId, token) {
    const key = `csrf:${sessionId}:${token}`;
    await redis_1.redis.set(key, '1', { EX: CSRF_TOKEN_TTL });
}
/**
 * Verify CSRF token validity
 */
async function verifyCsrfToken(sessionId, token) {
    if (!token || typeof token !== 'string') {
        return false;
    }
    const key = `csrf:${sessionId}:${token}`;
    const tokenValue = await redis_1.redis.get(key);
    if (tokenValue) {
        // Invalidate token after use (one-time use)
        await redis_1.redis.del(key);
        return true;
    }
    return false;
}
/**
 * CSRF protection middleware
 * - Generates tokens for safe methods (GET, HEAD, OPTIONS)
 * - Validates tokens for state-changing methods (POST, PUT, PATCH, DELETE)
 */
async function csrfProtection(req, res, next) {
    if (!shouldProtectAgainstCsrf(req)) {
        return next();
    }
    // Safe methods don't need CSRF validation but should receive token
    if (EXCLUDED_METHODS.has(req.method)) {
        const sessionId = req.sessionID || req.headers['x-session-id'] || req.ip || 'anonymous';
        const token = generateCsrfToken();
        await storeCsrfToken(sessionId, token);
        // Attach token to response for client
        res.locals.csrfToken = token;
        res.set('X-CSRF-Token', token);
        return next();
    }
    // State-changing methods require CSRF token validation
    const sessionId = req.sessionID || req.headers['x-session-id'] || req.ip || 'anonymous';
    // Check token from multiple possible sources
    const tokenFromBody = req.body?._csrf;
    const tokenFromHeader = req.headers['x-csrf-token'];
    const providedToken = Array.isArray(tokenFromHeader) ? tokenFromHeader[0] : tokenFromHeader || tokenFromBody;
    if (!providedToken) {
        return next(new app_error_1.AppError('CSRF token missing.', 403));
    }
    try {
        const isValid = await verifyCsrfToken(sessionId, providedToken);
        if (!isValid) {
            return next(new app_error_1.AppError('CSRF token invalid or expired.', 403));
        }
        // Generate new token for next request
        const newToken = generateCsrfToken();
        await storeCsrfToken(sessionId, newToken);
        res.set('X-CSRF-Token', newToken);
        next();
    }
    catch (error) {
        next(new app_error_1.AppError('CSRF token validation failed.', 500));
    }
}
/**
 * Helper to add CSRF token to JSON responses
 */
function addCsrfTokenToResponse(res, data) {
    return {
        ...data,
        _csrf: res.locals.csrfToken || res.getHeader('X-CSRF-Token')
    };
}
