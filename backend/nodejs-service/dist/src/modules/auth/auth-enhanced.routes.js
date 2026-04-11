"use strict";
/**
 * Enhanced Authentication Routes
 * Clerk integration — all routes delegate to the canonical AuthService
 * which owns rate-limiting, OTP validation, and audit logging.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const express_1 = require("express");
const zod_1 = require("zod");
const async_handler_1 = require("../../common/http/async-handler");
const app_error_1 = require("../../common/errors/app-error");
const authenticate_1 = require("../../common/middleware/authenticate");
const comprehensive_audit_service_1 = require("../../common/audit/comprehensive-audit.service");
const clerk_service_1 = require("../../infrastructure/auth/clerk.service");
const prisma_1 = require("../../infrastructure/db/prisma");
const router = (0, express_1.Router)();
const clerkService = new clerk_service_1.ClerkService();
const auditService = new comprehensive_audit_service_1.ComprehensiveAuditService(prisma_1.prisma);
function sha256(value) {
    return (0, crypto_1.createHash)("sha256").update(value).digest("hex");
}
// ─── Clerk webhook callback ───────────────────────────────────────────────────
router.post("/clerk-callback", (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { type, data } = req.body ?? {};
    if (!type || !data) {
        throw new app_error_1.AppError("Invalid webhook payload.", 400);
    }
    if (type === "user.created" || type === "user.updated") {
        const user = await clerkService.syncToDatabase(data, prisma_1.prisma);
        await auditService.recordAudit({
            actorId: user.id,
            actorRole: user.role,
            action: "auth.clerk_webhook",
            resourceType: "user",
            resourceId: user.id,
            status: "success",
            ipAddress: req.ip,
            metadata: { webhookType: type }
        });
        return res.json({ accepted: true });
    }
    // Unknown event types are acknowledged but not processed
    res.json({ accepted: true });
}));
// ─── Verify Clerk token ───────────────────────────────────────────────────────
router.post("/verify-clerk-token", (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { token } = zod_1.z.object({ token: zod_1.z.string().min(10) }).parse(req.body);
    const ipAddress = req.ip ?? "";
    const decoded = await clerkService.verifyToken(token);
    if (!decoded) {
        await auditService.recordSessionEvent({
            userId: "unknown",
            eventType: "login_failure",
            ipAddress,
            userAgent: req.get("user-agent") ?? "",
            isSuspicious: true
        });
        throw new app_error_1.AppError("Invalid token.", 401);
    }
    let user = await prisma_1.prisma.user.findUnique({ where: { email: decoded.email } });
    if (!user) {
        const clerkUser = await clerkService.getUser(decoded.sub);
        if (!clerkUser)
            throw new app_error_1.AppError("Clerk user not found.", 401);
        user = await clerkService.syncToDatabase(clerkUser, prisma_1.prisma);
    }
    if (user.isSuspended)
        throw new app_error_1.AppError("Account is suspended.", 403);
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: {
            lastLoginAt: new Date(),
            ...(decoded.email_verified && !user.emailVerifiedAt ? { emailVerifiedAt: new Date() } : {})
        }
    });
    await auditService.recordSessionEvent({
        userId: user.id,
        eventType: "login_success",
        ipAddress,
        userAgent: req.get("user-agent") ?? "",
        metadata: { provider: "clerk" }
    });
    res.json({ accepted: true, userId: user.id, role: user.role });
}));
// ─── Session (authenticated) ──────────────────────────────────────────────────
router.get("/session", authenticate_1.authenticate, (0, async_handler_1.asyncHandler)(async (req, res) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.auth.userId },
        select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            avatarUrl: true,
            emailVerifiedAt: true,
            profileCompletedAt: true
        }
    });
    if (!user)
        throw new app_error_1.AppError("User not found.", 404);
    res.json({ user });
}));
exports.default = router;
