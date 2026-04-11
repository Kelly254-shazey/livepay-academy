import type { PrismaClient } from "@prisma/client";

import { AppError } from "../../common/errors/app-error";
import { env } from "../../config/env";

const TIMEOUT_MS = 10_000;

export interface PaymentMethodInput {
  userId: string;
  type: string;
  provider: string;
  country: string;
  lastFour?: string;
  brand?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface PaymentProviderAvailability {
  provider: string;
  countries: string[];
  paymentTypes: string[];
  fees: { fixed?: number; percentage?: number };
  settingsOverride?: Record<string, unknown>;
  isActive: boolean;
}

export class GlobalPaymentMethodService {
  // Always use the validated env value — never allow an unvalidated override
  private readonly javaServiceUrl = env.JAVA_FINANCE_URL;

  constructor(private readonly prisma: PrismaClient) {}

  async addPaymentMethod(input: PaymentMethodInput): Promise<any> {
    const response = await this.javaFetch(`/api/v1/payment-methods`, {
      method: "POST",
      headers: this.buildHeaders(input.userId),
      body: JSON.stringify({
        type: this.toJavaEnum(input.type),
        provider: this.toJavaEnum(input.provider),
        country: input.country,
        lastFour: input.lastFour,
        brand: input.brand,
        expiresAt: input.expiresAt,
        metadata: input.metadata,
        isDefault: false
      })
    });
    return this.normalizePaymentMethod(await response.json());
  }

  async getPaymentMethods(userId: string): Promise<any[]> {
    const response = await this.javaFetch(`/api/v1/payment-methods`, {
      method: "GET",
      headers: this.buildHeaders(userId, false)
    });
    return (await response.json()).map((m: any) => this.normalizePaymentMethod(m));
  }

  async getAvailablePaymentMethods(userId: string): Promise<{
    methods: any[];
    providers: PaymentProviderAvailability[];
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, country: true }
    }) as { id: string; country?: string | null } | null;

    if (!user) throw new AppError("User not found.", 404);

    const [methods, providers] = await Promise.all([
      this.getPaymentMethods(userId),
      this.getAvailableProvidersForCountry(user.country ?? "US")
    ]);

    return { methods, providers };
  }

  async calculateFees(provider: string, amount: number, currency: string): Promise<{
    subtotal: number;
    fixed: number;
    percentage: number;
    total: number;
    provider: string;
  }> {
    const response = await this.javaFetch(`/api/v1/payment-methods/calculate-fees`, {
      method: "POST",
      headers: this.buildHeaders(undefined, true),
      body: JSON.stringify({ amount, provider: this.toJavaEnum(provider) })
    });
    const result = await response.json();
    return {
      subtotal: Number(result.amount ?? amount),
      fixed: Number(result.fixedFee ?? 0),
      percentage: Number(result.percentageFee ?? 0),
      total: Number(result.totalAmount ?? amount),
      provider: this.toNodeValue(provider)
    };
  }

  async getRecommendedPaymentMethods(countryCode: string): Promise<PaymentProviderAvailability[]> {
    return this.getAvailableProvidersForCountry(countryCode);
  }

  async getProviderConfigurations(): Promise<PaymentProviderAvailability[]> {
    const response = await this.javaFetch(`/api/v1/payment-methods/providers`, {
      method: "GET",
      headers: this.buildHeaders(undefined, true)
    });
    return (await response.json()).map((p: any) => this.normalizeProvider(p));
  }

  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    await this.javaFetch(`/api/v1/payment-methods/${paymentMethodId}/default`, {
      method: "PATCH",
      headers: this.buildHeaders(userId, false)
    });
  }

  async deactivatePaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    await this.javaFetch(`/api/v1/payment-methods/${paymentMethodId}`, {
      method: "DELETE",
      headers: this.buildHeaders(userId, false)
    });
  }

  async getPaymentStatisticsByCountry(country: string, days = 30): Promise<any> {
    try {
      const response = await this.javaFetch(
        `/api/v1/audit/payment?hoursAgo=${days * 24}`,
        { method: "GET", headers: this.buildHeaders(undefined, true) }
      );
      return response.json();
    } catch {
      return null;
    }
  }

  // ── private helpers ────────────────────────────────────────────────────────

  private async javaFetch(path: string, init: RequestInit): Promise<Response> {
    const response = await fetch(`${this.javaServiceUrl}${path}`, {
      ...init,
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    if (!response.ok) {
      throw new AppError(
        `Java finance service error on ${init.method} ${path}: ${response.status}`,
        response.status >= 400 && response.status < 500 ? response.status : 503
      );
    }
    return response;
  }

  private buildHeaders(userId?: string, includeContentType = true): Record<string, string> {
    const headers: Record<string, string> = {
      "x-internal-api-key": env.INTERNAL_API_KEY,
      "x-source-service": "nodejs-service"
    };
    if (includeContentType) headers["Content-Type"] = "application/json";
    if (userId) headers["User-ID"] = userId;
    return headers;
  }

  private async getAvailableProvidersForCountry(countryCode: string): Promise<PaymentProviderAvailability[]> {
    const normalized = countryCode.trim().toUpperCase();
    const providers = await this.getProviderConfigurations();
    return providers.filter((p) =>
      p.countries.some((c) => c.toUpperCase() === normalized)
    );
  }

  private toJavaEnum(value: string): string {
    return value.trim().replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[\s-]+/g, "_").toUpperCase();
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
        ? provider.paymentTypes.map((t: string) => this.toNodeValue(t))
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
