package com.livegate.finance.common;

import java.time.Instant;

public record ErrorResponse(
        Instant timestamp,
        int status,
        String message,
        String traceId
) {
}
