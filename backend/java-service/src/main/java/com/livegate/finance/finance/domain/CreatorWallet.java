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
@Table(name = "creator_wallets")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatorWallet {

    @Id
    private String creatorId;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal pendingBalance;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal availableBalance;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal lifetimeGross;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal lifetimePlatformCommission;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal lifetimeCreatorEarnings;

    @Column(nullable = false)
    private Instant updatedAt;
}

