import type { PrismaClient, NotificationType } from "@prisma/client";

import { toPrismaNullableJson } from "../../common/db/prisma-json";

export class NotificationsRepository {
  constructor(private readonly db: PrismaClient) {}

  listForUser(userId: string) {
    return this.db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  markRead(userId: string, notificationId: string) {
    return this.db.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() }
    });
  }

  listFollowerIds(creatorId: string) {
    return this.db.follow.findMany({
      where: { creatorId },
      select: { followerId: true }
    });
  }

  createMany(input: Array<{ userId: string; type: NotificationType; title: string; body: string; data?: Record<string, unknown> }>) {
    return this.db.notification.createMany({
      data: input.map((item) => ({
        ...item,
        data: toPrismaNullableJson(item.data)
      }))
    });
  }
}
