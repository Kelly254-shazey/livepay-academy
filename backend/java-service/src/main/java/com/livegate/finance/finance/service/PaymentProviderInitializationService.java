package com.livegate.finance.finance.service;

import com.livegate.finance.finance.domain.PaymentProvider;
import com.livegate.finance.finance.domain.PaymentProviderConfig;
import com.livegate.finance.finance.repository.PaymentProviderConfigRepository;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import java.time.Instant;
import java.io.IOException;

@Service
@Transactional
public class PaymentProviderInitializationService {

    private final PaymentProviderConfigRepository providerConfigRepository;
    private final ObjectMapper objectMapper;

    public PaymentProviderInitializationService(
            PaymentProviderConfigRepository providerConfigRepository,
            ObjectMapper objectMapper
    ) {
        this.providerConfigRepository = providerConfigRepository;
        this.objectMapper = objectMapper;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void initializePaymentProviders() {
        if (providerConfigRepository.findByIsActiveTrue().isEmpty()) {
            // Initialize all payment providers
            loadStripeProvider();
            loadPayPalProvider();
            loadWiseProvider();
            loadFlutterwaveProvider();
            loadRazorpayProvider();
            loadMPesaProvider();
        }
    }

    private void loadStripeProvider() {
        try {
            JsonNode countries = objectMapper.readTree("""
                ["US", "CA", "GB", "AU", "SG", "JP", "DE", "FR", "IE", "NL", "AT", "BE", "ES", "IT"]
                """);
            JsonNode paymentTypes = objectMapper.readTree("""
                ["CREDIT_CARD", "DEBIT_CARD", "BANK_TRANSFER", "DIGITAL_WALLET"]
                """);
            JsonNode fees = objectMapper.readTree("""
                {"fixed": 0.30, "percentage": 2.9}
                """);
            providerConfigRepository.save(createProviderConfig(PaymentProvider.STRIPE, countries, paymentTypes, fees));
        } catch (IOException | RuntimeException e) {
            throw new RuntimeException("Failed to initialize Stripe provider", e);
        }
    }

    private void loadPayPalProvider() {
        try {
            JsonNode countries = objectMapper.readTree("""
                ["US", "CA", "GB", "AU", "DE", "FR", "JP", "CN", "BR", "MX", "IN"]
                """);
            JsonNode paymentTypes = objectMapper.readTree("""
                ["PAYPAL", "CREDIT_CARD", "BANK_TRANSFER"]
                """);
            JsonNode fees = objectMapper.readTree("""
                {"fixed": 0.49, "percentage": 3.49}
                """);
            providerConfigRepository.save(createProviderConfig(PaymentProvider.PAYPAL, countries, paymentTypes, fees));
        } catch (IOException | RuntimeException e) {
            throw new RuntimeException("Failed to initialize PayPal provider", e);
        }
    }

    private void loadWiseProvider() {
        try {
            JsonNode countries = objectMapper.readTree("""
                ["GB", "US", "AU", "NZ", "SG", "JP", "CA", "EU"]
                """);
            JsonNode paymentTypes = objectMapper.readTree("""
                ["BANK_TRANSFER", "DEBIT_CARD"]
                """);
            JsonNode fees = objectMapper.readTree("""
                {"fixed": 0.0, "percentage": 0.71}
                """);
            providerConfigRepository.save(createProviderConfig(PaymentProvider.WISE, countries, paymentTypes, fees));
        } catch (IOException | RuntimeException e) {
            throw new RuntimeException("Failed to initialize Wise provider", e);
        }
    }

    private void loadFlutterwaveProvider() {
        try {
            JsonNode countries = objectMapper.readTree("""
                ["NG", "KE", "GH", "ZA", "TZ", "UG", "RW", "SN", "CM", "CI", "BW"]
                """);
            JsonNode paymentTypes = objectMapper.readTree("""
                ["MOBILE_MONEY", "CARD", "BANK_TRANSFER", "USSD"]
                """);
            JsonNode fees = objectMapper.readTree("""
                {"fixed": 0.0, "percentage": 1.4}
                """);
            providerConfigRepository.save(createProviderConfig(PaymentProvider.FLUTTERWAVE, countries, paymentTypes, fees));
        } catch (IOException | RuntimeException e) {
            throw new RuntimeException("Failed to initialize Flutterwave provider", e);
        }
    }

    private void loadRazorpayProvider() {
        try {
            JsonNode countries = objectMapper.readTree("""
                ["IN", "BD", "LK", "AF"]
                """);
            JsonNode paymentTypes = objectMapper.readTree("""
                ["CARD", "UPI", "BANK_TRANSFER", "MOBILE_MONEY", "WALLET"]
                """);
            JsonNode fees = objectMapper.readTree("""
                {"fixed": 0.0, "percentage": 2.0}
                """);
            providerConfigRepository.save(createProviderConfig(PaymentProvider.RAZORPAY, countries, paymentTypes, fees));
        } catch (IOException | RuntimeException e) {
            throw new RuntimeException("Failed to initialize Razorpay provider", e);
        }
    }

    private void loadMPesaProvider() {
        try {
            JsonNode countries = objectMapper.readTree("""
                ["KE", "TZ", "UG", "RW", "DZ"]
                """);
            JsonNode paymentTypes = objectMapper.readTree("""
                ["MOBILE_MONEY"]
                """);
            JsonNode fees = objectMapper.readTree("""
                {"fixed": 0.0, "percentage": 2.5}
                """);
            providerConfigRepository.save(createProviderConfig(PaymentProvider.MPESA, countries, paymentTypes, fees));
        } catch (IOException | RuntimeException e) {
            throw new RuntimeException("Failed to initialize M-Pesa provider", e);
        }
    }

    private PaymentProviderConfig createProviderConfig(
            PaymentProvider provider,
            JsonNode countries,
            JsonNode paymentTypes,
            JsonNode fees
    ) {
        PaymentProviderConfig config = new PaymentProviderConfig();
        config.setId(UUID.randomUUID().toString());
        config.setProvider(provider);
        config.setCountries(countries);
        config.setPaymentTypes(paymentTypes);
        config.setFees(fees);
        config.setIsActive(true);
        config.setCreatedAt(Instant.now());
        config.setUpdatedAt(Instant.now());
        return config;
    }
}
