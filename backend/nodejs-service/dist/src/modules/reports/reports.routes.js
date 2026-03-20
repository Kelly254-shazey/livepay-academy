"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReportsRouter = createReportsRouter;
const express_1 = require("express");
const async_handler_1 = require("../../common/http/async-handler");
const params_1 = require("../../common/http/params");
const validate_1 = require("../../common/http/validate");
const authenticate_1 = require("../../common/middleware/authenticate");
const authorize_1 = require("../../common/middleware/authorize");
const reports_schemas_1 = require("./reports.schemas");
function createReportsRouter(service) {
    const router = (0, express_1.Router)();
    router.use(authenticate_1.authenticate);
    router.get("/mine", (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.listMine(req.auth.userId);
        res.json(result);
    }));
    router.get("/queue", (0, authorize_1.authorize)("moderator", "admin"), (0, async_handler_1.asyncHandler)(async (_req, res) => {
        const result = await service.moderationQueue();
        res.json(result);
    }));
    router.post("/", (0, validate_1.validate)(reports_schemas_1.createReportSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.create({ userId: req.auth.userId, role: req.auth.role }, req.body);
        res.status(201).json(result);
    }));
    router.patch("/:reportId/status", (0, authorize_1.authorize)("moderator", "admin"), (0, validate_1.validate)(reports_schemas_1.updateReportStatusSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.updateStatus({ userId: req.auth.userId, role: req.auth.role }, (0, params_1.getStringParam)(req.params.reportId), req.body.status);
        res.json(result);
    }));
    return router;
}
