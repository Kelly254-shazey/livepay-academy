package com.livegate.finance.finance.controller;

import com.livegate.finance.finance.dto.ReconciliationRequest;
import com.livegate.finance.finance.dto.ReconciliationResponse;
import com.livegate.finance.finance.service.ReconciliationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/reconciliation")
public class ReconciliationController {

    private final ReconciliationService reconciliationService;

    public ReconciliationController(ReconciliationService reconciliationService) {
        this.reconciliationService = reconciliationService;
    }

    @PostMapping("/run")
    public ReconciliationResponse run(@Valid @RequestBody ReconciliationRequest request) {
        return reconciliationService.run(request);
    }
}
