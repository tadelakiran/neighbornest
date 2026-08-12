package com.neighbornest.chatservice.security;

import com.neighbornest.chatservice.client.NestResponse;
import com.neighbornest.chatservice.client.NestServiceClient;
import com.neighbornest.chatservice.client.UserProfileResponse;
import com.neighbornest.chatservice.client.UserServiceClient;
import com.neighbornest.chatservice.constants.AppConstants;
import com.neighbornest.chatservice.entity.Conversation;
import com.neighbornest.chatservice.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * STOMP channel interceptor enforcing WebSocket security.
 * <p>
 * <ul>
 *   <li><strong>CONNECT</strong> — extracts the JWT from the
 *       {@code Authorization} or {@code token} native STOMP header, validates
 *       it against the shared secret, bridges the auth user id to the
 *       user-service profile id and stores the principal (and token) on the
 *       session. Connections without a valid token are rejected with an ERROR
 *       frame.</li>
 *   <li><strong>SUBSCRIBE</strong> — verifies the user may subscribe to the
 *       destination: Nest topics require an active membership (via the
 *       nest-service), user queues are only reachable by their owner.</li>
 *   <li><strong>SEND</strong> — verifies the user may send to the destination:
 *       Nest sends require membership, DM sends require conversation
 *       participation.</li>
 * </ul>
 * All nest-service authorization calls fail closed: if the nest-service is
 * unreachable the frame is rejected.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserServiceClient userServiceClient;
    private final NestServiceClient nestServiceClient;
    private final ConversationRepository conversationRepository;

    private static final Pattern NEST_SUBSCRIBE =
            Pattern.compile("^/topic/nest\\.(\\d+)\\.(messages|typing|read)$");
    private static final Pattern USER_QUEUE_SUBSCRIBE =
            Pattern.compile("^/queue/user\\.(\\d+)\\.(dm|typing|read)$");
    private static final Pattern NEST_SEND =
            Pattern.compile("^/app/chat/nest/(\\d+)/(send|typing)$");
    private static final Pattern DM_SEND =
            Pattern.compile("^/app/chat/dm/(\\d+)/(send|typing)$");

    private static final String TOKEN_HEADER = "token";
    private static final String MARK_READ_DESTINATION = "/app/chat/read";

    /**
     * Intercepts every inbound STOMP frame and enforces authentication and
     * destination permissions.
     *
     * @param message the inbound message
     * @param channel the message channel
     * @return the (possibly modified) message, or the original when the
     *         command does not require checks
     */
    @Override
    public Message<?> preSend(final Message<?> message, final MessageChannel channel) {
        final StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        final StompCommand command = accessor.getCommand();
        if (command == null) {
            return message;
        }

        switch (command) {
            case CONNECT -> handleConnect(accessor);
            case SUBSCRIBE -> handleSubscribe(accessor);
            case SEND -> handleSend(accessor);
            default -> {
                // Heartbeats, DISCONNECT, ACK, etc. need no checks.
            }
        }
        return message;
    }

    /**
     * Validates the JWT on CONNECT, resolves the profile id and stores the
     * principal plus the raw Authorization header on the session.
     *
     * @param accessor the STOMP header accessor of the CONNECT frame
     */
    private void handleConnect(final StompHeaderAccessor accessor) {
        final String authorizationHeader = resolveAuthorizationHeader(accessor);
        if (authorizationHeader == null) {
            log.warn("WebSocket CONNECT rejected: missing JWT");
            throw new MessagingException("Unauthorized: missing JWT in CONNECT headers");
        }

        final String token = extractToken(authorizationHeader);
        if (!jwtService.isValid(token)) {
            log.warn("WebSocket CONNECT rejected: invalid JWT");
            throw new MessagingException("Unauthorized: invalid or expired JWT");
        }

        final String email = jwtService.extractEmail(token);
        final Long profileId = resolveProfileId(authorizationHeader);
        if (profileId == null) {
            log.warn("WebSocket CONNECT rejected for {}: could not resolve profile id", email);
            throw new MessagingException("Unauthorized: could not resolve your user profile");
        }

        accessor.setUser(new AuthenticatedUser(profileId, email, authorizationHeader));

        final Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        if (sessionAttributes != null) {
            sessionAttributes.put(AppConstants.WS_SESSION_PROFILE_ID, profileId);
            sessionAttributes.put(AppConstants.WS_SESSION_EMAIL, email);
            sessionAttributes.put(AppConstants.WS_SESSION_TOKEN, authorizationHeader);
        }

        log.info("WebSocket CONNECT accepted for profile id: {}", profileId);
    }

    /**
     * Enforces subscription permissions for the requested destination.
     *
     * @param accessor the STOMP header accessor of the SUBSCRIBE frame
     */
    private void handleSubscribe(final StompHeaderAccessor accessor) {
        final AuthenticatedUser user = currentUser(accessor);
        final String destination = accessor.getDestination();
        if (destination == null) {
            throw new MessagingException("Forbidden: missing destination");
        }

        final Matcher nest = NEST_SUBSCRIBE.matcher(destination);
        if (nest.matches()) {
            requireNestMember(user, Long.valueOf(nest.group(1)));
            return;
        }

        final Matcher queue = USER_QUEUE_SUBSCRIBE.matcher(destination);
        if (queue.matches()) {
            final Long ownerId = Long.valueOf(queue.group(1));
            if (!user.userId().equals(ownerId)) {
                throw new MessagingException("Forbidden: cannot subscribe to another user's private queue");
            }
            return;
        }

        // Spring-managed user destinations (e.g. /user/queue/messages) are
        // scoped to the authenticated principal automatically.
        if (destination.startsWith("/user/")) {
            return;
        }

        throw new MessagingException("Forbidden: subscription destination not allowed: " + destination);
    }

    /**
     * Enforces send permissions for the requested destination.
     *
     * @param accessor the STOMP header accessor of the SEND frame
     */
    private void handleSend(final StompHeaderAccessor accessor) {
        final AuthenticatedUser user = currentUser(accessor);
        final String destination = accessor.getDestination();
        if (destination == null) {
            throw new MessagingException("Forbidden: missing destination");
        }

        final Matcher nest = NEST_SEND.matcher(destination);
        if (nest.matches()) {
            requireNestMember(user, Long.valueOf(nest.group(1)));
            return;
        }

        final Matcher dm = DM_SEND.matcher(destination);
        if (dm.matches()) {
            requireConversationParticipant(user, Long.valueOf(dm.group(1)));
            return;
        }

        if (MARK_READ_DESTINATION.equals(destination)) {
            return;
        }

        throw new MessagingException("Forbidden: send destination not allowed: " + destination);
    }

    /**
     * Verifies the user is an active member of the Nest via the nest-service.
     *
     * @param user   the authenticated principal
     * @param nestId the nest id
     */
    private void requireNestMember(final AuthenticatedUser user, final Long nestId) {
        // Explicit header — the STOMP thread cannot rely on thread-local
        // propagation for the Feign call.
        final NestResponse nest = nestServiceClient.getNest(nestId, user.token());
        final boolean member = nest != null && nest.getMembers() != null && nest.getMembers().stream()
                .anyMatch(m -> user.userId().equals(m.getUserId())
                        && AppConstants.NEST_MEMBER_STATUS_ACCEPTED.equals(m.getStatus()));
        if (!member) {
            throw new MessagingException("Forbidden: you are not an active member of nest " + nestId);
        }
    }

    /**
     * Verifies the user is a participant of the conversation.
     *
     * @param user           the authenticated principal
     * @param conversationId the conversation id
     */
    private void requireConversationParticipant(final AuthenticatedUser user, final Long conversationId) {
        final Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new MessagingException("Forbidden: conversation not found: " + conversationId));
        if (!user.userId().equals(conversation.getParticipant1Id())
                && !user.userId().equals(conversation.getParticipant2Id())) {
            throw new MessagingException("Forbidden: you are not a participant of conversation " + conversationId);
        }
    }

    /**
     * Resolves the principal stored on the session.
     *
     * @param accessor the STOMP header accessor
     * @return the authenticated principal
     */
    private AuthenticatedUser currentUser(final StompHeaderAccessor accessor) {
        if (accessor.getUser() instanceof final AuthenticatedUser user) {
            return user;
        }
        throw new MessagingException("Unauthorized: no authenticated WebSocket session");
    }

    /**
     * Bridges the auth user id to the user-service profile id by calling
     * {@code /api/users/me} with the CONNECT token passed explicitly.
     * <p>
     * The STOMP CONNECT frame is processed on a different thread than the
     * Feign HTTP request, so thread-local header propagation (via
     * {@link AuthHeaderPropagator}) cannot be relied on here — the header is
     * forwarded as an explicit request parameter instead.
     * </p>
     *
     * @param authorizationHeader the raw Authorization header value
     * @return the profile id, or {@code null} if it cannot be resolved
     */
    private Long resolveProfileId(final String authorizationHeader) {
        final UserProfileResponse profile = userServiceClient.getMyProfile(authorizationHeader);
        return profile == null ? null : profile.getId();
    }

    /**
     * Resolves the Authorization header value from the STOMP native headers,
     * accepting either {@code Authorization: Bearer <token>} or the plain
     * {@code token} header used by some STOMP clients.
     *
     * @param accessor the STOMP header accessor
     * @return the raw Authorization header value (Bearer-prefixed), or {@code null}
     */
    private String resolveAuthorizationHeader(final StompHeaderAccessor accessor) {
        final String authorization = nativeHeader(accessor, AppConstants.AUTHORIZATION_HEADER);
        if (StringUtils.hasText(authorization)) {
            return authorization.trim();
        }
        final String token = nativeHeader(accessor, TOKEN_HEADER);
        if (StringUtils.hasText(token)) {
            return AppConstants.BEARER_PREFIX + token.trim();
        }
        return null;
    }

    /**
     * Reads a single native STOMP header value.
     *
     * @param accessor the STOMP header accessor
     * @param name     the header name
     * @return the first value, or {@code null}
     */
    private String nativeHeader(final StompHeaderAccessor accessor, final String name) {
        if (accessor.getNativeHeader(name) == null || accessor.getNativeHeader(name).isEmpty()) {
            return null;
        }
        return accessor.getNativeHeader(name).get(0);
    }

    /**
     * Strips the Bearer prefix from an Authorization header value.
     *
     * @param authorizationHeader the raw header value
     * @return the bare JWT
     */
    private String extractToken(final String authorizationHeader) {
        if (authorizationHeader.startsWith(AppConstants.BEARER_PREFIX)) {
            return authorizationHeader.substring(AppConstants.BEARER_PREFIX.length()).trim();
        }
        return authorizationHeader.trim();
    }
}
