package com.livegate.finance.finance.service;

import com.livegate.finance.finance.domain.ActorType;
import com.livegate.finance.finance.domain.Adjustment;
import com.livegate.finance.finance.domain.AdjustmentType;
import com.livegate.finance.finance.domain.EntryDirection;
import com.livegate.finance.finance.domain.LedgerEntryType;
import com.livegate.finance.finance.dto.AdjustmentRequest;
import com.livegate.finance.finance.repository.AdjustmentRepository;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdjustmentService {

    private final AdjustmentRepository adjustmentRepository;
    private final WalletService walletService;
    private final AuditLogService auditLogService;

    @Transactional
    public Adjustment apply(AdjustmentRequest request) {
        Adjustment adjustment = adjustmentRepository.save(
                Adjustment.builder()
                        .id(UUID.randomUUID().toString())
                        .creatorId(request.creatorId())
                        .paymentTransactionId(request.paymentTransactionId())
                        .amount(request.amount())
                        .currency(request.currency())
                        .type(request.type())
                        .reason(request.reason())
                        .createdAt(Instant.now())
                        .build()
        );

        EntryDirection direction = request.type() == AdjustmentType.MANUAL_CREDIT
                ? EntryDirection.CREDIT
                : EntryDirection.DEBIT;
        LedgerEntryType ledgerEntryType = request.type() == AdjustmentType.MANUAL_CREDIT
                ? LedgerEntryType.ADJUSTMENT_CREDIT
                : LedgerEntryType.ADJUSTMENT_DEBIT;

        walletService.applyAdjustment(
                request.creatorId(),
                request.amount(),
                request.currency(),
                ledgerEntryType,
                direction,
                adjustment.getId(),
                request.reason()
        );

        auditLogService.record(
                request.creatorId(),
                ActorType.ADMIN,
                "adjustment.applied",
                "adjustment",
                adjustment.getId(),
                "{\"type\":\"" + request.type().name() + "\"}"
        );
        return adjustment;
    }
}

