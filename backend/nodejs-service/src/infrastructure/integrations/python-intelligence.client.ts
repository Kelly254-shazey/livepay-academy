import { AxiosInstance, default as axios } from "axios";

import {
  INTERNAL_API_KEY_HEADER,
  REQUEST_ID_HEADER,
  REQUEST_TIMESTAMP_HEADER,
  SOURCE_SERVICE_HEADER
} from "../../common/constants/domain";
import { getRequestContext } from "../../common/middleware/request-context";
import { env } from "../../config/env";
import {
  executeInternalServiceRequest,
  IntegrationCircuitBreaker
} from "./internal-service-resilience";

export class PythonIntelligenceClient {
  private readonly client: AxiosInstance;
  private readonly breaker = new IntegrationCircuitBreaker("python-intelligence");

  constructor() {
    this.client = axios.create({
      baseURL: env.PYTHON_INTELLIGENCE_URL,
      timeout: 5000,
      headers: {
        [INTERNAL_API_KEY_HEADER]: env.INTERNAL_API_KEY
      }
    });

    this.client.interceptors.request.use((config) => {
      const context = getRequestContext();
      config.headers.set(SOURCE_SERVICE_HEADER, "nodejs-service");
      config.headers.set(REQUEST_TIMESTAMP_HEADER, new Date().toISOString());

      if (context?.requestId) {
        config.headers.set(REQUEST_ID_HEADER, context.requestId);
      }

      return config;
    });
  }

  async getCreatorRecommendations(userId: string) {
    return executeInternalServiceRequest({
      service: "python-intelligence",
      operation: "load creator recommendations",
      breaker: this.breaker,
      retryAttempts: 1,
      run: async () => (
        await this.client.post(`/recommendations/users/${userId}`, {
          include: ["creators"]
        })
      ).data
    });
  }

  async getCreatorInsights(creatorId: string) {
    return executeInternalServiceRequest({
      service: "python-intelligence",
      operation: "load creator insights",
      breaker: this.breaker,
      retryAttempts: 1,
      run: async () => (await this.client.get(`/analytics/creator-insights/${creatorId}`)).data
    });
  }

  async getAnalyticsSummary() {
    return executeInternalServiceRequest({
      service: "python-intelligence",
      operation: "load analytics summary",
      breaker: this.breaker,
      retryAttempts: 1,
      run: async () => (await this.client.get("/analytics/dashboard-summary")).data
    });
  }

  async analyzeContent(payload: { title: string; description?: string; contentType: string }) {
    const response = await executeInternalServiceRequest({
      service: "python-intelligence",
      operation: "analyze content safety",
      breaker: this.breaker,
      retryAttempts: 1,
      run: async () => (
        await this.client.post("/moderation/analyze-content", {
          title: payload.title,
          description: payload.description,
          content_type: payload.contentType
        })
      ).data
    });
    return {
      riskScore: response.risk_score,
      severity: response.severity,
      labels: response.labels,
      reviewRequired: response.review_required,
      sanitizedExcerpt: response.sanitized_excerpt
    };
  }

  async scoreTransaction(payload: Record<string, unknown>) {
    const response = await executeInternalServiceRequest({
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

  async scoreAccount(payload: Record<string, unknown>) {
    const response = await executeInternalServiceRequest({
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
    return executeInternalServiceRequest({
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

function toSnakeCasePayload(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`),
      value
    ])
  );
}
