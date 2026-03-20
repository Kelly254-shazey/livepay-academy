"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const app_error_1 = require("../../common/errors/app-error");
class NotificationsService {
    repository;
    auditService;
    constructor(repository, auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }
    listMine(userId) {
        return this.repository.listForUser(userId);
    }
    async markRead(userId, notificationId) {
        const updated = await this.repository.markRead(userId, notificationId);
        if (!updated.count) {
            throw new app_error_1.AppError("Notification not found.", 404);
        }
        return { updated: true };
    }
    async sendAnnouncement(actor, input) {
        let recipients = input.targetUserIds ?? [];
        if (actor.role === "creator" && recipients.length === 0) {
            const followers = await this.repository.listFollowerIds(actor.userId);
            recipients = followers.map((item) => item.followerId);
        }
        if (recipients.length === 0) {
            throw new app_error_1.AppError("No notification recipients were resolved.", 400);
        }
        const result = await this.repository.createMany(recipients.map((userId) => ({
            userId,
            title: input.title,
            body: input.body,
            type: input.type,
            data: input.liveSessionId ? { liveSessionId: input.liveSessionId } : undefined
        })));
        await this.auditService.record({
            actorId: actor.userId,
            actorRole: actor.role,
            action: "notification.announcement.sent",
            resource: "notification",
            metadata: {
                recipients: recipients.length,
                type: input.type,
                liveSessionId: input.liveSessionId
            }
        });
        return {
            sent: result.count
        };
    }
}
exports.NotificationsService = NotificationsService;
