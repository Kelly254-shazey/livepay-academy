package com.livegate.finance.finance.repository;

import com.livegate.finance.finance.domain.PaymentAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface PaymentAuditLogRepository extends JpaRepository<PaymentAuditLog, String> {

    List<PaymentAuditLog> findByPaymentIdOrderByCreatedAtDesc(String paymentId);

    List<PaymentAuditLog> findByUserIdOrderByCreatedAtDesc(String userId);

    Page<PaymentAuditLog> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    List<PaymentAuditLog> findByUserIdAndCreatedAtBetween(String userId, Instant start, Instant end);

    @Query("SELECT pal FROM PaymentAuditLog pal WHERE pal.riskLevel IN ('HIGH', 'CRITICAL') AND pal.createdAt >= :since ORDER BY pal.createdAt DESC")
    List<PaymentAuditLog> findSuspiciousPayments(@Param("since") Instant since);

    @Query("SELECT pal FROM PaymentAuditLog pal WHERE pal.userId = :userId AND pal.isSuccessful = false ORDER BY pal.createdAt DESC LIMIT 5")
    List<PaymentAuditLog> findRecentFailedPayments(@Param("userId") String userId);

    @Query("SELECT COUNT(pal) FROM PaymentAuditLog pal WHERE pal.userId = :userId AND pal.createdAt >= :since AND pal.isSuccessful = false")
    long countFailedPaymentsSince(@Param("userId") String userId, @Param("since") Instant since);

    List<PaymentAuditLog> findByCityAndCreatedAtBetween(String city, Instant start, Instant end);
}
