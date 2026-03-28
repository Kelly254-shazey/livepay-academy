import type { AuthNextStep, AuthSession, UserRole } from './contracts';

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
  const serverRoles = session.user.roles?.length
    ? session.user.roles
    : session.user.role
      ? [session.user.role]
      : [];
  const fallbackRoles = roles?.length
    ? roles
    : [activeRole ?? session.activeRole ?? session.user.role].filter(
        (role): role is UserRole => Boolean(role),
      );
  const normalizedRoles = Array.from(
    new Set(serverRoles.length ? serverRoles : fallbackRoles),
  );
  const requestedActiveRole =
    activeRole ?? session.activeRole ?? session.user.role ?? normalizedRoles[0];
  const normalizedActiveRole = normalizedRoles.includes(requestedActiveRole)
    ? requestedActiveRole
    : normalizedRoles[0];
  const nextStep =
    session.nextStep ??
    (session.user.emailVerified === false
      ? 'verify-email'
      : session.user.profileCompleted === false
        ? 'complete-profile'
        : null);

  return {
    ...session,
    activeRole: normalizedActiveRole,
    nextStep,
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

export function getRequiredAuthStep(
  session: AuthSession | null | undefined,
): AuthNextStep {
  if (!session) return null;

  if (session.nextStep) {
    return session.nextStep;
  }

  if (session.user.emailVerified === false) {
    return 'verify-email';
  }

  if (session.user.profileCompleted === false) {
    return 'complete-profile';
  }

  return null;
}
