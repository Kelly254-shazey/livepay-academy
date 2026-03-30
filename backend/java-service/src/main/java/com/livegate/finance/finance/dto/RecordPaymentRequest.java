package com.livegate.finance.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record RecordPaymentRequest(
        @NotBlank String buyerId,
        @NotBlank String creatorId,
        @NotBlank String targetType,
        @NotBlank String targetId,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        @NotBlank @Pattern(regexp = "^[A-Z]{3}$") String currency,
        @NotBlank @Size(min = 8, max = 120)
        @Pattern(regexp = "^[A-Za-z0-9](?:[A-Za-z0-9._:-]{6,118}[A-Za-z0-9])?$") String providerReference,
        @NotBlank @Size(min = 8, max = 120)
        @Pattern(regexp = "^[A-Za-z0-9](?:[A-Za-z0-9._:-]{6,118}[A-Za-z0-9])?$") String idempotencyKey
) {
}
