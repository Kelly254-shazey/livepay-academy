package com.livegate.finance.finance.controller;

import com.livegate.finance.finance.dto.PayoutDecisionRequest;
import com.livegate.finance.finance.dto.PayoutResponse;
import com.livegate.finance.finance.dto.RequestPayoutRequest;
import com.livegate.finance.finance.service.PayoutService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/payouts")
public class PayoutController {

    private final PayoutService payoutService;

    public PayoutController(PayoutService payoutService) {
        this.payoutService = payoutService;
    }

    @PostMapping("/request")
    public PayoutResponse request(@Valid @RequestBody RequestPayoutRequest request) {
        return payoutService.requestPayout(request);
    }

    @PostMapping("/{id}/approve")
    public PayoutResponse approve(@PathVariable String id, @RequestBody(required = false) PayoutDecisionRequest request) {
        return payoutService.approve(id, request == null ? new PayoutDecisionRequest(null, null) : request);
    }

    @PostMapping("/{id}/reject")
    public PayoutResponse reject(@PathVariable String id, @RequestBody(required = false) PayoutDecisionRequest request) {
        return payoutService.reject(id, request == null ? new PayoutDecisionRequest(null, "Rejected") : request);
    }
}

