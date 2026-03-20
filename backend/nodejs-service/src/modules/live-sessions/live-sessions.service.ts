import { AppError } from "../../common/errors/app-error";
import { AuditService } from "../../common/audit/audit.service";
import { PythonIntelligenceClient } from "../../infrastructure/integrations/python-intelligence.client";
import { StreamingProviderClient } from "../../infrastructure/integrations/streaming-provider.client";
import { AccessService } from "../access/access.service";
import { LiveSessionsRepository } from "./live-sessions.repository";

export class LiveSessionsService {
  constructor(
    private readonly repository: LiveSessionsRepository,
    private readonly accessService: AccessService,
    private readonly auditService: AuditService,
    private readonly pythonClient: PythonIntelligenceClient,
    private readonly streamingProviderClient: StreamingProviderClient
  ) {}

  async create(creatorId: string, role: "creator" | "admin", data: Parameters<LiveSessionsRepository["create"]>[1]) {
    await this.pythonClient.analyzeContent({
      title: data.title ?? "",
      description: data.description,
      contentType: "live_session"
    });

    const live = await this.repository.create(creatorId, data);
    const roomMetadata = {
      ...((live.roomMetadata as Record<string, unknown> | null) ?? {}),
      streaming: this.streamingProviderClient.buildRoom({
        liveSessionId: live.id,
        roomId: live.roomId,
        visibility: live.visibility
      })
    };
    await this.repository.setRoomMetadata(live.id, roomMetadata);

    await this.auditService.record({
      actorId: creatorId,
      actorRole: role,
      action: "live.created",
      resource: "live_session",
      resourceId: live.id
    });
    const created = await this.repository.getById(live.id);
    return created ? this.decorateLiveSession(created) : created;
  }

  async update(liveSessionId: string, creatorId: string, role: "creator" | "admin", data: Parameters<LiveSessionsRepository["update"]>[2]) {
    const updated = await this.repository.update(liveSessionId, creatorId, data);
    if (!updated.count) {
      throw new AppError("Live session not found or not owned by actor.", 404);
    }

    await this.auditService.record({
      actorId: creatorId,
      actorRole: role,
      action: "live.updated",
      resource: "live_session",
      resourceId: liveSessionId
    });

    const live = await this.repository.getById(liveSessionId);
    return live ? this.decorateLiveSession(live) : live;
  }

  list(filters: { categoryId?: string; creatorId?: string; status?: string }) {
    return this.repository.list(filters).then((items) => items.map((item) => this.decorateLiveSession(item)));
  }

  async getById(liveSessionId: string) {
    const live = await this.repository.getById(liveSessionId);
    if (!live) {
      throw new AppError("Live session not found.", 404);
    }

    return this.decorateLiveSession(live);
  }

  async publish(liveSessionId: string, creatorId: string, role: "creator" | "admin") {
    const result = await this.repository.setStatus(liveSessionId, creatorId, {
      status: "published",
      publishedAt: new Date()
    });
    if (!result.count) {
      throw new AppError("Live session not found or not owned by actor.", 404);
    }

    await this.auditService.record({
      actorId: creatorId,
      actorRole: role,
      action: "live.published",
      resource: "live_session",
      resourceId: liveSessionId
    });

    const live = await this.repository.getById(liveSessionId);
    return live ? this.decorateLiveSession(live) : live;
  }

  async start(liveSessionId: string, creatorId: string, role: "creator" | "admin") {
    const result = await this.repository.setStatus(liveSessionId, creatorId, {
      status: "live",
      startedAt: new Date()
    });
    if (!result.count) {
      throw new AppError("Live session not found or not owned by actor.", 404);
    }

    await this.auditService.record({
      actorId: creatorId,
      actorRole: role,
      action: "live.started",
      resource: "live_session",
      resourceId: liveSessionId
    });

    const live = await this.repository.getById(liveSessionId);
    return live ? this.decorateLiveSession(live) : live;
  }

  async end(liveSessionId: string, creatorId: string, role: "creator" | "admin") {
    const result = await this.repository.setStatus(liveSessionId, creatorId, {
      status: "ended",
      endedAt: new Date()
    });
    if (!result.count) {
      throw new AppError("Live session not found or not owned by actor.", 404);
    }

    await this.auditService.record({
      actorId: creatorId,
      actorRole: role,
      action: "live.ended",
      resource: "live_session",
      resourceId: liveSessionId
    });

    const live = await this.repository.getById(liveSessionId);
    return live ? this.decorateLiveSession(live) : live;
  }

  async joinCheck(liveSessionId: string, userId: string, role: "viewer" | "creator" | "moderator" | "admin") {
    const result = await this.accessService.assertLiveJoinAccess(userId, role, liveSessionId);
    await this.repository.recordJoin(liveSessionId, userId);
    return {
      liveSession: this.decorateLiveSession(result.live),
      roomAccessToken: result.roomAccessToken,
      roomId: result.live.roomId
    };
  }

  async recordAttendance(liveSessionId: string, userId: string, attendanceSeconds: number) {
    const participant = await this.repository.recordLeave(liveSessionId, userId, attendanceSeconds);
    return {
      updated: Boolean(participant),
      participant
    };
  }

  async listChatMessages(liveSessionId: string, userId: string, role: "viewer" | "creator" | "moderator" | "admin", limit: number) {
    await this.accessService.assertLiveSessionAccess(userId, role, liveSessionId);
    const messages = await this.repository.listChatMessages(liveSessionId, limit);
    return messages.reverse();
  }

  async updateChatMessageStatus(
    liveSessionId: string,
    messageId: string,
    actor: { userId: string; role: "creator" | "moderator" | "admin" },
    input: { status: "hidden" | "removed"; reason: string }
  ) {
    const live = await this.repository.getById(liveSessionId);
    if (!live) {
      throw new AppError("Live session not found.", 404);
    }

    if (actor.role === "creator" && live.creatorId !== actor.userId) {
      throw new AppError("Only the live creator can moderate this room.", 403);
    }

    const message = await this.repository.getChatMessage(messageId, liveSessionId);
    if (!message) {
      throw new AppError("Chat message not found.", 404);
    }

    const result = await this.repository.updateChatMessageStatus(messageId, liveSessionId, input.status);
    if (!result.count) {
      throw new AppError("Chat message update failed.", 409);
    }

    await this.repository.createModerationAction({
      moderatorId: actor.userId,
      targetType: "live_chat_message",
      targetId: messageId,
      action: "message_removed",
      reason: input.reason,
      metadata: {
        liveSessionId,
        previousStatus: message.status,
        newStatus: input.status
      }
    });

    await this.auditService.record({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "live.chat.message.moderated",
      resource: "live_chat_message",
      resourceId: messageId,
      metadata: {
        liveSessionId,
        previousStatus: message.status,
        newStatus: input.status,
        reason: input.reason
      }
    });

    return this.repository.getChatMessage(messageId, liveSessionId);
  }

  private decorateLiveSession<T extends { id: string; roomId: string; visibility: "public" | "followers_only" | "private"; roomMetadata?: unknown }>(live: T) {
    const roomMetadata = (live.roomMetadata as Record<string, unknown> | null) ?? {};
    const streaming = this.streamingProviderClient.buildRoom({
      liveSessionId: live.id,
      roomId: live.roomId,
      visibility: live.visibility
    });

    return {
      ...live,
      roomMetadata: {
        ...roomMetadata,
        streaming: roomMetadata.streaming ?? streaming
      }
    };
  }
}
