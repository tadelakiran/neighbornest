package com.neighbornest.nest.service;

import com.neighbornest.nest.dto.request.MeetingRequest;
import com.neighbornest.nest.dto.response.MeetingResponse;
import com.neighbornest.nest.entity.Meeting;
import com.neighbornest.nest.entity.MeetingStatus;
import com.neighbornest.nest.exception.InvalidOperationException;
import com.neighbornest.nest.exception.ResourceNotFoundException;
import com.neighbornest.nest.repository.MeetingRepository;
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
 * Unit tests for {@link MeetingService}.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MeetingService Unit Tests")
class MeetingServiceTest {

    @Mock
    private MeetingRepository meetingRepository;

    @Mock
    private NestService nestService;

    private MeetingService meetingService;

    @BeforeEach
    void setUp() {
        meetingService = new MeetingService(meetingRepository, nestService);
    }

    @Nested
    @DisplayName("scheduleMeeting method")
    class ScheduleMeetingTests {

        @Test
        @DisplayName("Should schedule a meeting for a member")
        void shouldScheduleMeeting() {
            final Meeting saved = meeting(1L, MeetingStatus.SCHEDULED);
            when(meetingRepository.save(any(Meeting.class))).thenReturn(saved);

            final MeetingResponse response = meetingService.scheduleMeeting(1L, 7L,
                    MeetingRequest.builder()
                            .scheduledAt(LocalDateTime.now().plusDays(1))
                            .venueName("Blue Bottle Coffee")
                            .activityType("Coffee & Chat")
                            .build());

            verify(nestService).requireMember(1L, 7L);
            assertThat(response.getId()).isEqualTo(1L);
            assertThat(response.getStatus()).isEqualTo(MeetingStatus.SCHEDULED);
            assertThat(response.getVenueName()).isEqualTo("Blue Bottle Coffee");
        }
    }

    @Nested
    @DisplayName("listMeetings method")
    class ListMeetingsTests {

        @Test
        @DisplayName("Should list meetings for a member")
        void shouldListMeetings() {
            when(meetingRepository.findByNestIdOrderByScheduledAtDesc(1L))
                    .thenReturn(List.of(meeting(1L, MeetingStatus.SCHEDULED)));

            final List<MeetingResponse> responses = meetingService.listMeetings(1L, 7L);

            verify(nestService).requireMember(1L, 7L);
            assertThat(responses).hasSize(1);
            assertThat(responses.get(0).getStatus()).isEqualTo(MeetingStatus.SCHEDULED);
        }
    }

    @Nested
    @DisplayName("completeMeeting method")
    class CompleteMeetingTests {

        @Test
        @DisplayName("Should complete a scheduled meeting")
        void shouldCompleteMeeting() {
            final Meeting meeting = meeting(1L, MeetingStatus.SCHEDULED);
            when(meetingRepository.findByIdAndNestId(1L, 1L)).thenReturn(Optional.of(meeting));
            when(meetingRepository.save(meeting)).thenReturn(meeting);

            final MeetingResponse response = meetingService.completeMeeting(1L, 1L, 7L);

            assertThat(response.getStatus()).isEqualTo(MeetingStatus.COMPLETED);
        }

        @Test
        @DisplayName("Should reject completing a meeting that is not scheduled")
        void shouldRejectNonScheduledMeeting() {
            final Meeting meeting = meeting(1L, MeetingStatus.CANCELLED);
            when(meetingRepository.findByIdAndNestId(1L, 1L)).thenReturn(Optional.of(meeting));

            assertThatThrownBy(() -> meetingService.completeMeeting(1L, 1L, 7L))
                    .isInstanceOf(InvalidOperationException.class)
                    .hasMessageContaining("Only scheduled meetings can be completed");
        }

        @Test
        @DisplayName("Should throw when the meeting is not in the nest")
        void shouldRejectMeetingFromAnotherNest() {
            when(meetingRepository.findByIdAndNestId(1L, 1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> meetingService.completeMeeting(1L, 1L, 7L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Meeting not found");
        }
    }

    @Nested
    @DisplayName("cancelMeeting method")
    class CancelMeetingTests {

        @Test
        @DisplayName("Should cancel a scheduled meeting")
        void shouldCancelMeeting() {
            final Meeting meeting = meeting(1L, MeetingStatus.SCHEDULED);
            when(meetingRepository.findByIdAndNestId(1L, 1L)).thenReturn(Optional.of(meeting));
            when(meetingRepository.save(meeting)).thenReturn(meeting);

            final MeetingResponse response = meetingService.cancelMeeting(1L, 1L, 7L);

            assertThat(response.getStatus()).isEqualTo(MeetingStatus.CANCELLED);
        }

        @Test
        @DisplayName("Should reject cancelling a completed meeting")
        void shouldRejectCompletedMeeting() {
            final Meeting meeting = meeting(1L, MeetingStatus.COMPLETED);
            when(meetingRepository.findByIdAndNestId(1L, 1L)).thenReturn(Optional.of(meeting));

            assertThatThrownBy(() -> meetingService.cancelMeeting(1L, 1L, 7L))
                    .isInstanceOf(InvalidOperationException.class)
                    .hasMessageContaining("Only scheduled meetings can be cancelled");
        }
    }

    private Meeting meeting(final Long id, final MeetingStatus status) {
        return Meeting.builder()
                .id(id)
                .nestId(1L)
                .scheduledAt(LocalDateTime.now().plusDays(1))
                .venueName("Blue Bottle Coffee")
                .venueAddress("315 Linden St, San Francisco")
                .activityType("Coffee & Chat")
                .description("Weekly catch-up")
                .status(status)
                .build();
    }
}
