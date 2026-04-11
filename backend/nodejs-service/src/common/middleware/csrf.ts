/**
 * CSRF Protection Middleware
 * Implements token-based CSRF protection for state-changing requests
 */

import type { NextFunction, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { AppError } from '../errors/app-error';
import { redis } from '../../infrastructure/cache/redis';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_TTL = 86400; // 24 hours
const EXCLUDED_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Generate a new CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

function shouldProtectAgainstCsrf(req: Request) {
  const hasSession = Boolean((req as any).sessionID);
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
export async function storeCsrfToken(sessionId: string, token: string): Promise<void> {
  const key = `csrf:${sessionId}:${token}`;
  await redis.set(key, '1', { EX: CSRF_TOKEN_TTL });
}

/**
 * Verify CSRF token validity
 */
export async function verifyCsrfToken(sessionId: string, token: string): Promise<boolean> {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const key = `csrf:${sessionId}:${token}`;
  const tokenValue = await redis.get(key);
  
  if (tokenValue) {
    // Invalidate token after use (one-time use)
    await redis.del(key);
    return true;
  }
  
  return false;
}

/**
 * CSRF protection middleware
 * - Generates tokens for safe methods (GET, HEAD, OPTIONS)
 * - Validates tokens for state-changing methods (POST, PUT, PATCH, DELETE)
 */
export async function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (!shouldProtectAgainstCsrf(req)) {
    return next();
  }

  // Safe methods don't need CSRF validation but should receive token
  if (EXCLUDED_METHODS.has(req.method)) {
    const sessionId = (req as any).sessionID || req.headers['x-session-id'] || req.ip || 'anonymous';
    const token = generateCsrfToken();
    
    await storeCsrfToken(sessionId, token);
    
    // Attach token to response for client
    res.locals.csrfToken = token;
    res.set('X-CSRF-Token', token);
    
    return next();
  }

  // State-changing methods require CSRF token validation
  const sessionId = (req as any).sessionID || req.headers['x-session-id'] || req.ip || 'anonymous';
  
  // Check token from multiple possible sources
  const tokenFromBody = req.body?._csrf;
  const tokenFromHeader = req.headers['x-csrf-token'];
  const providedToken = Array.isArray(tokenFromHeader) ? tokenFromHeader[0] : tokenFromHeader || tokenFromBody;

  if (!providedToken) {
    return next(new AppError('CSRF token missing.', 403));
  }

  try {
    const isValid = await verifyCsrfToken(sessionId, providedToken);
    
    if (!isValid) {
      return next(new AppError('CSRF token invalid or expired.', 403));
    }
    
    // Generate new token for next request
    const newToken = generateCsrfToken();
    await storeCsrfToken(sessionId, newToken);
    res.set('X-CSRF-Token', newToken);
    
    next();
  } catch (error) {
    next(new AppError('CSRF token validation failed.', 500));
  }
}

/**
 * Helper to add CSRF token to JSON responses
 */
export function addCsrfTokenToResponse(res: Response, data: any): any {
  return {
    ...data,
    _csrf: res.locals.csrfToken || res.getHeader('X-CSRF-Token')
  };
}
