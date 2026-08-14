package com.neighbornest.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

/**
 * Auth Service for NeighborNest.
 * <p>
 * Handles user authentication and authorization, including registration,
 * login, token management, and user profile retrieval. Registers with
 * Eureka for service discovery and calls the notification-service (the
 * platform's email service) for OTP delivery and transactional email.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
public class AuthServiceApplication {

    /**
     * Entry point for the Auth Service.
     *
     * @param args command-line arguments passed to the application
     */
    public static void main(final String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }
}
