import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";

import { asyncHandler } from "../../common/http/async-handler";
import { authenticate } from "../../common/middleware/authenticate";
import { getStringParam } from "../../common/http/params";
import { GlobalPaymentMethodService } from "../../infrastructure/payments/global-payment-method.service";
import { ComprehensiveAuditService } from "../../common/audit/comprehensive-audit.service";
import { prisma } from "../../infrastructure/db/prisma";

const router = Router();
const paymentService = new GlobalPaymentMethodService(prisma);
const auditService = new ComprehensiveAuditService(prisma);

const addMethodSchema = z.object({
  type: z.string().min(1).max(50),
  provider: z.string().min(1).max(50),
  country: z.string().length(2),
  lastFour: z.string().length(4).optional(),
  brand: z.string().max(50).optional(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional()
});

const calculateFeesSchema = z.object({
  provider: z.string().min(1).max(50),
  amount: z.number().positive().max(1_000_000),
  currency: z.string().length(3)
});

// GET /api/payment-methods — requires auth
router.get("/", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { methods, providers } = await paymentService.getAvailablePaymentMethods(req.auth!.userId);
  res.json({ methods, providers });
}));

// GET /api/payment-methods/providers — requires auth
router.get("/providers", authenticate, asyncHandler(async (_req: Request, res: Response) => {
  const providers = await paymentService.getProviderConfigurations();
  res.json({ providers });
}));

// POST /api/payment-methods — requires auth + validated body
router.post("/", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const body = addMethodSchema.parse(req.body);
  const method = await paymentService.addPaymentMethod({
    userId: req.auth!.userId,
    ...body,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined
  });
  await auditService.recordPaymentEvent({
    paymentId: method.id,
    userId: req.auth!.userId,
    action: "payment_method_added",
    ipAddress: req.ip ?? "",
    metadata: { methodId: method.id }
  });
  res.status(201).json({ method });
}));

// PATCH /api/payment-methods/:methodId/default — requires auth
router.patch("/:methodId/default", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const methodId = getStringParam(req.params.methodId);
  await paymentService.setDefaultPaymentMethod(req.auth!.userId, methodId);
  res.json({ updated: true });
}));

// DELETE /api/payment-methods/:methodId — requires auth
router.delete("/:methodId", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const methodId = getStringParam(req.params.methodId);
  await paymentService.deactivatePaymentMethod(req.auth!.userId, methodId);
  await auditService.recordPaymentEvent({
    paymentId: methodId,
    userId: req.auth!.userId,
    action: "payment_method_removed",
    ipAddress: req.ip ?? ""
  });
  res.json({ removed: true });
}));

// POST /api/payment-methods/calculate-fees — requires auth to prevent fee-structure probing
router.post("/calculate-fees", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { provider, amount, currency } = calculateFeesSchema.parse(req.body);
  const fees = await paymentService.calculateFees(provider, amount, currency);
  res.json({ fees });
}));

export default router;
