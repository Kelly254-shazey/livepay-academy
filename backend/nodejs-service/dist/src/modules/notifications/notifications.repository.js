"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsRepository = void 0;
const prisma_json_1 = require("../../common/db/prisma-json");
class NotificationsRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    listForUser(userId) {
        return this.db.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" }
        });
    }
    markRead(userId, notificationId) {
        return this.db.notification.updateMany({
            where: { id: notificationId, userId },
            data: { readAt: new Date() }
        });
    }
    listFollowerIds(creatorId) {
        return this.db.follow.findMany({
            where: { creatorId },
            select: { followerId: true }
        });
    }
    createMany(input) {
        return this.db.notification.createMany({
            data: input.map((item) => ({
                ...item,
                data: (0, prisma_json_1.toPrismaNullableJson)(item.data)
            }))
        });
    }
}
exports.NotificationsRepository = NotificationsRepository;
