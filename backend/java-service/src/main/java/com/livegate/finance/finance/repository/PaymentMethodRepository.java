package com.livegate.finance.finance.repository;

import com.livegate.finance.finance.domain.PaymentMethod;
import com.livegate.finance.finance.domain.PaymentProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, String> {

    List<PaymentMethod> findByUserIdAndIsActiveTrue(String userId);

    List<PaymentMethod> findByUserIdAndCountryAndIsActiveTrue(String userId, String country);

    List<PaymentMethod> findByUserIdAndProviderAndIsActiveTrue(String userId, PaymentProvider provider);

    List<PaymentMethod> findByUserIdAndTypeAndIsActiveTrue(String userId, String type);

    Optional<PaymentMethod> findByUserIdAndIdAndIsActiveTrue(String userId, String methodId);

    Optional<PaymentMethod> findByUserIdAndIsDefaultTrueAndIsActiveTrue(String userId);

    @Query("SELECT pm FROM PaymentMethod pm WHERE pm.userId = :userId AND pm.isActive = true AND pm.expiresAt > :now")
    List<PaymentMethod> findValidPaymentMethods(@Param("userId") String userId, @Param("now") Instant now);

    @Query("SELECT pm FROM PaymentMethod pm WHERE pm.userId = :userId AND pm.expiresAt <= :now AND pm.isActive = true")
    List<PaymentMethod> findExpiredPaymentMethods(@Param("userId") String userId, @Param("now") Instant now);

    long countByUserIdAndIsActiveTrue(String userId);
}
