package com.neighbornest.user.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ configuration for the User Service.
 * <p>
 * Declares the shared {@code nest.events} topic exchange (the same one the
 * nest/chat services publish to — declaring it here is idempotent) and wires
 * a JSR-310-aware JSON converter so events are published as typed POJOs.
 * Consumers declare their own durable queues bound to this exchange.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Configuration
public class RabbitMQConfig {

    @Value("${app.user.event.exchange}")
    private String exchange;

    /**
     * Declares the shared events topic exchange.
     *
     * @return the topic exchange
     */
    @Bean
    public TopicExchange userEventsExchange() {
        return new TopicExchange(exchange, true, false);
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
