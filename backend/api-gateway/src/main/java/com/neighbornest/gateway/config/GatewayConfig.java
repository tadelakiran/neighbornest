package com.neighbornest.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Configuration class for the API Gateway.
 * <p>
 * Defines global CORS settings and other cross-cutting gateway configurations.
 * Allowed origins come from the {@code CORS_ALLOWED_ORIGINS} environment
 * variable (comma-separated); defaults to the local Vite dev server.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.1.0
 */
@Configuration
public class GatewayConfig {

    /**
     * Creates a {@link CorsWebFilter} bean that allows cross-origin requests
     * from the configured NeighborNest frontend origins.
     *
     * @param allowedOrigins comma-separated list of origins from
     *                       {@code CORS_ALLOWED_ORIGINS}
     * @return configured {@link CorsWebFilter} instance
     */
    @Bean
    public CorsWebFilter corsWebFilter(
            @Value("${CORS_ALLOWED_ORIGINS:http://localhost:5173,http://127.0.0.1:5173}")
            final String allowedOrigins) {

        final List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();

        final CorsConfiguration corsConfig = new CorsConfiguration();
        corsConfig.setAllowedOrigins(origins);
        corsConfig.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        corsConfig.setAllowedHeaders(List.of("*"));
        corsConfig.setAllowCredentials(false);

        final UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);

        return new CorsWebFilter(source);
    }
}
