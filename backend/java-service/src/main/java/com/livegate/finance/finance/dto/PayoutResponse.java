package com.livegate.finance.finance.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record PayoutResponse(
        String payoutRequestId,
        String creatorId,
        BigDecimal amount,
        String currency,
        String status,
        Instant holdUntil
) {
}
