package com.livegate.finance.finance.controller;

import com.livegate.finance.finance.domain.AuditLog;
import com.livegate.finance.finance.service.AuditQueryService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/audit-logs")
public class AuditController {

    private final AuditQueryService auditQueryService;

    public AuditController(AuditQueryService auditQueryService) {
        this.auditQueryService = auditQueryService;
    }

    @GetMapping
    public List<AuditLog> listAuditLogs() {
        return auditQueryService.listAuditLogs();
    }
}

