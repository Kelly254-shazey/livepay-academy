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

type RecordPaymentInput = {
  buyerId: string;
  creatorId: string;
  targetType: string;
  targetId: string;
  amount: string;
  currency: string;
  providerReference: string;
  idempotencyKey: string;
};

export class JavaFinanceClient {
  private readonly client: AxiosInstance;
  private readonly breaker = new IntegrationCircuitBreaker("java-finance");

  constructor() {
    this.client = axios.create({
      baseURL: env.JAVA_FINANCE_URL,
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

  async recordSuccessfulPurchase(input: RecordPaymentInput) {
    return executeInternalServiceRequest({
      service: "java-finance",
      operation: "record a payment",
      breaker: this.breaker,
      retryAttempts: 1,
      run: async () => (await this.client.post("/internal/payments/record", input)).data
    });
  }

  async getWalletSummary(creatorId: string) {
    return executeInternalServiceRequest({
      service: "java-finance",
      operation: "load the creator wallet summary",
      breaker: this.breaker,
      retryAttempts: 1,
      run: async () => (await this.client.get(`/internal/wallets/${creatorId}`)).data
    });
  }

  async getWalletLedger(creatorId: string) {
    return executeInternalServiceRequest({
      service: "java-finance",
      operation: "load the creator wallet ledger",
      breaker: this.breaker,
      retryAttempts: 1,
      run: async () => (await this.client.get(`/internal/wallets/${creatorId}/ledger`)).data
    });
  }

  async requestPayout(creatorId: string, amount: string, currency: string) {
    return executeInternalServiceRequest({
      service: "java-finance",
      operation: "submit the payout request",
      breaker: this.breaker,
      run: async () => (
        await this.client.post("/internal/payouts/request", {
          creatorId,
          amount,
          currency
        })
      ).data
    });
  }

  async getRevenueSummary(from: string, to: string) {
    return executeInternalServiceRequest({
      service: "java-finance",
      operation: "load the finance revenue summary",
      breaker: this.breaker,
      retryAttempts: 1,
      run: async () => (
        await this.client.get("/internal/reports/revenue-summary", {
          params: { from, to }
        })
      ).data
    });
  }

  async getPlatformCommission(from: string, to: string) {
    return executeInternalServiceRequest({
      service: "java-finance",
      operation: "load the platform commission summary",
      breaker: this.breaker,
      retryAttempts: 1,
      run: async () => (
        await this.client.get("/internal/reports/platform-commission", {
          params: { from, to }
        })
      ).data
    });
  }

  async ping() {
    return executeInternalServiceRequest({
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
