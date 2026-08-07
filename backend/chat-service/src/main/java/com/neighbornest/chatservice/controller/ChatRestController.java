package com.neighbornest.chatservice.controller;

import com.neighbornest.chatservice.constants.AppConstants;
import com.neighbornest.chatservice.dto.request.MarkReadRequest;
import com.neighbornest.chatservice.dto.request.StartConversationRequest;
import com.neighbornest.chatservice.dto.response.ConversationResponse;
import com.neighbornest.chatservice.dto.response.MarkReadResponse;
import com.neighbornest.chatservice.dto.response.MessageResponse;
import com.neighbornest.chatservice.service.ChatMessageService;
import com.neighbornest.chatservice.service.ConversationService;
import com.neighbornest.chatservice.service.ReadReceiptService;
import com.neighbornest.chatservice.util.UserContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for chat history, conversations and read receipts.
 * <p>
 * All endpoints require a valid JWT (validated by the API gateway and this
 * service's security filter). The current caller's chat-domain identity (the
 * user-service profile id) is resolved via {@link UserContext}, which prefers
 * the {@code X-User-Id} header when the gateway injects it and otherwise
 * bridges the JWT through the user-service.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@RestController
@RequestMapping(value = "/api/chat", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Chat", description = "Chat history, conversations and read receipt endpoints")
@SecurityRequirement(name = "bearerAuth")
public class ChatRestController {

    private final ChatMessageService chatMessageService;
    private final ConversationService conversationService;
    private final ReadReceiptService readReceiptService;
    private final UserContext userContext;

    /**
     * Returns a paginated history of a Nest's group messages (newest first).
     * The returned page is marked as read for the caller.
     *
     * @param nestId   the nest id
     * @param pageable paging (default size {@value AppConstants#DEFAULT_PAGE_SIZE}, newest first)
     * @return the page of enriched messages
     */
    @GetMapping("/nests/{nestId}/messages")
    @Operation(summary = "Get Nest chat history",
            description = "Returns a paginated history of a Nest's group messages, enriched with sender details. Members only.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Messages retrieved successfully"),
            @ApiResponse(responseCode = "403", description = "Not an active member of the Nest"),
            @ApiResponse(responseCode = "503", description = "Nest-service unavailable")
    })
    public ResponseEntity<Page<MessageResponse>> getNestMessages(
            @PathVariable("nestId") final Long nestId,
            @PageableDefault(size = AppConstants.DEFAULT_PAGE_SIZE, sort = "createdAt", direction = Sort.Direction.DESC)
            final Pageable pageable) {

        final Long profileId = userContext.requireProfileId();
        log.debug("GET /api/chat/nests/{}/messages - for profile {}", nestId, profileId);
        return ResponseEntity.ok(chatMessageService.getNestMessages(nestId, profileId, pageable));
    }

    /**
     * Returns the ids of a Nest's active members (placeholder for future
     * Redis-backed online presence tracking).
     *
     * @param nestId the nest id
     * @return the list of member profile ids
     */
    @GetMapping("/nests/{nestId}/members/online")
    @Operation(summary = "Get Nest members (online placeholder)",
            description = "Returns all active member ids of a Nest. Online presence will be tracked in Redis in a future iteration; for now all active members are returned.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Member ids retrieved successfully"),
            @ApiResponse(responseCode = "403", description = "Not an active member of the Nest"),
            @ApiResponse(responseCode = "503", description = "Nest-service unavailable")
    })
    public ResponseEntity<List<Long>> getOnlineMembers(@PathVariable("nestId") final Long nestId) {
        final Long profileId = userContext.requireProfileId();
        log.debug("GET /api/chat/nests/{}/members/online - for profile {}", nestId, profileId);
        return ResponseEntity.ok(chatMessageService.getNestMemberIds(nestId, profileId));
    }

    /**
     * Starts (or fetches) a direct-message conversation with another user.
     *
     * @param request the start-conversation request
     * @return the conversation response with status 201 CREATED
     */
    @PostMapping("/dm/start")
    @Operation(summary = "Start a direct-message conversation",
            description = "Finds or creates the unique conversation with the given participant. Unlocked only for users who shared an active or graduated Nest.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Conversation created or fetched"),
            @ApiResponse(responseCode = "400", description = "Invalid participant id or self-conversation"),
            @ApiResponse(responseCode = "403", description = "Users never shared a Nest"),
            @ApiResponse(responseCode = "503", description = "Nest-service unavailable")
    })
    public ResponseEntity<ConversationResponse> startConversation(
            @Valid @RequestBody final StartConversationRequest request) {

        final Long profileId = userContext.requireProfileId();
        log.debug("POST /api/chat/dm/start - profile {} starting conversation with {}",
                profileId, request.getParticipantId());
        final ConversationResponse response = conversationService.startConversation(profileId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Returns all conversations of the caller with last-message preview and
     * unread counts.
     *
     * @return the list of conversation responses
     */
    @GetMapping("/dm/conversations")
    @Operation(summary = "Get my conversations",
            description = "Returns all direct-message conversations of the caller, enriched with the last message and unread count.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Conversations retrieved successfully")
    })
    public ResponseEntity<List<ConversationResponse>> getConversations() {
        final Long profileId = userContext.requireProfileId();
        log.debug("GET /api/chat/dm/conversations - for profile {}", profileId);
        return ResponseEntity.ok(conversationService.getConversations(profileId));
    }

    /**
     * Returns a paginated history of a direct-message conversation. The
     * returned page is marked as read for the caller.
     *
     * @param conversationId the conversation id
     * @param pageable       paging (default size {@value AppConstants#DEFAULT_PAGE_SIZE}, newest first)
     * @return the page of enriched messages
     */
    @GetMapping("/dm/{conversationId}/messages")
    @Operation(summary = "Get direct-message history",
            description = "Returns a paginated history of a direct-message conversation, enriched with sender details.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Messages retrieved successfully"),
            @ApiResponse(responseCode = "403", description = "Not a participant of the conversation"),
            @ApiResponse(responseCode = "404", description = "Conversation not found")
    })
    public ResponseEntity<Page<MessageResponse>> getDirectMessages(
            @PathVariable("conversationId") final Long conversationId,
            @PageableDefault(size = AppConstants.DEFAULT_PAGE_SIZE, sort = "createdAt", direction = Sort.Direction.DESC)
            final Pageable pageable) {

        final Long profileId = userContext.requireProfileId();
        log.debug("GET /api/chat/dm/{}/messages - for profile {}", conversationId, profileId);
        return ResponseEntity.ok(chatMessageService.getDirectMessages(conversationId, profileId, pageable));
    }

    /**
     * Marks a list of messages as read by the caller.
     *
     * @param request the mark-read request
     * @return the number of newly marked messages
     */
    @PostMapping("/messages/read")
    @Operation(summary = "Mark messages as read",
            description = "Creates read receipts for the given message ids and returns how many were newly marked.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Messages marked as read"),
            @ApiResponse(responseCode = "400", description = "messageIds missing or empty")
    })
    public ResponseEntity<MarkReadResponse> markRead(@Valid @RequestBody final MarkReadRequest request) {
        final Long profileId = userContext.requireProfileId();
        log.debug("POST /api/chat/messages/read - profile {} marking {} messages", profileId,
                request.getMessageIds().size());
        final int markedCount = readReceiptService.markRead(profileId, request.getMessageIds()).markedCount();
        return ResponseEntity.ok(new MarkReadResponse(markedCount));
    }
}
