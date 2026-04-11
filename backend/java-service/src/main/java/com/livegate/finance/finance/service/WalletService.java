package com.livegate.finance.finance.service;

import com.livegate.finance.common.ApiException;
import com.livegate.finance.finance.domain.BalanceBucket;
import com.livegate.finance.finance.domain.CreatorWallet;
import com.livegate.finance.finance.domain.EntryDirection;
import com.livegate.finance.finance.domain.LedgerEntryType;
import com.livegate.finance.finance.domain.PaymentTransaction;
import com.livegate.finance.finance.domain.WalletLedgerEntry;
import com.livegate.finance.finance.dto.LedgerEntryResponse;
import com.livegate.finance.finance.dto.WalletSummaryResponse;
import com.livegate.finance.finance.repository.CreatorWalletRepository;
import com.livegate.finance.finance.repository.WalletLedgerEntryRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final CreatorWalletRepository creatorWalletRepository;
    private final WalletLedgerEntryRepository walletLedgerEntryRepository;

    @Transactional
    public WalletSummaryResponse creditPending(PaymentTransaction paymentTransaction) {
        CreatorWallet wallet = getOrCreateWallet(paymentTransaction.getCreatorId(), paymentTransaction.getCurrency());
        wallet.setPendingBalance(wallet.getPendingBalance().add(paymentTransaction.getCreatorShareAmount()));
        wallet.setLifetimeGross(wallet.getLifetimeGross().add(paymentTransaction.getGrossAmount()));
        wallet.setLifetimePlatformCommission(wallet.getLifetimePlatformCommission().add(paymentTransaction.getPlatformCommissionAmount()));
        wallet.setLifetimeCreatorEarnings(wallet.getLifetimeCreatorEarnings().add(paymentTransaction.getCreatorShareAmount()));
        wallet.setUpdatedAt(Instant.now());
        creatorWalletRepository.save(wallet);

        saveLedger(
                wallet,
                paymentTransaction.getCreatorShareAmount(),
                wallet.getPendingBalance(),
                LedgerEntryType.PAYMENT_PENDING,
                BalanceBucket.PENDING,
                EntryDirection.CREDIT,
                "Creator share placed into pending balance.",
                paymentTransaction.getId(),
                null,
                null,
                null
        );
        return toSummary(wallet);
    }

    @Transactional
    public void releasePendingToAvailable(PaymentTransaction paymentTransaction) {
        CreatorWallet wallet = getOrCreateWallet(paymentTransaction.getCreatorId(), paymentTransaction.getCurrency());
        wallet.setPendingBalance(wallet.getPendingBalance().subtract(paymentTransaction.getCreatorShareAmount()));
        wallet.setAvailableBalance(wallet.getAvailableBalance().add(paymentTransaction.getCreatorShareAmount()));
        wallet.setUpdatedAt(Instant.now());
        creatorWalletRepository.save(wallet);

        saveLedger(
                wallet,
                paymentTransaction.getCreatorShareAmount(),
                wallet.getAvailableBalance(),
                LedgerEntryType.FUNDS_RELEASED,
                BalanceBucket.AVAILABLE,
                EntryDirection.CREDIT,
                "Creator funds released from pending to available.",
                paymentTransaction.getId(),
                null,
                null,
                null
        );
    }

    @Transactional
    public void debitAvailableForPayout(String creatorId, BigDecimal amount, String currency, String payoutRequestId) {
        CreatorWallet wallet = getOrCreateWallet(creatorId, currency);
        if (wallet.getAvailableBalance().compareTo(amount) < 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Insufficient available balance for payout.");
        }

        wallet.setAvailableBalance(wallet.getAvailableBalance().subtract(amount));
        wallet.setUpdatedAt(Instant.now());
        creatorWalletRepository.save(wallet);

        saveLedger(
                wallet,
                amount,
                wallet.getAvailableBalance(),
                LedgerEntryType.PAYOUT_SENT,
                BalanceBucket.AVAILABLE,
                EntryDirection.DEBIT,
                "Approved payout sent from available balance.",
                null,
                payoutRequestId,
                null,
                null
        );
    }

    @Transactional
    public void debitForRefund(PaymentTransaction paymentTransaction, String refundId, BigDecimal creatorShareToReverse) {
        CreatorWallet wallet = getOrCreateWallet(paymentTransaction.getCreatorId(), paymentTransaction.getCurrency());
        BalanceBucket bucket = paymentTransaction.getCreatorFundsReleasedAt() == null ? BalanceBucket.PENDING : BalanceBucket.AVAILABLE;

        if (bucket == BalanceBucket.PENDING) {
            if (wallet.getPendingBalance().compareTo(creatorShareToReverse) < 0) {
                throw new ApiException(HttpStatus.CONFLICT, "Pending balance cannot absorb refund.");
            }
            wallet.setPendingBalance(wallet.getPendingBalance().subtract(creatorShareToReverse));
            saveLedger(
                    wallet,
                    creatorShareToReverse,
                    wallet.getPendingBalance(),
                    LedgerEntryType.REFUND_DEBIT,
                    BalanceBucket.PENDING,
                    EntryDirection.DEBIT,
                    "Refund reversed creator share from pending balance.",
                    paymentTransaction.getId(),
                    null,
                    refundId,
                    null
            );
        } else {
            if (wallet.getAvailableBalance().compareTo(creatorShareToReverse) < 0) {
                throw new ApiException(HttpStatus.CONFLICT, "Available balance cannot absorb refund.");
            }
            wallet.setAvailableBalance(wallet.getAvailableBalance().subtract(creatorShareToReverse));
            saveLedger(
                    wallet,
                    creatorShareToReverse,
                    wallet.getAvailableBalance(),
                    LedgerEntryType.REFUND_DEBIT,
                    BalanceBucket.AVAILABLE,
                    EntryDirection.DEBIT,
                    "Refund reversed creator share from available balance.",
                    paymentTransaction.getId(),
                    null,
                    refundId,
                    null
            );
        }

        wallet.setUpdatedAt(Instant.now());
        creatorWalletRepository.save(wallet);
    }

    @Transactional
    public void applyAdjustment(String creatorId, BigDecimal amount, String currency, LedgerEntryType entryType, EntryDirection direction, String adjustmentId, String description) {
        CreatorWallet wallet = getOrCreateWallet(creatorId, currency);
        if (direction == EntryDirection.CREDIT) {
            wallet.setAvailableBalance(wallet.getAvailableBalance().add(amount));
        } else {
            if (wallet.getAvailableBalance().compareTo(amount) < 0) {
                throw new ApiException(HttpStatus.CONFLICT, "Available balance cannot absorb debit adjustment.");
            }
            wallet.setAvailableBalance(wallet.getAvailableBalance().subtract(amount));
        }

        wallet.setUpdatedAt(Instant.now());
        creatorWalletRepository.save(wallet);

        saveLedger(
                wallet,
                amount,
                wallet.getAvailableBalance(),
                entryType,
                BalanceBucket.AVAILABLE,
                direction,
                description,
                null,
                null,
                null,
                adjustmentId
        );
    }

    public WalletSummaryResponse getWalletSummary(String creatorId) {
        return creatorWalletRepository.findById(creatorId)
                .map(this::toSummary)
                .orElseGet(() -> toSummary(getOrCreateWallet(creatorId, "USD")));
    }

    public void ensureAvailableBalance(String creatorId, BigDecimal amount, String currency) {
        CreatorWallet wallet = getOrCreateWallet(creatorId, currency);
        if (wallet.getAvailableBalance().compareTo(amount) < 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Requested payout exceeds available balance.");
        }
    }

    public List<LedgerEntryResponse> getLedger(String creatorId) {
        return walletLedgerEntryRepository.findByCreatorIdOrderByCreatedAtDesc(creatorId)
                .stream()
                .map(entry -> new LedgerEntryResponse(
                        entry.getId(),
                        entry.getEntryType().name(),
                        entry.getBalanceBucket().name(),
                        entry.getDirection().name(),
                        entry.getAmount(),
                        entry.getBalanceAfter(),
                        entry.getDescription(),
                        entry.getCreatedAt()
                ))
                .toList();
    }

    private CreatorWallet getOrCreateWallet(String creatorId, String currency) {
        return creatorWalletRepository.findById(creatorId)
                .orElseGet(() -> creatorWalletRepository.save(
                        CreatorWallet.builder()
                                .creatorId(creatorId)
                                .currency(currency)
                                .pendingBalance(BigDecimal.ZERO.setScale(2))
                                .availableBalance(BigDecimal.ZERO.setScale(2))
                                .lifetimeGross(BigDecimal.ZERO.setScale(2))
                                .lifetimePlatformCommission(BigDecimal.ZERO.setScale(2))
                                .lifetimeCreatorEarnings(BigDecimal.ZERO.setScale(2))
                                .updatedAt(Instant.now())
                                .build()
                ));
    }

    private void saveLedger(
            CreatorWallet wallet,
            BigDecimal amount,
            BigDecimal balanceAfter,
            LedgerEntryType entryType,
            BalanceBucket balanceBucket,
            EntryDirection direction,
            String description,
            String paymentTransactionId,
            String payoutRequestId,
            String refundId,
            String adjustmentId
    ) {
        walletLedgerEntryRepository.save(
                WalletLedgerEntry.builder()
                        .id(UUID.randomUUID().toString())
                        .creatorId(wallet.getCreatorId())
                        .paymentTransactionId(paymentTransactionId)
                        .payoutRequestId(payoutRequestId)
                        .refundId(refundId)
                        .adjustmentId(adjustmentId)
                        .entryType(entryType)
                        .balanceBucket(balanceBucket)
                        .direction(direction)
                        .amount(amount)
                        .balanceAfter(balanceAfter)
                        .description(description)
                        .createdAt(Instant.now())
                        .build()
        );
    }

    private WalletSummaryResponse toSummary(CreatorWallet wallet) {
        return new WalletSummaryResponse(
                wallet.getCreatorId(),
                wallet.getCurrency(),
                wallet.getPendingBalance(),
                wallet.getAvailableBalance(),
                wallet.getLifetimeGross(),
                wallet.getLifetimePlatformCommission(),
                wallet.getLifetimeCreatorEarnings()
        );
    }
}
