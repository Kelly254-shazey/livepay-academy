package com.livegate.finance.finance.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "payment_transactions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentTransaction {

    @Id
    private String id;

    @Column(nullable = false, unique = true)
    private String idempotencyKey;

    @Column(nullable = false, unique = true)
    private String providerReference;

    @Column(nullable = false)
    private String buyerId;

    @Column(nullable = false)
    private String creatorId;

    @Column(nullable = false)
    private String targetType;

    @Column(nullable = false)
    private String targetId;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal grossAmount;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal platformCommissionAmount;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal creatorShareAmount;

    @Column(nullable = false, length = 3)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;

    @Column(nullable = false)
    private Instant recordedAt;

    private Instant creatorFundsReleasedAt;
}

