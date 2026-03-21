import type { AuthSession, UserRole } from './contracts';

export function getSessionRoles(session: AuthSession | null | undefined): UserRole[] {
  if (!session) return [];

  const roles = session.user.roles?.length
    ? session.user.roles
    : [session.activeRole ?? session.user.role];

  return Array.from(new Set(roles));
}

export function getActiveRole(session: AuthSession | null | undefined): UserRole | null {
  if (!session) return null;

  return session.activeRole ?? session.user.role;
}

export function normalizeAuthSession(
  session: AuthSession,
  roles?: UserRole[],
  activeRole?: UserRole,
): AuthSession {
  const normalizedRoles = Array.from(
    new Set(roles?.length ? roles : session.user.roles?.length ? session.user.roles : [activeRole ?? session.activeRole ?? session.user.role]),
  );
  const normalizedActiveRole =
    activeRole ?? session.activeRole ?? session.user.role ?? normalizedRoles[0];

  return {
    ...session,
    activeRole: normalizedActiveRole,
    user: {
      ...session.user,
      role: normalizedActiveRole,
      roles: normalizedRoles,
    },
  };
}

export function switchSessionRole(
  session: AuthSession | null,
  role: UserRole,
): AuthSession | null {
  if (!session) return null;

  const roles = getSessionRoles(session);
  if (!roles.includes(role)) return session;

  return normalizeAuthSession(session, roles, role);
}
