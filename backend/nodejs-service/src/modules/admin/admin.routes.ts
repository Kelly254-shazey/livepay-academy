import { Router } from "express";

import { asyncHandler } from "../../common/http/async-handler";
import { parsePagination } from "../../common/http/pagination";
import { getStringParam } from "../../common/http/params";
import { validate } from "../../common/http/validate";
import { authenticate } from "../../common/middleware/authenticate";
import { authorize } from "../../common/middleware/authorize";
import {
  creatorApprovalSchema,
  creatorRejectionSchema,
  creatorReviewHistorySchema,
  resourceSuspendSchema,
  userSuspendSchema
} from "./admin.schemas";
import { AdminService } from "./admin.service";

export function createAdminRouter(service: AdminService) {
  const router = Router();
  router.use(authenticate);

  router.get(
    "/overview",
    authorize("moderator", "admin"),
    asyncHandler(async (_req, res) => {
      const result = await service.overview();
      res.json(result);
    })
  );

  router.get(
    "/users",
    authorize("moderator", "admin"),
    asyncHandler(async (req, res) => {
      const result = await service.listUsers(parsePagination(req));
      res.json(result);
    })
  );

  router.get(
    "/creators",
    authorize("moderator", "admin"),
    asyncHandler(async (req, res) => {
      const result = await service.listCreators(parsePagination(req));
      res.json(result);
    })
  );

  router.get(
    "/audit-logs",
    authorize("moderator", "admin"),
    asyncHandler(async (req, res) => {
      const result = await service.listAuditLogs(parsePagination(req));
      res.json(result);
    })
  );

  router.get(
    "/moderation-actions",
    authorize("moderator", "admin"),
    asyncHandler(async (req, res) => {
      const result = await service.listModerationActions(parsePagination(req));
      res.json(result);
    })
  );

  router.get(
    "/creators/:creatorUserId/reviews",
    authorize("moderator", "admin"),
    validate(creatorReviewHistorySchema),
    asyncHandler(async (req, res) => {
      const result = await service.listCreatorReviews(getStringParam(req.params.creatorUserId));
      res.json(result);
    })
  );

  router.post(
    "/creators/:creatorUserId/approve",
    authorize("admin"),
    validate(creatorApprovalSchema),
    asyncHandler(async (req, res) => {
      const result = await service.approveCreator(
        { userId: req.auth!.userId, role: "admin" },
        getStringParam(req.params.creatorUserId),
        req.body.notes
      );
      res.json(result);
    })
  );

  router.post(
    "/creators/:creatorUserId/reject",
    authorize("admin"),
    validate(creatorRejectionSchema),
    asyncHandler(async (req, res) => {
      const result = await service.rejectCreator(
        { userId: req.auth!.userId, role: "admin" },
        getStringParam(req.params.creatorUserId),
        req.body.notes
      );
      res.json(result);
    })
  );

  router.post(
    "/users/:userId/suspend",
    authorize("admin"),
    validate(userSuspendSchema),
    asyncHandler(async (req, res) => {
      const result = await service.suspendUser(
        { userId: req.auth!.userId, role: "admin" },
        getStringParam(req.params.userId),
        req.body.reason
      );
      res.json(result);
    })
  );

  router.post(
    "/resources/suspend",
    authorize("moderator", "admin"),
    validate(resourceSuspendSchema),
    asyncHandler(async (req, res) => {
      const result = await service.suspendResource(
        { userId: req.auth!.userId, role: req.auth!.role as "admin" | "moderator" },
        req.body.resourceType,
        req.body.resourceId,
        req.body.reason
      );
      res.json(result);
    })
  );

  return router;
}
