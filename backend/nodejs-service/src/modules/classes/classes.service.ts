import { AppError } from "../../common/errors/app-error";
import { AuditService } from "../../common/audit/audit.service";
import { MediaAccessService } from "../../infrastructure/media/media-access.service";
import { PythonIntelligenceClient } from "../../infrastructure/integrations/python-intelligence.client";
import { AccessService } from "../access/access.service";
import { ClassesRepository } from "./classes.repository";

export class ClassesService {
  constructor(
    private readonly repository: ClassesRepository,
    private readonly accessService: AccessService,
    private readonly auditService: AuditService,
    private readonly pythonClient: PythonIntelligenceClient,
    private readonly mediaAccessService: MediaAccessService
  ) {}

  async create(creatorId: string, role: "creator" | "admin", data: Parameters<ClassesRepository["create"]>[1]) {
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

  async update(classId: string, creatorId: string, role: "creator" | "admin", data: Parameters<ClassesRepository["update"]>[2]) {
    const updated = await this.repository.update(classId, creatorId, data);
    if (!updated.count) {
      throw new AppError("Class not found or not owned by actor.", 404);
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

  async addLesson(classId: string, actor: { userId: string; role: "creator" | "admin" }, data: Parameters<ClassesRepository["addLesson"]>[1]) {
    const learningClass = await this.repository.getById(classId);
    if (!learningClass || learningClass.creatorId !== actor.userId) {
      throw new AppError("Class not found or not owned by actor.", 404);
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

  list(filters: { categoryId?: string; creatorId?: string; status?: string }) {
    return this.repository.list(filters);
  }

  async getById(classId: string) {
    const learningClass = await this.repository.getById(classId);
    if (!learningClass) {
      throw new AppError("Class not found.", 404);
    }
    return learningClass;
  }

  async enroll(classId: string, actor: { userId: string; role: "viewer" | "creator" | "moderator" | "admin" }) {
    const learningClass = await this.repository.getById(classId);
    if (!learningClass) {
      throw new AppError("Class not found.", 404);
    }

    if (learningClass.isPaid) {
      await this.accessService.assertClassAccess(actor.userId, actor.role, classId);
    }

    return this.repository.enroll(classId, actor.userId);
  }

  async lessonAccess(classId: string, lessonId: string, actor: { userId: string; role: "viewer" | "creator" | "moderator" | "admin" }) {
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

  async publish(classId: string, creatorId: string, role: "creator" | "admin") {
    const updated = await this.repository.publish(classId, creatorId);
    if (!updated.count) {
      throw new AppError("Class not found or not owned by actor.", 404);
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
