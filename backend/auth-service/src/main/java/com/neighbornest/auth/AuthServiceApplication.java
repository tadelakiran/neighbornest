package com.neighbornest.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * Auth Service for NeighborNest.
 * <p>
 * Handles user authentication and authorization, including registration,
 * login, token management, and user profile retrieval. Registers with
 * Eureka for service discovery.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@SpringBootApplication
@EnableDiscoveryClient
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
