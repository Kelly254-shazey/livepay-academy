import { Router } from "express";

import { asyncHandler } from "../../common/http/async-handler";
import { getStringParam } from "../../common/http/params";
import { validate } from "../../common/http/validate";
import { authenticate } from "../../common/middleware/authenticate";
import { authorize } from "../../common/middleware/authorize";
import { announcementSchema, notificationIdParamsSchema } from "./notifications.schemas";
import { NotificationsService } from "./notifications.service";

export function createNotificationsRouter(service: NotificationsService) {
  const router = Router();
  router.use(authenticate);

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const result = await service.listMine(req.auth!.userId);
      res.json(result);
    })
  );

  router.post(
    "/:notificationId/read",
    validate(notificationIdParamsSchema),
    asyncHandler(async (req, res) => {
      const result = await service.markRead(req.auth!.userId, getStringParam(req.params.notificationId));
      res.json(result);
    })
  );

  router.post(
    "/announcements",
    authorize("creator", "admin"),
    validate(announcementSchema),
    asyncHandler(async (req, res) => {
      const result = await service.sendAnnouncement(
        { userId: req.auth!.userId, role: req.auth!.role as "creator" | "admin" },
        req.body
      );
      res.status(201).json(result);
    })
  );

  return router;
}
