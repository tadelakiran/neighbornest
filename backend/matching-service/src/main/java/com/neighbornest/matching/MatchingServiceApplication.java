package com.neighbornest.matching;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Matching Service for NeighborNest.
 * <p>
 * Hosts the compatibility scoring engine, proposes Nest formations and
 * orchestrates Nest creation with the nest-service once all members accept.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@EnableScheduling
public class MatchingServiceApplication {

    /**
     * Entry point for the Matching Service.
     *
     * @param args command-line arguments passed to the application
     */
    public static void main(final String[] args) {
        SpringApplication.run(MatchingServiceApplication.class, args);
    }
}
