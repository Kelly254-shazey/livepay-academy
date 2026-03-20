"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const app_error_1 = require("../../common/errors/app-error");
class ReportsService {
    repository;
    auditService;
    pythonClient;
    constructor(repository, auditService, pythonClient) {
        this.repository = repository;
        this.auditService = auditService;
        this.pythonClient = pythonClient;
    }
    async create(actor, input) {
        const targetExists = await this.repository.targetExists(input.targetType, input.targetId);
        if (!targetExists) {
            throw new app_error_1.AppError("Report target not found.", 404);
        }
        const moderationSignal = await this.pythonClient.analyzeContent({
            title: input.reason,
            description: input.details,
            contentType: "user_report"
        }).catch(() => null);
        const report = await this.repository.create(actor.userId, input);
        await this.auditService.record({
            actorId: actor.userId,
            actorRole: actor.role,
            action: "report.created",
            resource: input.targetType,
            resourceId: input.targetId,
            metadata: { moderationSignal }
        });
        return { report, moderationSignal };
    }
    listMine(userId) {
        return this.repository.listMine(userId);
    }
    moderationQueue() {
        return this.repository.listModerationQueue();
    }
    async updateStatus(actor, reportId, status) {
        const report = await this.repository.updateStatus(reportId, status);
        if (status !== "under_review") {
            await this.repository.createModerationAction({
                moderatorId: actor.userId,
                reportId,
                targetType: "report",
                targetId: reportId,
                action: status === "dismissed" ? "report_dismissed" : "report_resolved",
                reason: `Report marked as ${status}.`,
                metadata: {
                    targetType: report.targetType,
                    targetId: report.targetId,
                    status
                }
            });
        }
        await this.auditService.record({
            actorId: actor.userId,
            actorRole: actor.role,
            action: "report.status.updated",
            resource: "report",
            resourceId: reportId,
            metadata: { status }
        });
        return report;
    }
}
exports.ReportsService = ReportsService;
