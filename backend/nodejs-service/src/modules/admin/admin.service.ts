import { parsePagination } from "../../common/http/pagination";
import { AuditService } from "../../common/audit/audit.service";
import { AppError } from "../../common/errors/app-error";
import { JavaFinanceClient } from "../../infrastructure/integrations/java-finance.client";
import { PythonIntelligenceClient } from "../../infrastructure/integrations/python-intelligence.client";
import { AdminRepository } from "./admin.repository";

export class AdminService {
  constructor(
    private readonly repository: AdminRepository,
    private readonly auditService: AuditService,
    private readonly pythonClient: PythonIntelligenceClient,
    private readonly javaFinanceClient: JavaFinanceClient
  ) {}

  listUsers(page: ReturnType<typeof parsePagination>) {
    return this.repository.listUsers(page.skip, page.limit);
  }

  listCreators(page: ReturnType<typeof parsePagination>) {
    return this.repository.listCreators(page.skip, page.limit);
  }

  listAuditLogs(page: ReturnType<typeof parsePagination>) {
    return this.repository.listAuditLogs(page.skip, page.limit);
  }

  listModerationActions(page: ReturnType<typeof parsePagination>) {
    return this.repository.listModerationActions(page.skip, page.limit);
  }

  listCreatorReviews(creatorUserId: string) {
    return this.repository.listCreatorReviews(creatorUserId);
  }

  async approveCreator(actor: { userId: string; role: "admin" }, creatorUserId: string, notes?: string) {
    const result = await this.repository.reviewCreator(creatorUserId, actor.userId, "approved", notes).catch(() => null);
    if (!result) {
      throw new AppError("Creator profile not found.", 404);
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

  async rejectCreator(actor: { userId: string; role: "admin" }, creatorUserId: string, notes: string) {
    const result = await this.repository.reviewCreator(creatorUserId, actor.userId, "rejected", notes).catch(() => null);
    if (!result) {
      throw new AppError("Creator profile not found.", 404);
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

  async suspendUser(actor: { userId: string; role: "admin" }, userId: string, reason: string) {
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

  async suspendResource(actor: { userId: string; role: "admin" | "moderator" }, resourceType: "live_session" | "premium_content" | "class", resourceId: string, reason: string) {
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

  async overview(actor: { role: "admin" | "moderator" }) {
    const to = new Date();
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const fromDate = from.toISOString().slice(0, 10);
    const toDate = to.toISOString().slice(0, 10);
    const financeVisible = actor.role === "admin";

    const [counts, analytics, revenueSummary, platformCommission] = await Promise.all([
      this.repository.overviewCounts(),
      this.pythonClient.getAnalyticsSummary().catch(() => null),
      financeVisible ? this.javaFinanceClient.getRevenueSummary(fromDate, toDate).catch(() => null) : Promise.resolve(null),
      financeVisible ? this.javaFinanceClient.getPlatformCommission(fromDate, toDate).catch(() => null) : Promise.resolve(null)
    ]);

    return {
      counts,
      analytics,
      finance: {
        financeVisible,
        revenueSummary,
        platformCommission,
        range: { from: fromDate, to: toDate }
      }
    };
  }
}
