"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PremiumContentRepository = void 0;
class PremiumContentRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    create(creatorId, data) {
        return this.db.premiumContent.create({
            data: {
                creatorId,
                title: data.title,
                excerpt: data.excerpt,
                description: data.description,
                categoryId: data.categoryId,
                price: data.isPaid === false ? 0 : data.price ?? 0,
                currency: data.currency,
                isPaid: data.isPaid ?? true,
                previewAsset: data.previewAsset,
                contentAsset: data.contentAsset
            }
        });
    }
    update(contentId, creatorId, data) {
        return this.db.premiumContent.updateMany({
            where: { id: contentId, creatorId },
            data
        });
    }
    list(filters) {
        return this.db.premiumContent.findMany({
            where: {
                categoryId: filters.categoryId,
                creatorId: filters.creatorId,
                status: filters.status
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        creatorProfile: { select: { handle: true, displayName: true } }
                    }
                },
                category: true
            },
            orderBy: { createdAt: "desc" }
        });
    }
    getById(id) {
        return this.db.premiumContent.findUnique({
            where: { id },
            include: {
                creator: {
                    select: {
                        id: true,
                        creatorProfile: { select: { handle: true, displayName: true } }
                    }
                },
                category: true
            }
        });
    }
    publish(contentId, creatorId) {
        return this.db.premiumContent.updateMany({
            where: { id: contentId, creatorId },
            data: {
                status: "published",
                publishedAt: new Date()
            }
        });
    }
}
exports.PremiumContentRepository = PremiumContentRepository;
