import { Router } from "express";

import { asyncHandler } from "../../common/http/async-handler";
import { validate } from "../../common/http/validate";
import { authenticate } from "../../common/middleware/authenticate";
import { loginSchema, passwordResetConfirmSchema, passwordResetRequestSchema, refreshTokenSchema, registerSchema } from "./auth.schemas";
import { AuthService } from "./auth.service";

export function createAuthRouter(service: AuthService) {
  const router = Router();

  router.post(
    "/register",
    validate(registerSchema),
    asyncHandler(async (req, res) => {
      const result = await service.register({
        ...req.body,
        ipAddress: req.ip
      });
      res.status(201).json(result);
    })
  );

  router.post(
    "/login",
    validate(loginSchema),
    asyncHandler(async (req, res) => {
      const result = await service.login({
        ...req.body,
        ipAddress: req.ip
      });
      res.json(result);
    })
  );

  router.post(
    "/refresh",
    validate(refreshTokenSchema),
    asyncHandler(async (req, res) => {
      const result = await service.refresh(req.body.refreshToken);
      res.json(result);
    })
  );

  router.post(
    "/logout",
    authenticate,
    validate(refreshTokenSchema),
    asyncHandler(async (req, res) => {
      await service.logout(req.body.refreshToken, {
        userId: req.auth!.userId,
        role: req.auth!.role,
        ipAddress: req.ip
      });
      res.status(204).send();
    })
  );

  router.post(
    "/password-reset/request",
    validate(passwordResetRequestSchema),
    asyncHandler(async (req, res) => {
      const result = await service.requestPasswordReset(req.body.email);
      res.json(result);
    })
  );

  router.post(
    "/password-reset/confirm",
    validate(passwordResetConfirmSchema),
    asyncHandler(async (req, res) => {
      const result = await service.confirmPasswordReset(req.body.token, req.body.password);
      res.json(result);
    })
  );

  return router;
}

