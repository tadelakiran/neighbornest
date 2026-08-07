package com.neighbornest.chatservice.config;

import com.neighbornest.chatservice.constants.AppConstants;
import com.neighbornest.chatservice.util.AuthHeaderPropagator;
import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Feign configuration for the Chat Service.
 * <p>
 * Propagates the incoming {@code Authorization} header onto outgoing Feign
 * requests so downstream JWT-protected services (user-service, nest-service)
 * can identify the caller. Two sources are consulted, in order:
 * <ol>
 *   <li>The HTTP request context (normal REST request → the caller's header).</li>
 *   <li>{@link AuthHeaderPropagator}, which the WebSocket STOMP layer
 *       populates with the CONNECT token when no HTTP request is active.</li>
 * </ol>
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Configuration
public class FeignClientConfig {

    /**
     * Creates a request interceptor that forwards the Authorization header.
     *
     * @return the configured interceptor
     */
    @Bean
    public RequestInterceptor authHeaderInterceptor() {
        return requestTemplate -> {
            final String authorizationHeader = resolveAuthorizationHeader();
            if (StringUtils.hasText(authorizationHeader)) {
                requestTemplate.header(AppConstants.AUTHORIZATION_HEADER, authorizationHeader);
            }
        };
    }

    /**
     * Resolves the Authorization header from the active HTTP request context,
     * falling back to the WebSocket thread-local propagator.
     *
     * @return the raw Authorization header value, or {@code null}
     */
    private String resolveAuthorizationHeader() {
        final ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            final String authHeader = attributes.getRequest().getHeader(AppConstants.AUTHORIZATION_HEADER);
            if (StringUtils.hasText(authHeader)) {
                return authHeader;
            }
        }
        return AuthHeaderPropagator.getToken();
    }
}
