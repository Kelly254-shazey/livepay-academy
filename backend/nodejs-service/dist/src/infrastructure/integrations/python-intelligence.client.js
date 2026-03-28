"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PythonIntelligenceClient = void 0;
const axios_1 = __importDefault(require("axios"));
const domain_1 = require("../../common/constants/domain");
const request_context_1 = require("../../common/middleware/request-context");
const env_1 = require("../../config/env");
const internal_service_resilience_1 = require("./internal-service-resilience");
class PythonIntelligenceClient {
    client;
    breaker = new internal_service_resilience_1.IntegrationCircuitBreaker("python-intelligence");
    constructor() {
        this.client = axios_1.default.create({
            baseURL: env_1.env.PYTHON_INTELLIGENCE_URL,
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
    async getCreatorRecommendations(userId) {
        return (0, internal_service_resilience_1.executeInternalServiceRequest)({
            service: "python-intelligence",
            operation: "load creator recommendations",
            breaker: this.breaker,
            retryAttempts: 1,
            run: async () => (await this.client.post(`/recommendations/users/${userId}`, {
                include: ["creators"]
            })).data
        });
    }
    async getCreatorInsights(creatorId) {
        return (0, internal_service_resilience_1.executeInternalServiceRequest)({
            service: "python-intelligence",
            operation: "load creator insights",
            breaker: this.breaker,
            retryAttempts: 1,
            run: async () => (await this.client.get(`/analytics/creator-insights/${creatorId}`)).data
        });
    }
    async getAnalyticsSummary() {
        return (0, internal_service_resilience_1.executeInternalServiceRequest)({
            service: "python-intelligence",
            operation: "load analytics summary",
            breaker: this.breaker,
            retryAttempts: 1,
            run: async () => (await this.client.get("/analytics/dashboard-summary")).data
        });
    }
    async analyzeContent(payload) {
        const response = await (0, internal_service_resilience_1.executeInternalServiceRequest)({
            service: "python-intelligence",
            operation: "analyze content safety",
            breaker: this.breaker,
            retryAttempts: 1,
            run: async () => (await this.client.post("/moderation/analyze-content", {
                title: payload.title,
                description: payload.description,
                content_type: payload.contentType
            })).data
        });
        return {
            riskScore: response.risk_score,
            severity: response.severity,
            labels: response.labels,
            reviewRequired: response.review_required,
            sanitizedExcerpt: response.sanitized_excerpt
        };
    }
    async scoreTransaction(payload) {
        const response = await (0, internal_service_resilience_1.executeInternalServiceRequest)({
            service: "python-intelligence",
            operation: "score the transaction risk",
            breaker: this.breaker,
            retryAttempts: 1,
            run: async () => (await this.client.post("/fraud/score-transaction", toSnakeCasePayload(payload))).data
        });
        return {
            riskScore: response.risk_score,
            trustScore: response.trust_score,
            decision: response.decision,
            reasons: response.reasons
        };
    }
    async scoreAccount(payload) {
        const response = await (0, internal_service_resilience_1.executeInternalServiceRequest)({
            service: "python-intelligence",
            operation: "score the account risk",
            breaker: this.breaker,
            retryAttempts: 1,
            run: async () => (await this.client.post("/fraud/score-account", toSnakeCasePayload(payload))).data
        });
        return {
            riskScore: response.risk_score,
            trustScore: response.trust_score,
            decision: response.decision,
            reasons: response.reasons
        };
    }
    async ping() {
        return (0, internal_service_resilience_1.executeInternalServiceRequest)({
            service: "python-intelligence",
            operation: "check the intelligence service health",
            breaker: this.breaker,
            run: async () => (await this.client.get("/health")).data
        });
    }
    getIntegrationStatus() {
        return this.breaker.snapshot();
    }
}
exports.PythonIntelligenceClient = PythonIntelligenceClient;
function toSnakeCasePayload(payload) {
    return Object.fromEntries(Object.entries(payload).map(([key, value]) => [
        key.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`),
        value
    ]));
}
