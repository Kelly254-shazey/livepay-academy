import { Router } from "express";

import { asyncHandler } from "../../common/http/async-handler";
import { getStringParam } from "../../common/http/params";
import { validate } from "../../common/http/validate";
import { authenticate } from "../../common/middleware/authenticate";
import { authorize } from "../../common/middleware/authorize";
import { contentIdParamsSchema, createPremiumContentSchema, updatePremiumContentSchema } from "./premium-content.schemas";
import { PremiumContentService } from "./premium-content.service";

export function createPremiumContentRouter(service: PremiumContentService) {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const result = await service.list({
        categoryId: typeof req.query.categoryId === "string" ? req.query.categoryId : undefined,
        creatorId: typeof req.query.creatorId === "string" ? req.query.creatorId : undefined,
        status: typeof req.query.status === "string" ? req.query.status : "published"
      });
      res.json(result);
    })
  );

  router.get(
    "/:contentId/preview",
    validate(contentIdParamsSchema),
    asyncHandler(async (req, res) => {
      const result = await service.preview(getStringParam(req.params.contentId));
      res.json(result);
    })
  );

  router.post(
    "/",
    authenticate,
    authorize("creator", "admin"),
    validate(createPremiumContentSchema),
    asyncHandler(async (req, res) => {
      const result = await service.create(req.auth!.userId, req.auth!.role as "creator" | "admin", req.body);
      res.status(201).json(result);
    })
  );

  router.patch(
    "/:contentId",
    authenticate,
    authorize("creator", "admin"),
    validate(updatePremiumContentSchema),
    asyncHandler(async (req, res) => {
      const result = await service.update(getStringParam(req.params.contentId), req.auth!.userId, req.auth!.role as "creator" | "admin", req.body);
      res.json(result);
    })
  );

  router.post(
    "/:contentId/access-check",
    authenticate,
    validate(contentIdParamsSchema),
    asyncHandler(async (req, res) => {
      const result = await service.accessCheck(getStringParam(req.params.contentId), { userId: req.auth!.userId, role: req.auth!.role });
      res.json(result);
    })
  );

  router.post(
    "/:contentId/publish",
    authenticate,
    authorize("creator", "admin"),
    validate(contentIdParamsSchema),
    asyncHandler(async (req, res) => {
      const result = await service.publish(getStringParam(req.params.contentId), req.auth!.userId, req.auth!.role as "creator" | "admin");
      res.json(result);
    })
  );

  return router;
}
