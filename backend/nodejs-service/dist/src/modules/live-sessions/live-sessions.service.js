"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveSessionsService = void 0;
const app_error_1 = require("../../common/errors/app-error");
class LiveSessionsService {
    repository;
    accessService;
    auditService;
    pythonClient;
    streamingProviderClient;
    constructor(repository, accessService, auditService, pythonClient, streamingProviderClient) {
        this.repository = repository;
        this.accessService = accessService;
        this.auditService = auditService;
        this.pythonClient = pythonClient;
        this.streamingProviderClient = streamingProviderClient;
    }
    async create(creatorId, role, data) {
        await this.pythonClient.analyzeContent({
            title: data.title ?? "",
            description: data.description,
            contentType: "live_session"
        });
        const live = await this.repository.create(creatorId, data);
        const roomMetadata = {
            ...(live.roomMetadata ?? {}),
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
    async update(liveSessionId, creatorId, role, data) {
        const updated = await this.repository.update(liveSessionId, creatorId, data);
        if (!updated.count) {
            throw new app_error_1.AppError("Live session not found or not owned by actor.", 404);
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
    list(filters) {
        return this.repository.list(filters).then((items) => items.map((item) => this.decorateLiveSession(item)));
    }
    async getById(liveSessionId) {
        const live = await this.repository.getById(liveSessionId);
        if (!live) {
            throw new app_error_1.AppError("Live session not found.", 404);
        }
        return this.decorateLiveSession(live);
    }
    async publish(liveSessionId, creatorId, role) {
        const result = await this.repository.setStatus(liveSessionId, creatorId, {
            status: "published",
            publishedAt: new Date()
        });
        if (!result.count) {
            throw new app_error_1.AppError("Live session not found or not owned by actor.", 404);
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
    async start(liveSessionId, creatorId, role) {
        const result = await this.repository.setStatus(liveSessionId, creatorId, {
            status: "live",
            startedAt: new Date()
        });
        if (!result.count) {
            throw new app_error_1.AppError("Live session not found or not owned by actor.", 404);
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
    async end(liveSessionId, creatorId, role) {
        const result = await this.repository.setStatus(liveSessionId, creatorId, {
            status: "ended",
            endedAt: new Date()
        });
        if (!result.count) {
            throw new app_error_1.AppError("Live session not found or not owned by actor.", 404);
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
    async joinCheck(liveSessionId, userId, role) {
        const result = await this.accessService.assertLiveJoinAccess(userId, role, liveSessionId);
        await this.repository.recordJoin(liveSessionId, userId);
        return {
            liveSession: this.decorateLiveSession(result.live),
            roomAccessToken: result.roomAccessToken,
            roomId: result.live.roomId
        };
    }
    async recordAttendance(liveSessionId, userId, attendanceSeconds) {
        const participant = await this.repository.recordLeave(liveSessionId, userId, attendanceSeconds);
        return {
            updated: Boolean(participant),
            participant
        };
    }
    async listChatMessages(liveSessionId, userId, role, limit) {
        await this.accessService.assertLiveSessionAccess(userId, role, liveSessionId);
        const messages = await this.repository.listChatMessages(liveSessionId, limit);
        return messages.reverse();
    }
    async updateChatMessageStatus(liveSessionId, messageId, actor, input) {
        const live = await this.repository.getById(liveSessionId);
        if (!live) {
            throw new app_error_1.AppError("Live session not found.", 404);
        }
        if (actor.role === "creator" && live.creatorId !== actor.userId) {
            throw new app_error_1.AppError("Only the live creator can moderate this room.", 403);
        }
        const message = await this.repository.getChatMessage(messageId, liveSessionId);
        if (!message) {
            throw new app_error_1.AppError("Chat message not found.", 404);
        }
        const result = await this.repository.updateChatMessageStatus(messageId, liveSessionId, input.status);
        if (!result.count) {
            throw new app_error_1.AppError("Chat message update failed.", 409);
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
    decorateLiveSession(live) {
        const roomMetadata = live.roomMetadata ?? {};
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
exports.LiveSessionsService = LiveSessionsService;
