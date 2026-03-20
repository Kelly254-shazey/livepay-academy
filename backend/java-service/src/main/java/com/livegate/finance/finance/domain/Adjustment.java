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
@Table(name = "adjustments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Adjustment {

    @Id
    private String id;

    @Column(nullable = false)
    private String creatorId;

    private String paymentTransactionId;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AdjustmentType type;

    @Column(nullable = false)
    private String reason;

    @Column(nullable = false)
    private Instant createdAt;
}

