package com.neighbornest.matching.service;

import com.neighbornest.matching.client.NestServiceClient;
import com.neighbornest.matching.client.UserServiceClient;
import com.neighbornest.matching.client.dto.CreateNestRequest;
import com.neighbornest.matching.client.dto.NestResponseDto;
import com.neighbornest.matching.client.dto.UserCityDto;
import com.neighbornest.matching.config.MatchingProperties;
import com.neighbornest.matching.dto.request.ProposalCreateRequest;
import com.neighbornest.matching.dto.response.MatchProposalResponse;
import com.neighbornest.matching.dto.response.ProposalExecutionResponse;
import com.neighbornest.matching.entity.MatchProposal;
import com.neighbornest.matching.entity.MatchProposalMember;
import com.neighbornest.matching.entity.ProposalResponse;
import com.neighbornest.matching.entity.ProposalStatus;
import com.neighbornest.matching.entity.RoleInNest;
import com.neighbornest.matching.exception.BadRequestException;
import com.neighbornest.matching.exception.ResourceNotFoundException;
import com.neighbornest.matching.repository.MatchProposalMemberRepository;
import com.neighbornest.matching.repository.MatchProposalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link MatchProposalService}.
 * <p>
 * Repositories and Feign clients are mocked so the proposal lifecycle is
 * exercised in isolation.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MatchProposalService Unit Tests")
class MatchProposalServiceTest {

    @Mock
    private MatchProposalRepository proposalRepository;

    @Mock
    private MatchProposalMemberRepository memberRepository;

    @Mock
    private NestServiceClient nestServiceClient;

    @Mock
    private UserServiceClient userServiceClient;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private MatchProposalService service;

    @BeforeEach
    void setUp() {
        final MatchingProperties matchingProperties = new MatchingProperties();
        matchingProperties.setProposalExpiryHours(168);
        service = new MatchProposalService(
                proposalRepository, memberRepository, nestServiceClient,
                userServiceClient, matchingProperties, eventPublisher);
    }

    @Nested
    @DisplayName("createProposal method")
    class CreateProposalTests {

        @Test
        @DisplayName("Should create a PENDING proposal with members and anchors")
        void shouldCreateProposal() {
            when(proposalRepository.save(any(MatchProposal.class))).thenAnswer(invocation -> {
                final MatchProposal proposal = invocation.getArgument(0);
                proposal.setId(1L);
                return proposal;
            });
            when(memberRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

            final ProposalCreateRequest request = ProposalCreateRequest.builder()
                    .userIds(List.of(1L, 2L, 3L, 4L, 5L))
                    .anchorIds(List.of(1L))
                    .build();

            final MatchProposalResponse response = service.createProposal(request);

            assertThat(response.getId()).isEqualTo(1L);
            assertThat(response.getStatus()).isEqualTo(ProposalStatus.PENDING);
            assertThat(response.getMembers()).hasSize(5);

            final ArgumentCaptor<List<MatchProposalMember>> captor = ArgumentCaptor.forClass(List.class);
            verify(memberRepository).saveAll(captor.capture());
            assertThat(captor.getValue()).hasSize(5);
            assertThat(captor.getValue().stream()
                    .filter(m -> m.getRoleInNest() == RoleInNest.ANCHOR))
                    .hasSize(1);
        }

        @Test
        @DisplayName("Should reject a proposal smaller than the minimum nest size")
        void shouldRejectTooSmallProposal() {
            final ProposalCreateRequest request = ProposalCreateRequest.builder()
                    .userIds(List.of(1L, 2L, 3L))
                    .anchorIds(List.of(1L))
                    .build();

            assertThatThrownBy(() -> service.createProposal(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("between 5 and 8");
        }

        @Test
        @DisplayName("Should reject a proposal without the required anchor count")
        void shouldRejectMissingAnchors() {
            final ProposalCreateRequest request = ProposalCreateRequest.builder()
                    .userIds(List.of(1L, 2L, 3L, 4L, 5L, 6L))
                    .build();

            assertThatThrownBy(() -> service.createProposal(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("anchors");
        }

        @Test
        @DisplayName("Should reject anchors that are not also members")
        void shouldRejectAnchorsOutsideMembers() {
            final ProposalCreateRequest request = ProposalCreateRequest.builder()
                    .userIds(List.of(1L, 2L, 3L, 4L, 5L))
                    .anchorIds(List.of(99L))
                    .build();

            assertThatThrownBy(() -> service.createProposal(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("must be included");
        }
    }

    @Nested
    @DisplayName("respond method")
    class RespondTests {

        @Test
        @DisplayName("Should accept the proposal and publish an event when all members accept")
        void shouldAcceptAndPublishEventWhenAllAccept() {
            final MatchProposal proposal = proposal(ProposalStatus.PENDING);
            when(proposalRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(proposal));
            when(memberRepository.findByMatchProposalIdAndUserId(1L, 100L))
                    .thenReturn(Optional.of(member(1L, 100L, ProposalResponse.PENDING)));
            when(memberRepository.findByMatchProposalId(1L)).thenReturn(List.of(
                    member(1L, 100L, ProposalResponse.ACCEPTED),
                    member(1L, 101L, ProposalResponse.ACCEPTED),
                    member(1L, 102L, ProposalResponse.ACCEPTED)));
            when(proposalRepository.save(any(MatchProposal.class))).thenReturn(proposal);

            final MatchProposalResponse response = service.respond(1L, 100L, true);

            // The proposal is durably ACCEPTED here; Nest creation is deferred
            // to AFTER_COMMIT via the event (handled by ProposalExecutionListener).
            assertThat(response.getStatus()).isEqualTo(ProposalStatus.ACCEPTED);
            assertThat(response.getNestId()).isNull();
            verify(eventPublisher).publishEvent(new com.neighbornest.matching.event.ProposalAcceptedEvent(1L));
            verify(nestServiceClient, never()).createNest(any(CreateNestRequest.class));
        }

        @Test
        @DisplayName("Should reject the proposal when any member declines")
        void shouldRejectWhenAnyDeclines() {
            final MatchProposal proposal = proposal(ProposalStatus.PENDING);
            when(proposalRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(proposal));
            when(memberRepository.findByMatchProposalIdAndUserId(1L, 100L))
                    .thenReturn(Optional.of(member(1L, 100L, ProposalResponse.PENDING)));
            when(memberRepository.findByMatchProposalId(1L)).thenReturn(List.of(
                    member(1L, 100L, ProposalResponse.DECLINED),
                    member(1L, 101L, ProposalResponse.ACCEPTED)));

            final MatchProposalResponse response = service.respond(1L, 100L, false);

            assertThat(response.getStatus()).isEqualTo(ProposalStatus.REJECTED);
            verify(eventPublisher, never()).publishEvent(any());
            verify(nestServiceClient, never()).createNest(any(CreateNestRequest.class));
        }

        @Test
        @DisplayName("Should throw when the user is not a member of the proposal")
        void shouldThrowWhenNotAMember() {
            final MatchProposal proposal = proposal(ProposalStatus.PENDING);
            when(proposalRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(proposal));
            when(memberRepository.findByMatchProposalIdAndUserId(1L, 999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.respond(1L, 999L, true))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("not part of proposal");
        }
    }

    @Nested
    @DisplayName("execute method")
    class ExecuteTests {

        @Test
        @DisplayName("Should execute an accepted proposal and capture the Nest ID")
        void shouldExecuteAcceptedProposal() {
            final MatchProposal proposal = proposal(ProposalStatus.ACCEPTED);
            when(proposalRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(proposal));
            when(memberRepository.findByMatchProposalId(1L)).thenReturn(List.of(
                    member(1L, 100L, ProposalResponse.ACCEPTED),
                    member(1L, 101L, ProposalResponse.ACCEPTED)));
            when(userServiceClient.getUserCity(any())).thenReturn(UserCityDto.builder().city("SF").build());
            when(nestServiceClient.createNest(any(CreateNestRequest.class)))
                    .thenReturn(NestResponseDto.builder().id(9L).build());

            final ProposalExecutionResponse response = service.execute(1L);

            assertThat(response.getProposalId()).isEqualTo(1L);
            assertThat(response.getNestId()).isEqualTo(9L);
            assertThat(proposal.getNestId()).isEqualTo(9L);
            assertThat(proposal.getStatus()).isEqualTo(ProposalStatus.COMPLETED);
            verify(proposalRepository).save(proposal);
        }

        @Test
        @DisplayName("Should throw when the proposal is not accepted")
        void shouldThrowWhenNotAccepted() {
            when(proposalRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(proposal(ProposalStatus.PENDING)));

            assertThatThrownBy(() -> service.execute(1L))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Only accepted proposals");
        }

        @Test
        @DisplayName("Should throw when the proposal does not exist")
        void shouldThrowWhenMissing() {
            when(proposalRepository.findByIdForUpdate(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.execute(99L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should treat a null Nest response as a failure and keep the proposal ACCEPTED")
        void shouldNotCompleteWhenNestResponseMissing() {
            final MatchProposal proposal = proposal(ProposalStatus.ACCEPTED);
            when(proposalRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(proposal));
            when(memberRepository.findByMatchProposalId(1L)).thenReturn(List.of(
                    member(1L, 100L, ProposalResponse.ACCEPTED)));
            when(userServiceClient.getUserCity(any())).thenReturn(UserCityDto.builder().city("SF").build());
            when(nestServiceClient.createNest(any(CreateNestRequest.class))).thenReturn(null);

            assertThatThrownBy(() -> service.execute(1L))
                    .isInstanceOf(com.neighbornest.matching.exception.ServiceUnavailableException.class)
                    .hasMessageContaining("Nest ID");

            assertThat(proposal.getStatus()).isEqualTo(ProposalStatus.ACCEPTED);
            assertThat(proposal.getNestId()).isNull();
        }
    }

    /**
     * Builds a proposal with the given status.
     */
    private MatchProposal proposal(final ProposalStatus status) {
        return MatchProposal.builder()
                .id(1L)
                .status(status)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
    }

    /**
     * Builds a proposal member.
     */
    private MatchProposalMember member(final Long proposalId, final Long userId, final ProposalResponse response) {
        return MatchProposalMember.builder()
                .matchProposalId(proposalId)
                .userId(userId)
                .roleInNest(RoleInNest.MEMBER)
                .response(response)
                .build();
    }
}
