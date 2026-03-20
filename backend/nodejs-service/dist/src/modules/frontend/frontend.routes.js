"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFrontendRouter = createFrontendRouter;
const express_1 = require("express");
const async_handler_1 = require("../../common/http/async-handler");
const params_1 = require("../../common/http/params");
const validate_1 = require("../../common/http/validate");
const authenticate_1 = require("../../common/middleware/authenticate");
const authorize_1 = require("../../common/middleware/authorize");
const frontend_schemas_1 = require("./frontend.schemas");
function createFrontendRouter(service) {
    const router = (0, express_1.Router)();
    router.post("/auth/sign-in", (0, validate_1.validate)(frontend_schemas_1.frontendSignInSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.signIn({
            ...req.body,
            ipAddress: req.ip
        });
        res.json(result);
    }));
    router.post("/auth/sign-up", (0, validate_1.validate)(frontend_schemas_1.frontendSignUpSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.signUp({
            ...req.body,
            ipAddress: req.ip
        });
        res.status(201).json(result);
    }));
    router.get("/auth/session", authenticate_1.authenticate, (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.getSession(req.auth);
        res.json(result);
    }));
    router.post("/auth/forgot-password", (0, validate_1.validate)(frontend_schemas_1.frontendForgotPasswordSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.forgotPassword(req.body.email);
        res.json(result);
    }));
    router.post("/auth/reset-password", (0, validate_1.validate)(frontend_schemas_1.frontendResetPasswordSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.resetPassword(req.body.token, req.body.password);
        res.json(result);
    }));
    router.get("/home", (0, async_handler_1.asyncHandler)(async (_req, res) => res.json(await service.getHomeFeed())));
    router.get("/categories/:slug", (0, validate_1.validate)(frontend_schemas_1.categorySlugParamsSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.getCategoryDetail((0, params_1.getStringParam)(req.params.slug));
        res.json(result);
    }));
    router.get("/creators/:creatorId", (0, validate_1.validate)(frontend_schemas_1.creatorIdParamsSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.getCreatorProfile((0, params_1.getStringParam)(req.params.creatorId));
        res.json(result);
    }));
    router.get("/lives/:liveId", (0, validate_1.validate)(frontend_schemas_1.liveIdParamsSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.getLiveDetail((0, params_1.getStringParam)(req.params.liveId));
        res.json(result);
    }));
    router.get("/lives/:liveId/room", authenticate_1.authenticate, (0, validate_1.validate)(frontend_schemas_1.liveIdParamsSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.getLiveRoom(req.auth, (0, params_1.getStringParam)(req.params.liveId));
        res.json(result);
    }));
    router.get("/premium-content/:contentId", (0, validate_1.validate)(frontend_schemas_1.contentIdParamsSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.getPremiumContentDetail((0, params_1.getStringParam)(req.params.contentId));
        res.json(result);
    }));
    router.get("/classes/:classId", (0, validate_1.validate)(frontend_schemas_1.classIdParamsSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.getClassDetail((0, params_1.getStringParam)(req.params.classId));
        res.json(result);
    }));
    router.get("/search", (0, validate_1.validate)(frontend_schemas_1.searchQuerySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.search({
            query: typeof req.query.query === "string" ? req.query.query : undefined,
            category: typeof req.query.category === "string" ? req.query.category : undefined,
            type: typeof req.query.type === "string"
                ? req.query.type
                : "all"
        });
        res.json(result);
    }));
    router.get("/viewer/dashboard", authenticate_1.authenticate, (0, authorize_1.authorize)("viewer"), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.getViewerDashboard(req.auth);
        res.json(result);
    }));
    router.get("/creator/dashboard", authenticate_1.authenticate, (0, authorize_1.authorize)("creator", "admin"), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.getCreatorDashboard(req.auth);
        res.json(result);
    }));
    router.get("/admin/dashboard", authenticate_1.authenticate, (0, authorize_1.authorize)("admin", "moderator"), (0, async_handler_1.asyncHandler)(async (_req, res) => {
        const result = await service.getAdminDashboard();
        res.json(result);
    }));
    router.get("/notifications", authenticate_1.authenticate, (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.getNotifications(req.auth);
        res.json(result);
    }));
    router.get("/transactions", authenticate_1.authenticate, (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.getTransactions(req.auth);
        res.json(result);
    }));
    router.post("/checkout", authenticate_1.authenticate, (0, validate_1.validate)(frontend_schemas_1.checkoutSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.createCheckout(req.auth, req.body);
        res.json(result);
    }));
    router.post("/creator/payouts", authenticate_1.authenticate, (0, authorize_1.authorize)("creator", "admin"), (0, validate_1.validate)(frontend_schemas_1.payoutRequestSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.requestPayout(req.auth, req.body);
        res.status(201).json(result);
    }));
    return router;
}
