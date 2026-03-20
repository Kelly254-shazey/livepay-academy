package com.livegate.finance.finance.controller;

import com.livegate.finance.finance.domain.Adjustment;
import com.livegate.finance.finance.domain.Refund;
import com.livegate.finance.finance.dto.AdjustmentRequest;
import com.livegate.finance.finance.dto.CommissionCalculationRequest;
import com.livegate.finance.finance.dto.CommissionBreakdownResponse;
import com.livegate.finance.finance.dto.ProcessRefundRequest;
import com.livegate.finance.finance.dto.RecordPaymentRequest;
import com.livegate.finance.finance.dto.RecordPaymentResponse;
import com.livegate.finance.finance.service.AdjustmentService;
import com.livegate.finance.finance.service.CommissionService;
import com.livegate.finance.finance.service.PaymentService;
import com.livegate.finance.finance.service.RefundService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal")
public class PaymentsController {

    private final PaymentService paymentService;
    private final CommissionService commissionService;
    private final RefundService refundService;
    private final AdjustmentService adjustmentService;

    public PaymentsController(
            PaymentService paymentService,
            CommissionService commissionService,
            RefundService refundService,
            AdjustmentService adjustmentService
    ) {
        this.paymentService = paymentService;
        this.commissionService = commissionService;
        this.refundService = refundService;
        this.adjustmentService = adjustmentService;
    }

    @PostMapping("/payments/record")
    public RecordPaymentResponse record(@Valid @RequestBody RecordPaymentRequest request) {
        return paymentService.recordPayment(request);
    }

    @PostMapping("/commissions/calculate")
    public CommissionBreakdownResponse calculate(@Valid @RequestBody CommissionCalculationRequest request) {
        return commissionService.calculate(request.amount());
    }

    @PostMapping("/refunds/process")
    public Refund processRefund(@Valid @RequestBody ProcessRefundRequest request) {
        return refundService.process(request);
    }

    @PostMapping("/adjustments/process")
    public Adjustment processAdjustment(@Valid @RequestBody AdjustmentRequest request) {
        return adjustmentService.apply(request);
    }
}
