package com.neighbornest.chatservice.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Returns a specific 401 JSON body when a request reaches a protected endpoint
 * without a valid access token (missing, expired, or invalid).
 * <p>
 * Previously the service relied on Spring Security's default entry point, which
 * answers <em>403 FORBIDDEN</em> with an empty body. That made expired/missing
 * tokens indistinguishable from genuine permission denials and — because the
 * frontend only refreshes tokens on 401 — prevented transparent session refresh
 * after expiry (every request kept failing with a misleading "permission
 * denied" error). This entry point restores the correct 401 semantics.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Component
@Slf4j
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    /**
     * Writes a structured 401 response explaining the token problem.
     *
     * @param request        the incoming HTTP request
     * @param response       the HTTP response
     * @param authException  the authentication failure that triggered this
     */
    @Override
    public void commence(final HttpServletRequest request,
                         final HttpServletResponse response,
                         final AuthenticationException authException) throws IOException {
        final String path = request.getRequestURI();
        log.warn("Authentication required for {} {} — returning 401 "
                + "(access token missing, expired, or invalid)", request.getMethod(), path);

        final Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", HttpServletResponse.SC_UNAUTHORIZED);
        body.put("error", "Unauthorized");
        body.put("message", "Access token is missing, expired, or invalid. Please refresh your session.");
        body.put("path", path);

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write(OBJECT_MAPPER.writeValueAsString(body));
    }
}
