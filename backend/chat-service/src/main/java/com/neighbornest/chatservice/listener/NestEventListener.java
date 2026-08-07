package com.neighbornest.chatservice.listener;

import com.neighbornest.chatservice.constants.AppConstants;
import com.neighbornest.chatservice.dto.response.MessageResponse;
import com.neighbornest.chatservice.event.NestCreatedEvent;
import com.neighbornest.chatservice.event.NestGraduatedEvent;
import com.neighbornest.chatservice.service.ChatMessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * Consumes Nest lifecycle events from RabbitMQ and auto-generates SYSTEM chat
 * messages (e.g. "Welcome to {nest}!", "Congratulations! You've graduated...").
 * <p>
 * The generated message is persisted with {@code messageType = SYSTEM} and
 * broadcast to the Nest's group chat topic, where the JWT channel interceptor
 * guarantees only Nest members are subscribed.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NestEventListener {

    private final ChatMessageService chatMessageService;
    private final SimpMessagingTemplate messagingTemplate;

    /** System message template for a newly created Nest. */
    private static final String NEST_CREATED_MESSAGE = "Welcome to %s! Your 6-week journey starts now.";

    /** System message template for a graduated Nest. */
    private static final String NEST_GRADUATED_MESSAGE = "Congratulations! You've graduated from %s.";

    /**
     * Handles a Nest-created event by saving and broadcasting a welcome
     * message to the Nest group chat.
     *
     * @param event the Nest-created event
     */
    @RabbitListener(queues = "${app.chat.events.created-queue}")
    public void handleNestCreated(final NestCreatedEvent event) {
        log.info("Nest created event received for nest {} ({})", event.nestId(), event.name());
        broadcastSystemMessage(event.nestId(), String.format(NEST_CREATED_MESSAGE, event.name()));
    }

    /**
     * Handles a Nest-graduated event by saving and broadcasting a
     * congratulations message to the Nest group chat.
     *
     * @param event the Nest-graduated event
     */
    @RabbitListener(queues = "${app.chat.events.graduated-queue}")
    public void handleNestGraduated(final NestGraduatedEvent event) {
        log.info("Nest graduated event received for nest {} ({})", event.nestId(), event.name());
        broadcastSystemMessage(event.nestId(), String.format(NEST_GRADUATED_MESSAGE, event.name()));
    }

    /**
     * Persists the SYSTEM message and broadcasts it to the Nest's message
     * topic.
     *
     * @param nestId  the nest id
     * @param content the system message content
     */
    private void broadcastSystemMessage(final Long nestId, final String content) {
        final MessageResponse response = chatMessageService.saveSystemMessage(nestId, content);
        messagingTemplate.convertAndSend(
                AppConstants.TOPIC_NEST_PREFIX + nestId + AppConstants.TOPIC_NEST_MESSAGES_SUFFIX, response);
    }
}
