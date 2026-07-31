package com.neighbornest.nest.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ configuration for the Nest Service.
 * <p>
 * Declares the {@code nest.events} topic exchange with durable queues for
 * created and graduated events, and configures a JSON message converter so
 * events are published as typed POJOs.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Configuration
public class RabbitMQConfig {

    @Value("${app.nest.event-exchange}")
    private String exchange;

    @Value("${app.nest.created-routing-key}")
    private String createdRoutingKey;

    @Value("${app.nest.graduated-routing-key}")
    private String graduatedRoutingKey;

    /**
     * Declares the Nest events topic exchange.
     *
     * @return the topic exchange
     */
    @Bean
    public TopicExchange nestEventsExchange() {
        return new TopicExchange(exchange, true, false);
    }

    /**
     * Declares the queue for Nest created events.
     *
     * @return the durable queue
     */
    @Bean
    public Queue nestCreatedQueue() {
        return new Queue("nest.created.queue", true);
    }

    /**
     * Declares the queue for Nest graduated events.
     *
     * @return the durable queue
     */
    @Bean
    public Queue nestGraduatedQueue() {
        return new Queue("nest.graduated.queue", true);
    }

    /**
     * Binds the created queue to the exchange.
     *
     * @return the binding
     */
    @Bean
    public Binding createdBinding() {
        return BindingBuilder.bind(nestCreatedQueue()).to(nestEventsExchange()).with(createdRoutingKey);
    }

    /**
     * Binds the graduated queue to the exchange.
     *
     * @return the binding
     */
    @Bean
    public Binding graduatedBinding() {
        return BindingBuilder.bind(nestGraduatedQueue()).to(nestEventsExchange()).with(graduatedRoutingKey);
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
