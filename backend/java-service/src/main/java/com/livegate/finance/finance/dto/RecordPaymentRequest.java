package com.livegate.finance.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record RecordPaymentRequest(
        @NotBlank String buyerId,
        @NotBlank String creatorId,
        @NotBlank String targetType,
        @NotBlank String targetId,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        @NotBlank String currency,
        @NotBlank String providerReference,
        @NotBlank String idempotencyKey
) {
}

