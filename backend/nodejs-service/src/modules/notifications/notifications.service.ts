import { AppError } from "../../common/errors/app-error";
import { AuditService } from "../../common/audit/audit.service";
import { NotificationsRepository } from "./notifications.repository";

export class NotificationsService {
  constructor(
    private readonly repository: NotificationsRepository,
    private readonly auditService: AuditService
  ) {}

  listMine(userId: string) {
    return this.repository.listForUser(userId);
  }

  async markRead(userId: string, notificationId: string) {
    const updated = await this.repository.markRead(userId, notificationId);
    if (!updated.count) {
      throw new AppError("Notification not found.", 404);
    }
    return { updated: true };
  }

  async sendAnnouncement(
    actor: { userId: string; role: "creator" | "admin" },
    input: { title: string; body: string; targetUserIds?: string[]; type: "creator_announcement" | "system_alert" | "live_reminder"; liveSessionId?: string }
  ) {
    let recipients = input.targetUserIds ?? [];

    if (actor.role === "creator" && recipients.length === 0) {
      const followers = await this.repository.listFollowerIds(actor.userId);
      recipients = followers.map((item) => item.followerId);
    }

    if (recipients.length === 0) {
      throw new AppError("No notification recipients were resolved.", 400);
    }

    const result = await this.repository.createMany(
      recipients.map((userId) => ({
        userId,
        title: input.title,
        body: input.body,
        type: input.type,
        data: input.liveSessionId ? { liveSessionId: input.liveSessionId } : undefined
      }))
    );

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

