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
    name = "payment_provider_configs",
    indexes = {
        @Index(name = "idx_provider_active", columnList = "provider,is_active")
    }
)
public class PaymentProviderConfig {

    @Id
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private PaymentProvider provider;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    private JsonNode countries; // List of supported countries

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    private JsonNode paymentTypes; // List of supported payment types

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    private JsonNode fees; // {"fixed": 0.30, "percentage": 2.9}

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "settings_override")
    private JsonNode settingsOverride; // Provider-specific settings

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public PaymentProviderConfig() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public PaymentProvider getProvider() {
        return provider;
    }

    public void setProvider(PaymentProvider provider) {
        this.provider = provider;
    }

    public JsonNode getCountries() {
        return countries;
    }

    public void setCountries(JsonNode countries) {
        this.countries = countries;
    }

    public JsonNode getPaymentTypes() {
        return paymentTypes;
    }

    public void setPaymentTypes(JsonNode paymentTypes) {
        this.paymentTypes = paymentTypes;
    }

    public JsonNode getFees() {
        return fees;
    }

    public void setFees(JsonNode fees) {
        this.fees = fees;
    }

    public JsonNode getSettingsOverride() {
        return settingsOverride;
    }

    public void setSettingsOverride(JsonNode settingsOverride) {
        this.settingsOverride = settingsOverride;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
