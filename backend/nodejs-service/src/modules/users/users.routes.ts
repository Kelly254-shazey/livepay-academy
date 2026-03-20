import { Router } from "express";

import { asyncHandler } from "../../common/http/async-handler";
import { getStringParam } from "../../common/http/params";
import { validate } from "../../common/http/validate";
import { authenticate } from "../../common/middleware/authenticate";
import { creatorIdParamsSchema, notificationPreferencesSchema, updateProfileSchema } from "./users.schemas";
import { UsersService } from "./users.service";

export function createUsersRouter(service: UsersService) {
  const router = Router();

  router.use(authenticate);

  router.get(
    "/me",
    asyncHandler(async (req, res) => {
      const result = await service.getMe(req.auth!.userId);
      res.json(result);
    })
  );

  router.patch(
    "/me",
    validate(updateProfileSchema),
    asyncHandler(async (req, res) => {
      const result = await service.updateMe(req.auth!.userId, req.body);
      res.json(result);
    })
  );

  router.get(
    "/me/purchases",
    asyncHandler(async (req, res) => {
      const result = await service.listPurchaseHistory(req.auth!.userId);
      res.json(result);
    })
  );

  router.get(
    "/me/recommendations",
    asyncHandler(async (req, res) => {
      const result = await service.getRecommendations(req.auth!.userId);
      res.json(result);
    })
  );

  router.post(
    "/:creatorId/follow",
    validate(creatorIdParamsSchema),
    asyncHandler(async (req, res) => {
      const result = await service.followCreator(req.auth!.userId, getStringParam(req.params.creatorId));
      res.status(201).json(result);
    })
  );

  router.delete(
    "/:creatorId/follow",
    validate(creatorIdParamsSchema),
    asyncHandler(async (req, res) => {
      await service.unfollowCreator(req.auth!.userId, getStringParam(req.params.creatorId));
      res.status(204).send();
    })
  );

  router.patch(
    "/me/notification-preferences",
    validate(notificationPreferencesSchema),
    asyncHandler(async (req, res) => {
      const result = await service.updateNotificationPreferences(req.auth!.userId, req.body);
      res.json(result);
    })
  );

  return router;
}
