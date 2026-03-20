import { AuditService } from "../../common/audit/audit.service";
import { JavaFinanceClient } from "../../infrastructure/integrations/java-finance.client";

export class WalletsService {
  constructor(
    private readonly javaFinanceClient: JavaFinanceClient,
    private readonly auditService: AuditService
  ) {}

  getMyWalletSummary(creatorId: string) {
    return this.javaFinanceClient.getWalletSummary(creatorId);
  }

  getMyWalletLedger(creatorId: string) {
    return this.javaFinanceClient.getWalletLedger(creatorId);
  }

  async requestPayout(actor: { userId: string; role: "creator" | "admin" }, amount: number, currency: string) {
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

