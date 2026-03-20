package com.livegate.finance.finance.repository;

import com.livegate.finance.finance.domain.PayoutTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PayoutTransactionRepository extends JpaRepository<PayoutTransaction, String> {
}

