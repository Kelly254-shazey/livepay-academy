/**
 * Authentication Test Suite
 * Covers: normalizeAuthSession, switchSessionRole, getRequiredAuthStep,
 *         getSessionRoles, getActiveRole, session-store logic, API route shapes,
 *         Zod schema validation, and security utilities.
 */

import {
  normalizeAuthSession,
  switchSessionRole,
  getRequiredAuthStep,
  getSessionRoles,
  getActiveRole,
} from '../shared/identity';
import { apiRoutes } from '../shared/api';
import type { AuthSession, UserRole } from '../shared/contracts';
import { z } from 'zod';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeSession(overrides: Partial<AuthSession> = {}): AuthSession {
  return {
    user: {
      id: 'user-1',
      fullName: 'Test User',
      email: 'test@livegate.com',
      role: 'viewer',
      roles: ['viewer'],
      emailVerified: true,
      profileCompleted: true,
    },
    tokens: {
      accessToken: 'access-token-abc',
      refreshToken: 'refresh-token-xyz',
    },
    activeRole: 'viewer',
    nextStep: null,
    ...overrides,
  };
}

// ─── getSessionRoles ──────────────────────────────────────────────────────────

describe('getSessionRoles', () => {
  it('returns empty array for null session', () => {
    expect(getSessionRoles(null)).toEqual([]);
  });

  it('returns empty array for undefined session', () => {
    expect(getSessionRoles(undefined)).toEqual([]);
  });

  it('returns user.roles when present', () => {
    const session = makeSession({ user: { ...makeSession().user, roles: ['viewer', 'creator'] } });
    expect(getSessionRoles(session)).toEqual(['viewer', 'creator']);
  });

  it('falls back to [activeRole] when user.roles is empty', () => {
    const session = makeSession({
      activeRole: 'creator',
      user: { ...makeSession().user, roles: [], role: 'creator' },
    });
    expect(getSessionRoles(session)).toEqual(['creator']);
  });

  it('deduplicates roles', () => {
    const session = makeSession({
      user: { ...makeSession().user, roles: ['viewer', 'viewer', 'creator'] },
    });
    expect(getSessionRoles(session)).toEqual(['viewer', 'creator']);
  });
});

// ─── getActiveRole ────────────────────────────────────────────────────────────

describe('getActiveRole', () => {
  it('returns null for null session', () => {
    expect(getActiveRole(null)).toBeNull();
  });

  it('returns activeRole when set', () => {
    const session = makeSession({ activeRole: 'creator' });
    expect(getActiveRole(session)).toBe('creator');
  });

  it('falls back to user.role when activeRole is undefined', () => {
    const session = makeSession({ activeRole: undefined });
    expect(getActiveRole(session)).toBe('viewer');
  });
});

// ─── getRequiredAuthStep ──────────────────────────────────────────────────────

describe('getRequiredAuthStep', () => {
  it('returns null for null session', () => {
    expect(getRequiredAuthStep(null)).toBeNull();
  });

  it('returns null when session is fully verified and complete', () => {
    expect(getRequiredAuthStep(makeSession())).toBeNull();
  });

  it('returns verify-email when nextStep is set', () => {
    const session = makeSession({ nextStep: 'verify-email' });
    expect(getRequiredAuthStep(session)).toBe('verify-email');
  });

  it('returns complete-profile when nextStep is set', () => {
    const session = makeSession({ nextStep: 'complete-profile' });
    expect(getRequiredAuthStep(session)).toBe('complete-profile');
  });

  it('returns verify-email when emailVerified is false and nextStep is null', () => {
    const session = makeSession({
      nextStep: null,
      user: { ...makeSession().user, emailVerified: false },
    });
    expect(getRequiredAuthStep(session)).toBe('verify-email');
  });

  it('returns complete-profile when profileCompleted is false and email is verified', () => {
    const session = makeSession({
      nextStep: null,
      user: { ...makeSession().user, emailVerified: true, profileCompleted: false },
    });
    expect(getRequiredAuthStep(session)).toBe('complete-profile');
  });

  it('nextStep takes priority over derived flags', () => {
    const session = makeSession({
      nextStep: 'complete-profile',
      user: { ...makeSession().user, emailVerified: false },
    });
    expect(getRequiredAuthStep(session)).toBe('complete-profile');
  });
});

// ─── normalizeAuthSession ─────────────────────────────────────────────────────

describe('normalizeAuthSession', () => {
  it('preserves existing roles and activeRole', () => {
    const session = makeSession({ activeRole: 'viewer' });
    const result = normalizeAuthSession(session, ['viewer'], 'viewer');
    expect(result.activeRole).toBe('viewer');
    expect(result.user.roles).toContain('viewer');
  });

  it('sets activeRole from provided argument', () => {
    const session = makeSession({
      user: { ...makeSession().user, roles: ['viewer', 'creator'] },
    });
    const result = normalizeAuthSession(session, ['viewer', 'creator'], 'creator');
    expect(result.activeRole).toBe('creator');
    expect(result.user.role).toBe('creator');
  });

  it('falls back to first role if requested activeRole not in roles', () => {
    const session = makeSession({
      user: { ...makeSession().user, roles: ['viewer'] },
    });
    const result = normalizeAuthSession(session, ['viewer'], 'admin' as UserRole);
    expect(result.activeRole).toBe('viewer');
  });

  it('derives nextStep verify-email when emailVerified is false', () => {
    const session = makeSession({
      nextStep: null,
      user: { ...makeSession().user, emailVerified: false },
    });
    const result = normalizeAuthSession(session);
    expect(result.nextStep).toBe('verify-email');
  });

  it('derives nextStep complete-profile when profileCompleted is false', () => {
    const session = makeSession({
      nextStep: null,
      user: { ...makeSession().user, emailVerified: true, profileCompleted: false },
    });
    const result = normalizeAuthSession(session);
    expect(result.nextStep).toBe('complete-profile');
  });

  it('preserves explicit nextStep from server', () => {
    const session = makeSession({ nextStep: 'verify-email' });
    const result = normalizeAuthSession(session);
    expect(result.nextStep).toBe('verify-email');
  });

  it('deduplicates roles', () => {
    const session = makeSession({
      user: { ...makeSession().user, roles: ['viewer', 'viewer', 'creator'] },
    });
    const result = normalizeAuthSession(session);
    const viewerCount = result.user.roles!.filter((r) => r === 'viewer').length;
    expect(viewerCount).toBe(1);
  });

  it('does not mutate the original session', () => {
    const session = makeSession();
    const original = JSON.stringify(session);
    normalizeAuthSession(session, ['viewer', 'creator'], 'creator');
    expect(JSON.stringify(session)).toBe(original);
  });

  it('uses server roles over provided fallback roles when server has roles', () => {
    const session = makeSession({
      user: { ...makeSession().user, roles: ['creator'] },
    });
    const result = normalizeAuthSession(session, ['viewer'], 'viewer');
    expect(result.user.roles).toEqual(['creator']);
  });
});

// ─── switchSessionRole ────────────────────────────────────────────────────────

describe('switchSessionRole', () => {
  it('returns null for null session', () => {
    expect(switchSessionRole(null, 'viewer')).toBeNull();
  });

  it('switches to a valid role the user has', () => {
    const session = makeSession({
      user: { ...makeSession().user, roles: ['viewer', 'creator'] },
    });
    const result = switchSessionRole(session, 'creator');
    expect(result?.activeRole).toBe('creator');
    expect(result?.user.role).toBe('creator');
  });

  it('returns original session unchanged when role not in user roles', () => {
    const session = makeSession({
      user: { ...makeSession().user, roles: ['viewer'] },
    });
    const result = switchSessionRole(session, 'admin');
    expect(result).toBe(session);
  });

  it('switching to current role is a no-op in terms of activeRole value', () => {
    const session = makeSession({ activeRole: 'viewer' });
    const result = switchSessionRole(session, 'viewer');
    expect(result?.activeRole).toBe('viewer');
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

describe('apiRoutes', () => {
  it('auth routes are correct strings', () => {
    expect(apiRoutes.auth.signIn).toBe('/auth/sign-in');
    expect(apiRoutes.auth.signUp).toBe('/auth/sign-up');
    expect(apiRoutes.auth.signInWithGoogle).toBe('/auth/google');
    expect(apiRoutes.auth.refresh).toBe('/auth/refresh');
    expect(apiRoutes.auth.logout).toBe('/auth/logout');
    expect(apiRoutes.auth.forgotPassword).toBe('/auth/forgot-password');
    expect(apiRoutes.auth.resetPassword).toBe('/auth/reset-password');
    expect(apiRoutes.auth.emailVerificationRequest).toBe('/auth/verify-email/resend');
    expect(apiRoutes.auth.emailVerificationConfirm).toBe('/auth/verify-email');
    expect(apiRoutes.auth.completeProfile).toBe('/auth/complete-profile');
    expect(apiRoutes.auth.session).toBe('/auth/session');
    expect(apiRoutes.auth.linkGoogleAccount).toBe('/auth/link/google');
    expect(apiRoutes.auth.linkPassword).toBe('/auth/link/password');
  });

  it('dynamic routes interpolate IDs correctly', () => {
    expect(apiRoutes.creatorDetail('abc-123')).toBe('/creators/abc-123');
    expect(apiRoutes.liveDetail('live-99')).toBe('/lives/live-99');
    expect(apiRoutes.notificationRead('notif-1')).toBe('/notifications/notif-1/read');
    expect(apiRoutes.categoryDetail('trading-education')).toBe('/categories/trading-education');
    expect(apiRoutes.liveRoom('room-42')).toBe('/lives/room-42/room');
    expect(apiRoutes.liveChatHistory('live-1', 20)).toBe('/v1/lives/live-1/chat?limit=20');
    expect(apiRoutes.liveAttendance('live-1')).toBe('/v1/lives/live-1/attendance');
  });

  it('accessGrantStatus builds correct path', () => {
    expect(apiRoutes.accessGrantStatus('live_session', 'live-1')).toBe('/v1/access/grants/live_session/live-1');
    expect(apiRoutes.accessGrantStatus('premium_content', 'content-5')).toBe('/v1/access/grants/premium_content/content-5');
    expect(apiRoutes.accessGrantStatus('class', 'class-3')).toBe('/v1/access/grants/class/class-3');
  });
});

// ─── Zod Schema Validation ────────────────────────────────────────────────────

const passwordSchema = z
  .string()
  .min(12, 'Use at least 12 characters.')
  .max(72, 'Use 72 characters or fewer.')
  .regex(/[a-z]/, 'Include a lowercase letter.')
  .regex(/[A-Z]/, 'Include an uppercase letter.')
  .regex(/\d/, 'Include a number.')
  .regex(/[^A-Za-z0-9]/, 'Include a symbol.');

const signInSchema = z.object({
  identifier: z.string().trim().min(3).max(160),
  password: z.string().min(1).max(256),
});

const signUpSchema = z
  .object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: passwordSchema,
    confirmPassword: z.string(),
    username: z.string().trim().min(3).max(32),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.'),
    gender: z.enum(['male', 'female', 'prefer_not_to_say', 'custom']),
    customGender: z.string().trim().max(80).optional(),
    country: z.string().min(2).max(2),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['confirmPassword'], message: 'Passwords do not match.' });
    }
    if (values.gender === 'custom' && !values.customGender?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customGender'], message: 'Tell us how you identify.' });
    }
  });

const forgotSchema = z.object({ email: z.string().email() });

const resetSchema = z.object({
  email: z.string().email(),
  code: z.string().trim().length(6),
  password: passwordSchema,
});

const emailVerificationSchema = z.object({
  email: z.string().email(),
  code: z.string().trim().length(6),
});

describe('signInSchema', () => {
  it('accepts valid credentials', () => {
    expect(signInSchema.safeParse({ identifier: 'user@test.com', password: 'pass' }).success).toBe(true);
  });

  it('rejects identifier shorter than 3 chars', () => {
    expect(signInSchema.safeParse({ identifier: 'ab', password: 'pass' }).success).toBe(false);
  });

  it('rejects empty password', () => {
    expect(signInSchema.safeParse({ identifier: 'user@test.com', password: '' }).success).toBe(false);
  });

  it('trims identifier whitespace', () => {
    const result = signInSchema.safeParse({ identifier: '  user@test.com  ', password: 'pass' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.identifier).toBe('user@test.com');
  });
});

describe('passwordSchema', () => {
  it('accepts a strong password', () => {
    expect(passwordSchema.safeParse('StrongPass1!').success).toBe(true);
  });

  it('rejects password shorter than 12 chars', () => {
    expect(passwordSchema.safeParse('Short1!').success).toBe(false);
  });

  it('rejects password without uppercase', () => {
    expect(passwordSchema.safeParse('alllowercase1!').success).toBe(false);
  });

  it('rejects password without lowercase', () => {
    expect(passwordSchema.safeParse('ALLUPPERCASE1!').success).toBe(false);
  });

  it('rejects password without a number', () => {
    expect(passwordSchema.safeParse('NoNumbersHere!').success).toBe(false);
  });

  it('rejects password without a symbol', () => {
    expect(passwordSchema.safeParse('NoSymbolsHere1').success).toBe(false);
  });

  it('rejects password longer than 72 chars', () => {
    expect(passwordSchema.safeParse('Aa1!' + 'x'.repeat(70)).success).toBe(false);
  });
});

describe('signUpSchema', () => {
  const valid = {
    fullName: 'Jane Doe',
    email: 'jane@livegate.com',
    password: 'StrongPass1!',
    confirmPassword: 'StrongPass1!',
    username: 'janedoe',
    dateOfBirth: '1995-06-15',
    gender: 'female' as const,
    country: 'US',
  };

  it('accepts valid registration data', () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = signUpSchema.safeParse({ ...valid, confirmPassword: 'DifferentPass1!' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain('confirmPassword');
    }
  });

  it('rejects invalid email', () => {
    expect(signUpSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects invalid dateOfBirth format', () => {
    expect(signUpSchema.safeParse({ ...valid, dateOfBirth: '15-06-1995' }).success).toBe(false);
  });

  it('rejects country code longer than 2 chars', () => {
    expect(signUpSchema.safeParse({ ...valid, country: 'USA' }).success).toBe(false);
  });

  it('rejects country code shorter than 2 chars', () => {
    expect(signUpSchema.safeParse({ ...valid, country: 'U' }).success).toBe(false);
  });

  it('requires customGender when gender is custom', () => {
    const result = signUpSchema.safeParse({ ...valid, gender: 'custom', customGender: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain('customGender');
    }
  });

  it('accepts custom gender with a value', () => {
    expect(signUpSchema.safeParse({ ...valid, gender: 'custom', customGender: 'Non-binary' }).success).toBe(true);
  });

  it('rejects username shorter than 3 chars', () => {
    expect(signUpSchema.safeParse({ ...valid, username: 'ab' }).success).toBe(false);
  });

  it('rejects username longer than 32 chars', () => {
    expect(signUpSchema.safeParse({ ...valid, username: 'a'.repeat(33) }).success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    expect(forgotSchema.safeParse({ email: 'user@test.com' }).success).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(forgotSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  const valid = { email: 'user@test.com', code: '123456', password: 'NewPass1!Word' };

  it('accepts valid reset data', () => {
    expect(resetSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects code shorter than 6 chars', () => {
    expect(resetSchema.safeParse({ ...valid, code: '12345' }).success).toBe(false);
  });

  it('rejects code longer than 6 chars', () => {
    expect(resetSchema.safeParse({ ...valid, code: '1234567' }).success).toBe(false);
  });

  it('rejects weak password', () => {
    expect(resetSchema.safeParse({ ...valid, password: 'weak' }).success).toBe(false);
  });
});

describe('emailVerificationSchema', () => {
  it('accepts valid email and 6-digit code', () => {
    expect(emailVerificationSchema.safeParse({ email: 'user@test.com', code: '654321' }).success).toBe(true);
  });

  it('rejects code that is not exactly 6 chars', () => {
    expect(emailVerificationSchema.safeParse({ email: 'user@test.com', code: '12345' }).success).toBe(false);
    expect(emailVerificationSchema.safeParse({ email: 'user@test.com', code: '1234567' }).success).toBe(false);
  });
});

// ─── Session Store Logic (pure functions) ────────────────────────────────────

describe('session sanitization edge cases', () => {
  it('normalizeAuthSession handles session with no roles array', () => {
    const session = makeSession({
      user: { ...makeSession().user, roles: undefined },
    });
    const result = normalizeAuthSession(session, ['viewer'], 'viewer');
    expect(result.user.roles).toBeDefined();
    expect(result.user.roles!.length).toBeGreaterThan(0);
  });

  it('normalizeAuthSession handles creator role switch', () => {
    const session = makeSession({
      user: { ...makeSession().user, roles: ['viewer', 'creator'], role: 'viewer' },
      activeRole: 'viewer',
    });
    const result = normalizeAuthSession(session, ['viewer', 'creator'], 'creator');
    expect(result.activeRole).toBe('creator');
    expect(result.user.role).toBe('creator');
  });

  it('normalizeAuthSession handles admin role', () => {
    const session = makeSession({
      user: { ...makeSession().user, roles: ['admin'], role: 'admin' },
      activeRole: 'admin',
    });
    const result = normalizeAuthSession(session, ['admin'], 'admin');
    expect(result.activeRole).toBe('admin');
  });

  it('normalizeAuthSession handles moderator role', () => {
    const session = makeSession({
      user: { ...makeSession().user, roles: ['moderator'], role: 'moderator' },
      activeRole: 'moderator',
    });
    const result = normalizeAuthSession(session, ['moderator'], 'moderator');
    expect(result.activeRole).toBe('moderator');
  });
});

// ─── Token Handling ───────────────────────────────────────────────────────────

describe('token handling', () => {
  it('session tokens are preserved through normalization', () => {
    const session = makeSession({
      tokens: { accessToken: 'my-access', refreshToken: 'my-refresh' },
    });
    const result = normalizeAuthSession(session);
    expect(result.tokens.accessToken).toBe('my-access');
    expect(result.tokens.refreshToken).toBe('my-refresh');
  });

  it('session without refreshToken is still valid', () => {
    const session = makeSession({
      tokens: { accessToken: 'access-only' },
    });
    const result = normalizeAuthSession(session);
    expect(result.tokens.accessToken).toBe('access-only');
    expect(result.tokens.refreshToken).toBeUndefined();
  });
});
