package com.livegate.finance.finance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RevenueSummaryResponse(
        LocalDate from,
        LocalDate to,
        BigDecimal grossRevenue,
        BigDecimal platformCommission,
        BigDecimal creatorEarnings,
        long totalTransactions
) {
}

