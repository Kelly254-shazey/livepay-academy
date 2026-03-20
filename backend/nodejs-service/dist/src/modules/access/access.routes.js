"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAccessRouter = createAccessRouter;
const express_1 = require("express");
const async_handler_1 = require("../../common/http/async-handler");
const params_1 = require("../../common/http/params");
const validate_1 = require("../../common/http/validate");
const authenticate_1 = require("../../common/middleware/authenticate");
const access_schemas_1 = require("./access.schemas");
function createAccessRouter(service) {
    const router = (0, express_1.Router)();
    router.use(authenticate_1.authenticate);
    router.post("/transactions/confirm", (0, validate_1.validate)(access_schemas_1.confirmPurchaseSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.confirmPurchase(req.auth.userId, req.auth.role, req.body);
        res.status(201).json(result);
    }));
    router.get("/grants/:targetType/:targetId", (0, validate_1.validate)(access_schemas_1.accessGrantStatusSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.getGrantStatus(req.auth.userId, req.params.targetType, (0, params_1.getStringParam)(req.params.targetId));
        res.json(result);
    }));
    return router;
}
