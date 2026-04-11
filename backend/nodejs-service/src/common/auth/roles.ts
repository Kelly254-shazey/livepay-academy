import type { UserRole } from "@prisma/client";

type RoleResolutionInput = {
  role: UserRole;
  hasCreatorProfile?: boolean | null;
};

export function deriveUserRoles(input: RoleResolutionInput): UserRole[] {
  const roles: UserRole[] = [];
  const hasCreatorCapability = input.role === "creator" || Boolean(input.hasCreatorProfile);

  if (input.role === "admin" || input.role === "moderator") {
    roles.push(input.role);
  }

  if (hasCreatorCapability) {
    roles.push("creator");
  }

  if (input.role === "viewer" || hasCreatorCapability) {
    roles.push("viewer");
  }

  if (roles.length === 0) {
    roles.push(input.role);
  }

  return Array.from(new Set(roles));
}

export function pickActiveRole(
  availableRoles: UserRole[],
  options?: {
    requestedRole?: string | string[] | null;
    fallbackRole?: UserRole;
  }
): UserRole {
  const requestedRole = Array.isArray(options?.requestedRole)
    ? options?.requestedRole[0]
    : options?.requestedRole;

  if (requestedRole && availableRoles.includes(requestedRole as UserRole)) {
    return requestedRole as UserRole;
  }

  if (options?.fallbackRole && availableRoles.includes(options.fallbackRole)) {
    return options.fallbackRole;
  }

  return availableRoles[0] ?? "viewer";
}
