"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsRepository = void 0;
class ReviewsRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    upsertReview(authorId, data) {
        return this.db.review.upsert({
            where: {
                authorId_targetType_targetId: {
                    authorId,
                    targetType: data.targetType,
                    targetId: data.targetId
                }
            },
            update: {
                rating: data.rating,
                comment: data.comment
            },
            create: {
                authorId,
                targetType: data.targetType,
                targetId: data.targetId,
                rating: data.rating,
                comment: data.comment
            }
        });
    }
    list(targetType, targetId) {
        return this.db.review.findMany({
            where: { targetType, targetId },
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        creatorProfile: { select: { handle: true, displayName: true } }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });
    }
    async targetExists(targetType, targetId) {
        switch (targetType) {
            case "creator":
                return Boolean(await this.db.creatorProfile.findFirst({
                    where: {
                        OR: [{ id: targetId }, { userId: targetId }]
                    },
                    select: { id: true }
                }));
            case "live_session":
                return Boolean(await this.db.liveSession.findUnique({ where: { id: targetId }, select: { id: true } }));
            case "premium_content":
                return Boolean(await this.db.premiumContent.findUnique({ where: { id: targetId }, select: { id: true } }));
            case "class":
                return Boolean(await this.db.learningClass.findUnique({ where: { id: targetId }, select: { id: true } }));
        }
        return false;
    }
}
exports.ReviewsRepository = ReviewsRepository;
