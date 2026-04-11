"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminRouter = createAdminRouter;
const express_1 = require("express");
const async_handler_1 = require("../../common/http/async-handler");
const pagination_1 = require("../../common/http/pagination");
const params_1 = require("../../common/http/params");
const validate_1 = require("../../common/http/validate");
const authenticate_1 = require("../../common/middleware/authenticate");
const authorize_1 = require("../../common/middleware/authorize");
const admin_schemas_1 = require("./admin.schemas");
function createAdminRouter(service) {
    const router = (0, express_1.Router)();
    router.use(authenticate_1.authenticate);
    router.get("/overview", (0, authorize_1.authorize)("moderator", "admin"), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.overview({ role: req.auth.role });
        res.json(result);
    }));
    router.get("/users", (0, authorize_1.authorize)("moderator", "admin"), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.listUsers((0, pagination_1.parsePagination)(req));
        res.json(result);
    }));
    router.get("/creators", (0, authorize_1.authorize)("moderator", "admin"), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.listCreators((0, pagination_1.parsePagination)(req));
        res.json(result);
    }));
    router.get("/audit-logs", (0, authorize_1.authorize)("moderator", "admin"), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.listAuditLogs((0, pagination_1.parsePagination)(req));
        res.json(result);
    }));
    router.get("/moderation-actions", (0, authorize_1.authorize)("moderator", "admin"), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.listModerationActions((0, pagination_1.parsePagination)(req));
        res.json(result);
    }));
    router.get("/creators/:creatorUserId/reviews", (0, authorize_1.authorize)("moderator", "admin"), (0, validate_1.validate)(admin_schemas_1.creatorReviewHistorySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.listCreatorReviews((0, params_1.getStringParam)(req.params.creatorUserId));
        res.json(result);
    }));
    router.post("/creators/:creatorUserId/approve", (0, authorize_1.authorize)("admin"), (0, validate_1.validate)(admin_schemas_1.creatorApprovalSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.approveCreator({ userId: req.auth.userId, role: "admin" }, (0, params_1.getStringParam)(req.params.creatorUserId), req.body.notes);
        res.json(result);
    }));
    router.post("/creators/:creatorUserId/reject", (0, authorize_1.authorize)("admin"), (0, validate_1.validate)(admin_schemas_1.creatorRejectionSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.rejectCreator({ userId: req.auth.userId, role: "admin" }, (0, params_1.getStringParam)(req.params.creatorUserId), req.body.notes);
        res.json(result);
    }));
    router.post("/users/:userId/suspend", (0, authorize_1.authorize)("admin"), (0, validate_1.validate)(admin_schemas_1.userSuspendSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.suspendUser({ userId: req.auth.userId, role: "admin" }, (0, params_1.getStringParam)(req.params.userId), req.body.reason);
        res.json(result);
    }));
    router.post("/resources/suspend", (0, authorize_1.authorize)("moderator", "admin"), (0, validate_1.validate)(admin_schemas_1.resourceSuspendSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.suspendResource({ userId: req.auth.userId, role: req.auth.role }, req.body.resourceType, req.body.resourceId, req.body.reason);
        res.json(result);
    }));
    return router;
}
