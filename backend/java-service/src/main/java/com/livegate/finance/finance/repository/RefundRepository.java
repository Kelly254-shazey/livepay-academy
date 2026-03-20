package com.livegate.finance.finance.repository;

import com.livegate.finance.finance.domain.Refund;
import java.math.BigDecimal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefundRepository extends JpaRepository<Refund, String> {
    @Query("select coalesce(sum(r.amount), 0) from Refund r where r.paymentTransactionId = :paymentTransactionId")
    BigDecimal totalRefundedForPayment(@Param("paymentTransactionId") String paymentTransactionId);
}

