package com.neighbornest.matching.service;

import com.neighbornest.matching.client.NestServiceClient;
import com.neighbornest.matching.client.UserServiceClient;
import com.neighbornest.matching.client.dto.CreateNestRequest;
import com.neighbornest.matching.config.MatchingProperties;
import com.neighbornest.matching.dto.request.ProposalCreateRequest;
import com.neighbornest.matching.dto.response.MatchProposalResponse;
import com.neighbornest.matching.dto.response.ProposalMemberResponse;
import com.neighbornest.matching.entity.MatchProposal;
import com.neighbornest.matching.entity.MatchProposalMember;
import com.neighbornest.matching.entity.ProposalResponse;
import com.neighbornest.matching.entity.ProposalStatus;
import com.neighbornest.matching.entity.RoleInNest;
import com.neighbornest.matching.exception.BadRequestException;
import com.neighbornest.matching.exception.ProposalExpiredException;
import com.neighbornest.matching.exception.ResourceNotFoundException;
import com.neighbornest.matching.repository.MatchProposalMemberRepository;
import com.neighbornest.matching.repository.MatchProposalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service managing the Nest formation proposal lifecycle.
 * <p>
 * Creates proposals from a set of users, tracks member responses, marks
 * proposals as accepted when all members accept, and triggers Nest creation
 * in the nest-service via Feign.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MatchProposalService {

    private final MatchProposalRepository proposalRepository;
    private final MatchProposalMemberRepository memberRepository;
    private final NestServiceClient nestServiceClient;
    private final UserServiceClient userServiceClient;
    private final MatchingProperties matchingProperties;

    /**
     * Creates a new proposal with the given members and anchors.
     *
     * @param request the proposal creation request
     * @return the created proposal
     */
    @Transactional
    public MatchProposalResponse createProposal(final ProposalCreateRequest request) {
        log.info("Creating proposal for {} users", request.getUserIds().size());

        validateAnchors(request);

        final MatchProposal proposal = MatchProposal.builder()
                .status(ProposalStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusHours(matchingProperties.getProposalExpiryHours()))
                .build();

        final MatchProposal saved = proposalRepository.save(proposal);

        final Set<Long> anchorIds = request.getAnchorIds() == null ? Set.of() : Set.copyOf(request.getAnchorIds());

        final List<MatchProposalMember> members = request.getUserIds().stream()
                .map(userId -> MatchProposalMember.builder()
                        .matchProposalId(saved.getId())
                        .userId(userId)
                        .roleInNest(anchorIds.contains(userId) ? RoleInNest.ANCHOR : RoleInNest.MEMBER)
                        .response(ProposalResponse.PENDING)
                        .build())
                .toList();

        memberRepository.saveAll(members);
        log.info("Proposal created with id: {}", saved.getId());

        return toResponse(saved, members);
    }

    /**
     * Records a user's response to a proposal.
     * <p>
     * When all members have accepted, the proposal transitions to ACCEPTED.
     * If any member declines, the proposal is marked REJECTED.
     * </p>
     *
     * @param proposalId the proposal ID
     * @param userId     the responding user ID
     * @param accept     whether the user accepts
     * @return the updated proposal
     */
    @Transactional
    public MatchProposalResponse respond(final Long proposalId, final Long userId, final boolean accept) {
        log.info("User {} responding {} to proposal {}", userId, accept ? "accept" : "decline", proposalId);

        final MatchProposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found with id: " + proposalId));

        if (proposal.getStatus() != ProposalStatus.PENDING) {
            throw new BadRequestException("Proposal " + proposalId + " is no longer open for responses");
        }
        if (proposal.getExpiresAt().isBefore(LocalDateTime.now())) {
            proposal.setStatus(ProposalStatus.EXPIRED);
            proposalRepository.save(proposal);
            throw new ProposalExpiredException("Proposal " + proposalId + " has expired");
        }

        final MatchProposalMember member = memberRepository.findByMatchProposalIdAndUserId(proposalId, userId)
                .orElseThrow(() -> new BadRequestException("User " + userId + " is not part of proposal " + proposalId));

        member.setResponse(accept ? ProposalResponse.ACCEPTED : ProposalResponse.DECLINED);
        member.setRespondedAt(LocalDateTime.now());
        memberRepository.save(member);

        updateProposalStatus(proposal);

        return toResponse(proposal, memberRepository.findByMatchProposalId(proposalId));
    }

    /**
     * Returns all pending proposals for a user.
     *
     * @param userId the user profile ID
     * @return the list of pending proposals
     */
    @Transactional(readOnly = true)
    public List<MatchProposalResponse> getPendingProposals(final Long userId) {
        log.debug("Fetching pending proposals for user: {}", userId);

        return memberRepository.findByUserIdAndResponse(userId, ProposalResponse.PENDING).stream()
                .filter(member -> {
                    final MatchProposal proposal = proposalRepository.findById(member.getMatchProposalId()).orElse(null);
                    return proposal != null && proposal.getStatus() == ProposalStatus.PENDING;
                })
                .map(member -> toResponse(
                        proposalRepository.findById(member.getMatchProposalId()).orElseThrow(),
                        memberRepository.findByMatchProposalId(member.getMatchProposalId())))
                .toList();
    }

    /**
     * Executes an accepted proposal by creating a Nest in the nest-service.
     *
     * @param proposalId the proposal ID
     * @return the executed proposal
     */
    @Transactional
    public MatchProposalResponse execute(final Long proposalId) {
        final MatchProposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found with id: " + proposalId));

        if (proposal.getStatus() != ProposalStatus.ACCEPTED) {
            throw new BadRequestException("Only accepted proposals can be executed");
        }

        final List<MatchProposalMember> members = memberRepository.findByMatchProposalId(proposalId);

        final CreateNestRequest request = CreateNestRequest.builder()
                .name("Nest-" + proposalId)
                .city(resolveCity(members))
                .memberUserIds(members.stream().map(MatchProposalMember::getUserId).toList())
                .anchorUserIds(members.stream()
                        .filter(m -> m.getRoleInNest() == RoleInNest.ANCHOR)
                        .map(MatchProposalMember::getUserId)
                        .toList())
                .build();

        nestServiceClient.createNest(request);
        log.info("Proposal {} executed: Nest creation triggered", proposalId);

        return toResponse(proposal, members);
    }

    /**
     * Resolves the city for the new Nest from the first member's profile.
     * <p>
     * Falls back to an empty city if the user-service is unavailable so the
     * proposal can still be executed with the city resolved later.
     * </p>
     *
     * @param members the proposal members
     * @return the resolved city, possibly empty
     */
    private String resolveCity(final List<MatchProposalMember> members) {
        return members.stream()
                .findFirst()
                .map(member -> {
                    final String city = userServiceClient.getUserCity(member.getUserId()).getCity();
                    return city == null ? "" : city;
                })
                .orElse("");
    }

    /**
     * Validates that all anchors are also members of the proposal.
     *
     * @param request the proposal creation request
     */
    private void validateAnchors(final ProposalCreateRequest request) {
        if (request.getAnchorIds() == null || request.getAnchorIds().isEmpty()) {
            return;
        }
        final Set<Long> memberIds = Set.copyOf(request.getUserIds());
        final boolean allAnchorsAreMembers = request.getAnchorIds().stream().allMatch(memberIds::contains);
        if (!allAnchorsAreMembers) {
            throw new BadRequestException("All anchor IDs must be included in the member list");
        }
    }

    /**
     * Transitions the proposal status based on member responses.
     *
     * @param proposal the proposal to update
     */
    private void updateProposalStatus(final MatchProposal proposal) {
        final List<MatchProposalMember> members = memberRepository.findByMatchProposalId(proposal.getId());

        final boolean anyDeclined = members.stream()
                .anyMatch(m -> m.getResponse() == ProposalResponse.DECLINED);
        if (anyDeclined) {
            proposal.setStatus(ProposalStatus.REJECTED);
            proposalRepository.save(proposal);
            return;
        }

        final boolean allAccepted = members.stream()
                .allMatch(m -> m.getResponse() == ProposalResponse.ACCEPTED);
        if (allAccepted) {
            proposal.setStatus(ProposalStatus.ACCEPTED);
            proposal.setAcceptedAt(LocalDateTime.now());
            proposalRepository.save(proposal);
        }
    }

    /**
     * Maps a proposal and its members to a response DTO.
     *
     * @param proposal the proposal entity
     * @param members  the member entities
     * @return the response DTO
     */
    private MatchProposalResponse toResponse(final MatchProposal proposal, final List<MatchProposalMember> members) {
        return MatchProposalResponse.builder()
                .id(proposal.getId())
                .status(proposal.getStatus())
                .proposedAt(proposal.getProposedAt())
                .expiresAt(proposal.getExpiresAt())
                .acceptedAt(proposal.getAcceptedAt())
                .members(members.stream().map(this::toMemberResponse).toList())
                .build();
    }

    /**
     * Maps a proposal member entity to its response DTO.
     *
     * @param member the member entity
     * @return the response DTO
     */
    private ProposalMemberResponse toMemberResponse(final MatchProposalMember member) {
        return ProposalMemberResponse.builder()
                .userId(member.getUserId())
                .roleInNest(member.getRoleInNest())
                .response(member.getResponse())
                .respondedAt(member.getRespondedAt())
                .build();
    }
}
