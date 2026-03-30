package com.livegate.finance.finance.controller;

import com.livegate.finance.finance.domain.SessionAuditLog;
import com.livegate.finance.finance.domain.PaymentAuditLog;
import com.livegate.finance.finance.domain.PaymentStatus;
import com.livegate.finance.finance.domain.ContentAccessAuditLog;
import com.livegate.finance.finance.service.ComprehensiveAuditService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/audit")
public class ComprehensiveAuditController {

    private final ComprehensiveAuditService auditService;

    public ComprehensiveAuditController(ComprehensiveAuditService auditService) {
        this.auditService = auditService;
    }

    // Session Audit Endpoints
    @PostMapping("/session/record")
    public ResponseEntity<SessionAuditLog> recordSessionEvent(
            @RequestBody SessionEventRequest request,
            Authentication authentication
    ) {
        String userId = authentication.getName();
        SessionAuditLog log = auditService.recordSessionEvent(
                userId,
                request.sessionId(),
                request.action(),
                request.ipAddress(),
                request.userAgent(),
                request.country(),
                request.device()
        );
        return ResponseEntity.ok(log);
    }

    @GetMapping("/session")
    public ResponseEntity<List<SessionAuditLog>> getUserSessions(
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size,
            Authentication authentication
    ) {
        String userId = authentication.getName();
        if (page > 0 || size != 20) {
            Page<SessionAuditLog> paginated = auditService.getUserSessionsPaginated(userId, page, size);
            return ResponseEntity.ok(paginated.getContent());
        }
        return ResponseEntity.ok(auditService.getUserSessions(userId));
    }

    // Payment Audit Endpoints
    @PostMapping("/payment/record")
    public ResponseEntity<PaymentAuditLog> recordPaymentEvent(
            @RequestBody PaymentEventRequest request,
            Authentication authentication
    ) {
        String userId = authentication.getName();
        PaymentAuditLog log = auditService.recordPaymentEvent(
                request.paymentId(),
                userId,
                request.action(),
                request.status(),
                request.amount(),
                request.currency(),
                request.paymentMethod(),
                request.country(),
                request.ipAddress(),
                request.riskLevel(),
                request.isSuccessful()
        );
        return ResponseEntity.ok(log);
    }

    @GetMapping("/payment")
    public ResponseEntity<List<PaymentAuditLog>> getUserPaymentHistory(
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size,
            Authentication authentication
    ) {
        String userId = authentication.getName();
        if (page > 0 || size != 20) {
            Page<PaymentAuditLog> paginated = auditService.getUserPaymentHistoryPaginated(userId, page, size);
            return ResponseEntity.ok(paginated.getContent());
        }
        return ResponseEntity.ok(auditService.getUserPaymentHistory(userId));
    }

    @GetMapping("/payment/{paymentId}")
    public ResponseEntity<List<PaymentAuditLog>> getPaymentAuditTrail(@PathVariable String paymentId) {
        return ResponseEntity.ok(auditService.getPaymentAuditTrail(paymentId));
    }

    @GetMapping("/suspicious-payments")
    public ResponseEntity<List<PaymentAuditLog>> getSuspiciousPayments(
            @RequestParam(required = false) Long hoursAgo
    ) {
        Instant since = hoursAgo != null 
                ? Instant.now().minusSeconds(hoursAgo * 3600) 
                : Instant.now().minusSeconds(86400); // Default 24 hours
        return ResponseEntity.ok(auditService.getSuspiciousPayments(since));
    }

    // Content Access Audit Endpoints
    @PostMapping("/content/record")
    public ResponseEntity<ContentAccessAuditLog> recordContentAccess(
            @RequestBody ContentAccessRequest request,
            Authentication authentication
    ) {
        String userId = authentication.getName();
        ContentAccessAuditLog log = auditService.recordContentAccess(
                userId,
                request.contentId(),
                request.contentType(),
                request.accessType(),
                request.ipAddress(),
                request.country(),
                request.deviceType(),
                request.role(),
                request.requiresPayment(),
                request.paymentVerified()
        );
        return ResponseEntity.ok(log);
    }

    @GetMapping("/content/{contentId}")
    public ResponseEntity<List<ContentAccessAuditLog>> getContentAccessHistory(@PathVariable String contentId) {
        return ResponseEntity.ok(auditService.getContentAccessHistory(contentId));
    }

    @GetMapping("/unpaid-access")
    public ResponseEntity<List<ContentAccessAuditLog>> getUnpaidAccess(
            @RequestParam(required = false) Long hoursAgo
    ) {
        Instant since = hoursAgo != null 
                ? Instant.now().minusSeconds(hoursAgo * 3600) 
                : Instant.now().minusSeconds(86400);
        return ResponseEntity.ok(auditService.getUnpaidAccess(since));
    }

    @GetMapping("/suspicious-activities")
    public ResponseEntity<List<SessionAuditLog>> getSuspiciousActivities(
            @RequestParam(required = false) Long hoursAgo
    ) {
        Instant since = hoursAgo != null 
                ? Instant.now().minusSeconds(hoursAgo * 3600) 
                : Instant.now().minusSeconds(86400);
        return ResponseEntity.ok(auditService.getSuspiciousActivities(since));
    }

    @GetMapping("/dashboard-summary")
    public ResponseEntity<Map<String, Object>> getDashboardSummary(
            Authentication authentication
    ) {
        String userId = authentication.getName();
        long failedPayments = auditService.countFailedPaymentsSince(userId, Instant.now().minusSeconds(86400));
        
        return ResponseEntity.ok(Map.of(
                "failedPaymentsLast24h", failedPayments,
                "recentSessions", auditService.getUserSessions(userId).size(),
                "recentPayments", auditService.getUserPaymentHistory(userId).size()
        ));
    }

    // Request Records
    public record SessionEventRequest(
            String sessionId,
            SessionAuditLog.SessionAction action,
            String ipAddress,
            String userAgent,
            String country,
            String device
    ) {}

    public record PaymentEventRequest(
            String paymentId,
            PaymentAuditLog.PaymentAction action,
            PaymentStatus status,
            java.math.BigDecimal amount,
            String currency,
            String paymentMethod,
            String country,
            String ipAddress,
            PaymentAuditLog.PaymentRiskLevel riskLevel,
            Boolean isSuccessful
    ) {}

    public record ContentAccessRequest(
            String contentId,
            String contentType,
            ContentAccessAuditLog.AccessType accessType,
            String ipAddress,
            String country,
            String deviceType,
            String role,
            Boolean requiresPayment,
            Boolean paymentVerified
    ) {}
}
