"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.optionalAuthenticate = optionalAuthenticate;
const app_error_1 = require("../errors/app-error");
const roles_1 = require("../auth/roles");
const jwt_1 = require("../security/jwt");
const prisma_1 = require("../../infrastructure/db/prisma");
async function resolveAuthContext(authorization, requestedRole) {
    const token = authorization.replace("Bearer ", "");
    const payload = (0, jwt_1.verifyAccessToken)(token);
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
            id: true,
            email: true,
            role: true,
            isSuspended: true,
            creatorProfile: {
                select: { id: true }
            }
        }
    });
    if (!user || user.isSuspended) {
        throw new app_error_1.AppError("Account is unavailable.", 403);
    }
    const roles = (0, roles_1.deriveUserRoles)({
        role: user.role,
        hasCreatorProfile: Boolean(user.creatorProfile)
    });
    const normalizedRequestedRole = Array.isArray(requestedRole) ? requestedRole[0] : requestedRole;
    if (normalizedRequestedRole && !roles.includes(normalizedRequestedRole)) {
        throw new app_error_1.AppError("Requested role is not available for this account.", 403);
    }
    return {
        userId: user.id,
        role: (0, roles_1.pickActiveRole)(roles, {
            requestedRole: normalizedRequestedRole,
            fallbackRole: payload.role
        }),
        roles,
        email: user.email
    };
}
async function authenticate(req, _res, next) {
    const authorization = req.header("authorization");
    if (!authorization?.startsWith("Bearer ")) {
        return next(new app_error_1.AppError("Authentication required.", 401));
    }
    try {
        req.auth = await resolveAuthContext(authorization, req.header("x-active-role"));
        return next();
    }
    catch (error) {
        if (error instanceof app_error_1.AppError) {
            return next(error);
        }
        return next(new app_error_1.AppError("Invalid or expired token.", 401));
    }
}
async function optionalAuthenticate(req, _res, next) {
    const authorization = req.header("authorization");
    if (!authorization) {
        return next();
    }
    if (!authorization.startsWith("Bearer ")) {
        return next(new app_error_1.AppError("Invalid or expired token.", 401));
    }
    try {
        req.auth = await resolveAuthContext(authorization, req.header("x-active-role"));
        return next();
    }
    catch (error) {
        if (error instanceof app_error_1.AppError) {
            return next(error);
        }
        return next(new app_error_1.AppError("Invalid or expired token.", 401));
    }
}
