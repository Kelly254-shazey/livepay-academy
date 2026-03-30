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
    name = "content_access_audit_logs",
    indexes = {
        @Index(name = "idx_user_content", columnList = "user_id,content_id"),
        @Index(name = "idx_created_at", columnList = "created_at"),
        @Index(name = "idx_access_type", columnList = "access_type")
    }
)
public class ContentAccessAuditLog {

    @Id
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "content_id", nullable = false)
    private String contentId;

    @Column(name = "content_type", nullable = false)
    private String contentType; // course, library, video, etc

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccessType accessType;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "country", length = 2)
    private String country;

    @Column(name = "device_type")
    private String deviceType; // mobile, web, desktop

    @Column(name = "duration_seconds")
    private Long durationSeconds;

    @Column(name = "watch_progress")
    private Integer watchProgress; // 0-100 percentage

    @Column(name = "is_completed")
    private Boolean isCompleted;

    @Column(nullable = false)
    private String role; // creator, viewer, staff

    @Column(name = "requires_payment")
    private Boolean requiresPayment;

    @Column(name = "payment_verified")
    private Boolean paymentVerified;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata")
    private JsonNode metadata;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public ContentAccessAuditLog() {
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

    public String getContentId() {
        return contentId;
    }

    public void setContentId(String contentId) {
        this.contentId = contentId;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public AccessType getAccessType() {
        return accessType;
    }

    public void setAccessType(AccessType accessType) {
        this.accessType = accessType;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getDeviceType() {
        return deviceType;
    }

    public void setDeviceType(String deviceType) {
        this.deviceType = deviceType;
    }

    public Long getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(Long durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public Integer getWatchProgress() {
        return watchProgress;
    }

    public void setWatchProgress(Integer watchProgress) {
        this.watchProgress = watchProgress;
    }

    public Boolean getIsCompleted() {
        return isCompleted;
    }

    public void setIsCompleted(Boolean isCompleted) {
        this.isCompleted = isCompleted;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Boolean getRequiresPayment() {
        return requiresPayment;
    }

    public void setRequiresPayment(Boolean requiresPayment) {
        this.requiresPayment = requiresPayment;
    }

    public Boolean getPaymentVerified() {
        return paymentVerified;
    }

    public void setPaymentVerified(Boolean paymentVerified) {
        this.paymentVerified = paymentVerified;
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

    public enum AccessType {
        VIEW,
        DOWNLOAD,
        STREAM,
        PURCHASE,
        SHARE,
        REPORT,
        ANALYTICS_VIEW
    }
}
