"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUsersRouter = createUsersRouter;
const express_1 = require("express");
const async_handler_1 = require("../../common/http/async-handler");
const params_1 = require("../../common/http/params");
const validate_1 = require("../../common/http/validate");
const authenticate_1 = require("../../common/middleware/authenticate");
const users_schemas_1 = require("./users.schemas");
function createUsersRouter(service) {
    const router = (0, express_1.Router)();
    router.use(authenticate_1.authenticate);
    router.get("/me", (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.getMe(req.auth.userId);
        res.json(result);
    }));
    router.patch("/me", (0, validate_1.validate)(users_schemas_1.updateProfileSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.updateMe(req.auth.userId, req.body);
        res.json(result);
    }));
    router.get("/me/purchases", (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.listPurchaseHistory(req.auth.userId);
        res.json(result);
    }));
    router.get("/me/recommendations", (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.getRecommendations(req.auth.userId);
        res.json(result);
    }));
    router.post("/:creatorId/follow", (0, validate_1.validate)(users_schemas_1.creatorIdParamsSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.followCreator(req.auth.userId, (0, params_1.getStringParam)(req.params.creatorId));
        res.status(201).json(result);
    }));
    router.delete("/:creatorId/follow", (0, validate_1.validate)(users_schemas_1.creatorIdParamsSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        await service.unfollowCreator(req.auth.userId, (0, params_1.getStringParam)(req.params.creatorId));
        res.status(204).send();
    }));
    router.patch("/me/notification-preferences", (0, validate_1.validate)(users_schemas_1.notificationPreferencesSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.updateNotificationPreferences(req.auth.userId, req.body);
        res.json(result);
    }));
    return router;
}
