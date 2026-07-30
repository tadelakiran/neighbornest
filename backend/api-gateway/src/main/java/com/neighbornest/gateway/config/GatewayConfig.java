package com.neighbornest.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Configuration class for the API Gateway.
 * <p>
 * Defines global CORS settings and other cross-cutting gateway configurations.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Configuration
public class GatewayConfig {

    /**
     * Creates a {@link CorsWebFilter} bean that allows cross-origin requests
     * from the NeighborNest frontend applications.
     *
     * @return configured {@link CorsWebFilter} instance
     */
    @Bean
    public CorsWebFilter corsWebFilter() {
        final CorsConfiguration corsConfig = new CorsConfiguration();
        corsConfig.setAllowedOrigins(List.of("*"));
        corsConfig.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        corsConfig.setAllowedHeaders(List.of("*"));
        corsConfig.setAllowCredentials(false);

        final UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);

        return new CorsWebFilter(source);
    }
}
