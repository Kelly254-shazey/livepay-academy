import { Router } from "express";

import { asyncHandler } from "../../common/http/async-handler";
import { getStringParam } from "../../common/http/params";
import { validate } from "../../common/http/validate";
import { authenticate } from "../../common/middleware/authenticate";
import { authorize } from "../../common/middleware/authorize";
import { addLessonSchema, classIdParamsSchema, createClassSchema, lessonAccessParamsSchema, updateClassSchema } from "./classes.schemas";
import { ClassesService } from "./classes.service";

export function createClassesRouter(service: ClassesService) {
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
    "/:classId",
    validate(classIdParamsSchema),
    asyncHandler(async (req, res) => {
      const result = await service.getById(getStringParam(req.params.classId));
      res.json(result);
    })
  );

  router.post(
    "/",
    authenticate,
    authorize("creator", "admin"),
    validate(createClassSchema),
    asyncHandler(async (req, res) => {
      const result = await service.create(req.auth!.userId, req.auth!.role as "creator" | "admin", req.body);
      res.status(201).json(result);
    })
  );

  router.patch(
    "/:classId",
    authenticate,
    authorize("creator", "admin"),
    validate(updateClassSchema),
    asyncHandler(async (req, res) => {
      const result = await service.update(getStringParam(req.params.classId), req.auth!.userId, req.auth!.role as "creator" | "admin", req.body);
      res.json(result);
    })
  );

  router.post(
    "/:classId/lessons",
    authenticate,
    authorize("creator", "admin"),
    validate(addLessonSchema),
    asyncHandler(async (req, res) => {
      const result = await service.addLesson(getStringParam(req.params.classId), { userId: req.auth!.userId, role: req.auth!.role as "creator" | "admin" }, req.body);
      res.status(201).json(result);
    })
  );

  router.post(
    "/:classId/enroll",
    authenticate,
    validate(classIdParamsSchema),
    asyncHandler(async (req, res) => {
      const result = await service.enroll(getStringParam(req.params.classId), { userId: req.auth!.userId, role: req.auth!.role });
      res.status(201).json(result);
    })
  );

  router.post(
    "/:classId/publish",
    authenticate,
    authorize("creator", "admin"),
    validate(classIdParamsSchema),
    asyncHandler(async (req, res) => {
      const result = await service.publish(getStringParam(req.params.classId), req.auth!.userId, req.auth!.role as "creator" | "admin");
      res.json(result);
    })
  );

  router.get(
    "/:classId/lessons/:lessonId/access",
    authenticate,
    validate(lessonAccessParamsSchema),
    asyncHandler(async (req, res) => {
      const result = await service.lessonAccess(
        getStringParam(req.params.classId),
        getStringParam(req.params.lessonId),
        { userId: req.auth!.userId, role: req.auth!.role }
      );
      res.json(result);
    })
  );

  return router;
}
