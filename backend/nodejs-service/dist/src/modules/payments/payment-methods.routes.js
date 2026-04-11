"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const async_handler_1 = require("../../common/http/async-handler");
const authenticate_1 = require("../../common/middleware/authenticate");
const params_1 = require("../../common/http/params");
const global_payment_method_service_1 = require("../../infrastructure/payments/global-payment-method.service");
const comprehensive_audit_service_1 = require("../../common/audit/comprehensive-audit.service");
const prisma_1 = require("../../infrastructure/db/prisma");
const router = (0, express_1.Router)();
const paymentService = new global_payment_method_service_1.GlobalPaymentMethodService(prisma_1.prisma);
const auditService = new comprehensive_audit_service_1.ComprehensiveAuditService(prisma_1.prisma);
const addMethodSchema = zod_1.z.object({
    type: zod_1.z.string().min(1).max(50),
    provider: zod_1.z.string().min(1).max(50),
    country: zod_1.z.string().length(2),
    lastFour: zod_1.z.string().length(4).optional(),
    brand: zod_1.z.string().max(50).optional(),
    expiresAt: zod_1.z.string().datetime().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional()
});
const calculateFeesSchema = zod_1.z.object({
    provider: zod_1.z.string().min(1).max(50),
    amount: zod_1.z.number().positive().max(1_000_000),
    currency: zod_1.z.string().length(3)
});
// GET /api/payment-methods — requires auth
router.get("/", authenticate_1.authenticate, (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { methods, providers } = await paymentService.getAvailablePaymentMethods(req.auth.userId);
    res.json({ methods, providers });
}));
// GET /api/payment-methods/providers — requires auth
router.get("/providers", authenticate_1.authenticate, (0, async_handler_1.asyncHandler)(async (_req, res) => {
    const providers = await paymentService.getProviderConfigurations();
    res.json({ providers });
}));
// POST /api/payment-methods — requires auth + validated body
router.post("/", authenticate_1.authenticate, (0, async_handler_1.asyncHandler)(async (req, res) => {
    const body = addMethodSchema.parse(req.body);
    const method = await paymentService.addPaymentMethod({
        userId: req.auth.userId,
        ...body,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined
    });
    await auditService.recordPaymentEvent({
        paymentId: method.id,
        userId: req.auth.userId,
        action: "payment_method_added",
        ipAddress: req.ip ?? "",
        metadata: { methodId: method.id }
    });
    res.status(201).json({ method });
}));
// PATCH /api/payment-methods/:methodId/default — requires auth
router.patch("/:methodId/default", authenticate_1.authenticate, (0, async_handler_1.asyncHandler)(async (req, res) => {
    const methodId = (0, params_1.getStringParam)(req.params.methodId);
    await paymentService.setDefaultPaymentMethod(req.auth.userId, methodId);
    res.json({ updated: true });
}));
// DELETE /api/payment-methods/:methodId — requires auth
router.delete("/:methodId", authenticate_1.authenticate, (0, async_handler_1.asyncHandler)(async (req, res) => {
    const methodId = (0, params_1.getStringParam)(req.params.methodId);
    await paymentService.deactivatePaymentMethod(req.auth.userId, methodId);
    await auditService.recordPaymentEvent({
        paymentId: methodId,
        userId: req.auth.userId,
        action: "payment_method_removed",
        ipAddress: req.ip ?? ""
    });
    res.json({ removed: true });
}));
// POST /api/payment-methods/calculate-fees — requires auth to prevent fee-structure probing
router.post("/calculate-fees", authenticate_1.authenticate, (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { provider, amount, currency } = calculateFeesSchema.parse(req.body);
    const fees = await paymentService.calculateFees(provider, amount, currency);
    res.json({ fees });
}));
exports.default = router;
