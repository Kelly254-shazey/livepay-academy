/**
 * Global Payment Methods API Routes
 * Handle payment method management and country-based payment options
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { getStringParam } from "../../common/http/params";
import { GlobalPaymentMethodService } from "../../infrastructure/payments/global-payment-method.service";
import { GeolocationService } from "../../infrastructure/integrations/geolocation.service";
import { ComprehensiveAuditService } from "../../common/audit/comprehensive-audit.service";
import { prisma } from "../../infrastructure/db/prisma";

const router = Router();
const paymentService = new GlobalPaymentMethodService(prisma);
const geolocationService = new GeolocationService();
const auditService = new ComprehensiveAuditService(prisma);

/**
 * GET /api/payment-methods
 * Get user's payment methods and available providers
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { methods, providers } = await paymentService.getAvailablePaymentMethods(userId);

    res.json({
      success: true,
      methods,
      providers
    });
  } catch (error) {
    console.error("Failed to get payment methods:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/payment-methods/available
 * Get payment methods available for user's country
 */
router.get("/available", async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Detect country from IP
    const ipAddress = req.ip || "127.0.0.1";
    const location = await geolocationService.detectLocation(ipAddress);

    if (!location) {
      return res.status(400).json({ error: "Unable to determine country" });
    }

    const country = location.country;

    const recommended = await paymentService.getRecommendedPaymentMethods(country);

    res.json({
      success: true,
      country,
      methods: recommended
    });
  } catch (error) {
    console.error("Failed to get available methods:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/payment-methods
 * Add a new payment method
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { type, provider, country, lastFour, brand, expiresAt, metadata } = req.body;

    const method = await paymentService.addPaymentMethod({
      userId,
      type,
      provider: provider as any,
      country,
      lastFour,
      brand,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      metadata
    });

    // Audit
    await auditService.recordPaymentEvent({
      paymentId: method.id,
      userId,
      action: "added",
      ipAddress: req.ip ?? "127.0.0.1",
      metadata: { methodId: method.id }
    });

    res.json({ success: true, method });
  } catch (error) {
    console.error("Failed to add payment method:", error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * PATCH /api/payment-methods/:methodId/default
 * Set as default payment method
 */
router.patch("/:methodId/default", async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const methodId = getStringParam(req.params.methodId);

    // Delegate to Java service
    await paymentService.setDefaultPaymentMethod(userId, methodId);

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to set default payment method:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/payment-methods/:methodId
 * Remove a payment method
 */
router.delete("/:methodId", async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const methodId = getStringParam(req.params.methodId);

    await paymentService.deactivatePaymentMethod(userId, methodId);

    // Audit (log locally and Java service will log detailed audit)
    await auditService.recordPaymentEvent({
      paymentId: methodId,
      userId,
      action: "payment_method_removed",
      ipAddress: req.ip ?? "127.0.0.1"
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to remove payment method:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/payment-methods/calculate-fees
 * Calculate transaction fees
 */
router.post("/calculate-fees", async (req: Request, res: Response) => {
  try {
    const { provider, amount, currency } = req.body;

    const fees = await paymentService.calculateFees(provider, amount, currency);

    res.json({ success: true, fees });
  } catch (error) {
    console.error("Failed to calculate fees:", error);
    res.status(400).json({ error: String(error) });
  }
});

/**
 * GET /api/payment-methods/providers
 * Get all available payment providers
 */
router.get("/providers", async (req: Request, res: Response) => {
  try {
    const providers = await paymentService.getProviderConfigurations();

    res.json({
      success: true,
      providers
    });
  } catch (error) {
    console.error("Failed to get providers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/payment-methods/location
 * Detect payment methods available in user's location
 */
router.get("/location", async (req: Request, res: Response) => {
  try {
    const ipAddress = req.ip || "127.0.0.1";
    const methods = await paymentService.detectPaymentMethodsFromLocation(ipAddress);

    res.json({
      success: true,
      ipAddress: ipAddress.substring(0, 10), // Sanitize IP
      availableMethods: methods
    });
  } catch (error) {
    console.error("Failed to detect location-based methods:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
