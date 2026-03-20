package com.livegate.finance.finance.dto;

public record PayoutDecisionRequest(
        String providerReference,
        String reason
) {
}

