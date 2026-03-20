"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletsService = void 0;
class WalletsService {
    javaFinanceClient;
    auditService;
    constructor(javaFinanceClient, auditService) {
        this.javaFinanceClient = javaFinanceClient;
        this.auditService = auditService;
    }
    getMyWalletSummary(creatorId) {
        return this.javaFinanceClient.getWalletSummary(creatorId);
    }
    getMyWalletLedger(creatorId) {
        return this.javaFinanceClient.getWalletLedger(creatorId);
    }
    async requestPayout(actor, amount, currency) {
        const result = await this.javaFinanceClient.requestPayout(actor.userId, amount.toFixed(2), currency);
        await this.auditService.record({
            actorId: actor.userId,
            actorRole: actor.role,
            action: "wallet.payout.requested",
            resource: "payout_request",
            resourceId: result.payoutRequestId,
            metadata: { amount, currency }
        });
        return result;
    }
}
exports.WalletsService = WalletsService;
