package com.livegate.finance.finance.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.Instant;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import com.fasterxml.jackson.databind.JsonNode;

@Entity
@Table(
    name = "session_audit_logs",
    indexes = {
        @Index(name = "idx_user_session", columnList = "user_id,session_id"),
        @Index(name = "idx_created_at", columnList = "created_at")
    }
)
public class SessionAuditLog {

    @Id
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "session_id", nullable = false)
    private String sessionId;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "country", length = 2)
    private String country; // ISO country code

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionAction action;

    @Column(nullable = false)
    private String device; // mobile, web, desktop

    @Column(name = "login_timestamp")
    private Instant loginTimestamp;

    @Column(name = "logout_timestamp")
    private Instant logoutTimestamp;

    @Column(name = "duration_seconds")
    private Long durationSeconds;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata")
    private JsonNode metadata;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public SessionAuditLog() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public SessionAction getAction() {
        return action;
    }

    public void setAction(SessionAction action) {
        this.action = action;
    }

    public String getDevice() {
        return device;
    }

    public void setDevice(String device) {
        this.device = device;
    }

    public Instant getLoginTimestamp() {
        return loginTimestamp;
    }

    public void setLoginTimestamp(Instant loginTimestamp) {
        this.loginTimestamp = loginTimestamp;
    }

    public Instant getLogoutTimestamp() {
        return logoutTimestamp;
    }

    public void setLogoutTimestamp(Instant logoutTimestamp) {
        this.logoutTimestamp = logoutTimestamp;
    }

    public Long getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(Long durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public JsonNode getMetadata() {
        return metadata;
    }

    public void setMetadata(JsonNode metadata) {
        this.metadata = metadata;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public enum SessionAction {
        LOGIN,
        LOGOUT,
        TIMEOUT,
        SUSPICIOUS_ACTIVITY,
        FAILED_LOGIN,
        MFA_VERIFIED,
        DEVICE_CHANGE
    }
}
