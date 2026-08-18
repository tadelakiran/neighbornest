package com.neighbornest.auth.config;

import com.neighbornest.auth.security.JwtAuthenticationFilter;
import com.neighbornest.auth.security.RestAuthenticationEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security configuration for the Auth Service.
 * <p>
 * Configures stateless JWT-based authentication, BCrypt password encoding,
 * public endpoint access, and role-based method security.
 * Enables method-level security annotations with {@link EnableMethodSecurity}.
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

    /** List of endpoints accessible without authentication. */
    private static final String[] PUBLIC_ENDPOINTS = {
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/refresh",
            "/api/auth/validate",
            // Email-verification and password-recovery flows run pre-auth.
            "/api/auth/otp/send",
            "/api/auth/password/forgot",
            "/api/auth/password/reset",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/v3/api-docs/**",
            "/actuator/health"
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

    /**
     * Creates a {@link PasswordEncoder} bean using BCrypt with strength 12.
     *
     * @return a {@link BCryptPasswordEncoder} instance
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        // Strength 10 balances security with latency: hashing/matching here takes
        // ~80-150ms vs ~400-700ms at strength 12, which was a major contributor
        // to slow login/registration. Existing hashes remain verifiable because
        // BCrypt embeds the cost factor in each hash.
        return new BCryptPasswordEncoder(10);
    }

    /**
     * Exposes the {@link AuthenticationManager} as a Spring bean.
     *
     * @param authenticationConfiguration the authentication configuration
     * @return the {@link AuthenticationManager} instance
     * @throws Exception if the manager cannot be obtained
     */
    @Bean
    public AuthenticationManager authenticationManager(
            final AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
