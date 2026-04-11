package com.livegate.finance.finance.service;

import com.livegate.finance.common.ApiException;
import com.livegate.finance.config.FinanceProperties;
import com.livegate.finance.finance.domain.ActorType;
import com.livegate.finance.finance.domain.PayoutRequest;
import com.livegate.finance.finance.domain.PayoutStatus;
import com.livegate.finance.finance.domain.PayoutTransaction;
import com.livegate.finance.finance.dto.PayoutDecisionRequest;
import com.livegate.finance.finance.dto.PayoutResponse;
import com.livegate.finance.finance.dto.RequestPayoutRequest;
import com.livegate.finance.finance.repository.PayoutRequestRepository;
import com.livegate.finance.finance.repository.PayoutTransactionRepository;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PayoutService {

    private final PayoutRequestRepository payoutRequestRepository;
    private final PayoutTransactionRepository payoutTransactionRepository;
    private final WalletService walletService;
    private final AuditLogService auditLogService;
    private final FinanceProperties financeProperties;

    @Transactional
    public PayoutResponse requestPayout(RequestPayoutRequest request) {
        walletService.ensureAvailableBalance(request.creatorId(), request.amount(), request.currency());
        Instant requestedAt = Instant.now();
        Instant holdUntil = requestedAt.plusSeconds(Math.max(financeProperties.payoutHoldDays(), 0) * 86_400L);
        PayoutRequest payoutRequest = payoutRequestRepository.save(
                PayoutRequest.builder()
                        .id(UUID.randomUUID().toString())
                        .creatorId(request.creatorId())
                        .amount(request.amount())
                        .currency(request.currency())
                        .status(PayoutStatus.PENDING)
                        .requestedAt(requestedAt)
                        .holdUntil(holdUntil)
                        .build()
        );

        auditLogService.record(
                request.creatorId(),
                ActorType.NODE_SERVICE,
                "payout.requested",
                "payout_request",
                payoutRequest.getId(),
                Map.of(
                        "amount", request.amount(),
                        "currency", request.currency()
                )
        );
        return toResponse(payoutRequest);
    }

    @Transactional
    public PayoutResponse approve(String payoutRequestId, PayoutDecisionRequest request) {
        PayoutRequest payoutRequest = payoutRequestRepository.findById(payoutRequestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payout request not found."));

        if (payoutRequest.getStatus() != PayoutStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "Payout request is no longer pending.");
        }
        if (payoutRequest.getHoldUntil() != null && Instant.now().isBefore(payoutRequest.getHoldUntil())) {
            throw new ApiException(HttpStatus.CONFLICT, "Payout request is still within the configured hold period.");
        }

        walletService.debitAvailableForPayout(
                payoutRequest.getCreatorId(),
                payoutRequest.getAmount(),
                payoutRequest.getCurrency(),
                payoutRequest.getId()
        );

        payoutRequest.setStatus(PayoutStatus.PROCESSED);
        payoutRequest.setApprovedAt(Instant.now());
        payoutRequest.setProcessedAt(Instant.now());
        payoutRequestRepository.save(payoutRequest);

        payoutTransactionRepository.save(
                PayoutTransaction.builder()
                        .id(UUID.randomUUID().toString())
                        .payoutRequestId(payoutRequest.getId())
                        .creatorId(payoutRequest.getCreatorId())
                        .amount(payoutRequest.getAmount())
                        .currency(payoutRequest.getCurrency())
                        .providerReference(
                                request.providerReference() == null || request.providerReference().isBlank()
                                        ? "payout-" + payoutRequest.getId()
                                        : request.providerReference()
                        )
                        .status(PayoutStatus.PROCESSED)
                        .processedAt(Instant.now())
                        .build()
        );

        auditLogService.record(
                payoutRequest.getCreatorId(),
                ActorType.ADMIN,
                "payout.approved",
                "payout_request",
                payoutRequest.getId(),
                Map.of(
                        "reason", request.reason() == null ? "" : request.reason(),
                        "providerReference", request.providerReference() == null ? "" : request.providerReference()
                )
        );
        return toResponse(payoutRequest);
    }

    @Transactional
    public PayoutResponse reject(String payoutRequestId, PayoutDecisionRequest request) {
        PayoutRequest payoutRequest = payoutRequestRepository.findById(payoutRequestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payout request not found."));

        if (payoutRequest.getStatus() != PayoutStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "Payout request is no longer pending.");
        }

        payoutRequest.setStatus(PayoutStatus.REJECTED);
        payoutRequest.setRejectedAt(Instant.now());
        payoutRequest.setRejectionReason(request.reason());
        payoutRequestRepository.save(payoutRequest);

        auditLogService.record(
                payoutRequest.getCreatorId(),
                ActorType.ADMIN,
                "payout.rejected",
                "payout_request",
                payoutRequest.getId(),
                Map.of("reason", request.reason() == null ? "" : request.reason())
        );
        return toResponse(payoutRequest);
    }

    private PayoutResponse toResponse(PayoutRequest payoutRequest) {
        return new PayoutResponse(
                payoutRequest.getId(),
                payoutRequest.getCreatorId(),
                payoutRequest.getAmount(),
                payoutRequest.getCurrency(),
                payoutRequest.getStatus().name(),
                payoutRequest.getHoldUntil()
        );
    }
}
