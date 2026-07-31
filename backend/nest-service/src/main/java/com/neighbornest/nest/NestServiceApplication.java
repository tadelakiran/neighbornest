package com.neighbornest.nest;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

/**
 * Nest Service for NeighborNest.
 * <p>
 * Manages the Nest lifecycle (formation, meetings, expenses, vibe checks)
 * and publishes lifecycle events to RabbitMQ.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
public class NestServiceApplication {

    /**
     * Entry point for the Nest Service.
     *
     * @param args command-line arguments passed to the application
     */
    public static void main(final String[] args) {
        SpringApplication.run(NestServiceApplication.class, args);
    }
}
