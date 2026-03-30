"use strict";
/**
 * Global Payment Method Service
 * Delegates to Java service for payment processing
 * Node.js acts as gateway/orchestration layer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalPaymentMethodService = void 0;
const env_1 = require("../../config/env");
class GlobalPaymentMethodService {
    prisma;
    javaServiceUrl;
    constructor(prisma) {
        this.prisma = prisma;
        this.javaServiceUrl = process.env.JAVA_SERVICE_URL || env_1.env.JAVA_FINANCE_URL;
    }
    /**
     * Add a payment method for a user
     * Delegates to Java service
     */
    async addPaymentMethod(input) {
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
    async getPaymentMethods(userId) {
        const response = await fetch(`${this.javaServiceUrl}/api/v1/payment-methods`, {
            method: "GET",
            headers: this.buildJavaHeaders(userId, false),
        });
        if (!response.ok) {
            throw new Error(`Failed to get payment methods: ${response.statusText}`);
        }
        return (await response.json()).map((method) => this.normalizePaymentMethod(method));
    }
    /**
     * Get payment methods available for user's country
     * Delegates to Java service
     */
    async getAvailablePaymentMethods(userId) {
        // Get user's country
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, country: true },
        });
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
    async calculateFees(provider, amount, currency) {
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
    async getRecommendedPaymentMethods(countryCode) {
        return this.getAvailableProvidersForCountry(countryCode);
    }
    /**
     * Get providers available for specific country
     * Delegates to Java service
     */
    async getAvailableProvidersForCountry(countryCode) {
        const normalizedCountry = countryCode.trim().toUpperCase();
        const providers = await this.getProviderConfigurations();
        return providers.filter((provider) => provider.countries.some((country) => country.toUpperCase() === normalizedCountry));
    }
    async getProviderConfigurations() {
        const response = await fetch(`${this.javaServiceUrl}/api/v1/payment-methods/providers`, {
            method: "GET",
            headers: this.buildJavaHeaders(undefined, true)
        });
        if (!response.ok) {
            throw new Error(`Failed to get providers: ${response.statusText}`);
        }
        return (await response.json()).map((provider) => this.normalizeProvider(provider));
    }
    /**
     * Set default payment method
     * Delegates to Java service
     */
    async setDefaultPaymentMethod(userId, paymentMethodId) {
        const response = await fetch(`${this.javaServiceUrl}/api/v1/payment-methods/${paymentMethodId}/default`, {
            method: "PATCH",
            headers: this.buildJavaHeaders(userId, false),
        });
        if (!response.ok) {
            throw new Error(`Failed to set default payment method: ${response.statusText}`);
        }
    }
    /**
     * Deactivate a payment method
     * Delegates to Java service
     */
    async deactivatePaymentMethod(userId, paymentMethodId) {
        const response = await fetch(`${this.javaServiceUrl}/api/v1/payment-methods/${paymentMethodId}`, {
            method: "DELETE",
            headers: this.buildJavaHeaders(userId, false),
        });
        if (!response.ok) {
            throw new Error(`Failed to deactivate payment method: ${response.statusText}`);
        }
    }
    /**
     * Initialize payment providers (Java service handles this on startup)
     */
    async initializeProviders() {
        // Java service initializes providers automatically
        // This is kept for compatibility but does nothing in Node.js
        console.log("Payment providers are initialized by Java service");
    }
    /**
     * Detect available payment methods from location
     */
    async detectPaymentMethodsFromLocation(ipAddress) {
        // For now, return default set
        // In production, integrate with geolocation service
        return ["credit_card", "debit_card", "paypal", "bank_transfer"];
    }
    /**
     * Get payment statistics
     * Delegates to Java service
     */
    async getPaymentStatisticsByCountry(country, days = 30) {
        const response = await fetch(`${this.javaServiceUrl}/api/v1/audit/payment?hoursAgo=${days * 24}`, {
            method: "GET",
            headers: this.buildJavaHeaders(undefined, true),
        });
        if (!response.ok) {
            return null;
        }
        return response.json();
    }
    buildJavaHeaders(userId, includeContentType = true) {
        const headers = {
            "x-internal-api-key": env_1.env.INTERNAL_API_KEY,
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
    toJavaEnum(value) {
        return value
            .trim()
            .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
            .replace(/[\s-]+/g, "_")
            .toUpperCase();
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
                ? provider.paymentTypes.map((type) => this.toNodeValue(type))
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
