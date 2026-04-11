"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassesService = void 0;
const app_error_1 = require("../../common/errors/app-error");
class ClassesService {
    repository;
    accessService;
    auditService;
    pythonClient;
    mediaAccessService;
    constructor(repository, accessService, auditService, pythonClient, mediaAccessService) {
        this.repository = repository;
        this.accessService = accessService;
        this.auditService = auditService;
        this.pythonClient = pythonClient;
        this.mediaAccessService = mediaAccessService;
    }
    async create(creatorId, role, data) {
        await this.pythonClient.analyzeContent({
            title: data.title ?? "",
            description: data.description,
            contentType: "class"
        });
        const learningClass = await this.repository.create(creatorId, data);
        await this.auditService.record({
            actorId: creatorId,
            actorRole: role,
            action: "class.created",
            resource: "class",
            resourceId: learningClass.id
        });
        return learningClass;
    }
    async update(classId, creatorId, role, data) {
        const updated = await this.repository.update(classId, creatorId, data);
        if (!updated.count) {
            throw new app_error_1.AppError("Class not found or not owned by actor.", 404);
        }
        await this.auditService.record({
            actorId: creatorId,
            actorRole: role,
            action: "class.updated",
            resource: "class",
            resourceId: classId
        });
        return this.repository.getById(classId);
    }
    async addLesson(classId, actor, data) {
        const learningClass = await this.repository.getById(classId);
        if (!learningClass || learningClass.creatorId !== actor.userId) {
            throw new app_error_1.AppError("Class not found or not owned by actor.", 404);
        }
        const lesson = await this.repository.addLesson(classId, {
            ...data,
            assetUrl: data.assetUrl ? this.mediaAccessService.validateSourceUrl(data.assetUrl) : undefined
        });
        await this.auditService.record({
            actorId: actor.userId,
            actorRole: actor.role,
            action: "class.lesson.added",
            resource: "lesson",
            resourceId: lesson.id
        });
        return lesson;
    }
    list(filters) {
        return this.repository.list(filters);
    }
    async getById(classId) {
        const learningClass = await this.repository.getById(classId);
        if (!learningClass) {
            throw new app_error_1.AppError("Class not found.", 404);
        }
        return learningClass;
    }
    async enroll(classId, actor) {
        const learningClass = await this.repository.getById(classId);
        if (!learningClass) {
            throw new app_error_1.AppError("Class not found.", 404);
        }
        if (learningClass.isPaid) {
            await this.accessService.assertClassAccess(actor.userId, actor.role, classId);
        }
        return this.repository.enroll(classId, actor.userId);
    }
    async lessonAccess(classId, lessonId, actor) {
        const lesson = await this.accessService.assertLessonAccess(actor.userId, actor.role, classId, lessonId);
        return {
            allowed: true,
            lessonId: lesson.id,
            classId,
            assetUrl: this.mediaAccessService.createDeliveryUrl({
                assetUrl: lesson.assetUrl,
                resourceType: "class_lesson",
                resourceId: lesson.id
            })
        };
    }
    async publish(classId, creatorId, role) {
        const updated = await this.repository.publish(classId, creatorId);
        if (!updated.count) {
            throw new app_error_1.AppError("Class not found or not owned by actor.", 404);
        }
        await this.auditService.record({
            actorId: creatorId,
            actorRole: role,
            action: "class.published",
            resource: "class",
            resourceId: classId
        });
        return this.repository.getById(classId);
    }
}
exports.ClassesService = ClassesService;
