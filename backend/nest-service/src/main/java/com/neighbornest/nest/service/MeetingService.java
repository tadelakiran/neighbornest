package com.neighbornest.nest.service;

import com.neighbornest.nest.dto.request.MeetingRequest;
import com.neighbornest.nest.dto.response.MeetingResponse;
import com.neighbornest.nest.entity.Meeting;
import com.neighbornest.nest.entity.MeetingStatus;
import com.neighbornest.nest.exception.InvalidOperationException;
import com.neighbornest.nest.exception.ResourceNotFoundException;
import com.neighbornest.nest.repository.MeetingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service handling Nest meeting scheduling and listing.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MeetingService {

    private final MeetingRepository meetingRepository;
    private final NestService nestService;

    /**
     * Schedules a new meeting for a Nest.
     *
     * @param nestId  the nest ID
     * @param request the meeting request
     * @return the created meeting
     * @throws ResourceNotFoundException if the Nest does not exist
     */
    @Transactional
    public MeetingResponse scheduleMeeting(final Long nestId, final Long userId, final MeetingRequest request) {
        nestService.requireMember(nestId, userId);

        final Meeting meeting = Meeting.builder()
                .nestId(nestId)
                .scheduledAt(request.getScheduledAt())
                .venueName(request.getVenueName())
                .venueAddress(request.getVenueAddress())
                .activityType(request.getActivityType())
                .description(request.getDescription())
                .build();

        final Meeting saved = meetingRepository.save(meeting);
        log.info("Meeting scheduled with id: {} for nest: {}", saved.getId(), nestId);

        return toResponse(saved);
    }

    /**
     * Lists all meetings for a Nest.
     *
     * @param nestId the nest ID
     * @return the list of meetings
     */
    /**
     * Lists all meetings for a Nest.
     *
     * @param nestId the nest ID
     * @param userId the user profile ID (must be a member)
     * @return the list of meetings
     */
    @Transactional(readOnly = true)
    public List<MeetingResponse> listMeetings(final Long nestId, final Long userId) {
        nestService.requireMember(nestId, userId);

        return meetingRepository.findByNestIdOrderByScheduledAtDesc(nestId).stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Marks a meeting as completed.
     *
     * @param nestId    the nest ID
     * @param meetingId the meeting ID
     * @param userId    the user profile ID (must be a member)
     * @return the updated meeting
     * @throws InvalidOperationException if the meeting is not currently scheduled
     */
    @Transactional
    public MeetingResponse completeMeeting(final Long nestId, final Long meetingId, final Long userId) {
        nestService.requireMember(nestId, userId);
        final Meeting meeting = findMeeting(nestId, meetingId);

        if (meeting.getStatus() != MeetingStatus.SCHEDULED) {
            throw new InvalidOperationException("Only scheduled meetings can be completed");
        }

        meeting.setStatus(MeetingStatus.COMPLETED);
        final Meeting saved = meetingRepository.save(meeting);
        log.info("Meeting {} completed for nest {}", meetingId, nestId);
        return toResponse(saved);
    }

    /**
     * Marks a meeting as cancelled.
     *
     * @param nestId    the nest ID
     * @param meetingId the meeting ID
     * @param userId    the user profile ID (must be a member)
     * @return the updated meeting
     * @throws InvalidOperationException if the meeting is not currently scheduled
     */
    @Transactional
    public MeetingResponse cancelMeeting(final Long nestId, final Long meetingId, final Long userId) {
        nestService.requireMember(nestId, userId);
        final Meeting meeting = findMeeting(nestId, meetingId);

        if (meeting.getStatus() != MeetingStatus.SCHEDULED) {
            throw new InvalidOperationException("Only scheduled meetings can be cancelled");
        }

        meeting.setStatus(MeetingStatus.CANCELLED);
        final Meeting saved = meetingRepository.save(meeting);
        log.info("Meeting {} cancelled for nest {}", meetingId, nestId);
        return toResponse(saved);
    }

    /**
     * Finds a meeting within a nest or throws.
     *
     * @param nestId    the nest ID
     * @param meetingId the meeting ID
     * @return the meeting entity
     */
    private Meeting findMeeting(final Long nestId, final Long meetingId) {
        return meetingRepository.findByIdAndNestId(meetingId, nestId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Meeting not found with id: " + meetingId + " in nest: " + nestId));
    }

    /**
     * Maps a meeting entity to its response DTO.
     *
     * @param meeting the meeting entity
     * @return the response DTO
     */
    private MeetingResponse toResponse(final Meeting meeting) {
        return MeetingResponse.builder()
                .id(meeting.getId())
                .scheduledAt(meeting.getScheduledAt())
                .venueName(meeting.getVenueName())
                .venueAddress(meeting.getVenueAddress())
                .activityType(meeting.getActivityType())
                .description(meeting.getDescription())
                .status(meeting.getStatus())
                .build();
    }
}
