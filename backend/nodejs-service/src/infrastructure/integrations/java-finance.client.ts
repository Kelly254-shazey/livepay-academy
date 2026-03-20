import axios, { AxiosInstance } from "axios";

import { env } from "../../config/env";
import { INTERNAL_API_KEY_HEADER } from "../../common/constants/domain";

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

  constructor() {
    this.client = axios.create({
      baseURL: env.JAVA_FINANCE_URL,
      timeout: 5000,
      headers: {
        [INTERNAL_API_KEY_HEADER]: env.INTERNAL_API_KEY
      }
    });
  }

  async recordSuccessfulPurchase(input: RecordPaymentInput) {
    const response = await this.client.post("/internal/payments/record", input);
    return response.data;
  }

  async getWalletSummary(creatorId: string) {
    const response = await this.client.get(`/internal/wallets/${creatorId}`);
    return response.data;
  }

  async getWalletLedger(creatorId: string) {
    const response = await this.client.get(`/internal/wallets/${creatorId}/ledger`);
    return response.data;
  }

  async requestPayout(creatorId: string, amount: string, currency: string) {
    const response = await this.client.post("/internal/payouts/request", {
      creatorId,
      amount,
      currency
    });
    return response.data;
  }

  async getRevenueSummary(from: string, to: string) {
    const response = await this.client.get("/internal/reports/revenue-summary", {
      params: { from, to }
    });
    return response.data;
  }

  async getPlatformCommission(from: string, to: string) {
    const response = await this.client.get("/internal/reports/platform-commission", {
      params: { from, to }
    });
    return response.data;
  }

  async ping() {
    const response = await this.client.get("/actuator/health");
    return response.data;
  }
}
