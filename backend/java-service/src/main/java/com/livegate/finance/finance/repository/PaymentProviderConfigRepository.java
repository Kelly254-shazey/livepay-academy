package com.livegate.finance.finance.repository;

import com.livegate.finance.finance.domain.PaymentProvider;
import com.livegate.finance.finance.domain.PaymentProviderConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentProviderConfigRepository extends JpaRepository<PaymentProviderConfig, String> {

    Optional<PaymentProviderConfig> findByProvider(PaymentProvider provider);

    List<PaymentProviderConfig> findByIsActiveTrue();

    Optional<PaymentProviderConfig> findByProviderAndIsActiveTrue(PaymentProvider provider);
}
