package com.neighbornest.nest.service;

import com.neighbornest.nest.dto.request.MeetingRequest;
import com.neighbornest.nest.dto.response.MeetingResponse;
import com.neighbornest.nest.entity.Meeting;
import com.neighbornest.nest.exception.ResourceNotFoundException;
import com.neighbornest.nest.repository.MeetingRepository;
import com.neighbornest.nest.repository.NestRepository;
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
    private final NestRepository nestRepository;

    /**
     * Schedules a new meeting for a Nest.
     *
     * @param nestId  the nest ID
     * @param request the meeting request
     * @return the created meeting
     * @throws ResourceNotFoundException if the Nest does not exist
     */
    @Transactional
    public MeetingResponse scheduleMeeting(final Long nestId, final MeetingRequest request) {
        ensureNestExists(nestId);

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
    @Transactional(readOnly = true)
    public List<MeetingResponse> listMeetings(final Long nestId) {
        return meetingRepository.findByNestIdOrderByScheduledAtDesc(nestId).stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Verifies the nest exists.
     *
     * @param nestId the nest ID
     */
    private void ensureNestExists(final Long nestId) {
        if (!nestRepository.existsById(nestId)) {
            throw new ResourceNotFoundException("Nest not found with id: " + nestId);
        }
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
