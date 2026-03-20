package com.livegate.finance.finance.service;

import com.livegate.finance.finance.domain.PaymentTransaction;
import com.livegate.finance.finance.dto.RevenueSummaryResponse;
import com.livegate.finance.finance.repository.PaymentTransactionRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReportingService {

    private final PaymentTransactionRepository paymentTransactionRepository;

    public RevenueSummaryResponse revenueSummary(LocalDate from, LocalDate to) {
        List<PaymentTransaction> transactions = paymentTransactionRepository.findByRecordedAtBetween(
                from.atStartOfDay().toInstant(ZoneOffset.UTC),
                to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC).minusSeconds(1)
        );
        return summarize(from, to, transactions);
    }

    public RevenueSummaryResponse creatorEarnings(String creatorId, LocalDate from, LocalDate to) {
        List<PaymentTransaction> transactions = paymentTransactionRepository.findByCreatorIdAndRecordedAtBetween(
                creatorId,
                from.atStartOfDay().toInstant(ZoneOffset.UTC),
                to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC).minusSeconds(1)
        );
        return summarize(from, to, transactions);
    }

    public RevenueSummaryResponse platformCommission(LocalDate from, LocalDate to) {
        return revenueSummary(from, to);
    }

    private RevenueSummaryResponse summarize(LocalDate from, LocalDate to, List<PaymentTransaction> transactions) {
        BigDecimal gross = transactions.stream().map(PaymentTransaction::getGrossAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal commission = transactions.stream().map(PaymentTransaction::getPlatformCommissionAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal creator = transactions.stream().map(PaymentTransaction::getCreatorShareAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new RevenueSummaryResponse(from, to, gross, commission, creator, transactions.size());
    }
}

