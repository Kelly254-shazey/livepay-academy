package com.livegate.finance.finance.repository;

import com.livegate.finance.finance.domain.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
}
