"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveSessionsRepository = void 0;
const prisma_json_1 = require("../../common/db/prisma-json");
class LiveSessionsRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    create(creatorId, data) {
        return this.db.liveSession.create({
            data: {
                creatorId,
                title: data.title,
                description: data.description,
                categoryId: data.categoryId,
                price: data.isPaid ? data.price ?? 0 : 0,
                currency: data.currency,
                isPaid: data.isPaid ?? false,
                visibility: data.visibility,
                scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
                roomMetadata: (0, prisma_json_1.toPrismaNullableJson)(data.roomMetadata),
                status: data.scheduledFor ? "scheduled" : "draft"
            }
        });
    }
    update(liveSessionId, creatorId, data) {
        const payload = {
            title: data.title,
            description: data.description,
            categoryId: data.categoryId,
            price: data.isPaid === false ? 0 : data.price,
            currency: data.currency,
            isPaid: data.isPaid,
            visibility: data.visibility,
            scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
            roomMetadata: (0, prisma_json_1.toPrismaNullableJson)(data.roomMetadata)
        };
        return this.db.liveSession.updateMany({
            where: { id: liveSessionId, creatorId },
            data: payload
        });
    }
    getById(id) {
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
    list(filters) {
        return this.db.liveSession.findMany({
            where: {
                categoryId: filters.categoryId,
                creatorId: filters.creatorId,
                status: filters.status
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
    setStatus(liveSessionId, creatorId, data) {
        return this.db.liveSession.updateMany({
            where: { id: liveSessionId, creatorId },
            data: data
        });
    }
    setRoomMetadata(liveSessionId, roomMetadata) {
        return this.db.liveSession.update({
            where: { id: liveSessionId },
            data: { roomMetadata: (0, prisma_json_1.toPrismaNullableJson)(roomMetadata) }
        });
    }
    recordJoin(liveSessionId, userId) {
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
            try {
                return await tx.liveParticipant.create({
                    data: { liveSessionId, userId }
                });
            }
            catch (error) {
                if (isUniqueConstraintError(error)) {
                    const participant = await tx.liveParticipant.findFirst({
                        where: {
                            liveSessionId,
                            userId,
                            leftAt: null
                        },
                        orderBy: { joinedAt: "desc" }
                    });
                    if (participant) {
                        return participant;
                    }
                }
                throw error;
            }
        });
    }
    async recordLeave(liveSessionId, userId, attendanceSeconds) {
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
    listChatMessages(liveSessionId, limit) {
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
    updateChatMessageStatus(messageId, liveSessionId, status) {
        return this.db.liveChatMessage.updateMany({
            where: {
                id: messageId,
                liveSessionId
            },
            data: { status }
        });
    }
    getChatMessage(messageId, liveSessionId) {
        return this.db.liveChatMessage.findFirst({
            where: {
                id: messageId,
                liveSessionId
            }
        });
    }
    createModerationAction(data) {
        return this.db.moderationAction.create({
            data: {
                ...data,
                metadata: (0, prisma_json_1.toPrismaNullableJson)(data.metadata)
            }
        });
    }
}
exports.LiveSessionsRepository = LiveSessionsRepository;
function isUniqueConstraintError(error) {
    return Boolean(error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2002");
}
