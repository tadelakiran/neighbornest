package com.neighbornest.matching.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ configuration for the Matching Service.
 * <p>
 * Configures a JSON message converter so events can be published and
 * consumed as typed POJOs. Used by the Nest formation flow and future
 * event-driven integrations.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Configuration
public class RabbitMQConfig {

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
    public AmqpTemplate amqpTemplate(final ConnectionFactory connectionFactory) {
        final RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
