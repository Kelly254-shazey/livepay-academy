"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JavaFinanceClient = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../../config/env");
const domain_1 = require("../../common/constants/domain");
class JavaFinanceClient {
    client;
    constructor() {
        this.client = axios_1.default.create({
            baseURL: env_1.env.JAVA_FINANCE_URL,
            timeout: 5000,
            headers: {
                [domain_1.INTERNAL_API_KEY_HEADER]: env_1.env.INTERNAL_API_KEY
            }
        });
    }
    async recordSuccessfulPurchase(input) {
        const response = await this.client.post("/internal/payments/record", input);
        return response.data;
    }
    async getWalletSummary(creatorId) {
        const response = await this.client.get(`/internal/wallets/${creatorId}`);
        return response.data;
    }
    async getWalletLedger(creatorId) {
        const response = await this.client.get(`/internal/wallets/${creatorId}/ledger`);
        return response.data;
    }
    async requestPayout(creatorId, amount, currency) {
        const response = await this.client.post("/internal/payouts/request", {
            creatorId,
            amount,
            currency
        });
        return response.data;
    }
    async getRevenueSummary(from, to) {
        const response = await this.client.get("/internal/reports/revenue-summary", {
            params: { from, to }
        });
        return response.data;
    }
    async getPlatformCommission(from, to) {
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
exports.JavaFinanceClient = JavaFinanceClient;
