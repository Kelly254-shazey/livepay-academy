import { Router } from "express";

import { asyncHandler } from "../../common/http/async-handler";
import { getStringParam } from "../../common/http/params";
import { validate } from "../../common/http/validate";
import { authenticate } from "../../common/middleware/authenticate";
import { accessGrantStatusSchema, confirmPurchaseSchema } from "./access.schemas";
import { AccessService } from "./access.service";

export function createAccessRouter(service: AccessService) {
  const router = Router();
  router.use(authenticate);

  router.post(
    "/transactions/confirm",
    validate(confirmPurchaseSchema),
    asyncHandler(async (req, res) => {
      const result = await service.confirmPurchase(req.auth!.userId, req.auth!.role, req.body);
      res.status(201).json(result);
    })
  );

  router.get(
    "/grants/:targetType/:targetId",
    validate(accessGrantStatusSchema),
    asyncHandler(async (req, res) => {
      const result = await service.getGrantStatus(
        req.auth!.userId,
        req.params.targetType as Parameters<AccessService["getGrantStatus"]>[1],
        getStringParam(req.params.targetId)
      );
      res.json(result);
    })
  );

  return router;
}
