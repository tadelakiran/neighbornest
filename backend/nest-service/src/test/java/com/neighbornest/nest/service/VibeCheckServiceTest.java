package com.neighbornest.nest.service;

import com.neighbornest.nest.dto.request.VibeCheckRequest;
import com.neighbornest.nest.dto.response.VibeCheckResponse;
import com.neighbornest.nest.dto.response.VibeCheckStatusResponse;
import com.neighbornest.nest.entity.VibeCheck;
import com.neighbornest.nest.exception.InvalidOperationException;
import com.neighbornest.nest.repository.VibeCheckRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link VibeCheckService}.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("VibeCheckService Unit Tests")
class VibeCheckServiceTest {

    @Mock
    private VibeCheckRepository vibeCheckRepository;

    @Mock
    private NestService nestService;

    private VibeCheckService vibeCheckService;

    @BeforeEach
    void setUp() {
        vibeCheckService = new VibeCheckService(vibeCheckRepository, nestService);
    }

    @Nested
    @DisplayName("submit method")
    class SubmitTests {

        @Test
        @DisplayName("Should submit a vibe check for a member")
        void shouldSubmitVibeCheck() {
            final VibeCheck saved = VibeCheck.builder()
                    .id(1L)
                    .nestId(1L)
                    .userId(7L)
                    .connectionScore(8)
                    .comfortScore(9)
                    .feedback("Loving the energy!")
                    .submittedAt(LocalDateTime.now())
                    .build();
            when(vibeCheckRepository.findByNestIdAndUserId(1L, 7L)).thenReturn(Optional.empty());
            when(vibeCheckRepository.save(any(VibeCheck.class))).thenReturn(saved);

            final VibeCheckResponse response = vibeCheckService.submit(1L, 7L,
                    VibeCheckRequest.builder()
                            .connectionScore(8)
                            .comfortScore(9)
                            .feedback("Loving the energy!")
                            .build());

            verify(nestService).requireMember(1L, 7L);
            assertThat(response.getUserId()).isEqualTo(7L);
            assertThat(response.getConnectionScore()).isEqualTo(8);
        }

        @Test
        @DisplayName("Should reject a duplicate submission")
        void shouldRejectDuplicateSubmission() {
            when(vibeCheckRepository.findByNestIdAndUserId(1L, 7L))
                    .thenReturn(Optional.of(VibeCheck.builder().id(1L).nestId(1L).userId(7L).build()));

            assertThatThrownBy(() -> vibeCheckService.submit(1L, 7L,
                    VibeCheckRequest.builder().connectionScore(8).comfortScore(9).build()))
                    .isInstanceOf(InvalidOperationException.class)
                    .hasMessageContaining("already submitted");
        }
    }

    @Nested
    @DisplayName("getStatus method")
    class GetStatusTests {

        @Test
        @DisplayName("Should aggregate scores across submissions")
        void shouldAggregateScores() {
            when(vibeCheckRepository.findByNestId(1L)).thenReturn(List.of(
                    check(7L, 8, 9),
                    check(8L, 6, 7)));

            final VibeCheckStatusResponse response = vibeCheckService.getStatus(1L, 7L);

            verify(nestService).requireMember(1L, 7L);
            assertThat(response.getSubmissionCount()).isEqualTo(2);
            assertThat(response.getAverageConnection()).isEqualByComparingTo("7.00");
            assertThat(response.getAverageComfort()).isEqualByComparingTo("8.00");
            assertThat(response.getOverallAverage()).isEqualByComparingTo("7.50");
        }

        @Test
        @DisplayName("Should return zeros when there are no submissions")
        void shouldReturnZerosWhenEmpty() {
            when(vibeCheckRepository.findByNestId(1L)).thenReturn(List.of());

            final VibeCheckStatusResponse response = vibeCheckService.getStatus(1L, 7L);

            assertThat(response.getSubmissionCount()).isZero();
            assertThat(response.getAverageConnection()).isEqualByComparingTo("0.00");
            assertThat(response.getOverallAverage()).isEqualByComparingTo("0.00");
        }
    }

    private VibeCheck check(final Long userId, final int connection, final int comfort) {
        return VibeCheck.builder()
                .id(userId)
                .nestId(1L)
                .userId(userId)
                .connectionScore(connection)
                .comfortScore(comfort)
                .feedback("Fine")
                .submittedAt(LocalDateTime.now())
                .build();
    }
}
