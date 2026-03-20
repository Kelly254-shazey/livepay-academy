"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsService = void 0;
const app_error_1 = require("../../common/errors/app-error");
class ReviewsService {
    repository;
    auditService;
    constructor(repository, auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }
    async upsertReview(actor, input) {
        const targetExists = await this.repository.targetExists(input.targetType, input.targetId);
        if (!targetExists) {
            throw new app_error_1.AppError("Review target not found.", 404);
        }
        const review = await this.repository.upsertReview(actor.userId, input);
        await this.auditService.record({
            actorId: actor.userId,
            actorRole: actor.role,
            action: "review.upserted",
            resource: input.targetType,
            resourceId: input.targetId,
            metadata: { rating: input.rating }
        });
        return review;
    }
    list(targetType, targetId) {
        return this.repository.list(targetType, targetId);
    }
}
exports.ReviewsService = ReviewsService;
