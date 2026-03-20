package com.livegate.finance.finance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ReconciliationResponse(
        String reportId,
        LocalDate cutoffDate,
        BigDecimal releasedCreatorFunds,
        long settledTransactions,
        String status
) {
}
