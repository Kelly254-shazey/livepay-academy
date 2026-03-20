package com.livegate.finance.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "livegate")
public record FinanceProperties(
        @NotBlank String internalApiKey,
        @NotNull BigDecimal platformCommissionRate,
        @NotNull BigDecimal creatorShareRate,
        int payoutHoldDays
) {
}

