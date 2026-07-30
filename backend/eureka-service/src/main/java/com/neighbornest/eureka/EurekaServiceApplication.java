package com.neighbornest.eureka;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

/**
 * Eureka Service Discovery Server for NeighborNest.
 * <p>
 * This service acts as the service registry, enabling microservices to
 * discover and communicate with each other without hardcoded URLs.
 * All NeighborNest microservices register themselves with this server.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@SpringBootApplication
@EnableEurekaServer
public class EurekaServiceApplication {

    /**
     * Entry point for the Eureka Service Discovery Server.
     *
     * @param args command-line arguments passed to the application
     */
    public static void main(final String[] args) {
        SpringApplication.run(EurekaServiceApplication.class, args);
    }
}
