package com.livegate.finance.finance.repository;

import com.livegate.finance.finance.domain.PaymentTransaction;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, String> {
    Optional<PaymentTransaction> findByIdempotencyKey(String idempotencyKey);
    Optional<PaymentTransaction> findByProviderReference(String providerReference);
    List<PaymentTransaction> findByCreatorFundsReleasedAtIsNullAndRecordedAtLessThanEqual(Instant cutoff);
    List<PaymentTransaction> findByRecordedAtBetween(Instant from, Instant to);
    List<PaymentTransaction> findByCreatorIdAndRecordedAtBetween(String creatorId, Instant from, Instant to);
}
