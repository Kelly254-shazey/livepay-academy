import type { PrismaClient } from "@prisma/client";

type ContentMutation = {
  categoryId?: string;
  title?: string;
  excerpt?: string;
  description?: string;
  price?: number;
  currency?: string;
  isPaid?: boolean;
  previewAsset?: string;
  contentAsset?: string;
};

export class PremiumContentRepository {
  constructor(private readonly db: PrismaClient) {}

  create(creatorId: string, data: ContentMutation) {
    return this.db.premiumContent.create({
      data: {
        creatorId,
        title: data.title!,
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

  update(contentId: string, creatorId: string, data: ContentMutation) {
    return this.db.premiumContent.updateMany({
      where: { id: contentId, creatorId },
      data
    });
  }

  list(filters: { categoryId?: string; creatorId?: string; status?: string }) {
    return this.db.premiumContent.findMany({
      where: {
        categoryId: filters.categoryId,
        creatorId: filters.creatorId,
        status: filters.status as never
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

  getById(id: string) {
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

  publish(contentId: string, creatorId: string) {
    return this.db.premiumContent.updateMany({
      where: { id: contentId, creatorId },
      data: {
        status: "published",
        publishedAt: new Date()
      }
    });
  }
}
