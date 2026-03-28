package com.livegate.finance.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RequestTracingFilter extends OncePerRequestFilter {

    public static final String REQUEST_ID_HEADER = "x-request-id";
    public static final String SOURCE_SERVICE_HEADER = "x-source-service";
    public static final String REQUEST_ID_ATTRIBUTE = "requestId";
    public static final String SOURCE_SERVICE_ATTRIBUTE = "sourceService";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String requestId = request.getHeader(REQUEST_ID_HEADER);
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }

        String sourceService = request.getHeader(SOURCE_SERVICE_HEADER);
        if (sourceService == null || sourceService.isBlank()) {
            sourceService = "unknown";
        }

        request.setAttribute(REQUEST_ID_ATTRIBUTE, requestId);
        request.setAttribute(SOURCE_SERVICE_ATTRIBUTE, sourceService);
        response.setHeader(REQUEST_ID_HEADER, requestId);
        response.setHeader(SOURCE_SERVICE_HEADER, "java-finance-service");

        MDC.put(REQUEST_ID_ATTRIBUTE, requestId);
        MDC.put(SOURCE_SERVICE_ATTRIBUTE, sourceService);
        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(REQUEST_ID_ATTRIBUTE);
            MDC.remove(SOURCE_SERVICE_ATTRIBUTE);
        }
    }
}
