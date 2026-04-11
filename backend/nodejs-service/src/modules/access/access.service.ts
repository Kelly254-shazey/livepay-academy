import jwt from "jsonwebtoken";
import { type AccessGrantTargetType, type PrismaClient, type UserRole } from "@prisma/client";

import { env } from "../../config/env";
import { AppError } from "../../common/errors/app-error";
import { AuditService } from "../../common/audit/audit.service";
import { JavaFinanceClient } from "../../infrastructure/integrations/java-finance.client";
import { PythonIntelligenceClient } from "../../infrastructure/integrations/python-intelligence.client";

type SupportedPurchaseTarget = "live_session" | "premium_content" | "class";

export class AccessService {
  constructor(
    private readonly db: PrismaClient,
    private readonly auditService: AuditService,
    private readonly javaFinanceClient: JavaFinanceClient,
    private readonly pythonClient: PythonIntelligenceClient
  ) {}

  async confirmPurchase(
    _userId: string,
    _role: UserRole,
    _input: {
      targetType: SupportedPurchaseTarget;
      targetId: string;
      providerReference: string;
      idempotencyKey?: string;
    }
  ) {
    throw new AppError(
      "Verified payment settlement is not configured. Purchase confirmation is disabled until provider callback verification is implemented.",
      503
    );
  }

  async getGrantStatus(userId: string, targetType: AccessGrantTargetType, targetId: string) {
    const grant = await this.findActiveGrant(userId, targetType, targetId);
    return { allowed: Boolean(grant), grant };
  }

  async assertLiveSessionAccess(userId: string, role: UserRole, liveSessionId: string) {
    const live = await this.resolveLiveAccess(userId, role, liveSessionId, false);
    return { live };
  }

  async assertLiveJoinAccess(userId: string, role: UserRole, liveSessionId: string) {
    const live = await this.resolveLiveAccess(userId, role, liveSessionId, true);

    return {
      live,
      roomAccessToken: this.issueRoomToken(live.id, userId)
    };
  }

  async assertPremiumContentAccess(userId: string, role: UserRole, contentId: string) {
    const content = await this.db.premiumContent.findUnique({
      where: { id: contentId }
    });
    if (!content) {
      throw new AppError("Premium content not found.", 404);
    }

    if (role === "admin" || role === "moderator" || content.creatorId === userId || !content.isPaid) {
      return content;
    }

    const grant = await this.findActiveGrant(userId, "premium_content", content.id);
    if (!grant) {
      throw new AppError("Access grant required.", 403);
    }

    return content;
  }

  async assertClassAccess(userId: string, role: UserRole, classId: string) {
    const learningClass = await this.db.learningClass.findUnique({
      where: { id: classId }
    });
    if (!learningClass) {
      throw new AppError("Class not found.", 404);
    }

    if (role === "admin" || role === "moderator" || learningClass.creatorId === userId || !learningClass.isPaid) {
      return learningClass;
    }

    const [grant, enrollment] = await Promise.all([
      this.findActiveGrant(userId, "class", classId),
      this.db.enrollment.findUnique({
        where: {
          classId_userId: {
            classId,
            userId
          }
        }
      })
    ]);

    if (!grant && enrollment?.status !== "active") {
      throw new AppError("Paid class access has not been granted.", 403);
    }

    return learningClass;
  }

  async assertLessonAccess(userId: string, role: UserRole, classId: string, lessonId: string) {
    const lesson = await this.db.classLesson.findFirst({
      where: { id: lessonId, classId },
      include: { learningClass: true }
    });
    if (!lesson) {
      throw new AppError("Lesson not found.", 404);
    }

    if (lesson.isPreview) {
      return lesson;
    }

    await this.assertClassAccess(userId, role, classId);
    return lesson;
  }

  private async findActiveGrant(userId: string, targetType: AccessGrantTargetType, targetId: string) {
    return this.db.accessGrant.findFirst({
      where: {
        userId,
        targetType,
        targetId,
        status: "active",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      },
      orderBy: { createdAt: "desc" }
    });
  }

  private issueRoomToken(liveSessionId: string, userId: string) {
    return jwt.sign({ kind: "live_room", liveSessionId, userId }, env.JWT_ACCESS_SECRET, {
      expiresIn: "10m"
    });
  }

  private async resolveLiveAccess(userId: string, role: UserRole, liveSessionId: string, requireJoinable: boolean) {
    const live = await this.db.liveSession.findUnique({
      where: { id: liveSessionId }
    });
    if (!live) {
      throw new AppError("Live session not found.", 404);
    }

    await this.assertLiveVisibilityAccess(live, userId, role, requireJoinable);

    if (role !== "admin" && role !== "moderator" && live.creatorId !== userId) {
      if (live.isPaid) {
        const grant = await this.findActiveGrant(userId, "live_session", live.id);
        if (!grant) {
          throw new AppError("Paid live access has not been granted.", 403);
        }
      }
    }

    return live;
  }

  private async assertLiveVisibilityAccess(
    live: {
      id: string;
      creatorId: string;
      status: string;
      visibility: "public" | "followers_only" | "private";
    },
    userId: string,
    role: UserRole,
    requireJoinable: boolean
  ) {
    const blockedStates = requireJoinable
      ? ["draft", "ended", "cancelled", "suspended"]
      : ["draft", "cancelled", "suspended"];
    if (blockedStates.includes(live.status)) {
      throw new AppError(requireJoinable ? "Live session is not joinable." : "Live session is not accessible.", 409);
    }

    if (role === "admin" || role === "moderator" || live.creatorId === userId) {
      return;
    }

    if (live.visibility === "followers_only") {
      const follow = await this.db.follow.findUnique({
        where: {
          followerId_creatorId: {
            followerId: userId,
            creatorId: live.creatorId
          }
        }
      });

      if (!follow) {
        throw new AppError("You must follow the creator to access this live.", 403);
      }
    }

    if (live.visibility === "private") {
      const invite = await this.db.accessGrant.findFirst({
        where: {
          userId,
          targetId: live.id,
          status: "active",
          targetType: { in: ["private_live_invite", "live_session"] }
        }
      });

      if (!invite) {
        throw new AppError("Private live access is required.", 403);
      }
    }
  }

}
