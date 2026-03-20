import { Router } from "express";

import { asyncHandler } from "../../common/http/async-handler";
import { getStringParam } from "../../common/http/params";
import { validate } from "../../common/http/validate";
import { authenticate } from "../../common/middleware/authenticate";
import { authorize } from "../../common/middleware/authorize";
import { createReportSchema, updateReportStatusSchema } from "./reports.schemas";
import { ReportsService } from "./reports.service";

export function createReportsRouter(service: ReportsService) {
  const router = Router();
  router.use(authenticate);

  router.get(
    "/mine",
    asyncHandler(async (req, res) => {
      const result = await service.listMine(req.auth!.userId);
      res.json(result);
    })
  );

  router.get(
    "/queue",
    authorize("moderator", "admin"),
    asyncHandler(async (_req, res) => {
      const result = await service.moderationQueue();
      res.json(result);
    })
  );

  router.post(
    "/",
    validate(createReportSchema),
    asyncHandler(async (req, res) => {
      const result = await service.create(
        { userId: req.auth!.userId, role: req.auth!.role },
        req.body
      );
      res.status(201).json(result);
    })
  );

  router.patch(
    "/:reportId/status",
    authorize("moderator", "admin"),
    validate(updateReportStatusSchema),
    asyncHandler(async (req, res) => {
      const result = await service.updateStatus(
        { userId: req.auth!.userId, role: req.auth!.role as "moderator" | "admin" },
        getStringParam(req.params.reportId),
        req.body.status
      );
      res.json(result);
    })
  );

  return router;
}
