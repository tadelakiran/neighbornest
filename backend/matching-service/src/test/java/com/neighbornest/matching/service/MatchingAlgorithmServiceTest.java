package com.neighbornest.matching.service;

import com.neighbornest.matching.client.UserServiceClient;
import com.neighbornest.matching.client.dto.OnboardingAnswerDto;
import com.neighbornest.matching.client.dto.UserMatchDto;
import com.neighbornest.matching.config.MatchingProperties;
import com.neighbornest.matching.dto.response.CompatibilityResponse;
import com.neighbornest.matching.entity.CompatibilityScore;
import com.neighbornest.matching.exception.BadRequestException;
import com.neighbornest.matching.repository.CompatibilityScoreRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link MatchingAlgorithmService}.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MatchingAlgorithmService Unit Tests")
class MatchingAlgorithmServiceTest {

    @Mock
    private UserServiceClient userServiceClient;

    @Mock
    private CompatibilityScoreRepository scoreRepository;

    private MatchingProperties matchingProperties;
    private MatchingAlgorithmService service;

    @BeforeEach
    void setUp() {
        matchingProperties = new MatchingProperties();
        matchingProperties.setTopN(20);
        service = new MatchingAlgorithmService(userServiceClient, scoreRepository, matchingProperties, new ScoringEngine());
    }

    @Nested
    @DisplayName("calculateForUser method")
    class CalculateTests {

        @Test
        @DisplayName("Should calculate scores against all eligible users except self")
        void shouldCalculateAgainstAllEligibleUsers() {
            when(userServiceClient.getReadyForMatch()).thenReturn(List.of(
                    user(1L, "values_adventure", "5"),
                    user(2L, "values_adventure", "5"),
                    user(3L, "values_adventure", "1")));

            final int count = service.calculateForUser(1L);

            assertThat(count).isEqualTo(2);

            final ArgumentCaptor<List<CompatibilityScore>> captor = ArgumentCaptor.forClass(List.class);
            verify(scoreRepository).saveAll(captor.capture());
            assertThat(captor.getValue()).hasSize(2);
            assertThat(captor.getValue()).allMatch(score -> score.getUserId1().equals(1L));
            verify(scoreRepository).deleteByUserId1OrUserId2(1L, 1L);
        }

        @Test
        @DisplayName("Should throw when the user is not eligible for matching")
        void shouldThrowWhenUserNotEligible() {
            when(userServiceClient.getReadyForMatch()).thenReturn(List.of(user(2L, "values_adventure", "5")));

            assertThatThrownBy(() -> service.calculateForUser(99L))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("not eligible");
        }

        @Test
        @DisplayName("Should store every pair with userId1 < userId2 (normalized orientation)")
        void shouldNormalizePairOrientation() {
            // Subject 3 has a HIGHER id than both candidates, so without
            // normalization the stored rows would be (3,1) and (3,2). The
            // rule requires the smaller id to always be userId1.
            when(userServiceClient.getReadyForMatch()).thenReturn(List.of(
                    user(3L, "values_adventure", "5"),
                    user(1L, "values_adventure", "5"),
                    user(2L, "values_adventure", "1")));

            service.calculateForUser(3L);

            final ArgumentCaptor<List<CompatibilityScore>> captor = ArgumentCaptor.forClass(List.class);
            verify(scoreRepository).saveAll(captor.capture());
            assertThat(captor.getValue()).hasSize(2);
            assertThat(captor.getValue())
                    .allMatch(score -> score.getUserId1() < score.getUserId2());
            assertThat(captor.getValue().stream().map(CompatibilityScore::getUserId1))
                    .containsExactlyInAnyOrder(1L, 2L);
            assertThat(captor.getValue().stream().map(CompatibilityScore::getUserId2))
                    .containsExactlyInAnyOrder(3L, 3L);
        }
    }

    @Nested
    @DisplayName("getTopCompatibles method")
    class CompatiblesTests {

        @Test
        @DisplayName("Should return top scores from both orientations ordered by overall score")
        void shouldReturnTopScores() {
            final CompatibilityScore asPrimary = score(1L, 2L, "90.00");
            final CompatibilityScore asCandidate = score(4L, 1L, "70.00");
            final CompatibilityScore low = score(1L, 3L, "50.00");

            when(scoreRepository.findByUserId1OrderByOverallScoreDesc(eq(1L), any(Pageable.class)))
                    .thenReturn(List.of(asPrimary, low));
            when(scoreRepository.findByUserId2OrderByOverallScoreDesc(eq(1L), any(Pageable.class)))
                    .thenReturn(List.of(asCandidate));

            final List<CompatibilityResponse> responses = service.getTopCompatibles(1L);

            assertThat(responses).hasSize(3);
            assertThat(responses.get(0).getUserId()).isEqualTo(2L);
            assertThat(responses.get(0).getOverallScore()).isEqualByComparingTo("90.00");
            // Candidate orientation must resolve the OTHER user as the partner
            assertThat(responses.get(1).getUserId()).isEqualTo(4L);
            assertThat(responses.get(1).getOverallScore()).isEqualByComparingTo("70.00");
            assertThat(responses.get(2).getUserId()).isEqualTo(3L);

            verify(scoreRepository, times(1)).findByUserId1OrderByOverallScoreDesc(eq(1L), any(Pageable.class));
            verify(scoreRepository, times(1)).findByUserId2OrderByOverallScoreDesc(eq(1L), any(Pageable.class));
        }

        @Test
        @DisplayName("Should enrich partners with name and city from the user-service")
        void shouldEnrichWithProfiles() {
            when(scoreRepository.findByUserId1OrderByOverallScoreDesc(eq(1L), any(Pageable.class)))
                    .thenReturn(List.of(score(1L, 2L, "90.00")));
            when(scoreRepository.findByUserId2OrderByOverallScoreDesc(eq(1L), any(Pageable.class)))
                    .thenReturn(List.of());
            when(userServiceClient.getReadyForMatch()).thenReturn(List.of(
                    UserMatchDto.builder().userId(2L).fullName("Jane Roe").city("New York").build()));

            final List<CompatibilityResponse> responses = service.getTopCompatibles(1L);

            assertThat(responses).hasSize(1);
            assertThat(responses.get(0).getUserId()).isEqualTo(2L);
            assertThat(responses.get(0).getFullName()).isEqualTo("Jane Roe");
            assertThat(responses.get(0).getCity()).isEqualTo("New York");
        }

        @Test
        @DisplayName("Should not fail enrichment when the user-service is down")
        void shouldGracefullyDegradeWhenProfilesUnavailable() {
            when(scoreRepository.findByUserId1OrderByOverallScoreDesc(eq(1L), any(Pageable.class)))
                    .thenReturn(List.of(score(1L, 2L, "90.00")));
            when(scoreRepository.findByUserId2OrderByOverallScoreDesc(eq(1L), any(Pageable.class)))
                    .thenReturn(List.of());
            when(userServiceClient.getReadyForMatch())
                    .thenThrow(new RuntimeException("user-service down"));

            final List<CompatibilityResponse> responses = service.getTopCompatibles(1L);

            assertThat(responses).hasSize(1);
            assertThat(responses.get(0).getUserId()).isEqualTo(2L);
            assertThat(responses.get(0).getFullName()).isNull();
        }
    }

    /**
     * Builds a user DTO.
     */
    private UserMatchDto user(final Long id, final String answerKey, final String answerValue) {
        return UserMatchDto.builder()
                .userId(id)
                .budgetLevel("MEDIUM")
                .onboardingAnswers(List.of(OnboardingAnswerDto.builder()
                        .questionKey(answerKey)
                        .answerValue(answerValue)
                        .weight(3)
                        .build()))
                .build();
    }

    /**
     * Builds a score entity.
     */
    private CompatibilityScore score(final Long user1, final Long user2, final String overall) {
        return CompatibilityScore.builder()
                .userId1(user1)
                .userId2(user2)
                .overallScore(new BigDecimal(overall))
                .valuesScore(BigDecimal.valueOf(80))
                .lifestyleScore(BigDecimal.valueOf(80))
                .interestScore(BigDecimal.valueOf(80))
                .build();
    }
}
