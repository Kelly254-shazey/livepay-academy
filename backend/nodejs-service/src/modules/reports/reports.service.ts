import type { ModerationStatus, ReportTargetType } from "@prisma/client";

import { AuditService } from "../../common/audit/audit.service";
import { AppError } from "../../common/errors/app-error";
import { PythonIntelligenceClient } from "../../infrastructure/integrations/python-intelligence.client";
import { ReportsRepository } from "./reports.repository";

export class ReportsService {
  constructor(
    private readonly repository: ReportsRepository,
    private readonly auditService: AuditService,
    private readonly pythonClient: PythonIntelligenceClient
  ) {}

  async create(actor: { userId: string; role: "viewer" | "creator" | "moderator" | "admin" }, input: { targetType: ReportTargetType; targetId: string; reason: string; details?: string }) {
    const targetExists = await this.repository.targetExists(input.targetType, input.targetId);
    if (!targetExists) {
      throw new AppError("Report target not found.", 404);
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

  listMine(userId: string) {
    return this.repository.listMine(userId);
  }

  moderationQueue() {
    return this.repository.listModerationQueue();
  }

  async updateStatus(actor: { userId: string; role: "moderator" | "admin" }, reportId: string, status: Exclude<ModerationStatus, "open">) {
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
