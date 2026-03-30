package com.livegate.finance.finance.controller;

import com.livegate.finance.finance.domain.PaymentMethod;
import com.livegate.finance.finance.domain.PaymentProvider;
import com.livegate.finance.finance.domain.PaymentProviderConfig;
import com.livegate.finance.finance.service.GlobalPaymentMethodService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payment-methods")
public class GlobalPaymentMethodController {

    private final GlobalPaymentMethodService paymentMethodService;

    public GlobalPaymentMethodController(GlobalPaymentMethodService paymentMethodService) {
        this.paymentMethodService = paymentMethodService;
    }

    @GetMapping
    public ResponseEntity<List<PaymentMethod>> getPaymentMethods(Authentication authentication) {
        String userId = authentication.getName();
        return ResponseEntity.ok(paymentMethodService.getPaymentMethods(userId));
    }

    @GetMapping("/by-country")
    public ResponseEntity<List<PaymentMethod>> getPaymentMethodsByCountry(
            @RequestParam String country,
            Authentication authentication
    ) {
        String userId = authentication.getName();
        return ResponseEntity.ok(paymentMethodService.getPaymentMethodsByCountry(userId, country));
    }

    @GetMapping("/by-provider")
    public ResponseEntity<List<PaymentMethod>> getPaymentMethodsByProvider(
            @RequestParam PaymentProvider provider,
            Authentication authentication
    ) {
        String userId = authentication.getName();
        return ResponseEntity.ok(paymentMethodService.getPaymentMethodsByProvider(userId, provider));
    }

    @GetMapping("/valid")
    public ResponseEntity<List<PaymentMethod>> getValidPaymentMethods(Authentication authentication) {
        String userId = authentication.getName();
        return ResponseEntity.ok(paymentMethodService.getValidPaymentMethods(userId));
    }

    @GetMapping("/available-for-country")
    public ResponseEntity<List<String>> getAvailableMethodsForCountry(@RequestParam String country) {
        return ResponseEntity.ok(paymentMethodService.getAvailablePaymentMethodsForCountry(country));
    }

    @GetMapping("/providers")
    public ResponseEntity<List<ProviderConfigResponse>> getProviderConfigs() {
        List<ProviderConfigResponse> providers = paymentMethodService.getActiveProviderConfigs().stream()
                .map(GlobalPaymentMethodController::toProviderConfigResponse)
                .toList();
        return ResponseEntity.ok(providers);
    }

    @PostMapping
    public ResponseEntity<PaymentMethod> addPaymentMethod(
            @RequestBody GlobalPaymentMethodService.PaymentMethodRequest request,
            Authentication authentication
    ) {
        String userId = authentication.getName();
        PaymentMethod method = paymentMethodService.addPaymentMethod(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(method);
    }

    @PatchMapping("/{methodId}/default")
    public ResponseEntity<PaymentMethod> setDefaultPaymentMethod(
            @PathVariable String methodId,
            Authentication authentication
    ) {
        String userId = authentication.getName();
        PaymentMethod method = paymentMethodService.setDefaultPaymentMethod(userId, methodId);
        return ResponseEntity.ok(method);
    }

    @DeleteMapping("/{methodId}")
    public ResponseEntity<Void> deletePaymentMethod(
            @PathVariable String methodId,
            Authentication authentication
    ) {
        String userId = authentication.getName();
        paymentMethodService.deletePaymentMethod(userId, methodId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/calculate-fees")
    public ResponseEntity<Map<String, Object>> calculateFees(
            @RequestBody FeeCalculationRequest request
    ) {
        GlobalPaymentMethodService.FeeCalculation fees = paymentMethodService.calculateFees(
                request.amount(),
                request.provider()
        );

        return ResponseEntity.ok(Map.of(
                "amount", fees.amount(),
                "fixedFee", fees.fixedFee(),
                "percentageFee", fees.percentageFee(),
                "totalFee", fees.totalFee(),
                "totalAmount", fees.totalAmount()
        ));
    }

    public record FeeCalculationRequest(
            BigDecimal amount,
            PaymentProvider provider
    ) {}

    public record ProviderConfigResponse(
            String provider,
            com.fasterxml.jackson.databind.JsonNode countries,
            com.fasterxml.jackson.databind.JsonNode paymentTypes,
            com.fasterxml.jackson.databind.JsonNode fees,
            com.fasterxml.jackson.databind.JsonNode settingsOverride,
            Boolean isActive
    ) {}

    private static ProviderConfigResponse toProviderConfigResponse(PaymentProviderConfig config) {
        return new ProviderConfigResponse(
                config.getProvider().name().toLowerCase(),
                config.getCountries(),
                config.getPaymentTypes(),
                config.getFees(),
                config.getSettingsOverride(),
                config.getIsActive()
        );
    }
}
