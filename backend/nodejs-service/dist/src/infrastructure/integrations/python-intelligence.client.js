"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PythonIntelligenceClient = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../../config/env");
const domain_1 = require("../../common/constants/domain");
class PythonIntelligenceClient {
    client;
    constructor() {
        this.client = axios_1.default.create({
            baseURL: env_1.env.PYTHON_INTELLIGENCE_URL,
            timeout: 5000,
            headers: {
                [domain_1.INTERNAL_API_KEY_HEADER]: env_1.env.INTERNAL_API_KEY
            }
        });
    }
    async getCreatorRecommendations(userId) {
        const response = await this.client.post(`/recommendations/users/${userId}`, {
            include: ["creators"]
        });
        return response.data;
    }
    async getCreatorInsights(creatorId) {
        const response = await this.client.get(`/analytics/creator-insights/${creatorId}`);
        return response.data;
    }
    async getAnalyticsSummary() {
        const response = await this.client.get("/analytics/dashboard-summary");
        return response.data;
    }
    async analyzeContent(payload) {
        const response = await this.client.post("/moderation/analyze-content", {
            title: payload.title,
            description: payload.description,
            content_type: payload.contentType
        });
        return {
            riskScore: response.data.risk_score,
            severity: response.data.severity,
            labels: response.data.labels,
            reviewRequired: response.data.review_required,
            sanitizedExcerpt: response.data.sanitized_excerpt
        };
    }
    async scoreTransaction(payload) {
        const response = await this.client.post("/fraud/score-transaction", toSnakeCasePayload(payload));
        return {
            riskScore: response.data.risk_score,
            trustScore: response.data.trust_score,
            decision: response.data.decision,
            reasons: response.data.reasons
        };
    }
    async scoreAccount(payload) {
        const response = await this.client.post("/fraud/score-account", toSnakeCasePayload(payload));
        return {
            riskScore: response.data.risk_score,
            trustScore: response.data.trust_score,
            decision: response.data.decision,
            reasons: response.data.reasons
        };
    }
    async ping() {
        const response = await this.client.get("/health");
        return response.data;
    }
}
exports.PythonIntelligenceClient = PythonIntelligenceClient;
function toSnakeCasePayload(payload) {
    return Object.fromEntries(Object.entries(payload).map(([key, value]) => [
        key.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`),
        value
    ]));
}
