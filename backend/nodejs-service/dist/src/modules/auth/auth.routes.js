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
    router.post("/sign-up", (0, validate_1.validate)(auth_schemas_1.registerSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.register({
            ...req.body,
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });
        res.status(201).json(result);
    }));
    router.post("/sign-in", (0, validate_1.validate)(auth_schemas_1.loginSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.login({
            ...req.body,
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });
        res.json(result);
    }));
    router.post("/google", (0, validate_1.validate)(auth_schemas_1.googleSignInSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.signInWithGoogle({
            ...req.body,
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });
        res.json(result);
    }));
    router.post("/refresh", (0, validate_1.validate)(auth_schemas_1.refreshTokenSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.refresh(req.body.refreshToken, {
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });
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
    router.post("/email-verification/request", authenticate_1.authenticate, (0, validate_1.validate)(auth_schemas_1.emptyBodySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.requestEmailVerification(req.auth.userId, {
            ipAddress: req.ip
        });
        res.json(result);
    }));
    router.post("/email-verification/confirm", (0, validate_1.validate)(auth_schemas_1.emailVerificationConfirmSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.confirmEmailVerification(req.body, {
            ipAddress: req.ip
        });
        res.json(result);
    }));
    router.post("/password-reset/request", (0, validate_1.validate)(auth_schemas_1.passwordResetRequestSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.requestPasswordReset(req.body.email, {
            ipAddress: req.ip
        });
        res.json(result);
    }));
    router.post("/password-reset/confirm", (0, validate_1.validate)(auth_schemas_1.passwordResetConfirmSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.confirmPasswordReset(req.body, {
            ipAddress: req.ip
        });
        res.json(result);
    }));
    router.post("/profile/complete", authenticate_1.authenticate, (0, validate_1.validate)(auth_schemas_1.completeProfileSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.completeProfile(req.auth.userId, req.body);
        res.json(result);
    }));
    router.post("/link/google", authenticate_1.authenticate, (0, validate_1.validate)(auth_schemas_1.googleSignInSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.linkGoogleAccount(req.auth.userId, {
            idToken: req.body.idToken,
            clerkToken: req.body.clerkToken
        });
        res.json(result);
    }));
    router.post("/link/password", authenticate_1.authenticate, (0, validate_1.validate)(auth_schemas_1.linkPasswordSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
        const result = await service.linkPassword(req.auth.userId, req.body.password);
        res.json(result);
    }));
    return router;
}
