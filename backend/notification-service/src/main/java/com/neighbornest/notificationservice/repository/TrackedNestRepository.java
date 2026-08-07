package com.neighbornest.notificationservice.repository;

import com.neighbornest.notificationservice.entity.TrackedNest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Spring Data JPA repository for {@link TrackedNest}.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public interface TrackedNestRepository extends JpaRepository<TrackedNest, Long> {

    /**
     * Finds the tracked record for a nest-service Nest id.
     *
     * @param nestId the Nest id
     * @return the tracked record, if present
     */
    Optional<TrackedNest> findByNestId(Long nestId);
}
