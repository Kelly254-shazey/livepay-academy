package com.livegate.finance.finance.repository;

import com.livegate.finance.finance.domain.PayoutRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PayoutRequestRepository extends JpaRepository<PayoutRequest, String> {
}

