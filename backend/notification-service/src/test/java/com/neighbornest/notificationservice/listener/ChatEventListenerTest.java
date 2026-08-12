package com.neighbornest.notificationservice.listener;

import com.neighbornest.notificationservice.client.NestMemberResponse;
import com.neighbornest.notificationservice.client.NestResponse;
import com.neighbornest.notificationservice.client.NestServiceClient;
import com.neighbornest.notificationservice.constants.AppConstants;
import com.neighbornest.notificationservice.enums.NotificationType;
import com.neighbornest.notificationservice.event.ChatMessageEvent;
import com.neighbornest.notificationservice.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link ChatEventListener} (chat → per-recipient in-app
 * notifications).
 *
 * @author NeighborNest Team
 * @version 1.1.0
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ChatEventListener Unit Tests")
class ChatEventListenerTest {

    @Mock
    private NotificationService notificationService;

    @Mock
    private NestServiceClient nestServiceClient;

    private ChatEventListener listener;

    @BeforeEach
    void setUp() {
        listener = new ChatEventListener(notificationService, nestServiceClient);
    }

    @Test
    @DisplayName("DM event creates one notification for the recipient, never the sender")
    void shouldNotifyDmRecipient() {
        final ChatMessageEvent event = dmEvent(33L, 1L, 4L, "DM E2E test from Priya!");

        listener.handleChatMessage(event);

        verify(notificationService).dispatchInApp(
                eq(4L), eq(NotificationType.CHAT_MESSAGE), eq("New message"),
                eq("DM E2E test from Priya!"), eq("CHAT"), eq(33L));
        verify(notificationService, never()).dispatchInApp(
                eq(1L), eq(NotificationType.CHAT_MESSAGE), eq("New message"),
                eq("DM E2E test from Priya!"), eq("CHAT"), eq(33L));
    }

    @Test
    @DisplayName("DM event for self (sender == recipient) is skipped")
    void shouldSkipSelfDm() {
        final ChatMessageEvent event = dmEvent(34L, 4L, 4L, "note to self");

        listener.handleChatMessage(event);

        verify(notificationService, never()).dispatchInApp(
                eq(4L), eq(NotificationType.CHAT_MESSAGE), eq("New message"),
                eq("note to self"), eq("CHAT"), eq(34L));
    }

    @Test
    @DisplayName("Group event fans out to every embedded recipient except the sender")
    void shouldFanOutToEmbeddedRecipients() {
        final ChatMessageEvent event = groupEvent(
                32L, 4L, List.of(1L, 3L, 4L, 5L), "Group chat E2E test from Sneha!");

        listener.handleChatMessage(event);

        verify(notificationService).dispatchInApp(
                eq(1L), eq(NotificationType.CHAT_MESSAGE), eq("New message in your Nest"),
                eq("Group chat E2E test from Sneha!"), eq("CHAT"), eq(32L));
        verify(notificationService).dispatchInApp(
                eq(3L), eq(NotificationType.CHAT_MESSAGE), eq("New message in your Nest"),
                eq("Group chat E2E test from Sneha!"), eq("CHAT"), eq(32L));
        verify(notificationService).dispatchInApp(
                eq(5L), eq(NotificationType.CHAT_MESSAGE), eq("New message in your Nest"),
                eq("Group chat E2E test from Sneha!"), eq("CHAT"), eq(32L));
        // The sender (4) must never be notified about their own message.
        verify(notificationService, never()).dispatchInApp(
                eq(4L), eq(NotificationType.CHAT_MESSAGE), eq("New message in your Nest"),
                eq("Group chat E2E test from Sneha!"), eq("CHAT"), eq(32L));
    }

    @Test
    @DisplayName("Group event falls back to the nest-service when recipientIds is empty")
    void shouldFallBackToNestLookup() {
        final ChatMessageEvent event = new ChatMessageEvent(
                35L, 4L, null, List.of(), "Hello nest!", "NEST_GROUP", 1L, null);
        final NestResponse nest = NestResponse.builder()
                .id(1L)
                .name("Hyderabad Huddlers")
                .members(List.of(
                        member(1L, AppConstants.NEST_MEMBER_STATUS_ACCEPTED),
                        member(4L, AppConstants.NEST_MEMBER_STATUS_ACCEPTED),
                        member(7L, "LEFT")))
                .build();
        when(nestServiceClient.getNest(1L)).thenReturn(nest);

        listener.handleChatMessage(event);

        verify(notificationService).dispatchInApp(
                eq(1L), eq(NotificationType.CHAT_MESSAGE), eq("New message in Hyderabad Huddlers"),
                eq("Hello nest!"), eq("CHAT"), eq(35L));
        // Sender (4) skipped, and the LEFT member (7) must not be notified.
        verify(notificationService, never()).dispatchInApp(
                eq(4L), eq(NotificationType.CHAT_MESSAGE), eq("New message in Hyderabad Huddlers"),
                eq("Hello nest!"), eq("CHAT"), eq(35L));
        verify(notificationService, never()).dispatchInApp(
                eq(7L), eq(NotificationType.CHAT_MESSAGE), eq("New message in Hyderabad Huddlers"),
                eq("Hello nest!"), eq("CHAT"), eq(35L));
    }

    @Test
    @DisplayName("Event without sender is ignored")
    void shouldIgnoreMissingSender() {
        final ChatMessageEvent event = new ChatMessageEvent(
                36L, null, 4L, List.of(), "hi", "DIRECT", null, 2L);

        listener.handleChatMessage(event);

        verify(notificationService, never()).dispatchInApp(
                eq(4L), eq(NotificationType.CHAT_MESSAGE), eq("New message"),
                eq("hi"), eq("CHAT"), eq(36L));
    }

    /** Builds a DM event. */
    private ChatMessageEvent dmEvent(final Long messageId, final Long senderId, final Long recipientId,
                                     final String content) {
        return new ChatMessageEvent(messageId, senderId, recipientId, List.of(), content, "DIRECT", null, 2L);
    }

    /** Builds a group event with the given recipient ids. */
    private ChatMessageEvent groupEvent(final Long messageId, final Long senderId, final List<Long> recipientIds,
                                        final String content) {
        return new ChatMessageEvent(messageId, senderId, null, recipientIds, content, "NEST_GROUP", 1L, null);
    }

    /** Builds a nest member response. */
    private NestMemberResponse member(final Long userId, final String status) {
        return NestMemberResponse.builder()
                .userId(userId)
                .fullName("Member " + userId)
                .status(status)
                .build();
    }
}
