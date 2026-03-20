package com.livegate.finance.finance.service;

import com.livegate.finance.finance.domain.AuditLog;
import com.livegate.finance.finance.repository.AuditLogRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditQueryService {

    private final AuditLogRepository auditLogRepository;

    public List<AuditLog> listAuditLogs() {
        return auditLogRepository.findAll()
                .stream()
                .sorted((left, right) -> right.getCreatedAt().compareTo(left.getCreatedAt()))
                .toList();
    }
}

