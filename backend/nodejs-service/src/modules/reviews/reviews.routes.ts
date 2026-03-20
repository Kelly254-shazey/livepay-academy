import { Router } from "express";
import type { ReviewTargetType } from "@prisma/client";

import { asyncHandler } from "../../common/http/async-handler";
import { validate } from "../../common/http/validate";
import { authenticate } from "../../common/middleware/authenticate";
import { createReviewSchema, listReviewsSchema } from "./reviews.schemas";
import { ReviewsService } from "./reviews.service";

export function createReviewsRouter(service: ReviewsService) {
  const router = Router();

  router.get(
    "/",
    validate(listReviewsSchema),
    asyncHandler(async (req, res) => {
      const result = await service.list(
        req.query.targetType as ReviewTargetType,
        req.query.targetId as string
      );
      res.json(result);
    })
  );

  router.post(
    "/",
    authenticate,
    validate(createReviewSchema),
    asyncHandler(async (req, res) => {
      const result = await service.upsertReview(
        { userId: req.auth!.userId, role: req.auth!.role },
        req.body
      );
      res.status(201).json(result);
    })
  );

  return router;
}
