package com.neighbornest.notificationservice;

import com.neighbornest.notificationservice.config.NotificationServiceProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Entry point for the Notification Service.
 * <p>
 * Event-driven notifications for NeighborNest: consumes Nest lifecycle events
 * from RabbitMQ, sends transactional email (Thymeleaf templates with a plain
 * text fallback), exposes a user notification inbox and preferences, admin
 * template/stats endpoints, and scheduled meeting / expense / vibe-check
 * reminders.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@SpringBootApplication
@EnableFeignClients
@EnableConfigurationProperties(NotificationServiceProperties.class)
@EnableScheduling
public class NotificationServiceApplication {

    /**
     * Starts the application.
     *
     * @param args the command-line arguments
     */
    public static void main(final String[] args) {
        SpringApplication.run(NotificationServiceApplication.class, args);
    }
}
