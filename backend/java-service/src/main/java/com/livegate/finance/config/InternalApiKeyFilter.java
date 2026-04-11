package com.livegate.finance.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class InternalApiKeyFilter extends OncePerRequestFilter {

    private static final String INTERNAL_API_KEY_HEADER = "x-internal-api-key";
    private static final String USER_ID_HEADER = "User-ID";
    private static final String INTERNAL_PRINCIPAL = "internal-service";

    private final FinanceProperties financeProperties;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return !(uri.startsWith("/internal/")
                || uri.startsWith("/api/v1/payment-methods")
                || uri.startsWith("/api/v1/audit"));
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String apiKey = request.getHeader(INTERNAL_API_KEY_HEADER);

        // All routes handled by this filter require a valid internal API key.
        // Missing or invalid key is always rejected — no pass-through.
        if (apiKey == null || apiKey.isBlank()) {
            reject(response, "Missing internal API key.");
            return;
        }

        // Constant-time comparison to prevent timing attacks
        if (!MessageDigest.isEqual(
                financeProperties.internalApiKey().getBytes(StandardCharsets.UTF_8),
                apiKey.getBytes(StandardCharsets.UTF_8))) {
            reject(response, "Invalid internal API key.");
            return;
        }

        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            String principal = request.getHeader(USER_ID_HEADER);
            if (principal == null || principal.isBlank()) {
                principal = INTERNAL_PRINCIPAL;
            }

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            principal,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_INTERNAL_SERVICE"))
                    );
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private void reject(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"message\":\"" + message + "\"}");
    }
}
