package com.livegate.finance.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record RequestPayoutRequest(
        @NotBlank String creatorId,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        @NotBlank String currency
) {
}

