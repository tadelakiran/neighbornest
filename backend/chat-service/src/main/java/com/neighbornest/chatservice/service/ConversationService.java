package com.neighbornest.chatservice.service;

import com.neighbornest.chatservice.client.NestMemberResponse;
import com.neighbornest.chatservice.client.NestResponse;
import com.neighbornest.chatservice.client.NestServiceClient;
import com.neighbornest.chatservice.client.UserProfileResponse;
import com.neighbornest.chatservice.client.UserServiceClient;
import com.neighbornest.chatservice.constants.AppConstants;
import com.neighbornest.chatservice.dto.request.StartConversationRequest;
import com.neighbornest.chatservice.dto.response.ConversationResponse;
import com.neighbornest.chatservice.entity.Conversation;
import com.neighbornest.chatservice.entity.Message;
import com.neighbornest.chatservice.enums.RoomType;
import com.neighbornest.chatservice.exception.BadRequestException;
import com.neighbornest.chatservice.exception.ForbiddenException;
import com.neighbornest.chatservice.exception.ResourceNotFoundException;
import com.neighbornest.chatservice.exception.ServiceUnavailableException;
import com.neighbornest.chatservice.repository.ConversationRepository;
import com.neighbornest.chatservice.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Stream;

/**
 * Service managing direct-message conversations.
 * <p>
 * Conversations store the participant pair normalized (smaller id first) with a
 * database unique constraint, and are only created for users who shared a Nest
 * (active or graduated) — the DM unlock rule enforced via the nest-service.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final NestServiceClient nestServiceClient;
    private final UserServiceClient userServiceClient;

    /** Fallback display name prefix when the user-service is unavailable. */
    private static final String UNKNOWN_USER_PREFIX = "User ";

    /**
     * Finds or creates the unique conversation between the caller and the
     * requested participant. Requires a shared Nest (active or graduated).
     *
     * @param userId  the caller's profile id
     * @param request the start-conversation request
     * @return the conversation response (existing or newly created)
     * @throws BadRequestException  if the participant equals the caller
     * @throws ForbiddenException   if the users never shared a Nest
     * @throws ServiceUnavailableException if the nest-service is unreachable
     */
    @Transactional
    @CacheEvict(value = "conversations", key = "#userId")
    public ConversationResponse startConversation(final Long userId, final StartConversationRequest request) {
        final Long participantId = request.getParticipantId();
        if (participantId.equals(userId)) {
            throw new BadRequestException("You cannot start a conversation with yourself");
        }

        assertDmEligible(userId, participantId);

        final Long participant1 = Math.min(userId, participantId);
        final Long participant2 = Math.max(userId, participantId);

        final Conversation conversation = conversationRepository
                .findByParticipant1IdAndParticipant2Id(participant1, participant2)
                .orElseGet(() -> conversationRepository.save(Conversation.builder()
                        .participant1Id(participant1)
                        .participant2Id(participant2)
                        .build()));

        log.info("Conversation {} ready between profiles {} and {}", conversation.getId(), participant1, participant2);
        return toResponse(conversation, userId);
    }

    /**
     * Returns all conversations of the caller, enriched with the last message
     * and the caller's unread count, newest first.
     *
     * @param userId the caller's profile id
     * @return the list of conversation responses
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "conversations", key = "#userId")
    public List<ConversationResponse> getConversations(final Long userId) {
        return conversationRepository.findAllByParticipant(userId).stream()
                .map(conversation -> toResponse(conversation, userId))
                .toList();
    }

    /**
     * Returns the id of the <em>other</em> participant of a conversation.
     *
     * @param conversationId the conversation id
     * @param userId         the caller's profile id (must be a participant)
     * @return the other participant's profile id
     * @throws ResourceNotFoundException if the conversation does not exist
     * @throws ForbiddenException        if the caller is not a participant
     */
    @Transactional(readOnly = true)
    public Long getOtherParticipant(final Long conversationId, final Long userId) {
        final Conversation conversation = findConversation(conversationId);
        if (!isParticipant(conversation, userId)) {
            throw new ForbiddenException("You are not a participant of this conversation");
        }
        return conversation.getParticipant1Id().equals(userId)
                ? conversation.getParticipant2Id()
                : conversation.getParticipant1Id();
    }

    /**
     * Verifies the user is a participant of the conversation (used by the
     * WebSocket layer before DM sends).
     *
     * @param conversationId the conversation id
     * @param userId         the user's profile id
     */
    @Transactional(readOnly = true)
    public void requireParticipant(final Long conversationId, final Long userId) {
        getOtherParticipant(conversationId, userId);
    }

    /**
     * Enforces the DM unlock rule: the two users must share an active or
     * graduated Nest. The caller's Nests are resolved via the nest-service
     * (which reads the forwarded JWT) and the participant must be an accepted
     * member of at least one of them.
     *
     * @param userId        the caller's profile id
     * @param participantId the other participant's profile id
     */
    private void assertDmEligible(final Long userId, final Long participantId) {
        final List<NestResponse> nests = nestServiceClient.getMyNests();

        final boolean eligible = nests != null && nests.stream()
                .filter(nest -> isSharedNest(nest.getStatus()))
                .flatMap(nest -> nest.getMembers() == null ? Stream.<NestMemberResponse>empty()
                        : nest.getMembers().stream())
                .anyMatch(member -> participantId.equals(member.getUserId())
                        && AppConstants.NEST_MEMBER_STATUS_ACCEPTED.equals(member.getStatus()));

        if (!eligible) {
            log.warn("DM start denied: profiles {} and {} never shared a nest", userId, participantId);
            throw new ForbiddenException(
                    "Direct messages are unlocked only with members of the same active or graduated nest");
        }
    }

    /**
     * Returns whether a Nest status permits DM eligibility.
     *
     * @param status the nest status
     * @return {@code true} for active or graduated Nests
     */
    private boolean isSharedNest(final String status) {
        return AppConstants.NEST_STATUS_ACTIVE.equals(status)
                || AppConstants.NEST_STATUS_GRADUATED.equals(status);
    }

    /**
     * Maps a conversation to its response DTO from the viewer's perspective.
     *
     * @param conversation the conversation entity
     * @param viewerId     the viewer's profile id
     * @return the response DTO
     */
    private ConversationResponse toResponse(final Conversation conversation, final Long viewerId) {
        final Long otherId = conversation.getParticipant1Id().equals(viewerId)
                ? conversation.getParticipant2Id()
                : conversation.getParticipant1Id();

        final UserProfileResponse profile = userServiceClient.getProfile(otherId);
        final Message lastMessage = latestMessage(conversation.getId());
        final long unreadCount = messageRepository.countUnreadDirectMessages(
                RoomType.DIRECT, conversation.getId(), viewerId);

        return ConversationResponse.builder()
                .id(conversation.getId())
                .participantId(otherId)
                .participantName(profile != null && profile.getFullName() != null
                        ? profile.getFullName() : UNKNOWN_USER_PREFIX + otherId)
                .participantPhotoUrl(profile != null ? profile.getProfilePhotoUrl() : null)
                .lastMessageContent(lastMessage != null ? lastMessage.getContent() : null)
                .lastMessageAt(lastMessage != null ? lastMessage.getCreatedAt() : null)
                .unreadCount(unreadCount)
                .build();
    }

    /**
     * Returns the latest message of a conversation, or {@code null}.
     *
     * @param conversationId the conversation id
     * @return the latest message if any
     */
    private Message latestMessage(final Long conversationId) {
        final List<Message> latest = messageRepository.findLatestByConversation(
                RoomType.DIRECT, conversationId, PageRequest.of(0, 1));
        return latest.isEmpty() ? null : latest.get(0);
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
}
