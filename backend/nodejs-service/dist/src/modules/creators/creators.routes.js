"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCreatorsRouter = createCreatorsRouter;
const express_1 = require("express");
const async_handler_1 = require("../../common/http/async-handler");
const params_1 = require("../../common/http/params");
const validate_1 = require("../../common/http/validate");
const authenticate_1 = require("../../common/middleware/authenticate");
const creators_schemas_1 = require("./creators.schemas");
function createCreatorsRouter(service) {
    const router = (0, express_1.Router)();
    router.get("/:handle", (0, validate_1.validate)(creators_schemas_1.creatorHandleParamsSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.getPublicProfile((0, params_1.getStringParam)(req.params.handle));
        res.json(result);
    }));
    router.post("/profile", authenticate_1.authenticate, (0, validate_1.validate)(creators_schemas_1.upsertCreatorProfileSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.upsertProfile(req.auth.userId, req.body);
        res.status(201).json(result);
    }));
    router.patch("/profile", authenticate_1.authenticate, (0, validate_1.validate)(creators_schemas_1.upsertCreatorProfileSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.upsertProfile(req.auth.userId, req.body);
        res.json(result);
    }));
    router.get("/profile/me", authenticate_1.authenticate, (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.getOwnProfile(req.auth.userId);
        res.json(result);
    }));
    return router;
}
