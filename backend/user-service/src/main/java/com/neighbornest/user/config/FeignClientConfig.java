package com.neighbornest.user.config;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Feign configuration for the User Service.
 * <p>
 * Propagates the incoming {@code Authorization} header onto outgoing Feign
 * requests so downstream JWT-protected services (e.g. auth-service) can
 * validate the caller. Header is only forwarded when a request context is
 * active (i.e. the call originates from an HTTP request).
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Configuration
public class FeignClientConfig {

    private static final String AUTHORIZATION_HEADER = "Authorization";

    /**
     * Creates a request interceptor that forwards the Authorization header.
     *
     * @return the configured interceptor
     */
    @Bean
    public RequestInterceptor authHeaderInterceptor() {
        return requestTemplate -> {
            final ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                final String authHeader = attributes.getRequest().getHeader(AUTHORIZATION_HEADER);
                if (authHeader != null && !authHeader.isBlank()) {
                    requestTemplate.header(AUTHORIZATION_HEADER, authHeader);
                }
            }
        };
    }
}
