package com.neighbornest.notificationservice.repository;

import com.neighbornest.notificationservice.entity.Notification;
import com.neighbornest.notificationservice.enums.NotificationChannel;
import com.neighbornest.notificationservice.enums.NotificationStatus;
import com.neighbornest.notificationservice.enums.NotificationType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Repository tests for {@link NotificationRepository} using an in-memory H2
 * database ({@link DataJpaTest}).
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@DataJpaTest
@ActiveProfiles("test")
@DisplayName("NotificationRepository DataJpa Tests")
class NotificationRepositoryTest {

    @Autowired
    private NotificationRepository notificationRepository;

    /**
     * Builds a minimal notification for persistence.
     */
    private Notification notification(final Long userId, final NotificationStatus status) {
        return Notification.builder()
                .userId(userId)
                .type(NotificationType.SYSTEM)
                .title("Title")
                .message("Message")
                .channel(NotificationChannel.IN_APP)
                .status(status)
                .build();
    }

    @Nested
    @DisplayName("findByIdAndUserId method")
    class FindByIdAndUserIdTests {

        @Test
        @DisplayName("Should find a notification owned by the user")
        void shouldFindOwned() {
            final Notification saved = notificationRepository.save(notification(1L, NotificationStatus.SENT));

            final Optional<Notification> found = notificationRepository.findByIdAndUserId(saved.getId(), 1L);

            assertThat(found).isPresent();
            assertThat(found.get().getTitle()).isEqualTo("Title");
        }

        @Test
        @DisplayName("Should return empty for another user's notification")
        void shouldNotFindForeign() {
            final Notification saved = notificationRepository.save(notification(1L, NotificationStatus.SENT));

            assertThat(notificationRepository.findByIdAndUserId(saved.getId(), 2L)).isEmpty();
        }
    }

    @Nested
    @DisplayName("Count methods")
    class CountTests {

        @Test
        @DisplayName("Should count all notifications of a user")
        void shouldCountByUser() {
            notificationRepository.save(notification(1L, NotificationStatus.SENT));
            notificationRepository.save(notification(1L, NotificationStatus.READ));
            notificationRepository.save(notification(2L, NotificationStatus.SENT));

            assertThat(notificationRepository.countByUserId(1L)).isEqualTo(2);
        }

        @Test
        @DisplayName("Should count by user and status")
        void shouldCountByUserAndStatus() {
            notificationRepository.save(notification(1L, NotificationStatus.READ));
            notificationRepository.save(notification(1L, NotificationStatus.SENT));

            assertThat(notificationRepository.countByUserIdAndStatus(1L, NotificationStatus.READ)).isEqualTo(1);
        }
    }

    @Nested
    @DisplayName("Unread queries")
    class UnreadTests {

        @Test
        @DisplayName("Should return all unread notifications of a user")
        void shouldFindUnread() {
            notificationRepository.save(notification(1L, NotificationStatus.PENDING));
            notificationRepository.save(notification(1L, NotificationStatus.SENT));
            notificationRepository.save(notification(1L, NotificationStatus.READ));

            final List<Notification> unread =
                    notificationRepository.findByUserIdAndStatusNot(1L, NotificationStatus.READ);

            assertThat(unread).hasSize(2);
        }

        @Test
        @DisplayName("Should page the inbox newest first")
        void shouldPageNewestFirst() {
            notificationRepository.save(notification(1L, NotificationStatus.SENT));
            notificationRepository.save(notification(1L, NotificationStatus.SENT));

            final Page<Notification> page = notificationRepository
                    .findByUserIdOrderByCreatedAtDesc(1L, PageRequest.of(0, 20));

            assertThat(page.getContent()).hasSize(2);
            assertThat(page.getTotalElements()).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("Retention cleanup")
    class CleanupTests {

        @Test
        @DisplayName("Should delete notifications created before the cutoff")
        void shouldDeleteOldNotifications() {
            final Notification saved = notificationRepository.save(notification(1L, NotificationStatus.SENT));

            final long deleted = notificationRepository.deleteByCreatedAtBefore(LocalDateTime.now().plusSeconds(1));

            assertThat(deleted).isEqualTo(1);
            assertThat(notificationRepository.findById(saved.getId())).isEmpty();
        }

        @Test
        @DisplayName("Should not delete notifications created after the cutoff")
        void shouldKeepRecentNotifications() {
            notificationRepository.save(notification(1L, NotificationStatus.SENT));

            final long deleted = notificationRepository.deleteByCreatedAtBefore(LocalDateTime.now().minusDays(1));

            assertThat(deleted).isZero();
            assertThat(notificationRepository.count()).isEqualTo(1);
        }
    }
}
