package com.neighbornest.nest.service;

import com.neighbornest.nest.client.UserServiceClient;
import com.neighbornest.nest.client.UserProfileSummary;
import com.neighbornest.nest.dto.request.CreateNestRequest;
import com.neighbornest.nest.dto.response.NestMemberResponse;
import com.neighbornest.nest.dto.response.NestResponse;
import com.neighbornest.nest.entity.Nest;
import com.neighbornest.nest.entity.NestMember;
import com.neighbornest.nest.entity.NestMemberStatus;
import com.neighbornest.nest.entity.NestRole;
import com.neighbornest.nest.entity.NestStatus;
import com.neighbornest.nest.event.NestCreatedEvent;
import com.neighbornest.nest.event.NestEventPublisher;
import com.neighbornest.nest.event.NestGraduatedEvent;
import com.neighbornest.nest.exception.BadRequestException;
import com.neighbornest.nest.exception.InvalidOperationException;
import com.neighbornest.nest.exception.ResourceNotFoundException;
import com.neighbornest.nest.repository.NestMemberRepository;
import com.neighbornest.nest.repository.NestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * Service managing the Nest lifecycle.
 * <p>
 * Creates Nests (called by the matching-service via Feign once a proposal is
 * accepted), retrieves Nest details with members, lists a user's Nests and
 * transitions Nests between lifecycle statuses. Publishes RabbitMQ events on
 * lifecycle transitions.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NestService {

    private final NestRepository nestRepository;
    private final NestMemberRepository nestMemberRepository;
    private final UserServiceClient userServiceClient;
    private final NestEventPublisher nestEventPublisher;

    /**
     * Creates a new Nest with its members and anchors.
     * <p>
     * Members are created in the ACCEPTED state (the matching-service only
     * calls this after all members have accepted) and the Nest moves to
     * ACTIVE, which triggers a {@link NestCreatedEvent} publish.
     * </p>
     *
     * @param request the nest creation request
     * @return the created Nest
     * @throws BadRequestException if a member appears more than once
     */
    @Transactional
    public NestResponse createNest(final CreateNestRequest request) {
        log.info("Creating nest '{}' in {}", request.getName(), request.getCity());

        validateMembers(request);

        final Nest nest = Nest.builder()
                .name(request.getName().trim())
                .city(request.getCity().trim())
                .status(NestStatus.ACTIVE)
                .startDate(LocalDate.now())
                .build();

        final Nest saved = nestRepository.save(nest);

        final Set<Long> anchorIds = request.getAnchorUserIds() == null
                ? Set.of() : Set.copyOf(request.getAnchorUserIds());

        final List<NestMember> members = request.getMemberUserIds().stream()
                .map(userId -> NestMember.builder()
                        .nestId(saved.getId())
                        .userId(userId)
                        .roleInNest(anchorIds.contains(userId) ? NestRole.ANCHOR : NestRole.MEMBER)
                        .status(NestMemberStatus.ACCEPTED)
                        .joinedAt(LocalDateTime.now())
                        .build())
                .toList();

        nestMemberRepository.saveAll(members);

        nestEventPublisher.publishNestCreated(new NestCreatedEvent(
                saved.getId(), saved.getName(), saved.getCity(),
                request.getMemberUserIds(), anchorIds.stream().toList(), saved.getCreatedAt()));

        log.info("Nest created with id: {}", saved.getId());

        return toResponse(saved, members);
    }

    /**
     * Returns a Nest's details including its members.
     *
     * @param nestId the nest ID
     * @return the Nest response
     * @throws ResourceNotFoundException if the Nest does not exist
     */
    @Transactional(readOnly = true)
    public NestResponse getNest(final Long nestId) {
        final Nest nest = findNest(nestId);
        return toResponse(nest, nestMemberRepository.findByNestId(nestId));
    }

    /**
     * Returns all active or graduated Nests the user belongs to.
     *
     * @param userId the user profile ID
     * @return the list of Nest responses
     */
    @Transactional(readOnly = true)
    public List<NestResponse> getMyNests(final Long userId) {
        log.debug("Fetching nests for user: {}", userId);

        return nestMemberRepository.findByUserIdAndStatus(userId, NestMemberStatus.ACCEPTED).stream()
                .map(member -> nestRepository.findById(member.getNestId()).orElse(null))
                .filter(nest -> nest != null && isVisibleStatus(nest.getStatus()))
                .map(nest -> toResponse(nest, nestMemberRepository.findByNestId(nest.getId())))
                .toList();
    }

    /**
     * Marks a Nest as graduated and publishes a {@link NestGraduatedEvent}.
     *
     * @param nestId the nest ID
     * @return the updated Nest
     * @throws InvalidOperationException if the Nest is not active
     */
    @Transactional
    public NestResponse graduate(final Long nestId) {
        final Nest nest = findNest(nestId);

        if (nest.getStatus() != NestStatus.ACTIVE) {
            throw new InvalidOperationException("Only active nests can graduate");
        }

        nest.setStatus(NestStatus.GRADUATED);
        nest.setEndDate(LocalDate.now());
        final Nest saved = nestRepository.save(nest);

        final List<NestMember> members = nestMemberRepository.findByNestId(nestId);
        members.forEach(member -> member.setGraduated(true));
        nestMemberRepository.saveAll(members);

        nestEventPublisher.publishNestGraduated(new NestGraduatedEvent(
                saved.getId(), saved.getName(), saved.getCity(), saved.getStartDate(), LocalDateTime.now()));

        log.info("Nest {} graduated", nestId);

        return toResponse(saved, nestMemberRepository.findByNestId(nestId));
    }

    /**
     * Marks a Nest as disbanded.
     *
     * @param nestId the nest ID
     * @return the updated Nest
     * @throws InvalidOperationException if the Nest has already graduated or disbanded
     */
    @Transactional
    public NestResponse disband(final Long nestId) {
        final Nest nest = findNest(nestId);

        if (nest.getStatus() == NestStatus.GRADUATED || nest.getStatus() == NestStatus.DISBANDED) {
            throw new InvalidOperationException("Nest has already ended");
        }

        nest.setStatus(NestStatus.DISBANDED);
        nest.setEndDate(LocalDate.now());
        final Nest saved = nestRepository.save(nest);

        log.info("Nest {} disbanded", nestId);

        return toResponse(saved, nestMemberRepository.findByNestId(nestId));
    }

    /**
     * Returns a nest entity or throws.
     *
     * @param nestId the nest ID
     * @return the nest entity
     */
    private Nest findNest(final Long nestId) {
        return nestRepository.findById(nestId)
                .orElseThrow(() -> new ResourceNotFoundException("Nest not found with id: " + nestId));
    }

    /**
     * Validates that members are unique.
     *
     * @param request the nest creation request
     */
    private void validateMembers(final CreateNestRequest request) {
        final long distinct = request.getMemberUserIds().stream().distinct().count();
        if (distinct != request.getMemberUserIds().size()) {
            throw new BadRequestException("Member list must not contain duplicates");
        }
    }

    /**
     * Returns whether a nest status is visible to members.
     *
     * @param status the nest status
     * @return {@code true} if visible
     */
    private boolean isVisibleStatus(final NestStatus status) {
        return status == NestStatus.ACTIVE
                || status == NestStatus.VIBE_CHECK
                || status == NestStatus.RE_MATCHING
                || status == NestStatus.GRADUATED;
    }

    /**
     * Maps a nest and its members to a response DTO.
     *
     * @param nest    the nest entity
     * @param members the member entities
     * @return the response DTO
     */
    private NestResponse toResponse(final Nest nest, final List<NestMember> members) {
        return NestResponse.builder()
                .id(nest.getId())
                .name(nest.getName())
                .city(nest.getCity())
                .status(nest.getStatus())
                .startDate(nest.getStartDate())
                .endDate(nest.getEndDate())
                .members(members.stream().map(this::toMemberResponse).toList())
                .createdAt(nest.getCreatedAt())
                .build();
    }

    /**
     * Maps a nest member entity to a response DTO, enriching the display name
     * from the user-service.
     *
     * @param member the member entity
     * @return the response DTO
     */
    private NestMemberResponse toMemberResponse(final NestMember member) {
        final UserProfileSummary profile = userServiceClient.getProfile(member.getUserId());

        return NestMemberResponse.builder()
                .userId(member.getUserId())
                .fullName(profile.getFullName())
                .roleInNest(member.getRoleInNest())
                .status(member.getStatus())
                .joinedAt(member.getJoinedAt())
                .graduated(member.isGraduated())
                .build();
    }
}
