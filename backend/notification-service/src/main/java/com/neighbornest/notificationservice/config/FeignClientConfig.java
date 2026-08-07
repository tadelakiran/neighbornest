package com.neighbornest.notificationservice.config;

import com.neighbornest.notificationservice.constants.AppConstants;
import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Feign configuration for the Notification Service.
 * <p>
 * Propagates the incoming {@code Authorization} header onto outgoing Feign
 * requests so downstream JWT-protected services (user-service, nest-service)
 * can identify the caller. The header is only forwarded when a request context
 * is active (i.e. the call originates from an HTTP request); scheduler-driven
 * calls simply go without a token.
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
            final ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                final String authHeader = attributes.getRequest().getHeader(AppConstants.AUTHORIZATION_HEADER);
                if (StringUtils.hasText(authHeader)) {
                    requestTemplate.header(AppConstants.AUTHORIZATION_HEADER, authHeader);
                }
            }
        };
    }
}
