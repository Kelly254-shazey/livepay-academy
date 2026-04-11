package com.livegate.finance.finance.service;

import com.livegate.finance.common.ApiException;
import com.livegate.finance.finance.domain.PaymentMethod;
import com.livegate.finance.finance.domain.PaymentMethodType;
import com.livegate.finance.finance.domain.PaymentProvider;
import com.livegate.finance.finance.domain.PaymentProviderConfig;
import com.livegate.finance.finance.repository.PaymentMethodRepository;
import com.livegate.finance.finance.repository.PaymentProviderConfigRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import com.fasterxml.jackson.databind.JsonNode;

@Service
@Transactional
public class GlobalPaymentMethodService {

    private final PaymentMethodRepository paymentMethodRepository;
    private final PaymentProviderConfigRepository providerConfigRepository;

    public GlobalPaymentMethodService(
            PaymentMethodRepository paymentMethodRepository,
            PaymentProviderConfigRepository providerConfigRepository
    ) {
        this.paymentMethodRepository = paymentMethodRepository;
        this.providerConfigRepository = providerConfigRepository;
    }

    // Add a new payment method for user
    public PaymentMethod addPaymentMethod(String userId, PaymentMethodRequest request) {
        if (!providerConfigRepository.findByProviderAndIsActiveTrue(request.provider()).isPresent()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Payment provider not supported");
        }
        ensureNoActiveDuplicate(userId, request);

        boolean isDefault = request.isDefault() != null && request.isDefault();
        
        // If this is default, unset other defaults
        if (isDefault) {
            paymentMethodRepository.findByUserIdAndIsDefaultTrueAndIsActiveTrue(userId)
                    .ifPresent(existing -> {
                        existing.setIsDefault(false);
                        paymentMethodRepository.save(existing);
                    });
        }

        PaymentMethod method = new PaymentMethod();
        method.setId(UUID.randomUUID().toString());
        method.setUserId(userId);
        method.setType(request.type());
        method.setProvider(request.provider());
        method.setCountry(request.country());
        method.setLastFour(request.lastFour());
        method.setBrand(request.brand());
        method.setIsDefault(isDefault);
        method.setIsActive(true);
        method.setExpiresAt(request.expiresAt());
        method.setMetadata(request.metadata());
        method.setCreatedAt(Instant.now());
        method.setUpdatedAt(Instant.now());

        return paymentMethodRepository.save(method);
    }

    // Get all active payment methods for user
    public List<PaymentMethod> getPaymentMethods(String userId) {
        return paymentMethodRepository.findByUserIdAndIsActiveTrue(userId);
    }

    // Get payment methods available for specific country
    public List<PaymentMethod> getPaymentMethodsByCountry(String userId, String country) {
        return paymentMethodRepository.findByUserIdAndCountryAndIsActiveTrue(userId, country);
    }

    // Get payment methods by provider
    public List<PaymentMethod> getPaymentMethodsByProvider(String userId, PaymentProvider provider) {
        return paymentMethodRepository.findByUserIdAndProviderAndIsActiveTrue(userId, provider);
    }

    // Get valid (not expired) payment methods
    public List<PaymentMethod> getValidPaymentMethods(String userId) {
        return paymentMethodRepository.findValidPaymentMethods(userId, Instant.now());
    }

    // Set a payment method as default
    public PaymentMethod setDefaultPaymentMethod(String userId, String methodId) {
        PaymentMethod method = paymentMethodRepository.findByUserIdAndIdAndIsActiveTrue(userId, methodId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment method not found"));

        // Unset current default
        paymentMethodRepository.findByUserIdAndIsDefaultTrueAndIsActiveTrue(userId)
                .ifPresent(existing -> {
                    existing.setIsDefault(false);
                    paymentMethodRepository.save(existing);
                });

        // Set new default
        method.setIsDefault(true);
        method.setUpdatedAt(Instant.now());
        return paymentMethodRepository.save(method);
    }

    // Delete (deactivate) a payment method
    public void deletePaymentMethod(String userId, String methodId) {
        PaymentMethod method = paymentMethodRepository.findByUserIdAndIdAndIsActiveTrue(userId, methodId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment method not found"));

        method.setIsActive(false);
        method.setUpdatedAt(Instant.now());
        paymentMethodRepository.save(method);
    }

    // Get available payment methods for a country
    public List<String> getAvailablePaymentMethodsForCountry(String country) {
        List<PaymentProviderConfig> configs = providerConfigRepository.findByIsActiveTrue();
        return configs.stream()
                .filter(config -> isCountrySupportedByProvider(config, country))
                .map(config -> config.getProvider().name().toLowerCase())
                .toList();
    }

    public List<PaymentProviderConfig> getActiveProviderConfigs() {
        return providerConfigRepository.findByIsActiveTrue();
    }

    // Calculate payment fees
    public FeeCalculation calculateFees(BigDecimal amount, PaymentProvider provider) {
        PaymentProviderConfig config = providerConfigRepository.findByProviderAndIsActiveTrue(provider)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Provider configuration not found"));

        BigDecimal normalizedAmount = amount.setScale(2, RoundingMode.HALF_UP);
        JsonNode feesNode = config.getFees();
        BigDecimal fixedFee = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal percentageFee = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        if (feesNode.has("fixed")) {
            fixedFee = new BigDecimal(feesNode.get("fixed").asText()).setScale(2, RoundingMode.HALF_UP);
        }
        if (feesNode.has("percentage")) {
            BigDecimal percentage = new BigDecimal(feesNode.get("percentage").asText());
            percentageFee = normalizedAmount
                    .multiply(percentage)
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        }

        BigDecimal totalFee = fixedFee.add(percentageFee).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = normalizedAmount.add(totalFee).setScale(2, RoundingMode.HALF_UP);

        return new FeeCalculation(normalizedAmount, fixedFee, percentageFee, totalFee, total);
    }

    private boolean isCountrySupportedByProvider(PaymentProviderConfig config, String country) {
        JsonNode countries = config.getCountries();
        if (countries.isArray()) {
            for (JsonNode countryNode : countries) {
                if (country.equals(countryNode.asText())) {
                    return true;
                }
            }
        }
        return false;
    }

    public record PaymentMethodRequest(
            PaymentMethodType type,
            PaymentProvider provider,
            String country,
            String lastFour,
            String brand,
            Boolean isDefault,
            Instant expiresAt,
            JsonNode metadata
    ) {}

    public record FeeCalculation(
            BigDecimal amount,
            BigDecimal fixedFee,
            BigDecimal percentageFee,
            BigDecimal totalFee,
            BigDecimal totalAmount
    ) {}

    private void ensureNoActiveDuplicate(String userId, PaymentMethodRequest request) {
        boolean exists = request.lastFour() == null || request.lastFour().isBlank()
                ? paymentMethodRepository.findByUserIdAndProviderAndTypeAndLastFourIsNullAndIsActiveTrue(
                        userId,
                        request.provider(),
                        request.type()
                ).isPresent()
                : paymentMethodRepository.findByUserIdAndProviderAndTypeAndLastFourAndIsActiveTrue(
                        userId,
                        request.provider(),
                        request.type(),
                        request.lastFour()
                ).isPresent();

        if (exists) {
            throw new ApiException(HttpStatus.CONFLICT, "Payment method is already registered for this account.");
        }
    }
}
