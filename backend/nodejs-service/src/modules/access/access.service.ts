import { createHash } from "crypto";
import jwt from "jsonwebtoken";
import { Prisma, type AccessGrantTargetType, type PrismaClient, type UserRole } from "@prisma/client";

import { env } from "../../config/env";
import { AppError } from "../../common/errors/app-error";
import { AuditService } from "../../common/audit/audit.service";
import { toPrismaJson, toPrismaNullableJson } from "../../common/db/prisma-json";
import { JavaFinanceClient } from "../../infrastructure/integrations/java-finance.client";
import { PythonIntelligenceClient } from "../../infrastructure/integrations/python-intelligence.client";

type SupportedPurchaseTarget = "live_session" | "premium_content" | "class";

type ResolvedTarget = {
  id: string;
  creatorId: string;
  title: string;
  amount: string;
  currency: string;
  isPaid: boolean;
};

const PAYMENT_IDENTIFIER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9._:-]{6,118}[A-Za-z0-9])?$/;

function buildLiveJoinCode(source: string) {
  const normalized = source.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const body = normalized.slice(0, 10).padEnd(10, "X");
  return `LIV-${body}`;
}

function normalizePaymentIdentifier(value: string, fieldLabel: string) {
  const normalized = value.trim();

  if (!PAYMENT_IDENTIFIER_PATTERN.test(normalized)) {
    throw new AppError(`${fieldLabel} format is invalid.`, 400);
  }

  return normalized;
}

function buildInternalIdempotencyKey(input: {
  userId: string;
  targetType: SupportedPurchaseTarget;
  targetId: string;
  providerReference: string;
  idempotencyKey?: string;
}) {
  if (input.idempotencyKey?.trim()) {
    return normalizePaymentIdentifier(input.idempotencyKey, "Idempotency key");
  }

  const digest = createHash("sha256")
    .update(`${input.userId}:${input.targetType}:${input.targetId}:${input.providerReference}`)
    .digest("hex");

  return `conf-${digest.slice(0, 32)}`;
}

export class AccessService {
  constructor(
    private readonly db: PrismaClient,
    private readonly auditService: AuditService,
    private readonly javaFinanceClient: JavaFinanceClient,
    private readonly pythonClient: PythonIntelligenceClient
  ) {}

  async confirmPurchase(
    userId: string,
    role: UserRole,
    input: {
      targetType: SupportedPurchaseTarget;
      targetId: string;
      providerReference: string;
      idempotencyKey?: string;
    }
  ) {
    const providerReference = normalizePaymentIdentifier(input.providerReference, "Provider reference");
    const idempotencyKey = buildInternalIdempotencyKey({
      userId,
      targetType: input.targetType,
      targetId: input.targetId,
      providerReference,
      idempotencyKey: input.idempotencyKey
    });
    const target = await this.resolveTarget(input.targetType, input.targetId);
    if (!target.isPaid) {
      throw new AppError("This resource does not require payment.", 409);
    }

    if (target.creatorId === userId) {
      throw new AppError("Creators already own access to their own resources.", 409);
    }

    if (input.targetType === "live_session") {
      const live = await this.db.liveSession.findUnique({
        where: { id: input.targetId }
      });

      if (!live) {
        throw new AppError("Live session not found.", 404);
      }

      await this.assertLiveVisibilityAccess(live, userId, role, false);
    }

    const existing = await this.db.accessGrant.findUnique({
      where: { sourceReference: providerReference }
    });

    if (existing) {
      return {
        grant: existing,
        idempotent: true,
        liveJoinCode: input.targetType === "live_session" ? buildLiveJoinCode(existing.id) : undefined
      };
    }

    const risk = await this.pythonClient
      .scoreTransaction({
        userId,
        creatorId: target.creatorId,
        targetType: input.targetType,
        targetId: input.targetId,
        amount: target.amount,
        currency: target.currency
      })
      .catch(() => ({ riskScore: 0, decision: "allow" }));

    const riskScore = Number(risk.riskScore ?? 0);
    if (riskScore >= 85 || risk.decision === "review") {
      await this.auditService.record({
        actorId: userId,
        actorRole: role,
        action: "purchase.blocked_by_risk",
        resource: input.targetType,
        resourceId: input.targetId,
        metadata: { risk }
      });
      throw new AppError("Transaction requires manual review.", 409, { risk });
    }

    const finance = await this.javaFinanceClient.recordSuccessfulPurchase({
      buyerId: userId,
      creatorId: target.creatorId,
      targetType: input.targetType,
      targetId: input.targetId,
      amount: target.amount,
      currency: target.currency,
      providerReference,
      idempotencyKey
    });

    const grant = await this.db.$transaction(async (tx) => {
      const createdGrant = await tx.accessGrant.create({
        data: {
          userId,
          grantedById: userId,
          targetType: input.targetType,
          targetId: input.targetId,
          sourceReference: providerReference,
          price: target.amount,
          currency: target.currency,
          riskScore,
          status: "active"
        }
      });

      if (input.targetType === "class") {
        await tx.enrollment.upsert({
          where: {
            classId_userId: {
              classId: input.targetId,
              userId
            }
          },
          update: {
            status: "active",
            accessGrantId: createdGrant.id
          },
          create: {
            classId: input.targetId,
            userId,
            status: "active",
            accessGrantId: createdGrant.id
          }
        });
      }

      return createdGrant;
    });

    await this.auditService.record({
      actorId: userId,
      actorRole: role,
      action: "purchase.confirmed",
      resource: input.targetType,
      resourceId: input.targetId,
      metadata: {
        providerReference,
        idempotencyKey,
        finance,
        riskScore
      }
    });

    await this.db.notification.createMany({
      data: [
        {
          userId,
          type: "purchase",
          title: "Purchase confirmed",
          body:
            input.targetType === "live_session"
              ? `Your access to ${target.title} is active. Join code: ${buildLiveJoinCode(grant.id)}.`
              : `Your access to ${target.title} is active.`,
          data: toPrismaJson({
            targetType: input.targetType,
            targetId: input.targetId,
            accessGrantId: grant.id,
            joinCode: input.targetType === "live_session" ? buildLiveJoinCode(grant.id) : undefined
          })
        },
        {
          userId: target.creatorId,
          type: "purchase",
          title: "New sale received",
          body: `A user purchased access to ${target.title}.`,
          data: toPrismaJson({
            targetType: input.targetType,
            targetId: input.targetId,
            buyerId: userId
          })
        }
      ]
    });

    return {
      grant,
      finance,
      risk,
      liveJoinCode: input.targetType === "live_session" ? buildLiveJoinCode(grant.id) : undefined
    };
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

  private async resolveTarget(targetType: SupportedPurchaseTarget, targetId: string): Promise<ResolvedTarget> {
    switch (targetType) {
      case "live_session": {
        const target = await this.db.liveSession.findUnique({ where: { id: targetId } });
        if (!target) {
          throw new AppError("Live session not found.", 404);
        }
        return {
          id: target.id,
          creatorId: target.creatorId,
          title: target.title,
          amount: target.price.toString(),
          currency: target.currency,
          isPaid: target.isPaid
        };
      }
      case "premium_content": {
        const target = await this.db.premiumContent.findUnique({ where: { id: targetId } });
        if (!target) {
          throw new AppError("Premium content not found.", 404);
        }
        return {
          id: target.id,
          creatorId: target.creatorId,
          title: target.title,
          amount: target.price.toString(),
          currency: target.currency,
          isPaid: target.isPaid
        };
      }
      case "class": {
        const target = await this.db.learningClass.findUnique({ where: { id: targetId } });
        if (!target) {
          throw new AppError("Class not found.", 404);
        }
        return {
          id: target.id,
          creatorId: target.creatorId,
          title: target.title,
          amount: target.price.toString(),
          currency: target.currency,
          isPaid: target.isPaid
        };
      }
    }

    throw new AppError("Unsupported purchase target.", 400);
  }
}
