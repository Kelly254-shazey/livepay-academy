"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthRouter = createAuthRouter;
const express_1 = require("express");
const async_handler_1 = require("../../common/http/async-handler");
const validate_1 = require("../../common/http/validate");
const authenticate_1 = require("../../common/middleware/authenticate");
const auth_schemas_1 = require("./auth.schemas");
function createAuthRouter(service) {
    const router = (0, express_1.Router)();
    router.post("/register", (0, validate_1.validate)(auth_schemas_1.registerSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.register({
            ...req.body,
            ipAddress: req.ip
        });
        res.status(201).json(result);
    }));
    router.post("/login", (0, validate_1.validate)(auth_schemas_1.loginSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.login({
            ...req.body,
            ipAddress: req.ip
        });
        res.json(result);
    }));
    router.post("/refresh", (0, validate_1.validate)(auth_schemas_1.refreshTokenSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.refresh(req.body.refreshToken);
        res.json(result);
    }));
    router.post("/logout", authenticate_1.authenticate, (0, validate_1.validate)(auth_schemas_1.refreshTokenSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        await service.logout(req.body.refreshToken, {
            userId: req.auth.userId,
            role: req.auth.role,
            ipAddress: req.ip
        });
        res.status(204).send();
    }));
    router.post("/password-reset/request", (0, validate_1.validate)(auth_schemas_1.passwordResetRequestSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.requestPasswordReset(req.body.email);
        res.json(result);
    }));
    router.post("/password-reset/confirm", (0, validate_1.validate)(auth_schemas_1.passwordResetConfirmSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.confirmPasswordReset(req.body.token, req.body.password);
        res.json(result);
    }));
    return router;
}
