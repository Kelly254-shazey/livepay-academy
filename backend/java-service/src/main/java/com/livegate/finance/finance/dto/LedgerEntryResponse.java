package com.livegate.finance.finance.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record LedgerEntryResponse(
        String id,
        String entryType,
        String balanceBucket,
        String direction,
        BigDecimal amount,
        BigDecimal balanceAfter,
        String description,
        Instant createdAt
) {
}

