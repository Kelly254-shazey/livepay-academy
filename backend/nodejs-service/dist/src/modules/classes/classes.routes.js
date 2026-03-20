"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClassesRouter = createClassesRouter;
const express_1 = require("express");
const async_handler_1 = require("../../common/http/async-handler");
const params_1 = require("../../common/http/params");
const validate_1 = require("../../common/http/validate");
const authenticate_1 = require("../../common/middleware/authenticate");
const authorize_1 = require("../../common/middleware/authorize");
const classes_schemas_1 = require("./classes.schemas");
function createClassesRouter(service) {
    const router = (0, express_1.Router)();
    router.get("/", (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.list({
            categoryId: typeof req.query.categoryId === "string" ? req.query.categoryId : undefined,
            creatorId: typeof req.query.creatorId === "string" ? req.query.creatorId : undefined,
            status: typeof req.query.status === "string" ? req.query.status : "published"
        });
        res.json(result);
    }));
    router.get("/:classId", (0, validate_1.validate)(classes_schemas_1.classIdParamsSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.getById((0, params_1.getStringParam)(req.params.classId));
        res.json(result);
    }));
    router.post("/", authenticate_1.authenticate, (0, authorize_1.authorize)("creator", "admin"), (0, validate_1.validate)(classes_schemas_1.createClassSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.create(req.auth.userId, req.auth.role, req.body);
        res.status(201).json(result);
    }));
    router.patch("/:classId", authenticate_1.authenticate, (0, authorize_1.authorize)("creator", "admin"), (0, validate_1.validate)(classes_schemas_1.updateClassSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.update((0, params_1.getStringParam)(req.params.classId), req.auth.userId, req.auth.role, req.body);
        res.json(result);
    }));
    router.post("/:classId/lessons", authenticate_1.authenticate, (0, authorize_1.authorize)("creator", "admin"), (0, validate_1.validate)(classes_schemas_1.addLessonSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.addLesson((0, params_1.getStringParam)(req.params.classId), { userId: req.auth.userId, role: req.auth.role }, req.body);
        res.status(201).json(result);
    }));
    router.post("/:classId/enroll", authenticate_1.authenticate, (0, validate_1.validate)(classes_schemas_1.classIdParamsSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.enroll((0, params_1.getStringParam)(req.params.classId), { userId: req.auth.userId, role: req.auth.role });
        res.status(201).json(result);
    }));
    router.post("/:classId/publish", authenticate_1.authenticate, (0, authorize_1.authorize)("creator", "admin"), (0, validate_1.validate)(classes_schemas_1.classIdParamsSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.publish((0, params_1.getStringParam)(req.params.classId), req.auth.userId, req.auth.role);
        res.json(result);
    }));
    router.get("/:classId/lessons/:lessonId/access", authenticate_1.authenticate, (0, validate_1.validate)(classes_schemas_1.lessonAccessParamsSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.lessonAccess((0, params_1.getStringParam)(req.params.classId), (0, params_1.getStringParam)(req.params.lessonId), { userId: req.auth.userId, role: req.auth.role });
        res.json(result);
    }));
    return router;
}
