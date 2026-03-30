package com.livegate.finance.finance.repository;

import com.livegate.finance.finance.domain.ContentAccessAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface ContentAccessAuditLogRepository extends JpaRepository<ContentAccessAuditLog, String> {

    List<ContentAccessAuditLog> findByUserIdOrderByCreatedAtDesc(String userId);

    Page<ContentAccessAuditLog> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    List<ContentAccessAuditLog> findByContentIdOrderByCreatedAtDesc(String contentId);

    Page<ContentAccessAuditLog> findByContentIdOrderByCreatedAtDesc(String contentId, Pageable pageable);

    @Query("SELECT cal FROM ContentAccessAuditLog cal WHERE cal.userId = :userId AND cal.contentId = :contentId ORDER BY cal.createdAt DESC")
    List<ContentAccessAuditLog> findUserContentAccess(@Param("userId") String userId, @Param("contentId") String contentId);

    @Query("SELECT COUNT(cal) FROM ContentAccessAuditLog cal WHERE cal.contentId = :contentId AND cal.isCompleted = true")
    long countCompletions(@Param("contentId") String contentId);

    @Query("SELECT cal FROM ContentAccessAuditLog cal WHERE cal.requiresPayment = true AND cal.paymentVerified = false AND cal.createdAt >= :since ORDER BY cal.createdAt DESC")
    List<ContentAccessAuditLog> findUnpaidAccess(@Param("since") Instant since);

    List<ContentAccessAuditLog> findByCreatedAtBetween(Instant start, Instant end);

    @Query("SELECT cal FROM ContentAccessAuditLog cal WHERE cal.userId = :userId AND cal.createdAt >= :since")
    List<ContentAccessAuditLog> findUserAccessesSince(@Param("userId") String userId, @Param("since") Instant since);
}
