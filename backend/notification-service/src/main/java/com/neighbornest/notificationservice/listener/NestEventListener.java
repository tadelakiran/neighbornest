package com.neighbornest.notificationservice.listener;

import com.neighbornest.notificationservice.client.NestMemberResponse;
import com.neighbornest.notificationservice.client.NestResponse;
import com.neighbornest.notificationservice.client.NestServiceClient;
import com.neighbornest.notificationservice.client.UserProfileResponse;
import com.neighbornest.notificationservice.client.UserServiceClient;
import com.neighbornest.notificationservice.config.NotificationServiceProperties;
import com.neighbornest.notificationservice.constants.AppConstants;
import com.neighbornest.notificationservice.entity.TrackedNest;
import com.neighbornest.notificationservice.enums.NotificationType;
import com.neighbornest.notificationservice.enums.TrackedNestStatus;
import com.neighbornest.notificationservice.event.NestCreatedEvent;
import com.neighbornest.notificationservice.event.NestDisbandedEvent;
import com.neighbornest.notificationservice.event.NestGraduatedEvent;
import com.neighbornest.notificationservice.repository.TrackedNestRepository;
import com.neighbornest.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Consumes Nest lifecycle events from RabbitMQ and fans out notifications.
 * <p>
 * <ul>
 *   <li>{@code nest.created} — registers the Nest in the local
 *       {@link TrackedNest} registry and sends the welcome email to every
 *       member (recipients come from the event payload);</li>
 *   <li>{@code nest.graduated} / {@code nest.disbanded} — send lifecycle
 *       emails; the payloads carry no member ids, so recipients are resolved
 *       from a live nest-service lookup when possible, falling back to the
 *       locally tracked registry (see {@link TrackedNest}).</li>
 * </ul>
 * Expected failures (Feign nulls, missing profiles) are handled inside the
 * {@link NotificationService} and never throw, so the per-member isolation
 * below only needs to separate real failures: {@link DataAccessException}s are
 * rethrown so RabbitMQ retries the message instead of silently losing the
 * event; any other unexpected error is logged and isolated to that member.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NestEventListener {

    private final NotificationService notificationService;
    private final UserServiceClient userServiceClient;
    private final NestServiceClient nestServiceClient;
    private final NotificationServiceProperties properties;
    private final TrackedNestRepository trackedNestRepository;

    /**
     * Handles a Nest-created event: tracks the Nest and welcomes every member.
     *
     * @param event the Nest-created event
     */
    @RabbitListener(queues = "${app.notification.events.created-queue}")
    public void handleNestCreated(final NestCreatedEvent event) {
        log.info("Received nest.created event for nest {}", event.nestId());
        final String nestName = event.name() != null ? event.name() : "your Nest";
        final List<Long> memberIds = distinct(event.memberUserIds());
        if (memberIds.isEmpty()) {
            log.warn("Nest.created event for nest {} carried no member ids; nothing to notify", event.nestId());
            return;
        }

        registerNest(event.nestId(), nestName, event.city(), memberIds);
        final List<String> memberNames = resolveMemberNames(memberIds);
        for (final Long memberId : memberIds) {
            try {
                final Map<String, Object> variables = new HashMap<>();
                variables.put(AppConstants.VAR_USER_NAME, resolveUserName(memberId));
                variables.put(AppConstants.VAR_NEST_NAME, nestName);
                variables.put(AppConstants.VAR_CITY, event.city());
                variables.put(AppConstants.VAR_MEMBERS, memberNames);
                variables.put(AppConstants.VAR_NEST_LINK, nestLink(event.nestId()));
                notificationService.dispatchEmail(
                        memberId,
                        NotificationType.NEST_CREATED,
                        AppConstants.SUBJECT_NEST_WELCOME,
                        AppConstants.TEMPLATE_NEST_WELCOME,
                        variables,
                        "Welcome to " + nestName + "!",
                        "You've been added to " + nestName
                                + (event.city() != null ? " in " + event.city() : "")
                                + ". Your 6-week journey starts now.",
                        AppConstants.RELATED_ENTITY_NEST,
                        event.nestId());
            } catch (final DataAccessException e) {
                log.error("Persistence failure while welcoming member {} of nest {}; rethrowing for retry",
                        memberId, event.nestId(), e);
                throw e;
            } catch (final Exception e) {
                log.error("Failed to process nest.created welcome for member {} of nest {}",
                        memberId, event.nestId(), e);
            }
        }
    }

    /**
     * Handles a Nest-graduated event: congratulates every member of the Nest.
     *
     * @param event the Nest-graduated event
     */
    @RabbitListener(queues = "${app.notification.events.graduated-queue}")
    public void handleNestGraduated(final NestGraduatedEvent event) {
        log.info("Received nest.graduated event for nest {}", event.nestId());
        notifyEndedNest(event.nestId(), event.name(), TrackedNestStatus.GRADUATED,
                NotificationType.NEST_GRADUATED, AppConstants.SUBJECT_NEST_GRADUATE,
                AppConstants.TEMPLATE_NEST_GRADUATE,
                "Congratulations! You graduated from ",
                "Your 6-week journey with ",
                " is complete. Thanks for being part of it!");
    }

    /**
     * Handles a Nest-disbanded event: notifies every member.
     *
     * @param event the Nest-disbanded event
     */
    @RabbitListener(queues = "${app.notification.events.disbanded-queue}")
    public void handleNestDisbanded(final NestDisbandedEvent event) {
        log.info("Received nest.disbanded event for nest {}", event.nestId());
        notifyEndedNest(event.nestId(), null, TrackedNestStatus.DISBANDED,
                NotificationType.NEST_DISBANDED, AppConstants.SUBJECT_NEST_DISBANDED,
                AppConstants.TEMPLATE_NEST_DISBANDED,
                "Your Nest has been disbanded",
                "The Nest '",
                "' has been disbanded. Thanks for the memories!");
    }

    /**
     * Sends lifecycle (graduation / disband) emails to the members of a Nest,
     * resolving recipients from a live lookup with the tracked registry as a
     * fallback, and advances the registry status.
     *
     * @param nestId         the Nest id
     * @param fallbackName   the event's name fallback (may be null)
     * @param status         the status to record in the registry
     * @param type           the notification type
     * @param subjectTemplate the subject template
     * @param templateKey    the email template key
     * @param titlePrefix    title prefix (full title is assembled with nestName)
     * @param bodyPrefix     body prefix before the nest name
     * @param bodySuffix     body suffix after the nest name
     */
    private void notifyEndedNest(final Long nestId, final String fallbackName, final TrackedNestStatus status,
                                 final NotificationType type, final String subjectTemplate,
                                 final String templateKey, final String titlePrefix,
                                 final String bodyPrefix, final String bodySuffix) {
        final NestRecipients recipients = resolveRecipients(nestId, fallbackName);
        if (recipients.memberIds().isEmpty()) {
            log.warn("No recipients resolvable for nest {} (status {}) — skipping notifications",
                    nestId, status);
            return;
        }
        markTrackedStatus(nestId, status);
        for (final Long memberId : recipients.memberIds()) {
            try {
                final Map<String, Object> variables = new HashMap<>();
                variables.put(AppConstants.VAR_USER_NAME, resolveUserName(memberId));
                variables.put(AppConstants.VAR_NEST_NAME, recipients.name());
                variables.put(AppConstants.VAR_NEST_LINK, nestLink(nestId));
                notificationService.dispatchEmail(
                        memberId,
                        type,
                        subjectTemplate,
                        templateKey,
                        variables,
                        titlePrefix + recipients.name(),
                        bodyPrefix + recipients.name() + bodySuffix,
                        AppConstants.RELATED_ENTITY_NEST,
                        nestId);
            } catch (final DataAccessException e) {
                log.error("Persistence failure while notifying member {} of nest {}; rethrowing for retry",
                        memberId, nestId, e);
                throw e;
            } catch (final Exception e) {
                log.error("Failed to process notification for member {} of nest {}",
                        memberId, nestId, e);
            }
        }
    }

    /**
     * Upserts the Nest in the local registry. A registry failure must never
     * break the welcome fan-out, so it is logged and swallowed.
     *
     * @param nestId    the Nest id
     * @param nestName  the Nest name
     * @param city      the Nest city (may be null)
     * @param memberIds the member profile ids
     */
    private void registerNest(final Long nestId, final String nestName, final String city,
                              final List<Long> memberIds) {
        try {
            final TrackedNest tracked = trackedNestRepository.findByNestId(nestId)
                    .map(existing -> {
                        existing.setName(nestName);
                        existing.setCity(city);
                        existing.setStatus(TrackedNestStatus.ACTIVE);
                        existing.setMemberIds(memberIds);
                        return existing;
                    })
                    .orElseGet(() -> TrackedNest.builder()
                            .nestId(nestId)
                            .name(nestName)
                            .city(city)
                            .status(TrackedNestStatus.ACTIVE)
                            .build());
            if (tracked.getId() == null) {
                tracked.setMemberIds(memberIds);
            }
            trackedNestRepository.save(tracked);
            log.info("Tracked nest {} ({} members)", nestId, memberIds.size());
        } catch (final Exception e) {
            log.error("Could not track nest {} in the local registry", nestId, e);
        }
    }

    /**
     * Advances the tracked status of a Nest, tolerating an untracked Nest.
     *
     * @param nestId the Nest id
     * @param status the new status
     */
    private void markTrackedStatus(final Long nestId, final TrackedNestStatus status) {
        try {
            trackedNestRepository.findByNestId(nestId).ifPresent(tracked -> {
                tracked.setStatus(status);
                trackedNestRepository.save(tracked);
            });
        } catch (final Exception e) {
            log.error("Could not update tracked status for nest {}", nestId, e);
        }
    }

    /**
     * Resolves the recipient ids (and best-known name) for a Nest.
     * <p>
     * A live nest-service lookup is preferred; when it is unavailable (no JWT
     * to forward from the consumer thread), the locally tracked registry is
     * used as the fallback.
     * </p>
     *
     * @param nestId       the Nest id
     * @param fallbackName the event's name fallback (may be null)
     * @return the recipients (possibly empty)
     */
    private NestRecipients resolveRecipients(final Long nestId, final String fallbackName) {
        final NestResponse nest = nestServiceClient.getNest(nestId);
        if (nest != null) {
            return new NestRecipients(
                    nest.getName() != null ? nest.getName()
                            : (fallbackName != null ? fallbackName : "your Nest"),
                    allMembers(nest).stream().map(NestMemberResponse::getUserId).toList());
        }
        final TrackedNest tracked = trackedNestRepository.findByNestId(nestId).orElse(null);
        final String name = tracked != null && tracked.getName() != null
                ? tracked.getName() : (fallbackName != null ? fallbackName : "your Nest");
        return new NestRecipients(name, tracked != null ? tracked.memberIdsAsList() : List.of());
    }

    /**
     * Resolves the display names of all members in one pass (used by the
     * welcome email's member list). Unresolvable profiles degrade to
     * {@code "Member {id}"}.
     *
     * @param memberIds the member profile ids
     * @return the display names in the same order
     */
    private List<String> resolveMemberNames(final List<Long> memberIds) {
        final List<String> names = new ArrayList<>(memberIds.size());
        for (final Long memberId : memberIds) {
            final UserProfileResponse profile = userServiceClient.getProfile(memberId);
            names.add(profile != null && profile.getFullName() != null
                    ? profile.getFullName()
                    : AppConstants.UNKNOWN_MEMBER_PREFIX + memberId);
        }
        return names;
    }

    /**
     * Resolves a single member's display name.
     *
     * @param memberId the member profile id
     * @return the display name, or {@code "User {id}"}
     */
    private String resolveUserName(final Long memberId) {
        final UserProfileResponse profile = userServiceClient.getProfile(memberId);
        return profile != null && profile.getFullName() != null
                ? profile.getFullName()
                : AppConstants.UNKNOWN_USER_PREFIX + memberId;
    }

    /**
     * Returns every member of a Nest (any membership status — once a Nest has
     * ended, all members participated in it).
     *
     * @param nest the Nest
     * @return the members, or an empty list
     */
    private List<NestMemberResponse> allMembers(final NestResponse nest) {
        if (nest.getMembers() == null) {
            return List.of();
        }
        return nest.getMembers().stream()
                .filter(member -> member != null && member.getUserId() != null)
                .toList();
    }

    /**
     * Returns the member ids, null-safe and de-duplicated.
     *
     * @param memberIds the raw member id list (may be null)
     * @return the distinct, non-null member ids
     */
    private List<Long> distinct(final List<Long> memberIds) {
        if (memberIds == null) {
            return List.of();
        }
        return memberIds.stream().filter(id -> id != null).distinct().toList();
    }

    /**
     * Builds a deep link to a Nest from the configured base URL.
     *
     * @param nestId the Nest id
     * @return the deep link URL
     */
    private String nestLink(final Long nestId) {
        return properties.getBaseUrl() + "/nests/" + nestId;
    }

    /**
     * Immutable holder of a resolved recipient set and best-known Nest name.
     *
     * @param name      the best-known Nest name
     * @param memberIds the recipient profile ids
     */
    private record NestRecipients(String name, List<Long> memberIds) {
    }
}
