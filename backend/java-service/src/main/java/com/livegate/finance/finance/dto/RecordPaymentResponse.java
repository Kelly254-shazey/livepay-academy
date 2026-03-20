package com.livegate.finance.finance.dto;

import java.math.BigDecimal;

public record RecordPaymentResponse(
        String paymentTransactionId,
        String providerReference,
        String creatorId,
        String targetType,
        String targetId,
        BigDecimal grossAmount,
        BigDecimal platformCommissionAmount,
        BigDecimal creatorShareAmount,
        String currency,
        String status
) {
}

