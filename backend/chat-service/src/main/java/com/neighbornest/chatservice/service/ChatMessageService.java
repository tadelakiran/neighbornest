package com.neighbornest.chatservice.service;

import com.neighbornest.chatservice.client.NestMemberResponse;
import com.neighbornest.chatservice.client.NestResponse;
import com.neighbornest.chatservice.client.NestServiceClient;
import com.neighbornest.chatservice.client.UserProfileResponse;
import com.neighbornest.chatservice.client.UserServiceClient;
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
import com.neighbornest.chatservice.repository.ConversationRepository;
import com.neighbornest.chatservice.repository.MessageRepository;
import com.neighbornest.chatservice.repository.ReadReceiptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service handling chat message operations.
 * <p>
 * Validates Nest membership (group chat) and conversation participation (DMs)
 * before persisting, sanitizes content (HTML stripped, length enforced),
 * enriches responses with sender details from the user-service and maintains
 * read receipts. Also generates SYSTEM messages for Nest lifecycle events.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatMessageService {

    private final MessageRepository messageRepository;
    private final ReadReceiptRepository readReceiptRepository;
    private final ConversationRepository conversationRepository;
    private final UserServiceClient userServiceClient;
    private final NestServiceClient nestServiceClient;

    /** Matches any HTML tag so tags are stripped from message content. */
    private static final String HTML_TAG_PATTERN = "<[^>]*>";

    /** Fallback display name prefix when the user-service is unavailable. */
    private static final String UNKNOWN_USER_PREFIX = "User ";

    /**
     * Validates membership, sanitizes and persists a group (Nest) message.
     *
     * @param nestId   the nest id
     * @param senderId the sender's profile id
     * @param payload  the message payload
     * @return the enriched message response
     * @throws ForbiddenException        if the sender is not an active Nest member
     * @throws BadRequestException       if the content is blank or too long
     */
    @Transactional
    public MessageResponse sendNestMessage(final Long nestId, final Long senderId, final ChatMessagePayload payload) {
        requireNestMember(nestId, senderId);

        final Message message = Message.builder()
                .roomType(RoomType.NEST_GROUP)
                .nestId(nestId)
                .senderId(senderId)
                .content(sanitize(payload.getContent()))
                .messageType(resolveMessageType(payload))
                .build();

        final Message saved = messageRepository.save(message);
        log.info("Profile {} sent a {} message to nest {}", senderId, saved.getMessageType(), nestId);
        return toResponse(saved, null, Set.of(), new HashMap<>());
    }

    /**
     * Validates participation, sanitizes and persists a direct message.
     *
     * @param conversationId the conversation id
     * @param senderId       the sender's profile id
     * @param payload        the message payload
     * @return the enriched message response
     * @throws ResourceNotFoundException if the conversation does not exist
     * @throws ForbiddenException        if the sender is not a participant
     * @throws BadRequestException       if the content is blank or too long
     */
    @Transactional
    public MessageResponse sendDirectMessage(final Long conversationId, final Long senderId,
                                             final ChatMessagePayload payload) {
        final Conversation conversation = findConversation(conversationId);
        if (!isParticipant(conversation, senderId)) {
            throw new ForbiddenException("You are not a participant of this conversation");
        }

        final Message message = Message.builder()
                .roomType(RoomType.DIRECT)
                .conversationId(conversationId)
                .senderId(senderId)
                .content(sanitize(payload.getContent()))
                .messageType(resolveMessageType(payload))
                .build();

        final Message saved = messageRepository.save(message);
        log.info("Profile {} sent a direct message in conversation {}", senderId, conversationId);
        return toResponse(saved, null, Set.of(), new HashMap<>());
    }

    /**
     * Returns a paginated, enriched history of a Nest's group messages and
     * marks the returned page as read for the caller.
     *
     * @param nestId   the nest id
     * @param userId   the caller's profile id
     * @param pageable the paging and sorting specification
     * @return the page of messages
     * @throws ForbiddenException if the caller is not an active Nest member
     */
    @Transactional(readOnly = true)
    public Page<MessageResponse> getNestMessages(final Long nestId, final Long userId, final Pageable pageable) {
        requireNestMember(nestId, userId);

        final Page<Message> page = messageRepository.findByRoomTypeAndNestId(RoomType.NEST_GROUP, nestId, pageable);
        final Set<Long> readIds = markRead(page.getContent(), userId);

        final Map<Long, UserProfileResponse> profileCache = new HashMap<>();
        return page.map(message -> toResponse(message, userId, readIds, profileCache));
    }

    /**
     * Returns a paginated, enriched history of a direct-message conversation
     * and marks the returned page as read for the caller.
     *
     * @param conversationId the conversation id
     * @param userId         the caller's profile id
     * @param pageable       the paging and sorting specification
     * @return the page of messages
     * @throws ResourceNotFoundException if the conversation does not exist
     * @throws ForbiddenException        if the caller is not a participant
     */
    @Transactional(readOnly = true)
    public Page<MessageResponse> getDirectMessages(final Long conversationId, final Long userId,
                                                   final Pageable pageable) {
        final Conversation conversation = findConversation(conversationId);
        if (!isParticipant(conversation, userId)) {
            throw new ForbiddenException("You are not a participant of this conversation");
        }

        final Page<Message> page =
                messageRepository.findByRoomTypeAndConversationId(RoomType.DIRECT, conversationId, pageable);
        final Set<Long> readIds = markRead(page.getContent(), userId);

        final Map<Long, UserProfileResponse> profileCache = new HashMap<>();
        return page.map(message -> toResponse(message, userId, readIds, profileCache));
    }

    /**
     * Returns the profile ids of all active members of a Nest (placeholder for
     * future Redis-backed online presence tracking).
     *
     * @param nestId the nest id
     * @param userId the caller's profile id (must be a member)
     * @return the list of active member profile ids
     * @throws ForbiddenException if the caller is not an active Nest member
     */
    @Transactional(readOnly = true)
    public List<Long> getNestMemberIds(final Long nestId, final Long userId) {
        final NestResponse nest = requireNestMemberAndGet(nestId, userId);

        return nest.getMembers().stream()
                .filter(member -> AppConstants.NEST_MEMBER_STATUS_ACCEPTED.equals(member.getStatus()))
                .map(NestMemberResponse::getUserId)
                .toList();
    }

    /**
     * Resolves the display name of a sender (used for typing indicators).
     *
     * @param senderId the sender's profile id
     * @return the display name
     */
    @Transactional(readOnly = true)
    public String resolveSenderName(final Long senderId) {
        return senderInfo(senderId, new HashMap<>()).name();
    }

    /**
     * Persists an auto-generated SYSTEM message for a Nest (e.g. welcome or
     * graduation) and returns it for broadcasting.
     *
     * @param nestId  the nest id
     * @param content the system message content
     * @return the enriched message response
     */
    @Transactional
    public MessageResponse saveSystemMessage(final Long nestId, final String content) {
        final Message message = Message.builder()
                .roomType(RoomType.NEST_GROUP)
                .nestId(nestId)
                .senderId(AppConstants.SYSTEM_SENDER_ID)
                .content(content)
                .messageType(MessageType.SYSTEM)
                .build();

        final Message saved = messageRepository.save(message);
        log.info("Saved system message for nest {}", nestId);
        return toResponse(saved, null, Set.of(), new HashMap<>());
    }

    /**
     * Verifies the user is an active member of the Nest via the nest-service.
     *
     * @param nestId the nest id
     * @param userId the user's profile id
     * @throws ForbiddenException if the user is not an active member
     */
    private void requireNestMember(final Long nestId, final Long userId) {
        requireNestMemberAndGet(nestId, userId);
    }

    /**
     * Verifies the user is an active member of the Nest and returns the Nest
     * response so callers can reuse it instead of fetching the Nest twice.
     *
     * @param nestId the nest id
     * @param userId the user's profile id
     * @return the Nest response
     * @throws ForbiddenException if the user is not an active member
     */
    private NestResponse requireNestMemberAndGet(final Long nestId, final Long userId) {
        final NestResponse nest = nestServiceClient.getNest(nestId);
        final boolean member = nest != null && nest.getMembers() != null && nest.getMembers().stream()
                .anyMatch(m -> userId.equals(m.getUserId())
                        && AppConstants.NEST_MEMBER_STATUS_ACCEPTED.equals(m.getStatus()));
        if (!member) {
            throw new ForbiddenException("You are not an active member of this nest");
        }
        return nest;
    }

    /**
     * Strips HTML tags and enforces the maximum message length.
     *
     * @param raw the raw content
     * @return the sanitized content
     * @throws BadRequestException if the content is blank or too long
     */
    private String sanitize(final String raw) {
        if (raw == null || raw.isBlank()) {
            throw new BadRequestException("Message content must not be blank");
        }
        final String stripped = raw.replaceAll(HTML_TAG_PATTERN, "").trim();
        // A payload like "<b></b>" is not blank but strips down to nothing —
        // reject it rather than persisting an empty message.
        if (stripped.isBlank()) {
            throw new BadRequestException("Message content must not be blank");
        }
        if (stripped.length() > AppConstants.MAX_MESSAGE_LENGTH) {
            throw new BadRequestException("Message content must not exceed " + AppConstants.MAX_MESSAGE_LENGTH + " characters");
        }
        return stripped;
    }

    /**
     * Resolves the message content type, defaulting to TEXT.
     *
     * @param payload the message payload
     * @return the message type
     */
    private MessageType resolveMessageType(final ChatMessagePayload payload) {
        return payload.getMessageType() == null ? MessageType.TEXT : payload.getMessageType();
    }

    /**
     * Creates read receipts for the messages the user has not read yet and
     * returns the ids that were already read (single batched lookup).
     *
     * @param messages the messages to mark
     * @param userId   the reader's profile id
     * @return the set of message ids already read by the user
     */
    private Set<Long> markRead(final List<Message> messages, final Long userId) {
        if (messages == null || messages.isEmpty()) {
            return Set.of();
        }
        final List<Long> ids = messages.stream().map(Message::getId).toList();
        // One batched lookup instead of a per-message existsBy… query (N+1).
        final Set<Long> alreadyRead = readReceiptRepository.findByMessageIdInAndUserId(ids, userId).stream()
                .map(receipt -> receipt.getMessage().getId())
                .collect(Collectors.toSet());

        final List<ReadReceipt> newReceipts = messages.stream()
                .filter(message -> !alreadyRead.contains(message.getId()))
                .map(message -> ReadReceipt.builder().message(message).userId(userId).build())
                .toList();

        if (!newReceipts.isEmpty()) {
            readReceiptRepository.saveAll(newReceipts);
            log.debug("Marked {} messages as read for profile {}", newReceipts.size(), userId);
        }
        return alreadyRead;
    }

    /**
     * Maps a message entity to its response DTO, enriching sender details via
     * the (per-call) profile cache.
     *
     * @param message        the message entity
     * @param viewerId       the viewer's profile id (used for the read flag)
     * @param readMessageIds message ids already read by the viewer
     * @param profileCache   per-call cache of user-service profiles
     * @return the response DTO
     */
    private MessageResponse toResponse(final Message message, final Long viewerId,
                                       final Set<Long> readMessageIds,
                                       final Map<Long, UserProfileResponse> profileCache) {
        final SenderInfo sender = senderInfo(message.getSenderId(), profileCache);
        final boolean readByMe = viewerId != null && readMessageIds.contains(message.getId());

        return MessageResponse.builder()
                .id(message.getId())
                .senderId(message.getSenderId())
                .senderName(sender.name())
                .senderPhotoUrl(sender.photoUrl())
                .content(message.getContent())
                .messageType(message.getMessageType())
                .createdAt(message.getCreatedAt())
                .readByMe(readByMe)
                .build();
    }

    /**
     * Resolves the sender display name and photo, caching per call.
     *
     * @param senderId     the sender's profile id
     * @param profileCache per-call cache of user-service profiles
     * @return the sender info
     */
    private SenderInfo senderInfo(final Long senderId, final Map<Long, UserProfileResponse> profileCache) {
        if (senderId.equals(AppConstants.SYSTEM_SENDER_ID)) {
            return new SenderInfo(AppConstants.SYSTEM_SENDER_NAME, null);
        }
        final UserProfileResponse profile = profileCache.computeIfAbsent(senderId, userServiceClient::getProfile);
        if (profile == null || profile.getFullName() == null) {
            return new SenderInfo(UNKNOWN_USER_PREFIX + senderId, null);
        }
        return new SenderInfo(profile.getFullName(), profile.getProfilePhotoUrl());
    }

    /**
     * Finds a conversation or throws.
     *
     * @param conversationId the conversation id
     * @return the conversation entity
     */
    private Conversation findConversation(final Long conversationId) {
        return conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with id: " + conversationId));
    }

    /**
     * Returns whether the user is one of the conversation participants.
     *
     * @param conversation the conversation entity
     * @param userId       the user's profile id
     * @return {@code true} if a participant
     */
    private boolean isParticipant(final Conversation conversation, final Long userId) {
        return userId.equals(conversation.getParticipant1Id()) || userId.equals(conversation.getParticipant2Id());
    }

    /**
     * Sender display information for message enrichment.
     */
    private record SenderInfo(String name, String photoUrl) {
    }
}
