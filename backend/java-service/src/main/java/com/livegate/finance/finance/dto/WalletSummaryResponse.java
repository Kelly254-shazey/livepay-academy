package com.livegate.finance.finance.dto;

import java.math.BigDecimal;

public record WalletSummaryResponse(
        String creatorId,
        String currency,
        BigDecimal pendingBalance,
        BigDecimal availableBalance,
        BigDecimal lifetimeGross,
        BigDecimal lifetimePlatformCommission,
        BigDecimal lifetimeCreatorEarnings
) {
}

