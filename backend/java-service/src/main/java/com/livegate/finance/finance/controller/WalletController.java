package com.livegate.finance.finance.controller;

import com.livegate.finance.finance.dto.LedgerEntryResponse;
import com.livegate.finance.finance.dto.WalletSummaryResponse;
import com.livegate.finance.finance.service.WalletService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/wallets")
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @GetMapping("/{creatorId}")
    public WalletSummaryResponse getWallet(@PathVariable String creatorId) {
        return walletService.getWalletSummary(creatorId);
    }

    @GetMapping("/{creatorId}/ledger")
    public List<LedgerEntryResponse> getLedger(@PathVariable String creatorId) {
        return walletService.getLedger(creatorId);
    }
}

