package com.neighbornest.chatservice;

import com.neighbornest.chatservice.config.ChatServiceProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cloud.openfeign.EnableFeignClients;

/**
 * Entry point for the Chat Service.
 * <p>
 * Real-time messaging for NeighborNest: group chats, direct messages, typing
 * indicators and read receipts over STOMP/WebSocket (with a RabbitMQ broker
 * relay) plus REST endpoints for chat history and conversation management.
 * Registers with Eureka and consumes the user-service / nest-service via
 * OpenFeign.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@SpringBootApplication
@EnableFeignClients
@EnableConfigurationProperties(ChatServiceProperties.class)
public class ChatServiceApplication {

    /**
     * Starts the application.
     *
     * @param args the command-line arguments
     */
    public static void main(final String[] args) {
        SpringApplication.run(ChatServiceApplication.class, args);
    }
}
