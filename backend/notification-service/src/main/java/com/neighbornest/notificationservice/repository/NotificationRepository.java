package com.neighbornest.notificationservice.repository;

import com.neighbornest.notificationservice.entity.Notification;
import com.neighbornest.notificationservice.enums.NotificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for {@link Notification}.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Returns a user's inbox page, newest first.
     *
     * @param userId   the recipient's profile id
     * @param pageable the paging specification
     * @return the requested page
     */
    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Returns a notification by id and owner (used for ownership-scoped reads).
     *
     * @param id     the notification id
     * @param userId the owner's profile id
     * @return the notification if it belongs to the user
     */
    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    /**
     * Counts all notifications of a user.
     *
     * @param userId the recipient's profile id
     * @return the total count
     */
    long countByUserId(Long userId);

    /**
     * Counts notifications of a user with the given status.
     *
     * @param userId the recipient's profile id
     * @param status the status
     * @return the count
     */
    long countByUserIdAndStatus(Long userId, NotificationStatus status);

    /**
     * Returns all notifications of a user whose status is not the given one
     * (used to load the unread set for mark-all-read).
     *
     * @param userId the recipient's profile id
     * @param status the status to exclude
     * @return the matching notifications
     */
    List<Notification> findByUserIdAndStatusNot(Long userId, NotificationStatus status);

    /**
     * Counts notifications created since a timestamp (stats).
     *
     * @param from the start timestamp
     * @return the count
     */
    long countByCreatedAtAfter(LocalDateTime from);

    /**
     * Counts notifications with the given status created since a timestamp.
     *
     * @param status the status
     * @param from   the start timestamp
     * @return the count
     */
    long countByStatusAndCreatedAtAfter(NotificationStatus status, LocalDateTime from);

    /**
     * Groups notification counts by type since a timestamp (stats).
     *
     * @param from the start timestamp
     * @return rows of [type, count]
     */
    @Query("select n.type, count(n) from Notification n where n.createdAt >= :from group by n.type")
    List<Object[]> countGroupByTypeSince(@Param("from") LocalDateTime from);

    /**
     * Groups notification counts by channel since a timestamp (stats).
     *
     * @param from the start timestamp
     * @return rows of [channel, count]
     */
    @Query("select n.channel, count(n) from Notification n where n.createdAt >= :from group by n.channel")
    List<Object[]> countGroupByChannelSince(@Param("from") LocalDateTime from);

    /**
     * Deletes notifications created before the cutoff (retention cleanup).
     *
     * @param cutoff the cutoff timestamp
     * @return the number of deleted rows
     */
    long deleteByCreatedAtBefore(LocalDateTime cutoff);
}
