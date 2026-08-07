package com.neighbornest.notificationservice.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ configuration for the Notification Service.
 * <p>
 * Declares the same {@code nest.events} topic exchange the nest-service
 * publishes to, and binds notification's own durable queues to it (each
 * consumer service declares its own queue so every one receives its own copy
 * of each event). The JSR-310-aware JSON converter ensures the listeners
 * deserialize {@code NestCreatedEvent} / {@code NestGraduatedEvent} payloads
 * exactly as the nest-service published them. The disbanded and chat queues
 * are wired for future events those services do not publish yet.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Configuration
@EnableRabbit
public class RabbitMQConfig {

    private final NotificationServiceProperties properties;

    /**
     * Constructs the RabbitMQ configuration.
     *
     * @param properties the notification service properties (event queues)
     */
    public RabbitMQConfig(final NotificationServiceProperties properties) {
        this.properties = properties;
    }

    /**
     * Declares the Nest events topic exchange.
     *
     * @return the topic exchange
     */
    @Bean
    public TopicExchange nestEventsExchange() {
        return new TopicExchange(properties.getEvents().getExchange(), true, false);
    }

    /**
     * Declares the durable queue for Nest-created events.
     *
     * @return the durable queue
     */
    @Bean
    public Queue nestCreatedQueue() {
        return new Queue(properties.getEvents().getCreatedQueue(), true);
    }

    /**
     * Declares the durable queue for Nest-graduated events.
     *
     * @return the durable queue
     */
    @Bean
    public Queue nestGraduatedQueue() {
        return new Queue(properties.getEvents().getGraduatedQueue(), true);
    }

    /**
     * Declares the durable queue for Nest-disbanded events (future).
     *
     * @return the durable queue
     */
    @Bean
    public Queue nestDisbandedQueue() {
        return new Queue(properties.getEvents().getDisbandedQueue(), true);
    }

    /**
     * Declares the durable queue for chat offline-push events (future).
     *
     * @return the durable queue
     */
    @Bean
    public Queue chatMessageQueue() {
        return new Queue(properties.getEvents().getChatQueue(), true);
    }

    /**
     * Binds the created queue to the exchange.
     *
     * @return the binding
     */
    @Bean
    public Binding createdBinding() {
        return BindingBuilder.bind(nestCreatedQueue())
                .to(nestEventsExchange())
                .with(properties.getEvents().getCreatedRoutingKey());
    }

    /**
     * Binds the graduated queue to the exchange.
     *
     * @return the binding
     */
    @Bean
    public Binding graduatedBinding() {
        return BindingBuilder.bind(nestGraduatedQueue())
                .to(nestEventsExchange())
                .with(properties.getEvents().getGraduatedRoutingKey());
    }

    /**
     * Binds the disbanded queue to the exchange.
     *
     * @return the binding
     */
    @Bean
    public Binding disbandedBinding() {
        return BindingBuilder.bind(nestDisbandedQueue())
                .to(nestEventsExchange())
                .with(properties.getEvents().getDisbandedRoutingKey());
    }

    /**
     * Binds the chat queue to the exchange.
     *
     * @return the binding
     */
    @Bean
    public Binding chatBinding() {
        return BindingBuilder.bind(chatMessageQueue())
                .to(nestEventsExchange())
                .with(properties.getEvents().getChatRoutingKey());
    }

    /**
     * Creates a JSON message converter backed by a JSR-310-aware mapper.
     *
     * @return the configured message converter
     */
    @Bean
    public MessageConverter jsonMessageConverter() {
        final ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return new Jackson2JsonMessageConverter(mapper);
    }

    /**
     * Creates a RabbitTemplate using the JSON converter.
     *
     * @param connectionFactory the RabbitMQ connection factory
     * @return the configured template
     */
    @Bean
    public RabbitTemplate rabbitTemplate(final ConnectionFactory connectionFactory) {
        final RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
