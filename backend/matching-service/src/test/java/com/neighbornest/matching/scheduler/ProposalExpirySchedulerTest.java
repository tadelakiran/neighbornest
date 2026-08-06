package com.neighbornest.matching.scheduler;

import com.neighbornest.matching.entity.MatchProposal;
import com.neighbornest.matching.entity.ProposalStatus;
import com.neighbornest.matching.repository.MatchProposalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link ProposalExpiryScheduler}.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ProposalExpiryScheduler Unit Tests")
class ProposalExpirySchedulerTest {

    @Mock
    private MatchProposalRepository proposalRepository;

    private ProposalExpiryScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new ProposalExpiryScheduler(proposalRepository);
    }

    @Test
    @DisplayName("Should expire every pending proposal past its expiry time")
    void shouldExpirePendingProposals() {
        final MatchProposal staleOne = proposal();
        final MatchProposal staleTwo = proposal();
        when(proposalRepository.findByStatusAndExpiresAtBefore(
                eq(ProposalStatus.PENDING), any(LocalDateTime.class)))
                .thenReturn(List.of(staleOne, staleTwo));

        scheduler.expireExpiredProposals();

        assertThat(staleOne.getStatus()).isEqualTo(ProposalStatus.EXPIRED);
        assertThat(staleTwo.getStatus()).isEqualTo(ProposalStatus.EXPIRED);
        verify(proposalRepository).saveAll(List.of(staleOne, staleTwo));
    }

    @Test
    @DisplayName("Should do nothing when no proposals are expired")
    void shouldDoNothingWhenNoneExpired() {
        when(proposalRepository.findByStatusAndExpiresAtBefore(
                eq(ProposalStatus.PENDING), any(LocalDateTime.class)))
                .thenReturn(List.of());

        scheduler.expireExpiredProposals();

        verify(proposalRepository).findByStatusAndExpiresAtBefore(eq(ProposalStatus.PENDING), any(LocalDateTime.class));
        verify(proposalRepository, never()).saveAll(any());
    }

    /**
     * Builds an expired pending proposal.
     */
    private MatchProposal proposal() {
        return MatchProposal.builder()
                .status(ProposalStatus.PENDING)
                .expiresAt(LocalDateTime.now().minusDays(1))
                .build();
    }
}
