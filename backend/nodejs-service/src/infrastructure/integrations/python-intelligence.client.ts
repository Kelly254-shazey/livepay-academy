import axios, { AxiosInstance } from "axios";

import { env } from "../../config/env";
import { INTERNAL_API_KEY_HEADER } from "../../common/constants/domain";

export class PythonIntelligenceClient {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.PYTHON_INTELLIGENCE_URL,
      timeout: 5000,
      headers: {
        [INTERNAL_API_KEY_HEADER]: env.INTERNAL_API_KEY
      }
    });
  }

  async getCreatorRecommendations(userId: string) {
    const response = await this.client.post(`/recommendations/users/${userId}`, {
      include: ["creators"]
    });
    return response.data;
  }

  async getCreatorInsights(creatorId: string) {
    const response = await this.client.get(`/analytics/creator-insights/${creatorId}`);
    return response.data;
  }

  async getAnalyticsSummary() {
    const response = await this.client.get("/analytics/dashboard-summary");
    return response.data;
  }

  async analyzeContent(payload: { title: string; description?: string; contentType: string }) {
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

  async scoreTransaction(payload: Record<string, unknown>) {
    const response = await this.client.post("/fraud/score-transaction", toSnakeCasePayload(payload));
    return {
      riskScore: response.data.risk_score,
      trustScore: response.data.trust_score,
      decision: response.data.decision,
      reasons: response.data.reasons
    };
  }

  async scoreAccount(payload: Record<string, unknown>) {
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

function toSnakeCasePayload(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`),
      value
    ])
  );
}
