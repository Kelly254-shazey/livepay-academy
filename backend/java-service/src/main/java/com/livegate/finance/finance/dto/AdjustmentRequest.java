package com.livegate.finance.finance.dto;

import com.livegate.finance.finance.domain.AdjustmentType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record AdjustmentRequest(
        @NotBlank String creatorId,
        String paymentTransactionId,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        @NotBlank String currency,
        @NotNull AdjustmentType type,
        @NotBlank String reason
) {
}

