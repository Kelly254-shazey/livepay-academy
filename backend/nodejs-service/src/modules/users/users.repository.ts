import { Prisma, type PrismaClient } from "@prisma/client";

import { toPrismaNullableJson } from "../../common/db/prisma-json";

export class UsersRepository {
  constructor(private readonly db: PrismaClient) {}

  getUserProfile(userId: string) {
    return this.db.user.findUnique({
      where: { id: userId },
      include: { creatorProfile: true }
    });
  }

  updateUserProfile(userId: string, data: { firstName?: string; lastName?: string; settings?: Record<string, unknown> }) {
    return this.db.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        settings: toPrismaNullableJson(data.settings)
      }
    });
  }

  updateNotificationPreferences(userId: string, preferences: Record<string, boolean>) {
    return this.db.user.update({
      where: { id: userId },
      data: { notificationPreferences: preferences as Prisma.InputJsonValue }
    });
  }

  createFollow(followerId: string, creatorId: string) {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.follow.findUnique({
        where: {
          followerId_creatorId: { followerId, creatorId }
        }
      });

      if (existing) {
        return existing;
      }

      const follow = await tx.follow.create({
        data: { followerId, creatorId }
      });

      await tx.creatorProfile.updateMany({
        where: { userId: creatorId },
        data: { followersCount: { increment: 1 } }
      });

      return follow;
    });
  }

  deleteFollow(followerId: string, creatorId: string) {
    return this.db.$transaction(async (tx) => {
      const deleted = await tx.follow.deleteMany({
        where: { followerId, creatorId }
      });

      if (deleted.count) {
        await tx.creatorProfile.updateMany({
          where: { userId: creatorId, followersCount: { gt: 0 } },
          data: { followersCount: { decrement: 1 } }
        });
      }
    });
  }

  listPurchaseHistory(userId: string) {
    return this.db.accessGrant.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }
}
