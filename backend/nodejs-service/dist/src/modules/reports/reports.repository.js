"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsRepository = void 0;
const prisma_json_1 = require("../../common/db/prisma-json");
class ReportsRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    create(reporterId, data) {
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
    listMine(reporterId) {
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
    updateStatus(reportId, status) {
        return this.db.report.update({
            where: { id: reportId },
            data: { status }
        });
    }
    async targetExists(targetType, targetId) {
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
    createModerationAction(data) {
        return this.db.moderationAction.create({
            data: {
                ...data,
                metadata: (0, prisma_json_1.toPrismaNullableJson)(data.metadata)
            }
        });
    }
}
exports.ReportsRepository = ReportsRepository;
