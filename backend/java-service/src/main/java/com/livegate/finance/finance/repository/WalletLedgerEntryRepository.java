package com.livegate.finance.finance.repository;

import com.livegate.finance.finance.domain.WalletLedgerEntry;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalletLedgerEntryRepository extends JpaRepository<WalletLedgerEntry, String> {
    List<WalletLedgerEntry> findByCreatorIdOrderByCreatedAtDesc(String creatorId);
}

