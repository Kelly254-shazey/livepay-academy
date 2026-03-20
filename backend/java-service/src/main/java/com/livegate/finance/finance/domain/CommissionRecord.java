package com.livegate.finance.finance.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "commission_records")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommissionRecord {

    @Id
    private String id;

    @Column(nullable = false, unique = true)
    private String paymentTransactionId;

    @Column(nullable = false, precision = 5, scale = 4)
    private BigDecimal platformRate;

    @Column(nullable = false, precision = 5, scale = 4)
    private BigDecimal creatorRate;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal platformAmount;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal creatorAmount;

    @Column(nullable = false)
    private Instant createdAt;
}

