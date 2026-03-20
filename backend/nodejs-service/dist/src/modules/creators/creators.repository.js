"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatorsRepository = void 0;
class CreatorsRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    upsertProfile(userId, data) {
        return this.db.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: { role: "creator" }
            });
            return tx.creatorProfile.upsert({
                where: { userId },
                update: data,
                create: {
                    userId,
                    ...data
                }
            });
        });
    }
    getOwnProfile(userId) {
        return this.db.creatorProfile.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
    }
    getPublicProfile(handle) {
        return this.db.creatorProfile.findUnique({
            where: { handle },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        createdAt: true
                    }
                }
            }
        });
    }
}
exports.CreatorsRepository = CreatorsRepository;
