package com.livegate.finance.finance.service;

import com.livegate.finance.finance.domain.ActorType;
import com.livegate.finance.finance.domain.PaymentTransaction;
import com.livegate.finance.finance.domain.ReconciliationReport;
import com.livegate.finance.finance.domain.ReconciliationStatus;
import com.livegate.finance.finance.dto.ReconciliationRequest;
import com.livegate.finance.finance.dto.ReconciliationResponse;
import com.livegate.finance.finance.repository.PaymentTransactionRepository;
import com.livegate.finance.finance.repository.ReconciliationReportRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReconciliationService {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final ReconciliationReportRepository reconciliationReportRepository;
    private final WalletService walletService;
    private final AuditLogService auditLogService;

    @Transactional
    public ReconciliationResponse run(ReconciliationRequest request) {
        Instant cutoff = request.cutoffDate()
                .plusDays(1)
                .atStartOfDay()
                .toInstant(ZoneOffset.UTC)
                .minusSeconds(1);
        List<PaymentTransaction> pendingTransactions =
                paymentTransactionRepository.findByCreatorFundsReleasedAtIsNullAndRecordedAtLessThanEqual(cutoff);

        BigDecimal releasedCreatorFunds = BigDecimal.ZERO.setScale(2);
        for (PaymentTransaction paymentTransaction : pendingTransactions) {
            walletService.releasePendingToAvailable(paymentTransaction);
            paymentTransaction.setCreatorFundsReleasedAt(Instant.now());
            paymentTransactionRepository.save(paymentTransaction);
            releasedCreatorFunds = releasedCreatorFunds.add(paymentTransaction.getCreatorShareAmount());
        }

        ReconciliationReport report = reconciliationReportRepository.save(
                ReconciliationReport.builder()
                        .id(UUID.randomUUID().toString())
                        .reportDate(request.cutoffDate())
                        .grossRevenue(pendingTransactions.stream().map(PaymentTransaction::getGrossAmount).reduce(BigDecimal.ZERO, BigDecimal::add))
                        .platformCommission(pendingTransactions.stream().map(PaymentTransaction::getPlatformCommissionAmount).reduce(BigDecimal.ZERO, BigDecimal::add))
                        .creatorEarnings(releasedCreatorFunds)
                        .totalTransactions((long) pendingTransactions.size())
                        .status(ReconciliationStatus.COMPLETED)
                        .createdAt(Instant.now())
                        .build()
        );

        auditLogService.record(
                "system",
                ActorType.SYSTEM,
                "reconciliation.completed",
                "reconciliation_report",
                report.getId(),
                Map.of("cutoffDate", request.cutoffDate())
        );

        return new ReconciliationResponse(
                report.getId(),
                request.cutoffDate(),
                releasedCreatorFunds,
                pendingTransactions.size(),
                report.getStatus().name()
        );
    }
}
