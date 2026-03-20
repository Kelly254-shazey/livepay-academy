"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPremiumContentRouter = createPremiumContentRouter;
const express_1 = require("express");
const async_handler_1 = require("../../common/http/async-handler");
const params_1 = require("../../common/http/params");
const validate_1 = require("../../common/http/validate");
const authenticate_1 = require("../../common/middleware/authenticate");
const authorize_1 = require("../../common/middleware/authorize");
const premium_content_schemas_1 = require("./premium-content.schemas");
function createPremiumContentRouter(service) {
    const router = (0, express_1.Router)();
    router.get("/", (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.list({
            categoryId: typeof req.query.categoryId === "string" ? req.query.categoryId : undefined,
            creatorId: typeof req.query.creatorId === "string" ? req.query.creatorId : undefined,
            status: typeof req.query.status === "string" ? req.query.status : "published"
        });
        res.json(result);
    }));
    router.get("/:contentId/preview", (0, validate_1.validate)(premium_content_schemas_1.contentIdParamsSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.preview((0, params_1.getStringParam)(req.params.contentId));
        res.json(result);
    }));
    router.post("/", authenticate_1.authenticate, (0, authorize_1.authorize)("creator", "admin"), (0, validate_1.validate)(premium_content_schemas_1.createPremiumContentSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.create(req.auth.userId, req.auth.role, req.body);
        res.status(201).json(result);
    }));
    router.patch("/:contentId", authenticate_1.authenticate, (0, authorize_1.authorize)("creator", "admin"), (0, validate_1.validate)(premium_content_schemas_1.updatePremiumContentSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.update((0, params_1.getStringParam)(req.params.contentId), req.auth.userId, req.auth.role, req.body);
        res.json(result);
    }));
    router.post("/:contentId/access-check", authenticate_1.authenticate, (0, validate_1.validate)(premium_content_schemas_1.contentIdParamsSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.accessCheck((0, params_1.getStringParam)(req.params.contentId), { userId: req.auth.userId, role: req.auth.role });
        res.json(result);
    }));
    router.post("/:contentId/publish", authenticate_1.authenticate, (0, authorize_1.authorize)("creator", "admin"), (0, validate_1.validate)(premium_content_schemas_1.contentIdParamsSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.publish((0, params_1.getStringParam)(req.params.contentId), req.auth.userId, req.auth.role);
        res.json(result);
    }));
    return router;
}
