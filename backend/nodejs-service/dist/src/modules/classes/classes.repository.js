"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassesRepository = void 0;
class ClassesRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    create(creatorId, data) {
        return this.db.learningClass.create({
            data: {
                creatorId,
                title: data.title,
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
    update(classId, creatorId, data) {
        return this.db.learningClass.updateMany({
            where: { id: classId, creatorId },
            data: {
                ...data,
                startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
                endsAt: data.endsAt ? new Date(data.endsAt) : undefined
            }
        });
    }
    addLesson(classId, data) {
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
    getById(id) {
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
    list(filters) {
        return this.db.learningClass.findMany({
            where: {
                categoryId: filters.categoryId,
                creatorId: filters.creatorId,
                status: filters.status
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
    enroll(classId, userId) {
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
    publish(classId, creatorId) {
        return this.db.learningClass.updateMany({
            where: { id: classId, creatorId },
            data: { status: "published" }
        });
    }
}
exports.ClassesRepository = ClassesRepository;
