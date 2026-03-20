import { Router } from "express";

import { asyncHandler } from "../../common/http/async-handler";
import { getStringParam } from "../../common/http/params";
import { validate } from "../../common/http/validate";
import { authenticate } from "../../common/middleware/authenticate";
import { authorize } from "../../common/middleware/authorize";
import {
  categorySlugParamsSchema,
  checkoutSchema,
  classIdParamsSchema,
  contentIdParamsSchema,
  creatorIdParamsSchema,
  frontendForgotPasswordSchema,
  frontendResetPasswordSchema,
  frontendSignInSchema,
  frontendSignUpSchema,
  liveIdParamsSchema,
  payoutRequestSchema,
  searchQuerySchema
} from "./frontend.schemas";
import { FrontendService } from "./frontend.service";

export function createFrontendRouter(service: FrontendService) {
  const router = Router();

  router.post(
    "/auth/sign-in",
    validate(frontendSignInSchema),
    asyncHandler(async (req, res) => {
      const result = await service.signIn({
        ...req.body,
        ipAddress: req.ip
      });
      res.json(result);
    })
  );

  router.post(
    "/auth/sign-up",
    validate(frontendSignUpSchema),
    asyncHandler(async (req, res) => {
      const result = await service.signUp({
        ...req.body,
        ipAddress: req.ip
      });
      res.status(201).json(result);
    })
  );

  router.get(
    "/auth/session",
    authenticate,
    asyncHandler(async (req, res) => {
      const result = await service.getSession(req.auth!);
      res.json(result);
    })
  );

  router.post(
    "/auth/forgot-password",
    validate(frontendForgotPasswordSchema),
    asyncHandler(async (req, res) => {
      const result = await service.forgotPassword(req.body.email);
      res.json(result);
    })
  );

  router.post(
    "/auth/reset-password",
    validate(frontendResetPasswordSchema),
    asyncHandler(async (req, res) => {
      const result = await service.resetPassword(req.body.token, req.body.password);
      res.json(result);
    })
  );

  router.get("/home", asyncHandler(async (_req, res) => res.json(await service.getHomeFeed())));

  router.get(
    "/categories/:slug",
    validate(categorySlugParamsSchema),
    asyncHandler(async (req, res) => {
      const result = await service.getCategoryDetail(getStringParam(req.params.slug));
      res.json(result);
    })
  );

  router.get(
    "/creators/:creatorId",
    validate(creatorIdParamsSchema),
    asyncHandler(async (req, res) => {
      const result = await service.getCreatorProfile(getStringParam(req.params.creatorId));
      res.json(result);
    })
  );

  router.get(
    "/lives/:liveId",
    validate(liveIdParamsSchema),
    asyncHandler(async (req, res) => {
      const result = await service.getLiveDetail(getStringParam(req.params.liveId));
      res.json(result);
    })
  );

  router.get(
    "/lives/:liveId/room",
    authenticate,
    validate(liveIdParamsSchema),
    asyncHandler(async (req, res) => {
      const result = await service.getLiveRoom(req.auth!, getStringParam(req.params.liveId));
      res.json(result);
    })
  );

  router.get(
    "/premium-content/:contentId",
    validate(contentIdParamsSchema),
    asyncHandler(async (req, res) => {
      const result = await service.getPremiumContentDetail(getStringParam(req.params.contentId));
      res.json(result);
    })
  );

  router.get(
    "/classes/:classId",
    validate(classIdParamsSchema),
    asyncHandler(async (req, res) => {
      const result = await service.getClassDetail(getStringParam(req.params.classId));
      res.json(result);
    })
  );

  router.get(
    "/search",
    validate(searchQuerySchema),
    asyncHandler(async (req, res) => {
      const result = await service.search({
        query: typeof req.query.query === "string" ? req.query.query : undefined,
        category: typeof req.query.category === "string" ? req.query.category : undefined,
        type: typeof req.query.type === "string"
          ? req.query.type as "creator" | "live" | "content" | "class" | "all"
          : "all"
      });
      res.json(result);
    })
  );

  router.get(
    "/viewer/dashboard",
    authenticate,
    authorize("viewer"),
    asyncHandler(async (req, res) => {
      const result = await service.getViewerDashboard(req.auth!);
      res.json(result);
    })
  );

  router.get(
    "/creator/dashboard",
    authenticate,
    authorize("creator", "admin"),
    asyncHandler(async (req, res) => {
      const result = await service.getCreatorDashboard(req.auth!);
      res.json(result);
    })
  );

  router.get(
    "/admin/dashboard",
    authenticate,
    authorize("admin", "moderator"),
    asyncHandler(async (_req, res) => {
      const result = await service.getAdminDashboard();
      res.json(result);
    })
  );

  router.get(
    "/notifications",
    authenticate,
    asyncHandler(async (req, res) => {
      const result = await service.getNotifications(req.auth!);
      res.json(result);
    })
  );

  router.get(
    "/transactions",
    authenticate,
    asyncHandler(async (req, res) => {
      const result = await service.getTransactions(req.auth!);
      res.json(result);
    })
  );

  router.post(
    "/checkout",
    authenticate,
    validate(checkoutSchema),
    asyncHandler(async (req, res) => {
      const result = await service.createCheckout(req.auth!, req.body);
      res.json(result);
    })
  );

  router.post(
    "/creator/payouts",
    authenticate,
    authorize("creator", "admin"),
    validate(payoutRequestSchema),
    asyncHandler(async (req, res) => {
      const result = await service.requestPayout(req.auth!, req.body);
      res.status(201).json(result);
    })
  );

  return router;
}
