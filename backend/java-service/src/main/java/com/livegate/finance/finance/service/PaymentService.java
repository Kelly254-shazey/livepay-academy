package com.livegate.finance.finance.service;

import com.livegate.finance.common.ApiException;
import com.livegate.finance.finance.domain.ActorType;
import com.livegate.finance.finance.domain.CommissionRecord;
import com.livegate.finance.finance.domain.PaymentStatus;
import com.livegate.finance.finance.domain.PaymentTransaction;
import com.livegate.finance.finance.dto.CommissionBreakdownResponse;
import com.livegate.finance.finance.dto.RecordPaymentRequest;
import com.livegate.finance.finance.dto.RecordPaymentResponse;
import com.livegate.finance.finance.repository.CommissionRecordRepository;
import com.livegate.finance.finance.repository.PaymentTransactionRepository;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final CommissionRecordRepository commissionRecordRepository;
    private final CommissionService commissionService;
    private final WalletService walletService;
    private final AuditLogService auditLogService;

    @Transactional
    public RecordPaymentResponse recordPayment(RecordPaymentRequest request) {
        return paymentTransactionRepository.findByIdempotencyKey(request.idempotencyKey())
                .map(this::toResponse)
                .orElseGet(() -> createPayment(request));
    }

    private RecordPaymentResponse createPayment(RecordPaymentRequest request) {
        if (paymentTransactionRepository.findByProviderReference(request.providerReference()).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Provider reference has already been recorded.");
        }

        CommissionBreakdownResponse breakdown = commissionService.calculate(request.amount());
        PaymentTransaction paymentTransaction = paymentTransactionRepository.save(
                PaymentTransaction.builder()
                        .id(UUID.randomUUID().toString())
                        .idempotencyKey(request.idempotencyKey())
                        .providerReference(request.providerReference())
                        .buyerId(request.buyerId())
                        .creatorId(request.creatorId())
                        .targetType(request.targetType())
                        .targetId(request.targetId())
                        .grossAmount(breakdown.grossAmount())
                        .platformCommissionAmount(breakdown.platformCommissionAmount())
                        .creatorShareAmount(breakdown.creatorShareAmount())
                        .currency(request.currency())
                        .status(PaymentStatus.RECORDED)
                        .recordedAt(Instant.now())
                        .build()
        );

        commissionRecordRepository.save(
                CommissionRecord.builder()
                        .id(UUID.randomUUID().toString())
                        .paymentTransactionId(paymentTransaction.getId())
                        .platformRate(breakdown.platformRate())
                        .creatorRate(breakdown.creatorRate())
                        .platformAmount(breakdown.platformCommissionAmount())
                        .creatorAmount(breakdown.creatorShareAmount())
                        .createdAt(Instant.now())
                        .build()
        );

        walletService.creditPending(paymentTransaction);
        auditLogService.record(
                request.buyerId(),
                ActorType.NODE_SERVICE,
                "payment.recorded",
                "payment_transaction",
                paymentTransaction.getId(),
                "{\"targetType\":\"" + request.targetType() + "\",\"targetId\":\"" + request.targetId() + "\"}"
        );
        return toResponse(paymentTransaction);
    }

    private RecordPaymentResponse toResponse(PaymentTransaction paymentTransaction) {
        return new RecordPaymentResponse(
                paymentTransaction.getId(),
                paymentTransaction.getProviderReference(),
                paymentTransaction.getCreatorId(),
                paymentTransaction.getTargetType(),
                paymentTransaction.getTargetId(),
                paymentTransaction.getGrossAmount(),
                paymentTransaction.getPlatformCommissionAmount(),
                paymentTransaction.getCreatorShareAmount(),
                paymentTransaction.getCurrency(),
                paymentTransaction.getStatus().name()
        );
    }
}

