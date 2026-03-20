package com.livegate.finance.finance.dto;

import java.math.BigDecimal;

public record CommissionBreakdownResponse(
        BigDecimal grossAmount,
        BigDecimal platformCommissionAmount,
        BigDecimal creatorShareAmount,
        BigDecimal platformRate,
        BigDecimal creatorRate
) {
}

