package com.neighbornest.notificationservice.service;

import com.neighbornest.notificationservice.client.UserProfileResponse;
import com.neighbornest.notificationservice.client.UserServiceClient;
import com.neighbornest.notificationservice.constants.AppConstants;
import com.neighbornest.notificationservice.dto.request.CreateTemplateRequest;
import com.neighbornest.notificationservice.dto.request.SendNotificationRequest;
import com.neighbornest.notificationservice.dto.request.UpdatePreferenceRequest;
import com.neighbornest.notificationservice.dto.response.EmailTemplateResponse;
import com.neighbornest.notificationservice.dto.response.NotificationCountResponse;
import com.neighbornest.notificationservice.dto.response.NotificationPreferenceResponse;
import com.neighbornest.notificationservice.dto.response.NotificationResponse;
import com.neighbornest.notificationservice.dto.response.NotificationStatsResponse;
import com.neighbornest.notificationservice.entity.EmailTemplate;
import com.neighbornest.notificationservice.entity.Notification;
import com.neighbornest.notificationservice.entity.NotificationPreference;
import com.neighbornest.notificationservice.enums.NotificationChannel;
import com.neighbornest.notificationservice.enums.NotificationStatus;
import com.neighbornest.notificationservice.enums.NotificationType;
import com.neighbornest.notificationservice.exception.BadRequestException;
import com.neighbornest.notificationservice.exception.ResourceNotFoundException;
import com.neighbornest.notificationservice.repository.EmailTemplateRepository;
import com.neighbornest.notificationservice.repository.NotificationPreferenceRepository;
import com.neighbornest.notificationservice.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Core service for the notification domain.
 * <p>
 * Owns the user inbox (list, unread count, read state), notification
 * preferences, admin template registry and statistics, and the dispatch
 * pipeline that renders and sends emails / SMS and records the outcome as a
 * {@code SENT}/{@code FAILED} notification. Dispatch respects per-user
 * preferences (missing preferences default to "everything enabled").
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final EmailTemplateRepository emailTemplateRepository;
    private final UserServiceClient userServiceClient;
    private final EmailService emailService;
    private final SmsService smsService;

    /** Minimal styled HTML wrapper for raw (non-template) emails. */
    private static final String RAW_EMAIL_HTML = """
            <!DOCTYPE html>
            <html>
            <body style="font-family: Inter, sans-serif; background: #0a0f1c; color: #f8fafc;">
              <div style="max-width: 600px; margin: 0 auto; padding: 40px;">
                <h1 style="color: #38bdf8;">%s</h1>
                <p style="font-size: 16px; line-height: 1.6;">%s</p>
              </div>
            </body>
            </html>
            """;

    /**
     * Returns the user's inbox page, newest first.
     *
     * @param userId   the recipient's profile id
     * @param pageable the paging specification
     * @return the page of notifications
     */
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getForUser(final Long userId, final Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toResponse);
    }

    /**
     * Returns the user's total / unread / read counts.
     *
     * @param userId the recipient's profile id
     * @return the counts
     */
    @Transactional(readOnly = true)
    public NotificationCountResponse getUnreadCount(final Long userId) {
        final long total = notificationRepository.countByUserId(userId);
        final long read = notificationRepository.countByUserIdAndStatus(userId, NotificationStatus.READ);
        return NotificationCountResponse.builder()
                .total(total)
                .unread(total - read)
                .read(read)
                .build();
    }

    /**
     * Marks a single notification as read (ownership-scoped).
     *
     * @param userId         the recipient's profile id
     * @param notificationId the notification id
     * @return the updated notification
     * @throws ResourceNotFoundException if the notification does not exist or
     *                                   belongs to another user
     */
    @Transactional
    public NotificationResponse markRead(final Long userId, final Long notificationId) {
        final Notification notification = notificationRepository
                .findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification not found with id: " + notificationId));

        if (notification.getStatus() != NotificationStatus.READ) {
            notification.setStatus(NotificationStatus.READ);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
        return toResponse(notification);
    }

    /**
     * Marks all of the user's notifications as read.
     *
     * @param userId the recipient's profile id
     * @return the updated counts (unread will be zero)
     */
    @Transactional
    public NotificationCountResponse markAllRead(final Long userId) {
        final List<Notification> unread = notificationRepository
                .findByUserIdAndStatusNot(userId, NotificationStatus.READ);
        if (!unread.isEmpty()) {
            unread.forEach(notification -> {
                notification.setStatus(NotificationStatus.READ);
                notification.setReadAt(LocalDateTime.now());
            });
            notificationRepository.saveAll(unread);
            log.info("Marked {} notifications as read for user {}", unread.size(), userId);
        }
        return getUnreadCount(userId);
    }

    /**
     * Returns the user's preferences, creating default (all-enabled)
     * preferences when no row exists yet.
     *
     * @param userId the user's profile id
     * @return the preferences
     */
    @Transactional(readOnly = true)
    public NotificationPreferenceResponse getPreferences(final Long userId) {
        final NotificationPreference preference = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> NotificationPreference.builder().userId(userId).build());
        return toPreferenceResponse(preference);
    }

    /**
     * Partially updates the user's preferences (null fields are unchanged).
     *
     * @param userId  the user's profile id
     * @param request the partial update
     * @return the updated preferences
     */
    @Transactional
    public NotificationPreferenceResponse updatePreferences(final Long userId,
                                                            final UpdatePreferenceRequest request) {
        final NotificationPreference preference = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> NotificationPreference.builder().userId(userId).build());

        if (request.getEmailEnabled() != null) {
            preference.setEmailEnabled(request.getEmailEnabled());
        }
        if (request.getSmsEnabled() != null) {
            preference.setSmsEnabled(request.getSmsEnabled());
        }
        if (request.getPushEnabled() != null) {
            preference.setPushEnabled(request.getPushEnabled());
        }
        if (request.getMeetingReminders() != null) {
            preference.setMeetingReminders(request.getMeetingReminders());
        }
        if (request.getExpenseAlerts() != null) {
            preference.setExpenseAlerts(request.getExpenseAlerts());
        }
        if (request.getVibeCheckReminders() != null) {
            preference.setVibeCheckReminders(request.getVibeCheckReminders());
        }
        if (request.getChatNotifications() != null) {
            preference.setChatNotifications(request.getChatNotifications());
        }

        return toPreferenceResponse(preferenceRepository.save(preference));
    }

    /**
     * Dispatches a template-based email notification to a user, respecting
     * their preferences, and records the outcome.
     *
     * @param userId           the recipient's profile id
     * @param type             the notification type
     * @param subjectTemplate  the subject with {{var}} placeholders
     * @param templateKey      the email template key
     * @param variables        the template variables
     * @param title            the inbox headline
     * @param message          the inbox body
     * @param relatedEntityType the related entity type (may be null)
     * @param relatedEntityId  the related entity id (may be null)
     * @return the created notification, or empty if the user's preferences
     *         suppress this channel/category
     */
    @Transactional
    public Optional<NotificationResponse> dispatchEmail(final Long userId, final NotificationType type,
                                                        final String subjectTemplate, final String templateKey,
                                                        final Map<String, Object> variables, final String title,
                                                        final String message, final String relatedEntityType,
                                                        final Long relatedEntityId) {
        if (!preferenceAllows(userId, type, NotificationChannel.EMAIL)) {
            log.debug("Email notification skipped for user {} (type {})", userId, type);
            return Optional.empty();
        }

        final UserProfileResponse profile = userServiceClient.getProfile(userId);
        final Notification notification = Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .channel(NotificationChannel.EMAIL)
                .status(NotificationStatus.PENDING)
                .relatedEntityType(relatedEntityType)
                .relatedEntityId(relatedEntityId)
                .build();
        final Notification saved = notificationRepository.save(notification);

        final String to = profile == null ? null : profile.getEmail();
        final boolean ok = emailService.sendTemplate(to, subjectTemplate, templateKey, variables);

        saved.setStatus(ok ? NotificationStatus.SENT : NotificationStatus.FAILED);
        if (ok) {
            saved.setSentAt(LocalDateTime.now());
        }
        log.info("Email notification {} for user {} (status {})", type, userId, saved.getStatus());
        return Optional.of(toResponse(notificationRepository.save(saved)));
    }

    /**
     * Manually sends a notification to any user (admin action), dispatching
     * over the requested channel and recording the outcome.
     *
     * @param request the send request
     * @return the created notification
     * @throws BadRequestException if the recipient's preferences suppress the channel/category
     */
    @Transactional
    public NotificationResponse sendManual(final SendNotificationRequest request) {
        if (!preferenceAllows(request.getUserId(), request.getType(), request.getChannel())) {
            throw new BadRequestException(
                    "Notification skipped: the recipient has disabled this channel or category");
        }

        final Notification notification = Notification.builder()
                .userId(request.getUserId())
                .type(request.getType())
                .title(request.getTitle())
                .message(request.getMessage())
                .channel(request.getChannel())
                .status(NotificationStatus.PENDING)
                .relatedEntityType(request.getRelatedEntityType())
                .relatedEntityId(request.getRelatedEntityId())
                .build();
        final Notification saved = notificationRepository.save(notification);

        dispatchByChannel(saved, request);
        return toResponse(notificationRepository.save(saved));
    }

    /**
     * Stores an in-app notification for a user (delivered simply by existing
     * in the inbox), respecting their preferences. Used by event listeners
     * that have no email/SMS payload, e.g. offline chat messages.
     *
     * @param userId            the recipient's profile id
     * @param type              the notification type
     * @param title             the inbox headline
     * @param message           the inbox body
     * @param relatedEntityType the related entity type (may be null)
     * @param relatedEntityId   the related entity id (may be null)
     * @return the created notification, or empty if the user's preferences
     *         suppress this channel/category
     */
    @Transactional
    public Optional<NotificationResponse> dispatchInApp(final Long userId, final NotificationType type,
                                                        final String title, final String message,
                                                        final String relatedEntityType, final Long relatedEntityId) {
        if (!preferenceAllows(userId, type, NotificationChannel.IN_APP)) {
            log.debug("In-app notification skipped for user {} (type {})", userId, type);
            return Optional.empty();
        }
        final Notification notification = Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .channel(NotificationChannel.IN_APP)
                .status(NotificationStatus.SENT)
                .relatedEntityType(relatedEntityType)
                .relatedEntityId(relatedEntityId)
                .sentAt(LocalDateTime.now())
                .build();
        return Optional.of(toResponse(notificationRepository.save(notification)));
    }

    /**
     * Purges notifications older than the configured retention window.
     *
     * @return the number of deleted notifications
     */
    @Transactional
    public long purgeOldNotifications() {
        final LocalDateTime cutoff = LocalDateTime.now().minusDays(AppConstants.MAX_NOTIFICATION_AGE_DAYS);
        final long deleted = notificationRepository.deleteByCreatedAtBefore(cutoff);
        if (deleted > 0) {
            log.info("Purged {} notifications older than {} days", deleted, AppConstants.MAX_NOTIFICATION_AGE_DAYS);
        }
        return deleted;
    }

    /**
     * Creates an admin-managed email template.
     *
     * @param request the create request
     * @return the created template
     * @throws BadRequestException if the template key already exists
     */
    @Transactional
    public EmailTemplateResponse createTemplate(final CreateTemplateRequest request) {
        if (emailTemplateRepository.existsByTemplateKey(request.getTemplateKey())) {
            throw new BadRequestException("Template key already exists: " + request.getTemplateKey());
        }
        final EmailTemplate template = EmailTemplate.builder()
                .templateKey(request.getTemplateKey())
                .subject(request.getSubject())
                .bodyHtml(request.getBodyHtml())
                .bodyText(request.getBodyText())
                .variables(request.getVariables())
                .build();
        return toTemplateResponse(emailTemplateRepository.save(template));
    }

    /**
     * Lists all admin-managed email templates.
     *
     * @return the list of templates
     */
    @Transactional(readOnly = true)
    public List<EmailTemplateResponse> listTemplates() {
        return emailTemplateRepository.findAll().stream()
                .map(this::toTemplateResponse)
                .toList();
    }

    /**
     * Returns today's notification statistics for admin dashboards.
     *
     * @return the stats
     */
    @Transactional(readOnly = true)
    public NotificationStatsResponse getStats() {
        final LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        return NotificationStatsResponse.builder()
                .totalSentToday(notificationRepository.countByCreatedAtAfter(startOfToday))
                .failedToday(notificationRepository.countByStatusAndCreatedAtAfter(
                        NotificationStatus.FAILED, startOfToday))
                .byType(groupCounts(notificationRepository.countGroupByTypeSince(startOfToday)))
                .byChannel(groupCounts(notificationRepository.countGroupByChannelSince(startOfToday)))
                .build();
    }

    /**
     * Dispatches a manual notification over its requested channel.
     *
     * @param notification the persisted notification (status updated in place)
     * @param request      the original send request
     */
    private void dispatchByChannel(final Notification notification, final SendNotificationRequest request) {
        final LocalDateTime now = LocalDateTime.now();
        switch (request.getChannel()) {
            case EMAIL -> {
                final UserProfileResponse profile = userServiceClient.getProfile(request.getUserId());
                final String to = profile == null ? null : profile.getEmail();
                final String html = String.format(RAW_EMAIL_HTML,
                        escapeHtml(request.getTitle()), escapeHtml(request.getMessage()));
                final boolean ok = emailService.sendRaw(to, request.getTitle(), html, request.getMessage());
                notification.setStatus(ok ? NotificationStatus.SENT : NotificationStatus.FAILED);
                if (ok) {
                    notification.setSentAt(now);
                }
            }
            case SMS -> {
                final UserProfileResponse profile = userServiceClient.getProfile(request.getUserId());
                final boolean ok = smsService.sendSms(profile == null ? null : profile.getPhone(),
                        request.getMessage());
                notification.setStatus(ok ? NotificationStatus.SENT : NotificationStatus.FAILED);
                if (ok) {
                    notification.setSentAt(now);
                }
            }
            case IN_APP -> {
                // Delivered simply by being stored in the inbox.
                notification.setStatus(NotificationStatus.SENT);
                notification.setSentAt(now);
            }
            case PUSH -> {
                log.warn("Push channel is not implemented yet; marking notification FAILED");
                notification.setStatus(NotificationStatus.FAILED);
            }
            default -> notification.setStatus(NotificationStatus.FAILED);
        }
    }

    /**
     * Returns whether the user's preferences allow the notification.
     *
     * @param userId  the user's profile id
     * @param type    the notification type
     * @param channel the delivery channel
     * @return {@code true} if allowed (missing preferences default to enabled)
     */
    private boolean preferenceAllows(final Long userId, final NotificationType type,
                                     final NotificationChannel channel) {
        return preferenceRepository.findByUserId(userId)
                .map(preference -> preference.allows(type, channel))
                .orElse(true);
    }

    /**
     * Converts grouped count rows into an ordered map keyed by enum name.
     *
     * @param rows the rows of [key, count]
     * @return the ordered map
     */
    private Map<String, Long> groupCounts(final List<Object[]> rows) {
        final Map<String, Long> result = new LinkedHashMap<>();
        for (final Object[] row : rows) {
            result.put(String.valueOf(row[0]), (Long) row[1]);
        }
        return result;
    }

    /**
     * Escapes HTML-sensitive characters for raw email bodies.
     *
     * @param value the raw text
     * @return the escaped text
     */
    private String escapeHtml(final String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }

    /**
     * Maps a notification entity to its response DTO.
     *
     * @param notification the entity
     * @return the response DTO
     */
    private NotificationResponse toResponse(final Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .userId(notification.getUserId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .channel(notification.getChannel())
                .status(notification.getStatus())
                .relatedEntityType(notification.getRelatedEntityType())
                .relatedEntityId(notification.getRelatedEntityId())
                .sentAt(notification.getSentAt())
                .readAt(notification.getReadAt())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    /**
     * Maps a preference entity to its response DTO.
     *
     * @param preference the entity
     * @return the response DTO
     */
    private NotificationPreferenceResponse toPreferenceResponse(final NotificationPreference preference) {
        return NotificationPreferenceResponse.builder()
                .userId(preference.getUserId())
                .emailEnabled(preference.isEmailEnabled())
                .smsEnabled(preference.isSmsEnabled())
                .pushEnabled(preference.isPushEnabled())
                .meetingReminders(preference.isMeetingReminders())
                .expenseAlerts(preference.isExpenseAlerts())
                .vibeCheckReminders(preference.isVibeCheckReminders())
                .chatNotifications(preference.isChatNotifications())
                .build();
    }

    /**
     * Maps a template entity to its response DTO.
     *
     * @param template the entity
     * @return the response DTO
     */
    private EmailTemplateResponse toTemplateResponse(final EmailTemplate template) {
        return EmailTemplateResponse.builder()
                .id(template.getId())
                .templateKey(template.getTemplateKey())
                .subject(template.getSubject())
                .variables(template.getVariables())
                .createdAt(template.getCreatedAt())
                .build();
    }
}
