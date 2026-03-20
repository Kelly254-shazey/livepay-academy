package com.livegate.finance.finance.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ReconciliationRequest(
        @NotNull LocalDate cutoffDate
) {
}

