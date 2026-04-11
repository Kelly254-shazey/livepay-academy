"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PremiumContentService = void 0;
const app_error_1 = require("../../common/errors/app-error");
class PremiumContentService {
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
    async update(contentId, creatorId, role, data) {
        const updated = await this.repository.update(contentId, creatorId, this.normalizeContentAssets(data));
        if (!updated.count) {
            throw new app_error_1.AppError("Content not found or not owned by actor.", 404);
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
    list(filters) {
        return this.repository.list(filters);
    }
    async preview(contentId) {
        const content = await this.repository.getById(contentId);
        if (!content) {
            throw new app_error_1.AppError("Premium content not found.", 404);
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
    async accessCheck(contentId, actor) {
        const content = await this.repository.getById(contentId);
        if (!content) {
            throw new app_error_1.AppError("Premium content not found.", 404);
        }
        if (!actor) {
            return { allowed: !content.isPaid, contentId };
        }
        await this.accessService.assertPremiumContentAccess(actor.userId, actor.role, contentId);
        return { allowed: true, contentId };
    }
    async publish(contentId, creatorId, role) {
        const updated = await this.repository.publish(contentId, creatorId);
        if (!updated.count) {
            throw new app_error_1.AppError("Content not found or not owned by actor.", 404);
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
    normalizeContentAssets(data) {
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
exports.PremiumContentService = PremiumContentService;
