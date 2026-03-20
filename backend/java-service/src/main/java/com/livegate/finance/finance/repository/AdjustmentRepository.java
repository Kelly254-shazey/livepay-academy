package com.livegate.finance.finance.repository;

import com.livegate.finance.finance.domain.Adjustment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdjustmentRepository extends JpaRepository<Adjustment, String> {
}

