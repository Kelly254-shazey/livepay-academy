import type { PrismaClient } from "@prisma/client";

import { toPrismaNullableJson } from "../../common/db/prisma-json";

export class AdminRepository {
  constructor(private readonly db: PrismaClient) {}

  listUsers(skip: number, take: number) {
    return this.db.user.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { creatorProfile: true }
    });
  }

  listCreators(skip: number, take: number) {
    return this.db.creatorProfile.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { user: true }
    });
  }

  listAuditLogs(skip: number, take: number) {
    return this.db.auditLog.findMany({
      skip,
      take,
      orderBy: { timestamp: "desc" }
    });
  }

  listModerationActions(skip: number, take: number) {
    return this.db.moderationAction.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        moderator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        report: true
      }
    });
  }

  reviewCreator(
    creatorUserId: string,
    reviewerId: string,
    decision: "approved" | "rejected",
    notes?: string
  ) {
    return this.db.$transaction(async (tx) => {
      const creator = await tx.creatorProfile.update({
        where: { userId: creatorUserId },
        data: {
          verificationStatus: decision,
          payoutEligible: decision === "approved"
        }
      });

      const review = await tx.creatorVerificationReview.create({
        data: {
          creatorProfileId: creator.id,
          reviewerId,
          decision,
          notes
        }
      });

      const moderationAction = await tx.moderationAction.create({
        data: {
          moderatorId: reviewerId,
          targetType: "creator_profile",
          targetId: creator.id,
          action: decision === "approved" ? "creator_approved" : "creator_rejected",
          reason: notes ?? (decision === "approved" ? "Creator approved." : "Creator rejected."),
          metadata: toPrismaNullableJson({
            creatorUserId
          })
        }
      });

      return { creator, review, moderationAction };
    });
  }

  listCreatorReviews(creatorUserId: string) {
    return this.db.creatorVerificationReview.findMany({
      where: {
        creatorProfile: {
          is: {
            userId: creatorUserId
          }
        }
      },
      orderBy: { createdAt: "desc" },
      include: {
        reviewer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        creatorProfile: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            userId: true
          }
        }
      }
    });
  }

  suspendUser(userId: string, moderatorId: string, reason: string) {
    return this.db.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { isSuspended: true }
      });

      const moderationAction = await tx.moderationAction.create({
        data: {
          moderatorId,
          targetType: "user",
          targetId: userId,
          action: "account_suspended",
          reason
        }
      });

      return { user, moderationAction };
    });
  }

  async suspendResource(
    resourceType: "live_session" | "premium_content" | "class",
    resourceId: string,
    moderatorId: string,
    reason: string
  ) {
    return this.db.$transaction(async (tx) => {
      let resource: unknown;

      switch (resourceType) {
        case "live_session":
          resource = await tx.liveSession.update({
            where: { id: resourceId },
            data: { status: "suspended" }
          });
          break;
        case "premium_content":
          resource = await tx.premiumContent.update({
            where: { id: resourceId },
            data: { status: "suspended" }
          });
          break;
        case "class":
          resource = await tx.learningClass.update({
            where: { id: resourceId },
            data: { status: "suspended" }
          });
          break;
      }

      const moderationAction = await tx.moderationAction.create({
        data: {
          moderatorId,
          targetType: resourceType,
          targetId: resourceId,
          action: "content_suspended",
          reason
        }
      });

      return { resource, moderationAction };
    });
  }

  async overviewCounts() {
    const [users, creators, liveSessions, premiumContents, classes] = await Promise.all([
      this.db.user.count(),
      this.db.creatorProfile.count(),
      this.db.liveSession.count(),
      this.db.premiumContent.count(),
      this.db.learningClass.count()
    ]);

    return { users, creators, liveSessions, premiumContents, classes };
  }
}
