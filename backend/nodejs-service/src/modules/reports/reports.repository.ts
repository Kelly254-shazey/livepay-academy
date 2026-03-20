import type { ModerationStatus, PrismaClient, ReportTargetType } from "@prisma/client";

import { toPrismaNullableJson } from "../../common/db/prisma-json";

export class ReportsRepository {
  constructor(private readonly db: PrismaClient) {}

  create(reporterId: string, data: { targetType: ReportTargetType; targetId: string; reason: string; details?: string }) {
    return this.db.report.create({
      data: {
        reporterId,
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
        details: data.details
      }
    });
  }

  listMine(reporterId: string) {
    return this.db.report.findMany({
      where: { reporterId },
      orderBy: { createdAt: "desc" }
    });
  }

  listModerationQueue() {
    return this.db.report.findMany({
      where: {
        status: { in: ["open", "under_review"] }
      },
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });
  }

  updateStatus(reportId: string, status: Exclude<ModerationStatus, "open">) {
    return this.db.report.update({
      where: { id: reportId },
      data: { status }
    });
  }

  async targetExists(targetType: ReportTargetType, targetId: string) {
    switch (targetType) {
      case "live_session":
        return Boolean(await this.db.liveSession.findUnique({ where: { id: targetId }, select: { id: true } }));
      case "premium_content":
        return Boolean(await this.db.premiumContent.findUnique({ where: { id: targetId }, select: { id: true } }));
      case "class":
        return Boolean(await this.db.learningClass.findUnique({ where: { id: targetId }, select: { id: true } }));
      case "user":
        return Boolean(await this.db.user.findUnique({ where: { id: targetId }, select: { id: true } }));
      case "message":
        return Boolean(await this.db.liveChatMessage.findUnique({ where: { id: targetId }, select: { id: true } }));
    }

    return false;
  }

  createModerationAction(data: {
    moderatorId: string;
    reportId: string;
    targetType: "report";
    targetId: string;
    action: "report_resolved" | "report_dismissed";
    reason: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.db.moderationAction.create({
      data: {
        ...data,
        metadata: toPrismaNullableJson(data.metadata)
      }
    });
  }
}
