package com.livegate.finance.finance.repository;

import com.livegate.finance.finance.domain.CommissionRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommissionRecordRepository extends JpaRepository<CommissionRecord, String> {
}

