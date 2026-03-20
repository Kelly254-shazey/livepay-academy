package com.livegate.finance.finance.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "reconciliation_reports")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReconciliationReport {

    @Id
    private String id;

    @Column(nullable = false)
    private LocalDate reportDate;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal grossRevenue;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal platformCommission;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal creatorEarnings;

    @Column(nullable = false)
    private Long totalTransactions;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReconciliationStatus status;

    @Column(nullable = false)
    private Instant createdAt;
}

