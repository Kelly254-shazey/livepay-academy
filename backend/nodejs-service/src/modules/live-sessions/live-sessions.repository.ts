import { Prisma, type PrismaClient } from "@prisma/client";

import { toPrismaNullableJson } from "../../common/db/prisma-json";

type LiveMutation = {
  categoryId?: string;
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  isPaid?: boolean;
  visibility?: "public" | "followers_only" | "private";
  scheduledFor?: string;
  roomMetadata?: Record<string, unknown>;
};

export class LiveSessionsRepository {
  constructor(private readonly db: PrismaClient) {}

  create(creatorId: string, data: LiveMutation) {
    return this.db.liveSession.create({
      data: {
        creatorId,
        title: data.title!,
        description: data.description,
        categoryId: data.categoryId,
        price: data.isPaid ? data.price ?? 0 : 0,
        currency: data.currency,
        isPaid: data.isPaid ?? false,
        visibility: data.visibility,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
        roomMetadata: toPrismaNullableJson(data.roomMetadata),
        status: data.scheduledFor ? "scheduled" : "draft"
      }
    });
  }

  update(liveSessionId: string, creatorId: string, data: LiveMutation) {
    const payload: Prisma.LiveSessionUncheckedUpdateManyInput = {
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      price: data.isPaid === false ? 0 : data.price,
      currency: data.currency,
      isPaid: data.isPaid,
      visibility: data.visibility,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
      roomMetadata: toPrismaNullableJson(data.roomMetadata)
    };

    return this.db.liveSession.updateMany({
      where: { id: liveSessionId, creatorId },
      data: payload
    });
  }

  getById(id: string) {
    return this.db.liveSession.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            creatorProfile: true
          }
        },
        category: true
      }
    });
  }

  list(filters: { categoryId?: string; creatorId?: string; status?: string }) {
    return this.db.liveSession.findMany({
      where: {
        categoryId: filters.categoryId,
        creatorId: filters.creatorId,
        status: filters.status as never
      },
      orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }],
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            creatorProfile: { select: { handle: true, displayName: true } }
          }
        },
        category: true
      }
    });
  }

  setStatus(liveSessionId: string, creatorId: string, data: Record<string, unknown>) {
    return this.db.liveSession.updateMany({
      where: { id: liveSessionId, creatorId },
      data: data as never
    });
  }

  setRoomMetadata(liveSessionId: string, roomMetadata: Record<string, unknown>) {
    return this.db.liveSession.update({
      where: { id: liveSessionId },
      data: { roomMetadata: toPrismaNullableJson(roomMetadata) }
    });
  }

  recordJoin(liveSessionId: string, userId: string) {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.liveParticipant.findFirst({
        where: {
          liveSessionId,
          userId,
          leftAt: null
        },
        orderBy: { joinedAt: "desc" }
      });

      if (existing) {
        return existing;
      }

      return tx.liveParticipant.create({
        data: { liveSessionId, userId }
      });
    });
  }

  async recordLeave(liveSessionId: string, userId: string, attendanceSeconds: number) {
    const participant = await this.db.liveParticipant.findFirst({
      where: { liveSessionId, userId, leftAt: null },
      orderBy: { joinedAt: "desc" }
    });

    if (!participant) {
      return null;
    }

    return this.db.liveParticipant.update({
      where: { id: participant.id },
      data: {
        leftAt: new Date(),
        attendanceSeconds
      }
    });
  }

  listChatMessages(liveSessionId: string, limit: number) {
    return this.db.liveChatMessage.findMany({
      where: {
        liveSessionId,
        status: "active"
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            creatorProfile: {
              select: {
                handle: true,
                displayName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: limit
    });
  }

  updateChatMessageStatus(messageId: string, liveSessionId: string, status: "hidden" | "removed") {
    return this.db.liveChatMessage.updateMany({
      where: {
        id: messageId,
        liveSessionId
      },
      data: { status }
    });
  }

  getChatMessage(messageId: string, liveSessionId: string) {
    return this.db.liveChatMessage.findFirst({
      where: {
        id: messageId,
        liveSessionId
      }
    });
  }

  createModerationAction(data: {
    moderatorId: string;
    reportId?: string;
    targetType: "live_chat_message";
    targetId: string;
    action: "message_removed";
    reason: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.db.moderationAction.create({
      data: {
        ...data,
        metadata: toPrismaNullableJson(data.metadata)
      }
    });
  }
}
