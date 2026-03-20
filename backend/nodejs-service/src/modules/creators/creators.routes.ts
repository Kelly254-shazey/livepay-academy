import { Router } from "express";

import { asyncHandler } from "../../common/http/async-handler";
import { getStringParam } from "../../common/http/params";
import { validate } from "../../common/http/validate";
import { authenticate } from "../../common/middleware/authenticate";
import { creatorHandleParamsSchema, upsertCreatorProfileSchema } from "./creators.schemas";
import { CreatorsService } from "./creators.service";

export function createCreatorsRouter(service: CreatorsService) {
  const router = Router();

  router.get(
    "/:handle",
    validate(creatorHandleParamsSchema),
    asyncHandler(async (req, res) => {
      const result = await service.getPublicProfile(getStringParam(req.params.handle));
      res.json(result);
    })
  );

  router.post(
    "/profile",
    authenticate,
    validate(upsertCreatorProfileSchema),
    asyncHandler(async (req, res) => {
      const result = await service.upsertProfile(req.auth!.userId, req.body);
      res.status(201).json(result);
    })
  );

  router.patch(
    "/profile",
    authenticate,
    validate(upsertCreatorProfileSchema),
    asyncHandler(async (req, res) => {
      const result = await service.upsertProfile(req.auth!.userId, req.body);
      res.json(result);
    })
  );

  router.get(
    "/profile/me",
    authenticate,
    asyncHandler(async (req, res) => {
      const result = await service.getOwnProfile(req.auth!.userId);
      res.json(result);
    })
  );

  return router;
}
