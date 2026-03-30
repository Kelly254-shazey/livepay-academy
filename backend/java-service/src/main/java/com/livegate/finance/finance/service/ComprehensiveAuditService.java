package com.livegate.finance.finance.service;

import com.livegate.finance.finance.domain.SessionAuditLog;
import com.livegate.finance.finance.domain.PaymentAuditLog;
import com.livegate.finance.finance.domain.PaymentStatus;
import com.livegate.finance.finance.domain.ContentAccessAuditLog;
import com.livegate.finance.finance.repository.SessionAuditLogRepository;
import com.livegate.finance.finance.repository.PaymentAuditLogRepository;
import com.livegate.finance.finance.repository.ContentAccessAuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ComprehensiveAuditService {

    private final SessionAuditLogRepository sessionAuditLogRepository;
    private final PaymentAuditLogRepository paymentAuditLogRepository;
    private final ContentAccessAuditLogRepository contentAccessAuditLogRepository;

    public ComprehensiveAuditService(
            SessionAuditLogRepository sessionAuditLogRepository,
            PaymentAuditLogRepository paymentAuditLogRepository,
            ContentAccessAuditLogRepository contentAccessAuditLogRepository
    ) {
        this.sessionAuditLogRepository = sessionAuditLogRepository;
        this.paymentAuditLogRepository = paymentAuditLogRepository;
        this.contentAccessAuditLogRepository = contentAccessAuditLogRepository;
    }

    // Session Audit Logging
    public SessionAuditLog recordSessionEvent(
            String userId,
            String sessionId,
            SessionAuditLog.SessionAction action,
            String ipAddress,
            String userAgent,
            String country,
            String device
    ) {
        SessionAuditLog log = new SessionAuditLog();
        log.setId(UUID.randomUUID().toString());
        log.setUserId(userId);
        log.setSessionId(sessionId);
        log.setAction(action);
        log.setIpAddress(ipAddress);
        log.setUserAgent(userAgent);
        log.setCountry(country);
        log.setDevice(device);
        log.setLoginTimestamp(action == SessionAuditLog.SessionAction.LOGIN ? Instant.now() : null);
        log.setCreatedAt(Instant.now());

        return sessionAuditLogRepository.save(log);
    }

    public void recordSessionLogout(String userId, String sessionId, Long durationSeconds) {
        sessionAuditLogRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(log -> log.getSessionId().equals(sessionId))
                .findFirst()
                .ifPresent(log -> {
                    log.setLogoutTimestamp(Instant.now());
                    log.setDurationSeconds(durationSeconds);
                    if (log.getAction() == null) {
                        log.setAction(SessionAuditLog.SessionAction.LOGOUT);
                    }
                    sessionAuditLogRepository.save(log);
                });
    }

    // Payment Audit Logging
    public PaymentAuditLog recordPaymentEvent(
            String paymentId,
            String userId,
            PaymentAuditLog.PaymentAction action,
            PaymentStatus status,
            BigDecimal amount,
            String currency,
            String paymentMethod,
            String country,
            String ipAddress,
            PaymentAuditLog.PaymentRiskLevel riskLevel,
            Boolean isSuccessful
    ) {
        PaymentAuditLog log = new PaymentAuditLog();
        log.setId(UUID.randomUUID().toString());
        log.setPaymentId(paymentId);
        log.setUserId(userId);
        log.setAction(action);
        log.setStatus(status);
        log.setAmount(amount);
        log.setCurrency(currency);
        log.setPaymentMethod(paymentMethod);
        log.setCountry(country);
        log.setIpAddress(ipAddress);
        log.setRiskLevel(riskLevel);
        log.setIsSuccessful(isSuccessful);
        log.setCreatedAt(Instant.now());

        return paymentAuditLogRepository.save(log);
    }

    public void updatePaymentAuditStatus(
            String paymentId,
            PaymentStatus status,
            String providerReference,
            Double fraudScore,
            String errorMessage
    ) {
        paymentAuditLogRepository.findByPaymentIdOrderByCreatedAtDesc(paymentId).stream()
                .findFirst()
                .ifPresent(log -> {
                    log.setStatus(status);
                    log.setProviderReference(providerReference);
                    log.setFraudScore(fraudScore);
                    log.setErrorMessage(errorMessage);
                    paymentAuditLogRepository.save(log);
                });
    }

    // Content Access Audit Logging
    public ContentAccessAuditLog recordContentAccess(
            String userId,
            String contentId,
            String contentType,
            ContentAccessAuditLog.AccessType accessType,
            String ipAddress,
            String country,
            String deviceType,
            String role,
            Boolean requiresPayment,
            Boolean paymentVerified
    ) {
        ContentAccessAuditLog log = new ContentAccessAuditLog();
        log.setId(UUID.randomUUID().toString());
        log.setUserId(userId);
        log.setContentId(contentId);
        log.setContentType(contentType);
        log.setAccessType(accessType);
        log.setIpAddress(ipAddress);
        log.setCountry(country);
        log.setDeviceType(deviceType);
        log.setRole(role);
        log.setRequiresPayment(requiresPayment);
        log.setPaymentVerified(paymentVerified);
        log.setCreatedAt(Instant.now());

        return contentAccessAuditLogRepository.save(log);
    }

    public void updateContentAccessCompletion(String userId, String contentId, Integer progress, Boolean isCompleted) {
        contentAccessAuditLogRepository.findUserContentAccess(userId, contentId).stream()
                .findFirst()
                .ifPresent(log -> {
                    log.setWatchProgress(progress);
                    log.setIsCompleted(isCompleted);
                    contentAccessAuditLogRepository.save(log);
                });
    }

    // Query Methods
    public List<SessionAuditLog> getUserSessions(String userId) {
        return sessionAuditLogRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Page<SessionAuditLog> getUserSessionsPaginated(String userId, int page, int size) {
        return sessionAuditLogRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));
    }

    public List<PaymentAuditLog> getUserPaymentHistory(String userId) {
        return paymentAuditLogRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Page<PaymentAuditLog> getUserPaymentHistoryPaginated(String userId, int page, int size) {
        return paymentAuditLogRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));
    }

    public List<PaymentAuditLog> getSuspiciousPayments(Instant since) {
        return paymentAuditLogRepository.findSuspiciousPayments(since);
    }

    public List<SessionAuditLog> getSuspiciousActivities(Instant since) {
        return sessionAuditLogRepository.findSuspiciousActivities(since);
    }

    public List<ContentAccessAuditLog> getUnpaidAccess(Instant since) {
        return contentAccessAuditLogRepository.findUnpaidAccess(since);
    }

    public long countFailedPaymentsSince(String userId, Instant since) {
        return paymentAuditLogRepository.countFailedPaymentsSince(userId, since);
    }

    public long countContentCompletions(String contentId) {
        return contentAccessAuditLogRepository.countCompletions(contentId);
    }

    public List<ContentAccessAuditLog> getContentAccessHistory(String contentId) {
        return contentAccessAuditLogRepository.findByContentIdOrderByCreatedAtDesc(contentId);
    }

    public List<PaymentAuditLog> getPaymentAuditTrail(String paymentId) {
        return paymentAuditLogRepository.findByPaymentIdOrderByCreatedAtDesc(paymentId);
    }
}
