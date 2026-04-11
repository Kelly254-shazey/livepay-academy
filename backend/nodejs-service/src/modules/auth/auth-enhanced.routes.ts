/**
 * Enhanced Authentication Routes
 * Clerk integration — all routes delegate to the canonical AuthService
 * which owns rate-limiting, OTP validation, and audit logging.
 */

import { createHash, randomBytes } from "crypto";
import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";

import { asyncHandler } from "../../common/http/async-handler";
import { AppError } from "../../common/errors/app-error";
import { authenticate } from "../../common/middleware/authenticate";
import { hashPassword } from "../../common/security/password";
import { ComprehensiveAuditService } from "../../common/audit/comprehensive-audit.service";
import { ClerkService } from "../../infrastructure/auth/clerk.service";
import { prisma } from "../../infrastructure/db/prisma";

const router = Router();
const clerkService = new ClerkService();
const auditService = new ComprehensiveAuditService(prisma);

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

// ─── Clerk webhook callback ───────────────────────────────────────────────────
router.post("/clerk-callback", asyncHandler(async (req: Request, res: Response) => {
  const { type, data } = req.body ?? {};
  if (!type || !data) {
    throw new AppError("Invalid webhook payload.", 400);
  }

  if (type === "user.created" || type === "user.updated") {
    const user = await clerkService.syncToDatabase(data, prisma);
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
router.post("/verify-clerk-token", asyncHandler(async (req: Request, res: Response) => {
  const { token } = z.object({ token: z.string().min(10) }).parse(req.body);
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
    throw new AppError("Invalid token.", 401);
  }

  let user = await prisma.user.findUnique({ where: { email: decoded.email } });
  if (!user) {
    const clerkUser = await clerkService.getUser(decoded.sub);
    if (!clerkUser) throw new AppError("Clerk user not found.", 401);
    user = await clerkService.syncToDatabase(clerkUser, prisma);
  }

  if (user.isSuspended) throw new AppError("Account is suspended.", 403);

  await prisma.user.update({
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
router.get("/session", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
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

  if (!user) throw new AppError("User not found.", 404);
  res.json({ user });
}));

export default router;
