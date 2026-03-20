"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersRepository = void 0;
const prisma_json_1 = require("../../common/db/prisma-json");
class UsersRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    getUserProfile(userId) {
        return this.db.user.findUnique({
            where: { id: userId },
            include: { creatorProfile: true }
        });
    }
    updateUserProfile(userId, data) {
        return this.db.user.update({
            where: { id: userId },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                settings: (0, prisma_json_1.toPrismaNullableJson)(data.settings)
            }
        });
    }
    updateNotificationPreferences(userId, preferences) {
        return this.db.user.update({
            where: { id: userId },
            data: { notificationPreferences: preferences }
        });
    }
    createFollow(followerId, creatorId) {
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
    deleteFollow(followerId, creatorId) {
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
    listPurchaseHistory(userId) {
        return this.db.accessGrant.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" }
        });
    }
}
exports.UsersRepository = UsersRepository;
