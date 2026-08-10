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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link NotificationScheduler}.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationScheduler Unit Tests")
class NotificationSchedulerTest {

    @Mock
    private NestServiceClient nestServiceClient;

    @Mock
    private NotificationService notificationService;

    @Mock
    private NotificationServiceProperties properties;

    @InjectMocks
    private NotificationScheduler scheduler;

    private static final Long NEST_ID = 1L;

    @BeforeEach
    void setUp() {
        // Lenient: not every job dispatches an email, so the base-url stub is
        // unused in some tests (e.g. the null-status no-op path).
        lenient().when(properties.getBaseUrl()).thenReturn("http://localhost:8080");
    }

    /**
     * Builds an active Nest with a single accepted member.
     */
    private NestResponse nestWithMember(final NestMemberResponse member) {
        return NestResponse.builder()
                .id(NEST_ID)
                .name("Mission Mates")
                .status("ACTIVE")
                .members(List.of(member))
                .build();
    }

    private NestMemberResponse member(final Long userId, final String status) {
        return NestMemberResponse.builder()
                .userId(userId)
                .fullName("Jane Doe")
                .status(status)
                .build();
    }

    @Nested
    @DisplayName("sendMeetingReminders")
    class MeetingReminderTests {

        @Test
        @DisplayName("Should remind accepted members about meetings tomorrow")
        void shouldRemindAboutTomorrowsMeeting() {
            final NestMemberResponse jane = member(7L, AppConstants.NEST_MEMBER_STATUS_ACCEPTED);
            final NestResponse nest = nestWithMember(jane);
            when(nestServiceClient.listActiveNests()).thenReturn(List.of(nest));
            final MeetingResponse meeting = MeetingResponse.builder()
                    .id(5L)
                    .scheduledAt(LocalDateTime.now().plusDays(1))
                    .activityType("Coffee & Chat")
                    .status(AppConstants.MEETING_STATUS_SCHEDULED)
                    .build();
            when(nestServiceClient.getMeetings(NEST_ID)).thenReturn(List.of(meeting));

            scheduler.sendMeetingReminders();

            verify(notificationService).dispatchEmail(
                    eq(7L), eq(NotificationType.MEETING_REMINDER), anyString(),
                    eq(AppConstants.TEMPLATE_MEETING_REMINDER), anyMap(), anyString(), anyString(),
                    eq(AppConstants.RELATED_ENTITY_MEETING), eq(5L));
        }

        @Test
        @DisplayName("Should skip meetings not scheduled for tomorrow")
        void shouldSkipTodayMeeting() {
            when(nestServiceClient.listActiveNests()).thenReturn(List.of(nestWithMember(member(7L, "ACCEPTED"))));
            // Fixed noon-today timestamp: `plusHours(2)` rolled over to tomorrow
            // when the suite ran near midnight, making this test time-dependent.
            final MeetingResponse meeting = MeetingResponse.builder()
                    .id(5L)
                    .scheduledAt(LocalDate.now().atTime(12, 0))
                    .status(AppConstants.MEETING_STATUS_SCHEDULED)
                    .build();
            when(nestServiceClient.getMeetings(NEST_ID)).thenReturn(List.of(meeting));

            scheduler.sendMeetingReminders();

            verify(notificationService, never()).dispatchEmail(any(), any(), anyString(), anyString(),
                    anyMap(), anyString(), anyString(), anyString(), any());
        }

        @Test
        @DisplayName("Should skip cancelled meetings")
        void shouldSkipCancelledMeeting() {
            when(nestServiceClient.listActiveNests()).thenReturn(List.of(nestWithMember(member(7L, "ACCEPTED"))));
            final MeetingResponse meeting = MeetingResponse.builder()
                    .id(5L)
                    .scheduledAt(LocalDateTime.now().plusDays(1))
                    .status("CANCELLED")
                    .build();
            when(nestServiceClient.getMeetings(NEST_ID)).thenReturn(List.of(meeting));

            scheduler.sendMeetingReminders();

            verify(notificationService, never()).dispatchEmail(any(), any(), anyString(), anyString(),
                    anyMap(), anyString(), anyString(), anyString(), any());
        }

        @Test
        @DisplayName("Should exclude members who have left the Nest")
        void shouldExcludeLeftMembers() {
            when(nestServiceClient.listActiveNests())
                    .thenReturn(List.of(nestWithMember(member(7L, "LEFT"))));
            when(nestServiceClient.getMeetings(NEST_ID)).thenReturn(List.of(MeetingResponse.builder()
                    .id(5L).scheduledAt(LocalDateTime.now().plusDays(1))
                    .status(AppConstants.MEETING_STATUS_SCHEDULED).build()));

            scheduler.sendMeetingReminders();

            verify(notificationService, never()).dispatchEmail(any(), any(), anyString(), anyString(),
                    anyMap(), anyString(), anyString(), anyString(), any());
        }

        @Test
        @DisplayName("Should no-op when no nests are returned")
        void shouldNoOpWithoutNests() {
            when(nestServiceClient.listActiveNests()).thenReturn(List.of());

            scheduler.sendMeetingReminders();

            verify(notificationService, never()).dispatchEmail(any(), any(), anyString(), anyString(),
                    anyMap(), anyString(), anyString(), anyString(), any());
        }
    }

    @Nested
    @DisplayName("sendVibeCheckReminders")
    class VibeCheckReminderTests {

        @Test
        @DisplayName("Should remind only members who have not submitted")
        void shouldRemindOnlyMissingSubmissions() {
            final NestResponse nest = NestResponse.builder()
                    .id(NEST_ID)
                    .name("Mission Mates")
                    .members(List.of(member(7L, "ACCEPTED"), member(12L, "ACCEPTED")))
                    .build();
            when(nestServiceClient.listActiveNests()).thenReturn(List.of(nest));
            final VibeCheckStatusResponse status = VibeCheckStatusResponse.builder()
                    .submissionCount(1)
                    .submissions(List.of(VibeCheckResponse.builder().userId(7L).build()))
                    .build();
            when(nestServiceClient.getVibeCheckStatus(NEST_ID)).thenReturn(status);

            scheduler.sendVibeCheckReminders();

            verify(notificationService, never()).dispatchEmail(
                    eq(7L), eq(NotificationType.VIBE_CHECK_DUE), anyString(), anyString(),
                    anyMap(), anyString(), anyString(), anyString(), any());
            verify(notificationService).dispatchEmail(
                    eq(12L), eq(NotificationType.VIBE_CHECK_DUE), anyString(),
                    eq(AppConstants.TEMPLATE_VIBE_CHECK_REMINDER), anyMap(), anyString(), anyString(),
                    eq(AppConstants.RELATED_ENTITY_NEST), eq(NEST_ID));
        }

        @Test
        @DisplayName("Should no-op when the status is unavailable")
        void shouldNoOpWithoutStatus() {
            when(nestServiceClient.listActiveNests()).thenReturn(List.of(nestWithMember(member(7L, "ACCEPTED"))));
            when(nestServiceClient.getVibeCheckStatus(NEST_ID)).thenReturn(null);

            scheduler.sendVibeCheckReminders();

            verify(notificationService, never()).dispatchEmail(any(), any(), anyString(), anyString(),
                    anyMap(), anyString(), anyString(), anyString(), any());
        }
    }

    @Nested
    @DisplayName("sendExpenseReminders")
    class ExpenseReminderTests {

        @Test
        @DisplayName("Should remind about old unsettled shares only")
        void shouldRemindOnlyOldUnsettledShares() {
            final NestResponse nest = nestWithMember(member(7L, "ACCEPTED"));
            when(nestServiceClient.listActiveNests()).thenReturn(List.of(nest));
            final ExpenseResponse oldExpense = ExpenseResponse.builder()
                    .id(9L)
                    .description("Group dinner")
                    .createdAt(LocalDateTime.now().minusDays(5))
                    .splits(List.of(
                            ExpenseSplitResponse.builder().userId(7L).amountOwed(new BigDecimal("25.00"))
                                    .settled(false).build(),
                            ExpenseSplitResponse.builder().userId(8L).amountOwed(new BigDecimal("25.00"))
                                    .settled(true).build()))
                    .build();
            when(nestServiceClient.getExpenses(NEST_ID)).thenReturn(List.of(oldExpense));

            scheduler.sendExpenseReminders();

            verify(notificationService).dispatchEmail(
                    eq(7L), eq(NotificationType.EXPENSE_SPLIT), anyString(),
                    eq(AppConstants.TEMPLATE_EXPENSE_ALERT), anyMap(), anyString(), anyString(),
                    eq(AppConstants.RELATED_ENTITY_EXPENSE), eq(9L));
            verify(notificationService, never()).dispatchEmail(
                    eq(8L), eq(NotificationType.EXPENSE_SPLIT), anyString(), anyString(),
                    anyMap(), anyString(), anyString(), anyString(), any());
        }

        @Test
        @DisplayName("Should skip expenses newer than the age threshold")
        void shouldSkipRecentExpenses() {
            when(nestServiceClient.listActiveNests()).thenReturn(List.of(nestWithMember(member(7L, "ACCEPTED"))));
            final ExpenseResponse recent = ExpenseResponse.builder()
                    .id(9L)
                    .createdAt(LocalDateTime.now().minusHours(5))
                    .splits(List.of(ExpenseSplitResponse.builder().userId(7L).settled(false).build()))
                    .build();
            when(nestServiceClient.getExpenses(NEST_ID)).thenReturn(List.of(recent));

            scheduler.sendExpenseReminders();

            verify(notificationService, never()).dispatchEmail(any(), any(), anyString(), anyString(),
                    anyMap(), anyString(), anyString(), anyString(), any());
        }
    }

    @Nested
    @DisplayName("purgeOldNotifications")
    class CleanupTests {

        @Test
        @DisplayName("Should delegate to the notification service")
        void shouldDelegateCleanup() {
            when(notificationService.purgeOldNotifications()).thenReturn(3L);

            scheduler.purgeOldNotifications();

            verify(notificationService).purgeOldNotifications();
        }
    }
}
