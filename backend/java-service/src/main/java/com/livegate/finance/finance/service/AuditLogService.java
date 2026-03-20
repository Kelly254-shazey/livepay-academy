package com.livegate.finance.finance.service;

import com.livegate.finance.finance.domain.ActorType;
import com.livegate.finance.finance.domain.AuditLog;
import com.livegate.finance.finance.repository.AuditLogRepository;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void record(String actorId, ActorType actorType, String action, String resourceType, String resourceId, String detailsJson) {
        auditLogRepository.save(
                AuditLog.builder()
                        .id(UUID.randomUUID().toString())
                        .actorId(actorId)
                        .actorType(actorType)
                        .action(action)
                        .resourceType(resourceType)
                        .resourceId(resourceId)
                        .detailsJson(detailsJson)
                        .createdAt(Instant.now())
                        .build()
        );
    }
}

