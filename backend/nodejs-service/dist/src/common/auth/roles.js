"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveUserRoles = deriveUserRoles;
exports.pickActiveRole = pickActiveRole;
function deriveUserRoles(input) {
    const roles = [];
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
function pickActiveRole(availableRoles, options) {
    const requestedRole = Array.isArray(options?.requestedRole)
        ? options?.requestedRole[0]
        : options?.requestedRole;
    if (requestedRole && availableRoles.includes(requestedRole)) {
        return requestedRole;
    }
    if (options?.fallbackRole && availableRoles.includes(options.fallbackRole)) {
        return options.fallbackRole;
    }
    return availableRoles[0] ?? "viewer";
}
