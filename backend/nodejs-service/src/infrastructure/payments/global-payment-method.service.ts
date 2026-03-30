/**
 * Global Payment Method Service
 * Delegates to Java service for payment processing
 * Node.js acts as gateway/orchestration layer
 */

import type { PrismaClient } from "@prisma/client";
import { env } from "../../config/env";

export interface PaymentMethodInput {
  userId: string;
  type: string;
  provider: string;
  country: string;
  lastFour?: string;
  brand?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface PaymentProviderAvailability {
  provider: string;
  countries: string[];
  paymentTypes: string[];
  fees: {
    fixed?: number;
    percentage?: number;
  };
  settingsOverride?: Record<string, any>;
  isActive: boolean;
}

export class GlobalPaymentMethodService {
  private javaServiceUrl: string;

  constructor(private prisma: PrismaClient) {
    this.javaServiceUrl = process.env.JAVA_SERVICE_URL || env.JAVA_FINANCE_URL;
  }

  /**
   * Add a payment method for a user
   * Delegates to Java service
   */
  async addPaymentMethod(input: PaymentMethodInput): Promise<any> {
    const response = await fetch(`${this.javaServiceUrl}/api/v1/payment-methods`, {
      method: "POST",
      headers: this.buildJavaHeaders(input.userId),
      body: JSON.stringify({
        type: this.toJavaEnum(input.type),
        provider: this.toJavaEnum(input.provider),
        country: input.country,
        lastFour: input.lastFour,
        brand: input.brand,
        expiresAt: input.expiresAt,
        metadata: input.metadata,
        isDefault: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add payment method: ${response.statusText}`);
    }

    return this.normalizePaymentMethod(await response.json());
  }

  /**
   * Get payment methods for a user
   * Delegates to Java service
   */
  async getPaymentMethods(userId: string): Promise<any[]> {
    const response = await fetch(`${this.javaServiceUrl}/api/v1/payment-methods`, {
      method: "GET",
      headers: this.buildJavaHeaders(userId, false),
    });

    if (!response.ok) {
      throw new Error(`Failed to get payment methods: ${response.statusText}`);
    }

    return (await response.json()).map((method: any) => this.normalizePaymentMethod(method));
  }

  /**
   * Get payment methods available for user's country
   * Delegates to Java service
   */
  async getAvailablePaymentMethods(userId: string): Promise<{
    methods: any[];
    providers: PaymentProviderAvailability[];
  }> {
    // Get user's country
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, country: true },
    } as any) as { id: string; country?: string | null } | null;

    if (!user) {
      throw new Error("User not found");
    }

    // Get available methods from Java service
    const [methods, availableProviders] = await Promise.all([
      this.getPaymentMethods(userId),
      this.getAvailableProvidersForCountry(user.country ?? "US")
    ]);

    return { methods, providers: availableProviders };
  }

  /**
   * Calculate transaction fees
   * Delegates to Java service
   */
  async calculateFees(
    provider: string,
    amount: number,
    currency: string
  ): Promise<{
    subtotal: number;
    fixed: number;
    percentage: number;
    total: number;
    provider: string;
  }> {
    const response = await fetch(`${this.javaServiceUrl}/api/v1/payment-methods/calculate-fees`, {
      method: "POST",
      headers: this.buildJavaHeaders(undefined, true),
      body: JSON.stringify({
        amount,
        provider: this.toJavaEnum(provider),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to calculate fees: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      subtotal: Number(result.amount ?? amount),
      fixed: Number(result.fixedFee ?? 0),
      percentage: Number(result.percentageFee ?? 0),
      total: Number(result.totalAmount ?? amount),
      provider: this.toNodeValue(provider)
    };
  }

  /**
   * Get recommended payment methods for country
   * Delegates to Java service
   */
  async getRecommendedPaymentMethods(countryCode: string): Promise<PaymentProviderAvailability[]> {
    return this.getAvailableProvidersForCountry(countryCode);
  }

  /**
   * Get providers available for specific country
   * Delegates to Java service
   */
  private async getAvailableProvidersForCountry(countryCode: string): Promise<PaymentProviderAvailability[]> {
    const normalizedCountry = countryCode.trim().toUpperCase();
    const providers = await this.getProviderConfigurations();
    return providers.filter((provider) =>
      provider.countries.some((country) => country.toUpperCase() === normalizedCountry)
    );
  }

  async getProviderConfigurations(): Promise<PaymentProviderAvailability[]> {
    const response = await fetch(`${this.javaServiceUrl}/api/v1/payment-methods/providers`, {
      method: "GET",
      headers: this.buildJavaHeaders(undefined, true)
    });

    if (!response.ok) {
      throw new Error(`Failed to get providers: ${response.statusText}`);
    }

    return (await response.json()).map((provider: any) => this.normalizeProvider(provider));
  }

  /**
   * Set default payment method
   * Delegates to Java service
   */
  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    const response = await fetch(
      `${this.javaServiceUrl}/api/v1/payment-methods/${paymentMethodId}/default`,
      {
        method: "PATCH",
        headers: this.buildJavaHeaders(userId, false),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to set default payment method: ${response.statusText}`);
    }
  }

  /**
   * Deactivate a payment method
   * Delegates to Java service
   */
  async deactivatePaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    const response = await fetch(
      `${this.javaServiceUrl}/api/v1/payment-methods/${paymentMethodId}`,
      {
        method: "DELETE",
        headers: this.buildJavaHeaders(userId, false),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to deactivate payment method: ${response.statusText}`);
    }
  }

  /**
   * Initialize payment providers (Java service handles this on startup)
   */
  async initializeProviders(): Promise<void> {
    // Java service initializes providers automatically
    // This is kept for compatibility but does nothing in Node.js
    console.log("Payment providers are initialized by Java service");
  }

  /**
   * Detect available payment methods from location
   */
  async detectPaymentMethodsFromLocation(ipAddress: string): Promise<string[]> {
    // For now, return default set
    // In production, integrate with geolocation service
    return ["credit_card", "debit_card", "paypal", "bank_transfer"];
  }

  /**
   * Get payment statistics
   * Delegates to Java service
   */
  async getPaymentStatisticsByCountry(country: string, days: number = 30): Promise<any> {
    const response = await fetch(
      `${this.javaServiceUrl}/api/v1/audit/payment?hoursAgo=${days * 24}`,
      {
        method: "GET",
        headers: this.buildJavaHeaders(undefined, true),
      }
    );

    if (!response.ok) {
      return null;
    }

    return response.json();
  }

  private buildJavaHeaders(userId?: string, includeContentType: boolean = true): Record<string, string> {
    const headers: Record<string, string> = {
      "x-internal-api-key": env.INTERNAL_API_KEY,
      "x-source-service": "nodejs-service"
    };

    if (includeContentType) {
      headers["Content-Type"] = "application/json";
    }

    if (userId) {
      headers["User-ID"] = userId;
    }

    return headers;
  }

  private toJavaEnum(value: string): string {
    return value
      .trim()
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .replace(/[\s-]+/g, "_")
      .toUpperCase();
  }

  private toNodeValue(value: string): string {
    return value.trim().toLowerCase();
  }

  private normalizePaymentMethod(method: any) {
    return {
      ...method,
      type: typeof method?.type === "string" ? this.toNodeValue(method.type) : method?.type,
      provider: typeof method?.provider === "string" ? this.toNodeValue(method.provider) : method?.provider
    };
  }

  private normalizeProvider(provider: any): PaymentProviderAvailability {
    return {
      provider: this.toNodeValue(String(provider.provider ?? "")),
      countries: Array.isArray(provider.countries) ? provider.countries : [],
      paymentTypes: Array.isArray(provider.paymentTypes)
        ? provider.paymentTypes.map((type: string) => this.toNodeValue(type))
        : [],
      fees: typeof provider.fees === "object" && provider.fees !== null ? provider.fees : {},
      settingsOverride:
        typeof provider.settingsOverride === "object" && provider.settingsOverride !== null
          ? provider.settingsOverride
          : undefined,
      isActive: Boolean(provider.isActive)
    };
  }
}
