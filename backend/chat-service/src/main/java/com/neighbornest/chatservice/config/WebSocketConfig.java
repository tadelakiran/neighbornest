package com.neighbornest.chatservice.config;

import com.neighbornest.chatservice.constants.AppConstants;
import com.neighbornest.chatservice.security.JwtChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket + STOMP configuration.
 * <p>
 * Registers the {@code /ws/chat} endpoint with SockJS fallback and relays STOMP
 * messages to RabbitMQ (the {@code rabbitmq_stomp} plugin) for scalable
 * fan-out. Destination prefixes follow the platform convention:
 * <ul>
 *   <li>{@code /app} — client-to-server ({@code @MessageMapping} handlers)</li>
 *   <li>{@code /topic} — server-to-client broadcasts (group chats, typing)</li>
 *   <li>{@code /queue} — server-to-client private queues (DMs, notifications)</li>
 * </ul>
 * The JWT channel interceptor is registered on the inbound channel so every
 * frame (CONNECT/SUBSCRIBE/SEND) is authenticated and authorized.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final ChatServiceProperties properties;
    private final JwtChannelInterceptor jwtChannelInterceptor;

    /** User-destination prefix for Spring-managed private messages. */
    private static final String USER_DESTINATION_PREFIX = "/user";

    /**
     * Configures the message broker (RabbitMQ STOMP relay) and destination
     * prefixes.
     *
     * @param registry the message broker registry
     */
    @Override
    public void configureMessageBroker(final MessageBrokerRegistry registry) {
        registry.enableStompBrokerRelay("/topic", "/queue")
                .setRelayHost(properties.getStomp().getRelayHost())
                .setRelayPort(properties.getStomp().getRelayPort())
                .setClientLogin(properties.getStomp().getClientLogin())
                .setClientPasscode(properties.getStomp().getClientPasscode())
                .setSystemLogin(properties.getStomp().getSystemLogin())
                .setSystemPasscode(properties.getStomp().getSystemPasscode());
        registry.setApplicationDestinationPrefixes(AppConstants.APP_DESTINATION_PREFIX);
        registry.setUserDestinationPrefix(USER_DESTINATION_PREFIX);
    }

    /**
     * Registers the STOMP endpoint with SockJS fallback.
     *
     * @param registry the STOMP endpoint registry
     */
    @Override
    public void registerStompEndpoints(final StompEndpointRegistry registry) {
        registry.addEndpoint(AppConstants.WEBSOCKET_ENDPOINT)
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    /**
     * Registers the JWT channel interceptor on the client inbound channel.
     *
     * @param registration the channel registration
     */
    @Override
    public void configureClientInboundChannel(final ChannelRegistration registration) {
        registration.interceptors(jwtChannelInterceptor);
    }
}
