package com.neighbornest.nest.repository;

import com.neighbornest.nest.entity.NestMember;
import com.neighbornest.nest.entity.NestMemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for {@link NestMember} entities.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Repository
public interface NestMemberRepository extends JpaRepository<NestMember, Long> {

    /**
     * Returns all members of a nest.
     *
     * @param nestId the nest ID
     * @return the list of members
     */
    List<NestMember> findByNestId(Long nestId);

    /**
     * Finds a member within a nest.
     *
     * @param nestId the nest ID
     * @param userId the user profile ID
     * @return the member, if present
     */
    Optional<NestMember> findByNestIdAndUserId(Long nestId, Long userId);

    /**
     * Returns all nests the user has accepted membership in.
     *
     * @param userId the user profile ID
     * @param status the accepted status
     * @return the list of memberships
     */
    List<NestMember> findByUserIdAndStatus(Long userId, NestMemberStatus status);
}
