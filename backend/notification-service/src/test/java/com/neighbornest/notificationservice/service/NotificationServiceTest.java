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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link NotificationService}.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService Unit Tests")
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private NotificationPreferenceRepository preferenceRepository;

    @Mock
    private EmailTemplateRepository emailTemplateRepository;

    @Mock
    private UserServiceClient userServiceClient;

    @Mock
    private EmailService emailService;

    @Mock
    private SmsService smsService;

    @InjectMocks
    private NotificationService notificationService;

    private static final Long USER_ID = 7L;

    /**
     * Builds a minimal persisted notification.
     */
    private Notification notification(final Long id, final NotificationStatus status) {
        return Notification.builder()
                .id(id)
                .userId(USER_ID)
                .type(NotificationType.SYSTEM)
                .title("Title")
                .message("Message")
                .channel(NotificationChannel.IN_APP)
                .status(status)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("Inbox queries")
    class InboxTests {

        @Test
        @DisplayName("Should map the inbox page to response DTOs")
        void shouldMapInboxPage() {
            final Page<Notification> page = new PageImpl<>(
                    List.of(notification(1L, NotificationStatus.SENT)), PageRequest.of(0, 20), 1);
            when(notificationRepository.findByUserIdOrderByCreatedAtDesc(USER_ID, PageRequest.of(0, 20)))
                    .thenReturn(page);

            final Page<NotificationResponse> result = notificationService.getForUser(USER_ID, PageRequest.of(0, 20));

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getId()).isEqualTo(1L);
            assertThat(result.getContent().get(0).getUserId()).isEqualTo(USER_ID);
            assertThat(result.getContent().get(0).getStatus()).isEqualTo(NotificationStatus.SENT);
        }

        @Test
        @DisplayName("Should compute unread count from totals")
        void shouldComputeUnreadCount() {
            when(notificationRepository.countByUserId(USER_ID)).thenReturn(10L);
            when(notificationRepository.countByUserIdAndStatus(USER_ID, NotificationStatus.READ)).thenReturn(4L);

            final NotificationCountResponse counts = notificationService.getUnreadCount(USER_ID);

            assertThat(counts.getTotal()).isEqualTo(10);
            assertThat(counts.getRead()).isEqualTo(4);
            assertThat(counts.getUnread()).isEqualTo(6);
        }
    }

    @Nested
    @DisplayName("Read state")
    class ReadStateTests {

        @Test
        @DisplayName("Should mark an unread notification as read")
        void shouldMarkRead() {
            final Notification unread = notification(1L, NotificationStatus.PENDING);
            when(notificationRepository.findByIdAndUserId(1L, USER_ID)).thenReturn(Optional.of(unread));

            final NotificationResponse result = notificationService.markRead(USER_ID, 1L);

            assertThat(result.getStatus()).isEqualTo(NotificationStatus.READ);
            assertThat(result.getReadAt()).isNotNull();
            verify(notificationRepository).save(unread);
        }

        @Test
        @DisplayName("Should leave an already-read notification untouched")
        void shouldNotTouchAlreadyRead() {
            when(notificationRepository.findByIdAndUserId(1L, USER_ID))
                    .thenReturn(Optional.of(notification(1L, NotificationStatus.READ)));

            notificationService.markRead(USER_ID, 1L);

            verify(notificationRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw when the notification is missing or not owned")
        void shouldThrowWhenMissing() {
            when(notificationRepository.findByIdAndUserId(99L, USER_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> notificationService.markRead(USER_ID, 99L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should mark all unread notifications as read")
        void shouldMarkAllRead() {
            when(notificationRepository.findByUserIdAndStatusNot(USER_ID, NotificationStatus.READ))
                    .thenReturn(List.of(notification(1L, NotificationStatus.PENDING),
                            notification(2L, NotificationStatus.PENDING)));
            when(notificationRepository.countByUserId(USER_ID)).thenReturn(2L);
            when(notificationRepository.countByUserIdAndStatus(USER_ID, NotificationStatus.READ)).thenReturn(2L);

            final NotificationCountResponse result = notificationService.markAllRead(USER_ID);

            assertThat(result.getUnread()).isZero();
            verify(notificationRepository).saveAll(anyCollection());
        }
    }

    @Nested
    @DisplayName("Preferences")
    class PreferenceTests {

        @Test
        @DisplayName("Should return default (all-enabled) preferences when none exist")
        void shouldDefaultPreferences() {
            when(preferenceRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());

            final NotificationPreferenceResponse prefs = notificationService.getPreferences(USER_ID);

            assertThat(prefs.getUserId()).isEqualTo(USER_ID);
            assertThat(prefs.isEmailEnabled()).isTrue();
            assertThat(prefs.isSmsEnabled()).isFalse();
            assertThat(prefs.isMeetingReminders()).isTrue();
        }

        @Test
        @DisplayName("Should apply a partial update without touching other flags")
        void shouldApplyPartialUpdate() {
            when(preferenceRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());
            when(preferenceRepository.save(any(NotificationPreference.class))).thenAnswer(inv -> inv.getArgument(0));

            final NotificationPreferenceResponse result =
                    notificationService.updatePreferences(USER_ID,
                            UpdatePreferenceRequest.builder().emailEnabled(false).build());

            assertThat(result.isEmailEnabled()).isFalse();
            assertThat(result.isSmsEnabled()).isFalse();
            assertThat(result.isChatNotifications()).isTrue();
            verify(preferenceRepository).save(any(NotificationPreference.class));
        }
    }

    @Nested
    @DisplayName("Dispatch")
    class DispatchTests {

        @Test
        @DisplayName("Should skip the email when the user disabled the channel")
        void shouldSkipWhenSuppressed() {
            when(preferenceRepository.findByUserId(USER_ID))
                    .thenReturn(Optional.of(NotificationPreference.builder()
                            .userId(USER_ID).emailEnabled(false).build()));

            final Optional<NotificationResponse> result = notificationService.dispatchEmail(
                    USER_ID, NotificationType.NEST_CREATED, AppConstants.SUBJECT_NEST_WELCOME,
                    AppConstants.TEMPLATE_NEST_WELCOME, Map.of(), "Title", "Message",
                    AppConstants.RELATED_ENTITY_NEST, 3L);

            assertThat(result).isEmpty();
            verify(notificationRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should mark SENT when the email is delivered")
        void shouldMarkSent() {
            when(preferenceRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());
            when(userServiceClient.getProfile(USER_ID))
                    .thenReturn(UserProfileResponse.builder().id(USER_ID).email("jane@example.com").build());
            when(emailService.sendTemplate(anyString(), anyString(), anyString(), anyMap())).thenReturn(true);
            when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

            final Optional<NotificationResponse> result = notificationService.dispatchEmail(
                    USER_ID, NotificationType.NEST_CREATED, AppConstants.SUBJECT_NEST_WELCOME,
                    AppConstants.TEMPLATE_NEST_WELCOME, Map.of(), "Title", "Message",
                    AppConstants.RELATED_ENTITY_NEST, 3L);

            assertThat(result).isPresent();
            assertThat(result.get().getStatus()).isEqualTo(NotificationStatus.SENT);
            assertThat(result.get().getSentAt()).isNotNull();
            verify(emailService).sendTemplate(eq("jane@example.com"), anyString(), anyString(), anyMap());
        }

        @Test
        @DisplayName("Should mark FAILED when no recipient email is resolvable")
        void shouldMarkFailedWithoutEmail() {
            when(preferenceRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());
            when(userServiceClient.getProfile(USER_ID)).thenReturn(null);
            when(emailService.sendTemplate(isNull(), anyString(), anyString(), anyMap())).thenReturn(false);
            when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

            final Optional<NotificationResponse> result = notificationService.dispatchEmail(
                    USER_ID, NotificationType.NEST_CREATED, AppConstants.SUBJECT_NEST_WELCOME,
                    AppConstants.TEMPLATE_NEST_WELCOME, Map.of(), "Title", "Message",
                    AppConstants.RELATED_ENTITY_NEST, 3L);

            assertThat(result).isPresent();
            assertThat(result.get().getStatus()).isEqualTo(NotificationStatus.FAILED);
        }

        @Test
        @DisplayName("Should store an in-app notification as SENT")
        void shouldDispatchInApp() {
            when(preferenceRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());
            when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

            final Optional<NotificationResponse> result =
                    notificationService.dispatchInApp(USER_ID, NotificationType.CHAT_MESSAGE,
                            "New message", "Preview", "CHAT", 1L);

            assertThat(result).isPresent();
            assertThat(result.get().getStatus()).isEqualTo(NotificationStatus.SENT);
            assertThat(result.get().getChannel()).isEqualTo(NotificationChannel.IN_APP);
        }

        @Test
        @DisplayName("Should reject a manual send the recipient opted out of")
        void shouldRejectSuppressedManualSend() {
            when(preferenceRepository.findByUserId(USER_ID))
                    .thenReturn(Optional.of(NotificationPreference.builder()
                            .userId(USER_ID).smsEnabled(false).build()));
            final SendNotificationRequest request = SendNotificationRequest.builder()
                    .userId(USER_ID).type(NotificationType.SYSTEM).title("T").message("M")
                    .channel(NotificationChannel.SMS).build();

            assertThatThrownBy(() -> notificationService.sendManual(request))
                    .isInstanceOf(BadRequestException.class);
        }

        @Test
        @DisplayName("Should dispatch a manual email over SMTP")
        void shouldDispatchManualEmail() {
            when(preferenceRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());
            when(userServiceClient.getProfile(USER_ID))
                    .thenReturn(UserProfileResponse.builder().id(USER_ID).email("jane@example.com").build());
            when(emailService.sendRaw(anyString(), anyString(), anyString(), anyString())).thenReturn(true);
            when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

            final SendNotificationRequest request = SendNotificationRequest.builder()
                    .userId(USER_ID).type(NotificationType.SYSTEM).title("T").message("M")
                    .channel(NotificationChannel.EMAIL).build();

            final NotificationResponse result = notificationService.sendManual(request);

            assertThat(result.getStatus()).isEqualTo(NotificationStatus.SENT);
            verify(emailService).sendRaw(eq("jane@example.com"), anyString(), anyString(), anyString());
        }
    }

    @Nested
    @DisplayName("Templates and stats")
    class TemplateAndStatsTests {

        @Test
        @DisplayName("Should reject a duplicate template key")
        void shouldRejectDuplicateKey() {
            when(emailTemplateRepository.existsByTemplateKey("nest-welcome")).thenReturn(true);

            assertThatThrownBy(() -> notificationService.createTemplate(templateRequest()))
                    .isInstanceOf(BadRequestException.class);
        }

        @Test
        @DisplayName("Should create a template for a new key")
        void shouldCreateTemplate() {
            when(emailTemplateRepository.existsByTemplateKey("nest-welcome")).thenReturn(false);
            when(emailTemplateRepository.save(any(EmailTemplate.class))).thenAnswer(inv -> inv.getArgument(0));

            final EmailTemplateResponse result = notificationService.createTemplate(templateRequest());

            assertThat(result.getTemplateKey()).isEqualTo("nest-welcome");
            assertThat(result.getSubject()).isEqualTo("Welcome!");
        }

        @Test
        @DisplayName("Should list all templates")
        void shouldListTemplates() {
            when(emailTemplateRepository.findAll()).thenReturn(List.of(EmailTemplate.builder()
                    .templateKey("nest-welcome").subject("Welcome!").build()));

            final List<EmailTemplateResponse> result = notificationService.listTemplates();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getTemplateKey()).isEqualTo("nest-welcome");
        }

        @Test
        @DisplayName("Should aggregate stats grouped by type and channel")
        void shouldAggregateStats() {
            when(notificationRepository.countByCreatedAtAfter(any())).thenReturn(10L);
            when(notificationRepository.countByStatusAndCreatedAtAfter(eq(NotificationStatus.FAILED), any()))
                    .thenReturn(2L);
            when(notificationRepository.countGroupByTypeSince(any()))
                    .thenReturn(Collections.singletonList(
                            new Object[]{NotificationType.NEST_CREATED.name(), 5L}));
            when(notificationRepository.countGroupByChannelSince(any()))
                    .thenReturn(Collections.singletonList(
                            new Object[]{NotificationChannel.EMAIL.name(), 5L}));

            final NotificationStatsResponse stats = notificationService.getStats();

            assertThat(stats.getTotalSentToday()).isEqualTo(10);
            assertThat(stats.getFailedToday()).isEqualTo(2);
            assertThat(stats.getByType()).containsEntry("NEST_CREATED", 5L);
            assertThat(stats.getByChannel()).containsEntry("EMAIL", 5L);
        }
    }

    @Nested
    @DisplayName("Retention cleanup")
    class CleanupTests {

        @Test
        @DisplayName("Should purge notifications older than the retention window")
        void shouldPurgeOldNotifications() {
            when(notificationRepository.deleteByCreatedAtBefore(any())).thenReturn(3L);

            assertThat(notificationService.purgeOldNotifications()).isEqualTo(3);
        }
    }

    /**
     * Builds a template create request.
     */
    private CreateTemplateRequest templateRequest() {
        return CreateTemplateRequest.builder()
                .templateKey("nest-welcome")
                .subject("Welcome!")
                .bodyHtml("<p>Hi {{userName}}</p>")
                .bodyText("Hi {{userName}}")
                .build();
    }
}
