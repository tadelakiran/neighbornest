package com.neighbornest.chatservice.config;

import com.neighbornest.chatservice.security.JwtAuthenticationFilter;
import com.neighbornest.chatservice.security.RestAuthenticationEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security configuration for the Chat Service.
 * <p>
 * REST endpoints are JWT-protected (the API gateway also validates tokens and
 * routes {@code /api/chat/**} here). The WebSocket handshake
 * ({@code /ws/chat/**}) is permitted at the HTTP layer because STOMP-level
 * authentication is enforced by the {@code JwtChannelInterceptor} on the
 * CONNECT frame. Authentication is stateless.
 * </p>
 * <p>
 * Requests that reach a protected endpoint without a valid token are answered
 * by {@link RestAuthenticationEntryPoint} with a specific 401 JSON body (the
 * framework default would be a bare 403, which breaks the frontend's
 * token-refresh flow).
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.1.0
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;

    /** Endpoints accessible without authentication. */
    private static final String[] PUBLIC_ENDPOINTS = {
            "/ws/chat/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/v3/api-docs/**",
            "/actuator/health",
            "/actuator/info"
    };

    /**
     * Configures the security filter chain with JWT authentication.
     *
     * @param http the {@link HttpSecurity} to configure
     * @return the built {@link SecurityFilterChain}
     * @throws Exception if configuration fails
     */
    @Bean
    public SecurityFilterChain securityFilterChain(final HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(exception ->
                        exception.authenticationEntryPoint(restAuthenticationEntryPoint))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
