package com.neighbornest.user.repository;

import com.neighbornest.user.entity.AnchorApplication;
import com.neighbornest.user.entity.AnchorStatus;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Repository tests for {@link AnchorApplicationRepository} using an in-memory
 * H2 database ({@link DataJpaTest}).
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@DataJpaTest
@ActiveProfiles("test")
@DisplayName("AnchorApplicationRepository DataJpa Tests")
class AnchorApplicationRepositoryTest {

    @Autowired
    private AnchorApplicationRepository anchorApplicationRepository;

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Builds an application for the given profile.
     */
    private AnchorApplication application(final Long profileId, final int yearsInCity) {
        return AnchorApplication.builder()
                .userProfileId(profileId)
                .yearsInCity(yearsInCity)
                .neighborhoodsKnown("Mission, Noe Valley")
                .experience("Ran a local book club for 3 years")
                .build();
    }

    @Nested
    @DisplayName("findTopByUserProfileIdOrderByAppliedAtDesc method")
    class FindTopByProfileTests {

        @Test
        @DisplayName("Should return the most recently applied application")
        void shouldReturnMostRecentApplication() {
            final AnchorApplication older = anchorApplicationRepository.saveAndFlush(application(1L, 2));
            final AnchorApplication newer = anchorApplicationRepository.saveAndFlush(application(1L, 5));

            // @PrePersist overwrites appliedAt with now(), so force deterministic
            // timestamps via JPQL instead of relying on wall-clock timing.
            setAppliedAt(older.getId(), LocalDateTime.now().minusDays(1));
            setAppliedAt(newer.getId(), LocalDateTime.now());
            entityManager.flush();
            entityManager.clear();

            final Optional<AnchorApplication> found =
                    anchorApplicationRepository.findTopByUserProfileIdOrderByAppliedAtDesc(1L);

            assertThat(found).isPresent();
            assertThat(found.get().getYearsInCity()).isEqualTo(5);
            assertThat(found.get().getStatus()).isEqualTo(AnchorStatus.PENDING);
        }

        /**
         * Updates the appliedAt timestamp of an application directly in the
         * database so ordering assertions do not depend on clock resolution.
         */
        private void setAppliedAt(final Long applicationId, final LocalDateTime timestamp) {
            entityManager.createQuery(
                            "update AnchorApplication a set a.appliedAt = :ts where a.id = :id")
                    .setParameter("ts", timestamp)
                    .setParameter("id", applicationId)
                    .executeUpdate();
        }

        @Test
        @DisplayName("Should return empty when the profile has no application")
        void shouldReturnEmptyWhenNoApplication() {
            assertThat(anchorApplicationRepository.findTopByUserProfileIdOrderByAppliedAtDesc(999L))
                    .isEmpty();
        }
    }
}
