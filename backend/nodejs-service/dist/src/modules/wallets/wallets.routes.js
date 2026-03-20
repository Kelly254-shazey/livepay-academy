"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWalletsRouter = createWalletsRouter;
const express_1 = require("express");
const async_handler_1 = require("../../common/http/async-handler");
const validate_1 = require("../../common/http/validate");
const authenticate_1 = require("../../common/middleware/authenticate");
const authorize_1 = require("../../common/middleware/authorize");
const wallets_schemas_1 = require("./wallets.schemas");
function createWalletsRouter(service) {
    const router = (0, express_1.Router)();
    router.use(authenticate_1.authenticate);
    router.get("/me/summary", (0, authorize_1.authorize)("creator", "admin"), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.getMyWalletSummary(req.auth.userId);
        res.json(result);
    }));
    router.get("/me/ledger", (0, authorize_1.authorize)("creator", "admin"), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.getMyWalletLedger(req.auth.userId);
        res.json(result);
    }));
    router.post("/me/payouts", (0, authorize_1.authorize)("creator", "admin"), (0, validate_1.validate)(wallets_schemas_1.requestPayoutSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.requestPayout({ userId: req.auth.userId, role: req.auth.role }, req.body.amount, req.body.currency);
        res.status(201).json(result);
    }));
    return router;
}
