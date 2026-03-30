package com.livegate.finance.finance.repository;

import com.livegate.finance.finance.domain.SessionAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface SessionAuditLogRepository extends JpaRepository<SessionAuditLog, String> {

    List<SessionAuditLog> findByUserIdOrderByCreatedAtDesc(String userId);

    Page<SessionAuditLog> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    List<SessionAuditLog> findByUserIdAndCreatedAtBetween(String userId, Instant start, Instant end);

    @Query("SELECT sal FROM SessionAuditLog sal WHERE sal.userId = :userId AND sal.action = 'LOGIN' ORDER BY sal.createdAt DESC LIMIT 10")
    List<SessionAuditLog> findRecentLogins(@Param("userId") String userId);

    @Query("SELECT sal FROM SessionAuditLog sal WHERE sal.action = 'SUSPICIOUS_ACTIVITY' AND sal.createdAt >= :since ORDER BY sal.createdAt DESC")
    List<SessionAuditLog> findSuspiciousActivities(@Param("since") Instant since);

    long countByUserIdAndAction(String userId, String action);
}
