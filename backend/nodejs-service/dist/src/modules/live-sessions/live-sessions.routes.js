"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLiveSessionsRouter = createLiveSessionsRouter;
const express_1 = require("express");
const async_handler_1 = require("../../common/http/async-handler");
const params_1 = require("../../common/http/params");
const validate_1 = require("../../common/http/validate");
const authenticate_1 = require("../../common/middleware/authenticate");
const authorize_1 = require("../../common/middleware/authorize");
const live_sessions_schemas_1 = require("./live-sessions.schemas");
function createLiveSessionsRouter(service) {
    const router = (0, express_1.Router)();
    router.get("/", (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.list({
            categoryId: typeof req.query.categoryId === "string" ? req.query.categoryId : undefined,
            creatorId: typeof req.query.creatorId === "string" ? req.query.creatorId : undefined,
            status: typeof req.query.status === "string" ? req.query.status : undefined
        });
        res.json(result);
    }));
    router.get("/:liveSessionId", (0, validate_1.validate)(live_sessions_schemas_1.liveIdParamsSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.getById((0, params_1.getStringParam)(req.params.liveSessionId));
        res.json(result);
    }));
    router.post("/", authenticate_1.authenticate, (0, authorize_1.authorize)("creator", "admin"), (0, validate_1.validate)(live_sessions_schemas_1.createLiveSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.create(req.auth.userId, req.auth.role, req.body);
        res.status(201).json(result);
    }));
    router.patch("/:liveSessionId", authenticate_1.authenticate, (0, authorize_1.authorize)("creator", "admin"), (0, validate_1.validate)(live_sessions_schemas_1.updateLiveSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.update((0, params_1.getStringParam)(req.params.liveSessionId), req.auth.userId, req.auth.role, req.body);
        res.json(result);
    }));
    router.post("/:liveSessionId/publish", authenticate_1.authenticate, (0, authorize_1.authorize)("creator", "admin"), (0, validate_1.validate)(live_sessions_schemas_1.liveIdParamsSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.publish((0, params_1.getStringParam)(req.params.liveSessionId), req.auth.userId, req.auth.role);
        res.json(result);
    }));
    router.post("/:liveSessionId/start", authenticate_1.authenticate, (0, authorize_1.authorize)("creator", "admin"), (0, validate_1.validate)(live_sessions_schemas_1.liveIdParamsSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.start((0, params_1.getStringParam)(req.params.liveSessionId), req.auth.userId, req.auth.role);
        res.json(result);
    }));
    router.post("/:liveSessionId/end", authenticate_1.authenticate, (0, authorize_1.authorize)("creator", "admin"), (0, validate_1.validate)(live_sessions_schemas_1.liveIdParamsSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.end((0, params_1.getStringParam)(req.params.liveSessionId), req.auth.userId, req.auth.role);
        res.json(result);
    }));
    router.post("/:liveSessionId/join-check", authenticate_1.authenticate, (0, validate_1.validate)(live_sessions_schemas_1.liveIdParamsSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.joinCheck((0, params_1.getStringParam)(req.params.liveSessionId), req.auth.userId, req.auth.role);
        res.json(result);
    }));
    router.get("/:liveSessionId/chat", authenticate_1.authenticate, (0, validate_1.validate)(live_sessions_schemas_1.liveChatHistorySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.listChatMessages((0, params_1.getStringParam)(req.params.liveSessionId), req.auth.userId, req.auth.role, Number(req.query.limit));
        res.json(result);
    }));
    router.patch("/:liveSessionId/chat/:messageId/status", authenticate_1.authenticate, (0, authorize_1.authorize)("creator", "moderator", "admin"), (0, validate_1.validate)(live_sessions_schemas_1.liveChatMessageStatusSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.updateChatMessageStatus((0, params_1.getStringParam)(req.params.liveSessionId), (0, params_1.getStringParam)(req.params.messageId), {
            userId: req.auth.userId,
            role: req.auth.role
        }, req.body);
        res.json(result);
    }));
    router.post("/:liveSessionId/attendance", authenticate_1.authenticate, (0, validate_1.validate)(live_sessions_schemas_1.attendanceSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.recordAttendance((0, params_1.getStringParam)(req.params.liveSessionId), req.auth.userId, req.body.attendanceSeconds);
        res.json(result);
    }));
    return router;
}
