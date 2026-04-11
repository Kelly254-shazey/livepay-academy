"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalPaymentMethodService = void 0;
const app_error_1 = require("../../common/errors/app-error");
const env_1 = require("../../config/env");
const TIMEOUT_MS = 10_000;
class GlobalPaymentMethodService {
    prisma;
    // Always use the validated env value — never allow an unvalidated override
    javaServiceUrl = env_1.env.JAVA_FINANCE_URL;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async addPaymentMethod(input) {
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
    async getPaymentMethods(userId) {
        const response = await this.javaFetch(`/api/v1/payment-methods`, {
            method: "GET",
            headers: this.buildHeaders(userId, false)
        });
        return (await response.json()).map((m) => this.normalizePaymentMethod(m));
    }
    async getAvailablePaymentMethods(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, country: true }
        });
        if (!user)
            throw new app_error_1.AppError("User not found.", 404);
        const [methods, providers] = await Promise.all([
            this.getPaymentMethods(userId),
            this.getAvailableProvidersForCountry(user.country ?? "US")
        ]);
        return { methods, providers };
    }
    async calculateFees(provider, amount, currency) {
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
    async getRecommendedPaymentMethods(countryCode) {
        return this.getAvailableProvidersForCountry(countryCode);
    }
    async getProviderConfigurations() {
        const response = await this.javaFetch(`/api/v1/payment-methods/providers`, {
            method: "GET",
            headers: this.buildHeaders(undefined, true)
        });
        return (await response.json()).map((p) => this.normalizeProvider(p));
    }
    async setDefaultPaymentMethod(userId, paymentMethodId) {
        await this.javaFetch(`/api/v1/payment-methods/${paymentMethodId}/default`, {
            method: "PATCH",
            headers: this.buildHeaders(userId, false)
        });
    }
    async deactivatePaymentMethod(userId, paymentMethodId) {
        await this.javaFetch(`/api/v1/payment-methods/${paymentMethodId}`, {
            method: "DELETE",
            headers: this.buildHeaders(userId, false)
        });
    }
    async getPaymentStatisticsByCountry(country, days = 30) {
        try {
            const response = await this.javaFetch(`/api/v1/audit/payment?hoursAgo=${days * 24}`, { method: "GET", headers: this.buildHeaders(undefined, true) });
            return response.json();
        }
        catch {
            return null;
        }
    }
    // ── private helpers ────────────────────────────────────────────────────────
    async javaFetch(path, init) {
        const response = await fetch(`${this.javaServiceUrl}${path}`, {
            ...init,
            signal: AbortSignal.timeout(TIMEOUT_MS)
        });
        if (!response.ok) {
            throw new app_error_1.AppError(`Java finance service error on ${init.method} ${path}: ${response.status}`, response.status >= 400 && response.status < 500 ? response.status : 503);
        }
        return response;
    }
    buildHeaders(userId, includeContentType = true) {
        const headers = {
            "x-internal-api-key": env_1.env.INTERNAL_API_KEY,
            "x-source-service": "nodejs-service"
        };
        if (includeContentType)
            headers["Content-Type"] = "application/json";
        if (userId)
            headers["User-ID"] = userId;
        return headers;
    }
    async getAvailableProvidersForCountry(countryCode) {
        const normalized = countryCode.trim().toUpperCase();
        const providers = await this.getProviderConfigurations();
        return providers.filter((p) => p.countries.some((c) => c.toUpperCase() === normalized));
    }
    toJavaEnum(value) {
        return value.trim().replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[\s-]+/g, "_").toUpperCase();
    }
    toNodeValue(value) {
        return value.trim().toLowerCase();
    }
    normalizePaymentMethod(method) {
        return {
            ...method,
            type: typeof method?.type === "string" ? this.toNodeValue(method.type) : method?.type,
            provider: typeof method?.provider === "string" ? this.toNodeValue(method.provider) : method?.provider
        };
    }
    normalizeProvider(provider) {
        return {
            provider: this.toNodeValue(String(provider.provider ?? "")),
            countries: Array.isArray(provider.countries) ? provider.countries : [],
            paymentTypes: Array.isArray(provider.paymentTypes)
                ? provider.paymentTypes.map((t) => this.toNodeValue(t))
                : [],
            fees: typeof provider.fees === "object" && provider.fees !== null ? provider.fees : {},
            settingsOverride: typeof provider.settingsOverride === "object" && provider.settingsOverride !== null
                ? provider.settingsOverride
                : undefined,
            isActive: Boolean(provider.isActive)
        };
    }
}
exports.GlobalPaymentMethodService = GlobalPaymentMethodService;
