"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JavaFinanceClient = void 0;
const axios_1 = __importDefault(require("axios"));
const domain_1 = require("../../common/constants/domain");
const request_context_1 = require("../../common/middleware/request-context");
const env_1 = require("../../config/env");
const internal_service_resilience_1 = require("./internal-service-resilience");
class JavaFinanceClient {
    client;
    breaker = new internal_service_resilience_1.IntegrationCircuitBreaker("java-finance");
    constructor() {
        this.client = axios_1.default.create({
            baseURL: env_1.env.JAVA_FINANCE_URL,
            timeout: 5000,
            headers: {
                [domain_1.INTERNAL_API_KEY_HEADER]: env_1.env.INTERNAL_API_KEY
            }
        });
        this.client.interceptors.request.use((config) => {
            const context = (0, request_context_1.getRequestContext)();
            config.headers.set(domain_1.SOURCE_SERVICE_HEADER, "nodejs-service");
            config.headers.set(domain_1.REQUEST_TIMESTAMP_HEADER, new Date().toISOString());
            if (context?.requestId) {
                config.headers.set(domain_1.REQUEST_ID_HEADER, context.requestId);
            }
            return config;
        });
    }
    async recordSuccessfulPurchase(input) {
        return (0, internal_service_resilience_1.executeInternalServiceRequest)({
            service: "java-finance",
            operation: "record a payment",
            breaker: this.breaker,
            retryAttempts: 1,
            run: async () => (await this.client.post("/internal/payments/record", input)).data
        });
    }
    async getWalletSummary(creatorId) {
        return (0, internal_service_resilience_1.executeInternalServiceRequest)({
            service: "java-finance",
            operation: "load the creator wallet summary",
            breaker: this.breaker,
            retryAttempts: 1,
            run: async () => (await this.client.get(`/internal/wallets/${creatorId}`)).data
        });
    }
    async getWalletLedger(creatorId) {
        return (0, internal_service_resilience_1.executeInternalServiceRequest)({
            service: "java-finance",
            operation: "load the creator wallet ledger",
            breaker: this.breaker,
            retryAttempts: 1,
            run: async () => (await this.client.get(`/internal/wallets/${creatorId}/ledger`)).data
        });
    }
    async requestPayout(creatorId, amount, currency) {
        return (0, internal_service_resilience_1.executeInternalServiceRequest)({
            service: "java-finance",
            operation: "submit the payout request",
            breaker: this.breaker,
            run: async () => (await this.client.post("/internal/payouts/request", {
                creatorId,
                amount,
                currency
            })).data
        });
    }
    async getRevenueSummary(from, to) {
        return (0, internal_service_resilience_1.executeInternalServiceRequest)({
            service: "java-finance",
            operation: "load the finance revenue summary",
            breaker: this.breaker,
            retryAttempts: 1,
            run: async () => (await this.client.get("/internal/reports/revenue-summary", {
                params: { from, to }
            })).data
        });
    }
    async getPlatformCommission(from, to) {
        return (0, internal_service_resilience_1.executeInternalServiceRequest)({
            service: "java-finance",
            operation: "load the platform commission summary",
            breaker: this.breaker,
            retryAttempts: 1,
            run: async () => (await this.client.get("/internal/reports/platform-commission", {
                params: { from, to }
            })).data
        });
    }
    async ping() {
        return (0, internal_service_resilience_1.executeInternalServiceRequest)({
            service: "java-finance",
            operation: "check the finance service health",
            breaker: this.breaker,
            run: async () => (await this.client.get("/actuator/health")).data
        });
    }
    getIntegrationStatus() {
        return this.breaker.snapshot();
    }
}
exports.JavaFinanceClient = JavaFinanceClient;
