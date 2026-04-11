package com.livegate.finance.finance.service;

import com.livegate.finance.config.FinanceProperties;
import com.livegate.finance.finance.dto.CommissionBreakdownResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.stereotype.Service;

@Service
public class CommissionService {

    private final FinanceProperties financeProperties;

    public CommissionService(FinanceProperties financeProperties) {
        this.financeProperties = financeProperties;
    }

    public CommissionBreakdownResponse calculate(BigDecimal grossAmount) {
        BigDecimal normalized = grossAmount.setScale(2, RoundingMode.HALF_UP);
        BigDecimal platformAmount = normalized
                .multiply(financeProperties.platformCommissionRate())
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal creatorAmount = normalized.subtract(platformAmount).setScale(2, RoundingMode.HALF_UP);
        return new CommissionBreakdownResponse(
                normalized,
                platformAmount,
                creatorAmount,
                financeProperties.platformCommissionRate(),
                financeProperties.creatorShareRate()
        );
    }
}

