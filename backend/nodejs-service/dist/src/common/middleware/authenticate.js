"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const app_error_1 = require("../errors/app-error");
const jwt_1 = require("../security/jwt");
const prisma_1 = require("../../infrastructure/db/prisma");
async function authenticate(req, _res, next) {
    const authorization = req.header("authorization");
    if (!authorization?.startsWith("Bearer ")) {
        return next(new app_error_1.AppError("Authentication required.", 401));
    }
    try {
        const token = authorization.replace("Bearer ", "");
        const payload = (0, jwt_1.verifyAccessToken)(token);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, role: true, isSuspended: true }
        });
        if (!user || user.isSuspended) {
            return next(new app_error_1.AppError("Account is unavailable.", 403));
        }
        req.auth = {
            userId: user.id,
            role: user.role,
            email: user.email
        };
        return next();
    }
    catch {
        return next(new app_error_1.AppError("Invalid or expired token.", 401));
    }
}
