import type { PrismaClient } from "@prisma/client";

type ClassMutation = {
  categoryId?: string;
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  isPaid?: boolean;
  startsAt?: string;
  endsAt?: string;
};

export class ClassesRepository {
  constructor(private readonly db: PrismaClient) {}

  create(creatorId: string, data: ClassMutation) {
    return this.db.learningClass.create({
      data: {
        creatorId,
        title: data.title!,
        description: data.description,
        categoryId: data.categoryId,
        price: data.isPaid === false ? 0 : data.price ?? 0,
        currency: data.currency,
        isPaid: data.isPaid ?? true,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined
      }
    });
  }

  update(classId: string, creatorId: string, data: ClassMutation) {
    return this.db.learningClass.updateMany({
      where: { id: classId, creatorId },
      data: {
        ...data,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined
      }
    });
  }

  addLesson(classId: string, data: { title: string; description?: string; orderIndex: number; isPreview: boolean; assetUrl?: string; scheduledFor?: string }) {
    return this.db.classLesson.create({
      data: {
        classId,
        title: data.title,
        description: data.description,
        orderIndex: data.orderIndex,
        isPreview: data.isPreview,
        assetUrl: data.assetUrl,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined
      }
    });
  }

  getById(id: string) {
    return this.db.learningClass.findUnique({
      where: { id },
      include: {
        lessons: { orderBy: { orderIndex: "asc" } },
        category: true,
        creator: {
          select: {
            id: true,
            creatorProfile: { select: { handle: true, displayName: true } }
          }
        }
      }
    });
  }

  list(filters: { categoryId?: string; creatorId?: string; status?: string }) {
    return this.db.learningClass.findMany({
      where: {
        categoryId: filters.categoryId,
        creatorId: filters.creatorId,
        status: filters.status as never
      },
      include: {
        category: true,
        creator: {
          select: {
            id: true,
            creatorProfile: { select: { handle: true, displayName: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  enroll(classId: string, userId: string) {
    return this.db.enrollment.upsert({
      where: {
        classId_userId: {
          classId,
          userId
        }
      },
      update: { status: "active" },
      create: {
        classId,
        userId,
        status: "active"
      }
    });
  }

  publish(classId: string, creatorId: string) {
    return this.db.learningClass.updateMany({
      where: { id: classId, creatorId },
      data: { status: "published" }
    });
  }
}
