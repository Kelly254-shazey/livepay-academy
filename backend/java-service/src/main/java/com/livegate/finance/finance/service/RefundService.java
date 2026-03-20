package com.livegate.finance.finance.service;

import com.livegate.finance.common.ApiException;
import com.livegate.finance.finance.domain.ActorType;
import com.livegate.finance.finance.domain.PaymentStatus;
import com.livegate.finance.finance.domain.PaymentTransaction;
import com.livegate.finance.finance.domain.Refund;
import com.livegate.finance.finance.domain.RefundStatus;
import com.livegate.finance.finance.dto.CommissionBreakdownResponse;
import com.livegate.finance.finance.dto.ProcessRefundRequest;
import com.livegate.finance.finance.repository.PaymentTransactionRepository;
import com.livegate.finance.finance.repository.RefundRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RefundService {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final RefundRepository refundRepository;
    private final CommissionService commissionService;
    private final WalletService walletService;
    private final AuditLogService auditLogService;

    @Transactional
    public Refund process(ProcessRefundRequest request) {
        PaymentTransaction paymentTransaction = paymentTransactionRepository.findById(request.paymentTransactionId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment transaction not found."));

        BigDecimal alreadyRefunded = refundRepository.totalRefundedForPayment(paymentTransaction.getId());
        BigDecimal newTotal = alreadyRefunded.add(request.amount());
        if (newTotal.compareTo(paymentTransaction.getGrossAmount()) > 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Refund amount exceeds the original transaction.");
        }

        CommissionBreakdownResponse breakdown = commissionService.calculate(request.amount());
        Refund refund = refundRepository.save(
                Refund.builder()
                        .id(UUID.randomUUID().toString())
                        .paymentTransactionId(paymentTransaction.getId())
                        .creatorId(paymentTransaction.getCreatorId())
                        .amount(request.amount())
                        .currency(paymentTransaction.getCurrency())
                        .status(RefundStatus.PROCESSED)
                        .reason(request.reason())
                        .processedAt(Instant.now())
                        .build()
        );

        walletService.debitForRefund(paymentTransaction, refund.getId(), breakdown.creatorShareAmount());
        paymentTransaction.setStatus(
                newTotal.compareTo(paymentTransaction.getGrossAmount()) == 0
                        ? PaymentStatus.REFUNDED
                        : PaymentStatus.ADJUSTED
        );
        paymentTransactionRepository.save(paymentTransaction);

        auditLogService.record(
                paymentTransaction.getBuyerId(),
                ActorType.NODE_SERVICE,
                "refund.processed",
                "refund",
                refund.getId(),
                "{\"paymentTransactionId\":\"" + paymentTransaction.getId() + "\"}"
        );
        return refund;
    }
}
