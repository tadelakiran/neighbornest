package com.neighbornest.notificationservice.service;

import com.neighbornest.notificationservice.client.ExpenseResponse;
import com.neighbornest.notificationservice.client.ExpenseSplitResponse;
import com.neighbornest.notificationservice.client.MeetingResponse;
import com.neighbornest.notificationservice.client.NestMemberResponse;
import com.neighbornest.notificationservice.client.NestResponse;
import com.neighbornest.notificationservice.client.NestServiceClient;
import com.neighbornest.notificationservice.client.VibeCheckResponse;
import com.neighbornest.notificationservice.client.VibeCheckStatusResponse;
import com.neighbornest.notificationservice.config.NotificationServiceProperties;
import com.neighbornest.notificationservice.constants.AppConstants;
import com.neighbornest.notificationservice.enums.NotificationType;
import com.neighbornest.notificationservice.repository.EmailOtpRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Scheduled reminder jobs for the Notification Service.
 * <p>
 * Three recurring jobs fan out transactional emails to Nest members:
 * <ul>
 *   <li>{@code 09:00} — meeting reminders for meetings scheduled tomorrow;</li>
 *   <li>{@code 09:00} — vibe check reminders for members who have not yet
 *       submitted their check;</li>
 *   <li>{@code 18:00} — expense settlement reminders for unsettled shares
 *       older than the configured age threshold.</li>
 * </ul>
 * plus a nightly retention cleanup job.
 * </p>
 * <p>
 * <strong>Upstream dependency:</strong> the jobs iterate the nests returned by
 * {@link NestServiceClient#listActiveNests()} and query per-nest meetings,
 * expenses and vibe-check status through the nest-service. The nest-service
 * does not expose an admin "list all nests" endpoint yet and its per-nest read
 * endpoints require an authenticated Nest member, so service-to-service calls
 * currently return empty data through the Feign fallbacks and the jobs run as
 * safe no-ops until those admin endpoints are added — the scheduling skeleton,
 * filtering and dispatch logic are fully implemented and unit-tested.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationScheduler {

    private final NestServiceClient nestServiceClient;
    private final NotificationService notificationService;
    private final NotificationServiceProperties properties;
    private final EmailOtpRepository emailOtpRepository;

    /** Renders meeting timestamps in a friendly, locale-free format. */
    private static final DateTimeFormatter MEETING_DATE_FORMAT = DateTimeFormatter.ofPattern("EEE, MMM d 'at' h:mm a");

    /**
     * Sends meeting reminders for meetings scheduled tomorrow (09:00 daily).
     */
    @Scheduled(cron = AppConstants.MORNING_REMINDER_CRON)
    public void sendMeetingReminders() {
        final LocalDate tomorrow = LocalDate.now().plusDays(1);
        for (final NestResponse nest : activeNests()) {
            final List<MeetingResponse> meetings = nestServiceClient.getMeetings(nest.getId());
            if (meetings == null || meetings.isEmpty()) {
                continue;
            }
            meetings.stream()
                    .filter(Objects::nonNull)
                    .filter(meeting -> AppConstants.MEETING_STATUS_SCHEDULED.equals(meeting.getStatus()))
                    .filter(meeting -> meeting.getScheduledAt() != null
                            && meeting.getScheduledAt().toLocalDate().equals(tomorrow))
                    .forEach(meeting -> remindMeeting(nest, meeting));
        }
    }

    /**
     * Sends vibe check reminders to members who have not submitted their check
     * yet (09:00 daily).
     */
    @Scheduled(cron = AppConstants.MORNING_REMINDER_CRON)
    public void sendVibeCheckReminders() {
        for (final NestResponse nest : activeNests()) {
            final VibeCheckStatusResponse status = nestServiceClient.getVibeCheckStatus(nest.getId());
            if (status == null || status.getSubmissions() == null) {
                continue;
            }
            final Set<Long> submitted = status.getSubmissions().stream()
                    .filter(Objects::nonNull)
                    .map(VibeCheckResponse::getUserId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            for (final NestMemberResponse member : acceptedMembers(nest)) {
                if (!submitted.contains(member.getUserId())) {
                    remindVibeCheck(nest, member);
                }
            }
        }
    }

    /**
     * Sends expense settlement reminders for unsettled shares older than the
     * age threshold (18:00 daily).
     */
    @Scheduled(cron = AppConstants.EVENING_REMINDER_CRON)
    public void sendExpenseReminders() {
        final LocalDateTime cutoff = LocalDateTime.now().minusDays(AppConstants.EXPENSE_REMINDER_AGE_DAYS);
        for (final NestResponse nest : activeNests()) {
            final List<ExpenseResponse> expenses = nestServiceClient.getExpenses(nest.getId());
            if (expenses == null || expenses.isEmpty()) {
                continue;
            }
            for (final ExpenseResponse expense : expenses) {
                if (expense == null || expense.getCreatedAt() == null
                        || expense.getCreatedAt().isAfter(cutoff) || expense.getSplits() == null) {
                    continue;
                }
                expense.getSplits().stream()
                        .filter(Objects::nonNull)
                        .filter(split -> split.getUserId() != null && !split.isSettled())
                        .forEach(split -> remindExpense(nest, expense, split));
            }
        }
    }

    /**
     * Purges notifications older than the retention window and one-time
     * passcodes that expired more than a day ago (03:00 daily).
     */
    @Transactional
    @Scheduled(cron = AppConstants.CLEANUP_CRON)
    public void purgeOldNotifications() {
        final long deleted = notificationService.purgeOldNotifications();
        final int purgedOtps = emailOtpRepository.deleteExpiredBefore(LocalDateTime.now().minusDays(1));
        log.info("Scheduled cleanup removed {} old notifications and {} expired OTPs", deleted, purgedOtps);
    }

    /**
     * Dispatches a meeting reminder email to each accepted member of the Nest.
     *
     * @param nest    the Nest
     * @param meeting the meeting scheduled for tomorrow
     */
    private void remindMeeting(final NestResponse nest, final MeetingResponse meeting) {
        final String activity = meeting.getActivityType() != null ? meeting.getActivityType() : "Nest gathering";
        final String when = MEETING_DATE_FORMAT.format(meeting.getScheduledAt());
        for (final NestMemberResponse member : acceptedMembers(nest)) {
            final Map<String, Object> variables = new HashMap<>();
            variables.put(AppConstants.VAR_USER_NAME, displayName(member));
            variables.put(AppConstants.VAR_NEST_NAME, nest.getName());
            variables.put(AppConstants.VAR_ACTIVITY_TYPE, activity);
            variables.put(AppConstants.VAR_MEETING_DATE, when);
            variables.put(AppConstants.VAR_VENUE_NAME, meeting.getVenueName());
            variables.put(AppConstants.VAR_NEST_LINK, nestLink(nest.getId()));
            notificationService.dispatchEmail(
                    member.getUserId(),
                    NotificationType.MEETING_REMINDER,
                    AppConstants.SUBJECT_MEETING_REMINDER,
                    AppConstants.TEMPLATE_MEETING_REMINDER,
                    variables,
                    "Meeting tomorrow: " + activity,
                    "Your Nest '" + nest.getName() + "' has a meeting tomorrow at " + when + ".",
                    AppConstants.RELATED_ENTITY_MEETING,
                    meeting.getId());
        }
    }

    /**
     * Dispatches a vibe check reminder email to a single member.
     *
     * @param nest   the Nest
     * @param member the member who has not submitted yet
     */
    private void remindVibeCheck(final NestResponse nest, final NestMemberResponse member) {
        final Map<String, Object> variables = new HashMap<>();
        variables.put(AppConstants.VAR_USER_NAME, displayName(member));
        variables.put(AppConstants.VAR_NEST_NAME, nest.getName());
        variables.put(AppConstants.VAR_NEST_LINK, nestLink(nest.getId()));
        notificationService.dispatchEmail(
                member.getUserId(),
                NotificationType.VIBE_CHECK_DUE,
                AppConstants.SUBJECT_VIBE_CHECK_REMINDER,
                AppConstants.TEMPLATE_VIBE_CHECK_REMINDER,
                variables,
                "Vibe check due for " + nest.getName(),
                "Your Nest '" + nest.getName() + "' is checking in — let everyone know how it's going.",
                AppConstants.RELATED_ENTITY_NEST,
                nest.getId());
    }

    /**
     * Dispatches an expense settlement reminder email for one unsettled share.
     *
     * @param nest    the Nest
     * @param expense the expense
     * @param split   the unsettled share
     */
    private void remindExpense(final NestResponse nest, final ExpenseResponse expense,
                               final ExpenseSplitResponse split) {
        final NestMemberResponse member = findMember(nest, split.getUserId());
        final String description = expense.getDescription() != null
                ? expense.getDescription() : "a shared expense";
        // A null amount must never render as "$null" in the email.
        final String amount = split.getAmountOwed() != null
                ? String.format("$%.2f", split.getAmountOwed())
                : "$0.00";
        final Map<String, Object> variables = new HashMap<>();
        variables.put(AppConstants.VAR_USER_NAME,
                member != null ? displayName(member) : AppConstants.UNKNOWN_USER_PREFIX + split.getUserId());
        variables.put(AppConstants.VAR_NEST_NAME, nest.getName());
        variables.put(AppConstants.VAR_DESCRIPTION, description);
        variables.put(AppConstants.VAR_AMOUNT, amount);
        variables.put(AppConstants.VAR_NEST_LINK, nestLink(nest.getId()));
        notificationService.dispatchEmail(
                split.getUserId(),
                NotificationType.EXPENSE_SPLIT,
                AppConstants.SUBJECT_EXPENSE_ALERT,
                AppConstants.TEMPLATE_EXPENSE_ALERT,
                variables,
                "Settle up: " + description,
                "You owe " + amount + " for '" + description + "' in " + nest.getName() + ". Time to settle up!",
                AppConstants.RELATED_ENTITY_EXPENSE,
                expense.getId());
    }

    /**
     * Returns the active Nests known to the nest-service (fallback: empty).
     *
     * @return the active nests, or an empty list when unavailable
     */
    private List<NestResponse> activeNests() {
        final List<NestResponse> nests = nestServiceClient.listActiveNests();
        if (nests == null) {
            return List.of();
        }
        return nests.stream()
                .filter(Objects::nonNull)
                .filter(nest -> nest.getId() != null)
                .toList();
    }

    /**
     * Returns the accepted (active) members of a Nest.
     *
     * @param nest the Nest
     * @return the accepted members, or an empty list
     */
    private List<NestMemberResponse> acceptedMembers(final NestResponse nest) {
        if (nest.getMembers() == null) {
            return List.of();
        }
        return nest.getMembers().stream()
                .filter(Objects::nonNull)
                .filter(member -> member.getUserId() != null)
                .filter(member -> AppConstants.NEST_MEMBER_STATUS_ACCEPTED.equals(member.getStatus()))
                .toList();
    }

    /**
     * Finds a Nest member by user id.
     *
     * @param nest   the Nest
     * @param userId the member's user id
     * @return the member, or {@code null}
     */
    private NestMemberResponse findMember(final NestResponse nest, final Long userId) {
        if (nest.getMembers() == null) {
            return null;
        }
        return nest.getMembers().stream()
                .filter(Objects::nonNull)
                .filter(member -> userId.equals(member.getUserId()))
                .findFirst()
                .orElse(null);
    }

    /**
     * Resolves a display name for a member, degrading to "User {id}".
     *
     * @param member the member
     * @return the display name
     */
    private String displayName(final NestMemberResponse member) {
        return member.getFullName() != null ? member.getFullName()
                : AppConstants.UNKNOWN_USER_PREFIX + member.getUserId();
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
}
