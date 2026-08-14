package com.neighbornest.auth.config;

import com.neighbornest.auth.constants.AppConstants;
import feign.RequestInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

/**
 * Feign configuration for the Auth Service.
 * <p>
 * Attaches the shared service-to-service API key to every outgoing Feign call
 * so the notification-service's internal endpoints (welcome email) accept the
 * request. The key is harmless on the public OTP endpoints, which ignore it.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Configuration
public class FeignClientConfig {

    /**
     * Creates a request interceptor that adds the internal API key header.
     *
     * @param internalApiKey the shared secret (empty = no header, calls to
     *                       internal endpoints will be rejected by the receiver)
     * @return the configured interceptor
     */
    @Bean
    public RequestInterceptor internalApiKeyInterceptor(
            @Value("${app.internal.api-key:}") final String internalApiKey) {
        return requestTemplate -> {
            if (StringUtils.hasText(internalApiKey)) {
                requestTemplate.header(AppConstants.INTERNAL_API_KEY_HEADER, internalApiKey);
            }
        };
    }
}
