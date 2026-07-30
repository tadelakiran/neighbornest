package com.neighbornest.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * API Gateway for NeighborNest.
 * <p>
 * Serves as the single entry point for all client requests, routing them to
 * the appropriate microservices. Handles cross-cutting concerns such as
 * authentication validation, rate limiting, and circuit breaking.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@SpringBootApplication
@EnableDiscoveryClient
public class ApiGatewayApplication {

    /**
     * Entry point for the API Gateway.
     *
     * @param args command-line arguments passed to the application
     */
    public static void main(final String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
