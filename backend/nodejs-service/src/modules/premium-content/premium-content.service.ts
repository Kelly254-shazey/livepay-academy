import { AppError } from "../../common/errors/app-error";
import { AuditService } from "../../common/audit/audit.service";
import { MediaAccessService } from "../../infrastructure/media/media-access.service";
import { PythonIntelligenceClient } from "../../infrastructure/integrations/python-intelligence.client";
import { AccessService } from "../access/access.service";
import { PremiumContentRepository } from "./premium-content.repository";

export class PremiumContentService {
  constructor(
    private readonly repository: PremiumContentRepository,
    private readonly accessService: AccessService,
    private readonly auditService: AuditService,
    private readonly pythonClient: PythonIntelligenceClient,
    private readonly mediaAccessService: MediaAccessService
  ) {}

  async create(creatorId: string, role: "creator" | "admin", data: Parameters<PremiumContentRepository["create"]>[1]) {
    await this.pythonClient.analyzeContent({
      title: data.title ?? "",
      description: data.description,
      contentType: "premium_content"
    });

    const content = await this.repository.create(creatorId, this.normalizeContentAssets(data));
    await this.auditService.record({
      actorId: creatorId,
      actorRole: role,
      action: "content.created",
      resource: "premium_content",
      resourceId: content.id
    });
    return content;
  }

  async update(contentId: string, creatorId: string, role: "creator" | "admin", data: Parameters<PremiumContentRepository["update"]>[2]) {
    const updated = await this.repository.update(contentId, creatorId, this.normalizeContentAssets(data));
    if (!updated.count) {
      throw new AppError("Content not found or not owned by actor.", 404);
    }

    await this.auditService.record({
      actorId: creatorId,
      actorRole: role,
      action: "content.updated",
      resource: "premium_content",
      resourceId: contentId
    });

    return this.repository.getById(contentId);
  }

  list(filters: { categoryId?: string; creatorId?: string; status?: string }) {
    return this.repository.list(filters);
  }

  async preview(contentId: string) {
    const content = await this.repository.getById(contentId);
    if (!content) {
      throw new AppError("Premium content not found.", 404);
    }

    return {
      id: content.id,
      title: content.title,
      excerpt: content.excerpt,
      description: content.description,
      price: content.price,
      currency: content.currency,
      isPaid: content.isPaid,
      previewAsset: content.previewAsset,
      creator: content.creator,
      category: content.category
    };
  }

  async accessCheck(contentId: string, actor?: { userId: string; role: "viewer" | "creator" | "moderator" | "admin" }) {
    const content = await this.repository.getById(contentId);
    if (!content) {
      throw new AppError("Premium content not found.", 404);
    }

    if (!actor) {
      return { allowed: !content.isPaid, contentId };
    }

    await this.accessService.assertPremiumContentAccess(actor.userId, actor.role, contentId);
    return { allowed: true, contentId };
  }

  async publish(contentId: string, creatorId: string, role: "creator" | "admin") {
    const updated = await this.repository.publish(contentId, creatorId);
    if (!updated.count) {
      throw new AppError("Content not found or not owned by actor.", 404);
    }

    await this.auditService.record({
      actorId: creatorId,
      actorRole: role,
      action: "content.published",
      resource: "premium_content",
      resourceId: contentId
    });

    return this.repository.getById(contentId);
  }

  private normalizeContentAssets<T extends { previewAsset?: string; contentAsset?: string }>(data: T): T {
    return {
      ...data,
      previewAsset: data.previewAsset
        ? this.mediaAccessService.validateSourceUrl(data.previewAsset)
        : undefined,
      contentAsset: data.contentAsset
        ? this.mediaAccessService.validateSourceUrl(data.contentAsset)
        : undefined
    };
  }
}
