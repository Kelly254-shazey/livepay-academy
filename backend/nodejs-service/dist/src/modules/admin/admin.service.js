"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const app_error_1 = require("../../common/errors/app-error");
class AdminService {
    repository;
    auditService;
    pythonClient;
    javaFinanceClient;
    constructor(repository, auditService, pythonClient, javaFinanceClient) {
        this.repository = repository;
        this.auditService = auditService;
        this.pythonClient = pythonClient;
        this.javaFinanceClient = javaFinanceClient;
    }
    listUsers(page) {
        return this.repository.listUsers(page.skip, page.limit);
    }
    listCreators(page) {
        return this.repository.listCreators(page.skip, page.limit);
    }
    listAuditLogs(page) {
        return this.repository.listAuditLogs(page.skip, page.limit);
    }
    listModerationActions(page) {
        return this.repository.listModerationActions(page.skip, page.limit);
    }
    listCreatorReviews(creatorUserId) {
        return this.repository.listCreatorReviews(creatorUserId);
    }
    async approveCreator(actor, creatorUserId, notes) {
        const result = await this.repository.reviewCreator(creatorUserId, actor.userId, "approved", notes).catch(() => null);
        if (!result) {
            throw new app_error_1.AppError("Creator profile not found.", 404);
        }
        await this.auditService.record({
            actorId: actor.userId,
            actorRole: actor.role,
            action: "admin.creator.approved",
            resource: "creator_profile",
            resourceId: result.creator.id,
            metadata: { notes, reviewId: result.review.id }
        });
        return result;
    }
    async rejectCreator(actor, creatorUserId, notes) {
        const result = await this.repository.reviewCreator(creatorUserId, actor.userId, "rejected", notes).catch(() => null);
        if (!result) {
            throw new app_error_1.AppError("Creator profile not found.", 404);
        }
        await this.auditService.record({
            actorId: actor.userId,
            actorRole: actor.role,
            action: "admin.creator.rejected",
            resource: "creator_profile",
            resourceId: result.creator.id,
            metadata: { notes, reviewId: result.review.id }
        });
        return result;
    }
    async suspendUser(actor, userId, reason) {
        const { user, moderationAction } = await this.repository.suspendUser(userId, actor.userId, reason);
        await this.auditService.record({
            actorId: actor.userId,
            actorRole: actor.role,
            action: "admin.user.suspended",
            resource: "user",
            resourceId: user.id,
            metadata: { reason, moderationActionId: moderationAction.id }
        });
        return user;
    }
    async suspendResource(actor, resourceType, resourceId, reason) {
        const { resource, moderationAction } = await this.repository.suspendResource(resourceType, resourceId, actor.userId, reason);
        await this.auditService.record({
            actorId: actor.userId,
            actorRole: actor.role,
            action: "admin.resource.suspended",
            resource: resourceType,
            resourceId,
            metadata: { reason, moderationActionId: moderationAction.id }
        });
        return resource;
    }
    async overview() {
        const to = new Date();
        const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const fromDate = from.toISOString().slice(0, 10);
        const toDate = to.toISOString().slice(0, 10);
        const [counts, analytics, revenueSummary, platformCommission] = await Promise.all([
            this.repository.overviewCounts(),
            this.pythonClient.getAnalyticsSummary().catch(() => null),
            this.javaFinanceClient.getRevenueSummary(fromDate, toDate).catch(() => null),
            this.javaFinanceClient.getPlatformCommission(fromDate, toDate).catch(() => null)
        ]);
        return {
            counts,
            analytics,
            finance: {
                revenueSummary,
                platformCommission,
                range: { from: fromDate, to: toDate }
            }
        };
    }
}
exports.AdminService = AdminService;
