package com.neighbornest.chatservice.service;

import com.neighbornest.chatservice.client.NestMemberResponse;
import com.neighbornest.chatservice.client.NestResponse;
import com.neighbornest.chatservice.client.NestServiceClient;
import com.neighbornest.chatservice.client.UserProfileResponse;
import com.neighbornest.chatservice.client.UserServiceClient;
import com.neighbornest.chatservice.config.ChatServiceProperties;
import com.neighbornest.chatservice.constants.AppConstants;
import com.neighbornest.chatservice.dto.request.ChatMessagePayload;
import com.neighbornest.chatservice.dto.response.MessageResponse;
import com.neighbornest.chatservice.entity.Conversation;
import com.neighbornest.chatservice.entity.Message;
import com.neighbornest.chatservice.entity.ReadReceipt;
import com.neighbornest.chatservice.enums.MessageType;
import com.neighbornest.chatservice.enums.RoomType;
import com.neighbornest.chatservice.exception.BadRequestException;
import com.neighbornest.chatservice.exception.ForbiddenException;
import com.neighbornest.chatservice.exception.ResourceNotFoundException;
import com.neighbornest.chatservice.exception.ServiceUnavailableException;
import com.neighbornest.chatservice.repository.ConversationRepository;
import com.neighbornest.chatservice.repository.MessageRepository;
import com.neighbornest.chatservice.repository.ReadReceiptRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link ChatMessageService}.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ChatMessageService Unit Tests")
class ChatMessageServiceTest {

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private ReadReceiptRepository readReceiptRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private UserServiceClient userServiceClient;

    @Mock
    private NestServiceClient nestServiceClient;

    @Mock
    private RabbitTemplate rabbitTemplate;

    private ChatMessageService chatMessageService;

    private ChatServiceProperties chatServiceProperties;

    private static final Long SENDER_ID = 7L;
    private static final Long OTHER_ID = 12L;
    private static final Long NEST_ID = 1L;
    private static final Long CONVERSATION_ID = 5L;

    @BeforeEach
    void setUp() {
        final ChatServiceProperties.Events events = new ChatServiceProperties.Events();
        events.setExchange("nest.events");
        events.setChatRoutingKey("chat.message.sent");
        chatServiceProperties = new ChatServiceProperties();
        chatServiceProperties.setEvents(events);
        chatMessageService = new ChatMessageService(
                messageRepository, readReceiptRepository, conversationRepository, userServiceClient,
                nestServiceClient, rabbitTemplate, chatServiceProperties);
    }

    @Nested
    @DisplayName("sendNestMessage method")
    class SendNestMessageTests {

        @Test
        @DisplayName("Should validate membership, save and enrich a group message")
        void shouldSendNestMessage() {
            when(nestServiceClient.getNest(NEST_ID)).thenReturn(nestWithMember(SENDER_ID, "ACCEPTED"));
            when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
                final Message message = inv.getArgument(0);
                message.setId(101L);
                return message;
            });
            when(userServiceClient.getProfile(SENDER_ID))
                    .thenReturn(UserProfileResponse.builder().id(SENDER_ID).fullName("Jane Doe").build());

            final MessageResponse response = chatMessageService.sendNestMessage(
                    NEST_ID, SENDER_ID, payload("Hello nest!", MessageType.TEXT), null);

            assertThat(response.getId()).isEqualTo(101L);
            assertThat(response.getSenderId()).isEqualTo(SENDER_ID);
            assertThat(response.getSenderName()).isEqualTo("Jane Doe");
            assertThat(response.getContent()).isEqualTo("Hello nest!");
            assertThat(response.getMessageType()).isEqualTo(MessageType.TEXT);

            final ArgumentCaptor<Message> captor = ArgumentCaptor.forClass(Message.class);
            verify(messageRepository).save(captor.capture());
            assertThat(captor.getValue().getRoomType()).isEqualTo(RoomType.NEST_GROUP);
            assertThat(captor.getValue().getNestId()).isEqualTo(NEST_ID);
            assertThat(captor.getValue().getSenderId()).isEqualTo(SENDER_ID);
        }

        @Test
        @DisplayName("Should reject a non-member sender")
        void shouldRejectNonMember() {
            when(nestServiceClient.getNest(NEST_ID)).thenReturn(nestWithMember(99L, "ACCEPTED"));

            assertThatThrownBy(() -> chatMessageService.sendNestMessage(
                    NEST_ID, SENDER_ID, payload("hi", MessageType.TEXT), null))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("active member");

            verify(messageRepository, never()).save(any(Message.class));
        }

        @Test
        @DisplayName("Should strip HTML tags from the content")
        void shouldStripHtml() {
            when(nestServiceClient.getNest(NEST_ID)).thenReturn(nestWithMember(SENDER_ID, "ACCEPTED"));
            when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
                final Message message = inv.getArgument(0);
                message.setId(102L);
                return message;
            });

            final MessageResponse response = chatMessageService.sendNestMessage(
                    NEST_ID, SENDER_ID, payload("<script>alert('x')</script>Hello <b>there</b>", MessageType.TEXT), null);

            assertThat(response.getContent()).isEqualTo("alert('x')Hello there");
        }

        @Test
        @DisplayName("Should reject blank content")
        void shouldRejectBlankContent() {
            when(nestServiceClient.getNest(NEST_ID)).thenReturn(nestWithMember(SENDER_ID, "ACCEPTED"));

            assertThatThrownBy(() -> chatMessageService.sendNestMessage(
                    NEST_ID, SENDER_ID, payload("   ", MessageType.TEXT), null))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("must not be blank");
        }

        @Test
        @DisplayName("Should reject content that is only HTML tags")
        void shouldRejectHtmlOnlyContent() {
            when(nestServiceClient.getNest(NEST_ID)).thenReturn(nestWithMember(SENDER_ID, "ACCEPTED"));

            assertThatThrownBy(() -> chatMessageService.sendNestMessage(
                    NEST_ID, SENDER_ID, payload("<b></b>", MessageType.TEXT), null))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("must not be blank");
        }

        @Test
        @DisplayName("Should reject content longer than the maximum")
        void shouldRejectOversizedContent() {
            when(nestServiceClient.getNest(NEST_ID)).thenReturn(nestWithMember(SENDER_ID, "ACCEPTED"));
            final String longContent = "x".repeat(AppConstants.MAX_MESSAGE_LENGTH + 1);

            assertThatThrownBy(() -> chatMessageService.sendNestMessage(
                    NEST_ID, SENDER_ID, payload(longContent, MessageType.TEXT), null))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("must not exceed");
        }

        @Test
        @DisplayName("Should fail closed with 503 when the nest-service is unavailable")
        void shouldFailClosedWhenNestServiceDown() {
            when(nestServiceClient.getNest(NEST_ID)).thenThrow(new ServiceUnavailableException("down"));

            assertThatThrownBy(() -> chatMessageService.sendNestMessage(
                    NEST_ID, SENDER_ID, payload("hi", MessageType.TEXT), null))
                    .isInstanceOf(ServiceUnavailableException.class);
        }
    }

    @Nested
    @DisplayName("sendDirectMessage method")
    class SendDirectMessageTests {

        @Test
        @DisplayName("Should save a direct message for a participant")
        void shouldSendDirectMessage() {
            when(conversationRepository.findById(CONVERSATION_ID))
                    .thenReturn(Optional.of(conversation(SENDER_ID, OTHER_ID)));
            when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
                final Message message = inv.getArgument(0);
                message.setId(201L);
                return message;
            });
            when(userServiceClient.getProfile(SENDER_ID))
                    .thenReturn(UserProfileResponse.builder().id(SENDER_ID).fullName("Jane Doe").build());

            final MessageResponse response = chatMessageService.sendDirectMessage(
                    CONVERSATION_ID, SENDER_ID, payload("psst", null), null);

            assertThat(response.getId()).isEqualTo(201L);
            assertThat(response.getSenderName()).isEqualTo("Jane Doe");
            assertThat(response.getMessageType()).isEqualTo(MessageType.TEXT);

            final ArgumentCaptor<Message> captor = ArgumentCaptor.forClass(Message.class);
            verify(messageRepository).save(captor.capture());
            assertThat(captor.getValue().getRoomType()).isEqualTo(RoomType.DIRECT);
            assertThat(captor.getValue().getConversationId()).isEqualTo(CONVERSATION_ID);
        }

        @Test
        @DisplayName("Should reject a non-participant sender")
        void shouldRejectNonParticipant() {
            when(conversationRepository.findById(CONVERSATION_ID))
                    .thenReturn(Optional.of(conversation(SENDER_ID, OTHER_ID)));

            assertThatThrownBy(() -> chatMessageService.sendDirectMessage(
                    CONVERSATION_ID, 99L, payload("hi", MessageType.TEXT), null))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("not a participant");
        }

        @Test
        @DisplayName("Should throw when the conversation does not exist")
        void shouldThrowWhenConversationMissing() {
            when(conversationRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> chatMessageService.sendDirectMessage(
                    999L, SENDER_ID, payload("hi", MessageType.TEXT), null))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Conversation not found");
        }
    }

    @Nested
    @DisplayName("getNestMessages method")
    class GetNestMessagesTests {

        @Test
        @DisplayName("Should return an enriched page and mark unread messages for the caller")
        void shouldReturnPageAndMarkRead() {
            when(nestServiceClient.getNest(NEST_ID)).thenReturn(nestWithMember(SENDER_ID, "ACCEPTED"));
            final Message message = message(101L, SENDER_ID, "Hello nest!");
            final Page<Message> page = new PageImpl<>(List.of(message), PageRequest.of(0, 50), 1);
            when(messageRepository.findByRoomTypeAndNestId(RoomType.NEST_GROUP, NEST_ID, PageRequest.of(0, 50)))
                    .thenReturn(page);
            when(readReceiptRepository.findByMessageIdInAndUserId(anyCollection(), eq(SENDER_ID)))
                    .thenReturn(List.of());
            when(userServiceClient.getProfile(SENDER_ID))
                    .thenReturn(UserProfileResponse.builder().id(SENDER_ID).fullName("Jane Doe").build());

            final Page<MessageResponse> result = chatMessageService.getNestMessages(
                    NEST_ID, SENDER_ID, PageRequest.of(0, 50));

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getSenderName()).isEqualTo("Jane Doe");
            assertThat(result.getContent().get(0).isReadByMe()).isFalse();

            verify(readReceiptRepository).saveAll(anyCollection());
        }

        @Test
        @DisplayName("Should report messages already read by the caller without re-saving receipts")
        void shouldReportAlreadyReadMessages() {
            when(nestServiceClient.getNest(NEST_ID)).thenReturn(nestWithMember(SENDER_ID, "ACCEPTED"));
            final Message message = message(101L, SENDER_ID, "Hello nest!");
            final Page<Message> page = new PageImpl<>(List.of(message), PageRequest.of(0, 50), 1);
            when(messageRepository.findByRoomTypeAndNestId(RoomType.NEST_GROUP, NEST_ID, PageRequest.of(0, 50)))
                    .thenReturn(page);
            final ReadReceipt receipt = new ReadReceipt();
            receipt.setMessage(message);
            receipt.setUserId(SENDER_ID);
            when(readReceiptRepository.findByMessageIdInAndUserId(anyCollection(), eq(SENDER_ID)))
                    .thenReturn(List.of(receipt));
            when(userServiceClient.getProfile(SENDER_ID))
                    .thenReturn(UserProfileResponse.builder().id(SENDER_ID).fullName("Jane Doe").build());

            final Page<MessageResponse> result = chatMessageService.getNestMessages(
                    NEST_ID, SENDER_ID, PageRequest.of(0, 50));

            assertThat(result.getContent().get(0).isReadByMe()).isTrue();
            verify(readReceiptRepository, never()).saveAll(anyCollection());
        }

        @Test
        @DisplayName("Should reject a non-member caller")
        void shouldRejectNonMember() {
            when(nestServiceClient.getNest(NEST_ID)).thenReturn(nestWithMember(99L, "ACCEPTED"));

            assertThatThrownBy(() -> chatMessageService.getNestMessages(
                    NEST_ID, SENDER_ID, PageRequest.of(0, 50)))
                    .isInstanceOf(ForbiddenException.class);
        }
    }

    @Nested
    @DisplayName("getNestMemberIds method")
    class GetNestMemberIdsTests {

        @Test
        @DisplayName("Should return only active member ids")
        void shouldReturnActiveMembers() {
            when(nestServiceClient.getNest(NEST_ID)).thenReturn(NestResponse.builder()
                    .id(NEST_ID)
                    .members(List.of(
                            member(SENDER_ID, "ACCEPTED"),
                            member(OTHER_ID, "ACCEPTED"),
                            member(99L, "LEFT")))
                    .build());

            final List<Long> ids = chatMessageService.getNestMemberIds(NEST_ID, SENDER_ID);

            assertThat(ids).containsExactly(SENDER_ID, OTHER_ID);
        }
    }

    @Nested
    @DisplayName("saveSystemMessage method")
    class SaveSystemMessageTests {

        @Test
        @DisplayName("Should persist a SYSTEM message with the platform sender name")
        void shouldSaveSystemMessage() {
            when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
                final Message message = inv.getArgument(0);
                message.setId(301L);
                return message;
            });

            final MessageResponse response = chatMessageService.saveSystemMessage(NEST_ID, "Welcome to Nest!");

            assertThat(response.getSenderId()).isEqualTo(AppConstants.SYSTEM_SENDER_ID);
            assertThat(response.getSenderName()).isEqualTo(AppConstants.SYSTEM_SENDER_NAME);
            assertThat(response.getMessageType()).isEqualTo(MessageType.SYSTEM);

            verify(userServiceClient, never()).getProfile(any());
        }
    }

    /** Builds a chat message payload. */
    private ChatMessagePayload payload(final String content, final MessageType type) {
        return ChatMessagePayload.builder()
                .roomType(RoomType.NEST_GROUP)
                .nestId(NEST_ID)
                .content(content)
                .messageType(type)
                .build();
    }

    /** Builds a nest response containing the given member. */
    private NestResponse nestWithMember(final Long memberId, final String status) {
        return NestResponse.builder()
                .id(NEST_ID)
                .name("Mission Mates")
                .status(AppConstants.NEST_STATUS_ACTIVE)
                .members(List.of(member(memberId, status)))
                .build();
    }

    /** Builds a nest member response. */
    private NestMemberResponse member(final Long userId, final String status) {
        return NestMemberResponse.builder()
                .userId(userId)
                .fullName("Jane Doe")
                .status(status)
                .build();
    }

    /** Builds a conversation entity. */
    private Conversation conversation(final Long p1, final Long p2) {
        final Conversation conversation = new Conversation();
        conversation.setId(CONVERSATION_ID);
        conversation.setParticipant1Id(Math.min(p1, p2));
        conversation.setParticipant2Id(Math.max(p1, p2));
        conversation.setCreatedAt(LocalDateTime.now());
        return conversation;
    }

    /** Builds a message entity. */
    private Message message(final Long id, final Long senderId, final String content) {
        final Message message = new Message();
        message.setId(id);
        message.setRoomType(RoomType.NEST_GROUP);
        message.setNestId(NEST_ID);
        message.setSenderId(senderId);
        message.setContent(content);
        message.setMessageType(MessageType.TEXT);
        message.setCreatedAt(LocalDateTime.now());
        return message;
    }
}
