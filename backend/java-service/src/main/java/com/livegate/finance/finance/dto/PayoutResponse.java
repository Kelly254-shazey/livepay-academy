package com.livegate.finance.finance.dto;

import java.math.BigDecimal;

public record PayoutResponse(
        String payoutRequestId,
        String creatorId,
        BigDecimal amount,
        String currency,
        String status
) {
}

