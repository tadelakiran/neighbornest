package com.neighbornest.nest.repository;

import com.neighbornest.nest.entity.Meeting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for {@link Meeting} entities.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Repository
public interface MeetingRepository extends JpaRepository<Meeting, Long> {

    /**
     * Returns all meetings for a nest, ordered by scheduled time descending.
     *
     * @param nestId the nest ID
     * @return the list of meetings
     */
    List<Meeting> findByNestIdOrderByScheduledAtDesc(Long nestId);
}
