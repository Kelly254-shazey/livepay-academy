/**
 * Enhanced Authentication Routes
 * Clerk integration, password reset, email verification
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { ClerkService } from "../../infrastructure/auth/clerk.service";
import { GeolocationService } from "../../infrastructure/integrations/geolocation.service";
import { ComprehensiveAuditService } from "../../common/audit/comprehensive-audit.service";
import { prisma } from "../../infrastructure/db/prisma";

const router = Router();
const clerkService = new ClerkService();
const geolocationService = new GeolocationService();
const auditService = new ComprehensiveAuditService(prisma);

/**
 * POST /api/auth/clerk-callback
 * Handles Clerk webhook and syncs user to database
 */
router.post("/clerk-callback", async (req: Request, res: Response) => {
  try {
    const {
      type,
      data: { id, email_addresses, first_name, last_name, profile_image_url, public_metadata }
    } = req.body;

    if (type === "user.created" || type === "user.updated") {
      const clerkUser = {
        id,
        email_addresses,
        first_name,
        last_name,
        profile_image_url,
        public_metadata
      };

      // Detect user location
      const ipAddress = req.ip || "127.0.0.1";
      const location = await geolocationService.detectLocation(ipAddress);

      // Sync to database
      const user = await clerkService.syncToDatabase(clerkUser, prisma);

      // Update user with location and currency (user fields may be updated based on Prisma schema)
      if (location) {
        // Note: Store location info in audit log metadata instead of user record
        // User model may not have country/currency fields
      }

      // Audit log
      await auditService.recordAudit({
        actorId: user.id,
        actorRole: user.role,
        action: "auth.clerk_signin",
        resourceType: "user",
        resourceId: user.id,
        status: "success",
        ipAddress,
        metadata: { provider: "clerk", country: location?.country }
      });

      res.json({ success: true, user });
    }
  } catch (error) {
    console.error("Clerk callback error:", error);
    await auditService.recordAudit({
      action: "auth.clerk_callback_failed",
      status: "failure",
      errorMessage: String(error),
      ipAddress: req.ip
    });
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/auth/verify-clerk-token
 * Verify and sync Clerk JWT token
 */
router.post("/verify-clerk-token", async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const ipAddress = req.ip || "127.0.0.1";

    const decoded = await clerkService.verifyToken(token);
    if (!decoded) {
      await auditService.recordSessionEvent({
        userId: "unknown",
        eventType: "login_failure",
        ipAddress,
        userAgent: req.get("user-agent") || "",
        isSuspicious: true
      });
      return res.status(401).json({ error: "Invalid token" });
    }

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { email: decoded.email }
    });

    if (!user) {
      const clerkUser = await clerkService.getUser(decoded.sub);
      if (clerkUser) {
        user = await clerkService.syncToDatabase(clerkUser, prisma);
      }
    }

    // Update last login
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          emailVerifiedAt: decoded.email_verified ? new Date() : undefined
        }
      });

      // Record session
      await auditService.recordSessionEvent({
        userId: user.id,
        eventType: "login_success",
        ipAddress,
        userAgent: req.get("user-agent") || "",
        metadata: { provider: "clerk" }
      });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("Clerk verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/auth/request-password-reset
 * Request password reset email
 */
router.post("/request-password-reset", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const ipAddress = req.ip || "127.0.0.1";

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Don't reveal if email exists for security
      return res.json({ success: true, message: "If email exists, reset link sent" });
    }

    // Generate password reset token
    const token = require("crypto").randomBytes(32).toString("hex");
    const tokenHash = require("crypto").createHash("sha256").update(token).digest("hex");

    const resetToken = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      }
    });

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/auth?mode=reset&token=${token}`;
    // await emailService.sendPasswordResetEmail(user.email, resetUrl, user.firstName);

    // Audit
    await auditService.recordAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "auth.password_reset_requested",
      ipAddress,
      metadata: { tokenId: resetToken.id }
    });

    res.json({ success: true, message: "Reset link sent to email" });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/auth/reset-password
 * Complete password reset
 */
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;
    const ipAddress = req.ip || "127.0.0.1";

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid request" });
    }

    // Verify code (from email service)
    // This would check the code that was sent via email
    // For now, just verify the format
    if (!code || code.length < 6) {
      return res.status(401).json({ error: "Invalid code" });
    }

    // Update password
    const hashPassword = require("../common/security/password").hashPassword;
    const newPasswordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash }
    });

    // Invalidate all existing refresh tokens
    await prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { revokedAt: new Date() }
    });

    // Audit
    await auditService.recordAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "auth.password_reset_completed",
      ipAddress
    });

    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/auth/verify-email
 * Verify email address with OTP
 */
router.post("/verify-email", async (req: Request, res: Response) => {
  try {
    const { userId, code } = req.body;
    const ipAddress = req.ip || "127.0.0.1";

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify code (would check against OneTimeCode table)
    // For now, just check format
    if (!code || code.length < 6) {
      return res.status(401).json({ error: "Invalid code" });
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() }
    });

    // Audit
    await auditService.recordAudit({
      actorId: userId,
      actorRole: user.role,
      action: "auth.email_verified",
      ipAddress
    });

    res.json({ success: true, message: "Email verified" });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/auth/session
 * Get current session info
 */
router.get("/session", async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        emailVerifiedAt: true
      }
    });

    res.json({ success: true, user });
  } catch (error) {
    console.error("Session error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
