package com.neighbornest.notificationservice.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neighbornest.notificationservice.constants.AppConstants;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Guards service-to-service endpoints (paths under
 * {@code /api/notifications/internal/**}) with a shared secret header.
 * <p>
 * The auth-service attaches the configured {@code X-Internal-Key} header to
 * its Feign calls; any other caller is rejected with 403. The check fails
 * <em>closed</em>: if no key is configured, internal endpoints are simply
 * unreachable. Because the security filter chain permits these paths
 * (they carry no user JWT), this filter is the only gate.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class InternalApiKeyFilter extends OncePerRequestFilter {

    private static final String INTERNAL_PATH_PREFIX = "/api/notifications/internal/";

    private final ObjectMapper objectMapper;

    @Value("${app.internal.api-key:}")
    private String internalApiKey;

    /**
     * Enforces the shared-secret check on internal routes.
     *
     * @param request     the incoming HTTP request
     * @param response    the HTTP response
     * @param filterChain the filter chain to pass the request along
     * @throws ServletException if a servlet error occurs
     * @throws IOException      if an I/O error occurs
     */
    @Override
    protected void doFilterInternal(@NonNull final HttpServletRequest request,
                                    @NonNull final HttpServletResponse response,
                                    @NonNull final FilterChain filterChain)
            throws ServletException, IOException {

        if (request.getRequestURI().startsWith(INTERNAL_PATH_PREFIX)) {
            final String provided = request.getHeader(AppConstants.INTERNAL_API_KEY_HEADER);
            if (!StringUtils.hasText(internalApiKey) || !internalApiKey.equals(provided)) {
                log.warn("Rejected internal endpoint call to {} without a valid API key", request.getRequestURI());
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.setCharacterEncoding("UTF-8");
                objectMapper.writeValue(response.getWriter(), Map.of(
                        "timestamp", LocalDateTime.now().toString(),
                        "status", HttpServletResponse.SC_FORBIDDEN,
                        "error", "Forbidden",
                        "message", "Forbidden",
                        "path", request.getRequestURI()));
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
