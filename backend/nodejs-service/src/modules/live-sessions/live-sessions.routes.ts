import { Router } from "express";

import { asyncHandler } from "../../common/http/async-handler";
import { getStringParam } from "../../common/http/params";
import { validate } from "../../common/http/validate";
import { authenticate } from "../../common/middleware/authenticate";
import { authorize } from "../../common/middleware/authorize";
import {
  attendanceSchema,
  createLiveSchema,
  liveChatHistorySchema,
  liveChatMessageStatusSchema,
  liveIdParamsSchema,
  updateLiveSchema
} from "./live-sessions.schemas";
import { LiveSessionsService } from "./live-sessions.service";

export function createLiveSessionsRouter(service: LiveSessionsService) {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const result = await service.list({
        categoryId: typeof req.query.categoryId === "string" ? req.query.categoryId : undefined,
        creatorId: typeof req.query.creatorId === "string" ? req.query.creatorId : undefined,
        status: typeof req.query.status === "string" ? req.query.status : undefined
      });
      res.json(result);
    })
  );

  router.get(
    "/:liveSessionId",
    validate(liveIdParamsSchema),
    asyncHandler(async (req, res) => {
      const result = await service.getById(getStringParam(req.params.liveSessionId));
      res.json(result);
    })
  );

  router.post(
    "/",
    authenticate,
    authorize("creator", "admin"),
    validate(createLiveSchema),
    asyncHandler(async (req, res) => {
      const result = await service.create(req.auth!.userId, req.auth!.role as "creator" | "admin", req.body);
      res.status(201).json(result);
    })
  );

  router.patch(
    "/:liveSessionId",
    authenticate,
    authorize("creator", "admin"),
    validate(updateLiveSchema),
    asyncHandler(async (req, res) => {
      const result = await service.update(getStringParam(req.params.liveSessionId), req.auth!.userId, req.auth!.role as "creator" | "admin", req.body);
      res.json(result);
    })
  );

  router.post(
    "/:liveSessionId/publish",
    authenticate,
    authorize("creator", "admin"),
    validate(liveIdParamsSchema),
    asyncHandler(async (req, res) => {
      const result = await service.publish(getStringParam(req.params.liveSessionId), req.auth!.userId, req.auth!.role as "creator" | "admin");
      res.json(result);
    })
  );

  router.post(
    "/:liveSessionId/start",
    authenticate,
    authorize("creator", "admin"),
    validate(liveIdParamsSchema),
    asyncHandler(async (req, res) => {
      const result = await service.start(getStringParam(req.params.liveSessionId), req.auth!.userId, req.auth!.role as "creator" | "admin");
      res.json(result);
    })
  );

  router.post(
    "/:liveSessionId/end",
    authenticate,
    authorize("creator", "admin"),
    validate(liveIdParamsSchema),
    asyncHandler(async (req, res) => {
      const result = await service.end(getStringParam(req.params.liveSessionId), req.auth!.userId, req.auth!.role as "creator" | "admin");
      res.json(result);
    })
  );

  router.post(
    "/:liveSessionId/join-check",
    authenticate,
    validate(liveIdParamsSchema),
    asyncHandler(async (req, res) => {
      const result = await service.joinCheck(getStringParam(req.params.liveSessionId), req.auth!.userId, req.auth!.role);
      res.json(result);
    })
  );

  router.get(
    "/:liveSessionId/chat",
    authenticate,
    validate(liveChatHistorySchema),
    asyncHandler(async (req, res) => {
      const result = await service.listChatMessages(
        getStringParam(req.params.liveSessionId),
        req.auth!.userId,
        req.auth!.role,
        Number(req.query.limit)
      );
      res.json(result);
    })
  );

  router.patch(
    "/:liveSessionId/chat/:messageId/status",
    authenticate,
    authorize("creator", "moderator", "admin"),
    validate(liveChatMessageStatusSchema),
    asyncHandler(async (req, res) => {
      const result = await service.updateChatMessageStatus(
        getStringParam(req.params.liveSessionId),
        getStringParam(req.params.messageId),
        {
          userId: req.auth!.userId,
          role: req.auth!.role as "creator" | "moderator" | "admin"
        },
        req.body
      );
      res.json(result);
    })
  );

  router.post(
    "/:liveSessionId/attendance",
    authenticate,
    validate(attendanceSchema),
    asyncHandler(async (req, res) => {
      const result = await service.recordAttendance(getStringParam(req.params.liveSessionId), req.auth!.userId, req.body.attendanceSeconds);
      res.json(result);
    })
  );

  return router;
}
