import { Router } from "express";

import { asyncHandler } from "../../common/http/async-handler";
import { validate } from "../../common/http/validate";
import { authenticate } from "../../common/middleware/authenticate";
import { authorize } from "../../common/middleware/authorize";
import { requestPayoutSchema } from "./wallets.schemas";
import { WalletsService } from "./wallets.service";

export function createWalletsRouter(service: WalletsService) {
  const router = Router();
  router.use(authenticate);

  router.get(
    "/me/summary",
    authorize("creator", "admin"),
    asyncHandler(async (req, res) => {
      const result = await service.getMyWalletSummary(req.auth!.userId);
      res.json(result);
    })
  );

  router.get(
    "/me/ledger",
    authorize("creator", "admin"),
    asyncHandler(async (req, res) => {
      const result = await service.getMyWalletLedger(req.auth!.userId);
      res.json(result);
    })
  );

  router.post(
    "/me/payouts",
    authorize("creator", "admin"),
    validate(requestPayoutSchema),
    asyncHandler(async (req, res) => {
      const result = await service.requestPayout(
        { userId: req.auth!.userId, role: req.auth!.role as "creator" | "admin" },
        req.body.amount,
        req.body.currency
      );
      res.status(201).json(result);
    })
  );

  return router;
}

