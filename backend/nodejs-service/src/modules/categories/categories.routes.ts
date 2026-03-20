import { Router } from "express";

import { asyncHandler } from "../../common/http/async-handler";
import { getStringParam } from "../../common/http/params";
import { validate } from "../../common/http/validate";
import { authenticate } from "../../common/middleware/authenticate";
import { authorize } from "../../common/middleware/authorize";
import { createCategorySchema, updateCategorySchema } from "./categories.schemas";
import { CategoriesService } from "./categories.service";

export function createCategoriesRouter(service: CategoriesService) {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const status = req.query.status === "archived" ? "archived" : req.query.status === "active" ? "active" : undefined;
      const result = await service.list(status);
      res.json(result);
    })
  );

  router.post(
    "/",
    authenticate,
    authorize("admin"),
    validate(createCategorySchema),
    asyncHandler(async (req, res) => {
      const result = await service.create({
        ...req.body,
        createdById: req.auth!.userId
      });
      res.status(201).json(result);
    })
  );

  router.patch(
    "/:categoryId",
    authenticate,
    authorize("admin"),
    validate(updateCategorySchema),
    asyncHandler(async (req, res) => {
      const result = await service.update(getStringParam(req.params.categoryId), req.body);
      res.json(result);
    })
  );

  return router;
}
