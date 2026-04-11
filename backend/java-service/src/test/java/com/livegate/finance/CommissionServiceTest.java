package com.livegate.finance;

import static org.assertj.core.api.Assertions.assertThat;

import com.livegate.finance.config.FinanceProperties;
import com.livegate.finance.finance.dto.CommissionBreakdownResponse;
import com.livegate.finance.finance.service.CommissionService;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class CommissionServiceTest {

    @Test
    void calculatesPlatformAndCreatorSplit() {
        FinanceProperties props = new FinanceProperties(
                "test-api-key",
                new BigDecimal("0.20"),
                new BigDecimal("0.80"),
                7
        );
        CommissionService commissionService = new CommissionService(props);

        CommissionBreakdownResponse response = commissionService.calculate(new BigDecimal("100.00"));

        assertThat(response.platformCommissionAmount()).isEqualByComparingTo("20.00");
        assertThat(response.creatorShareAmount()).isEqualByComparingTo("80.00");
    }
}
