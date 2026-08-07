package com.neighbornest.notificationservice.listener;

import com.neighbornest.notificationservice.client.NestMemberResponse;
import com.neighbornest.notificationservice.client.NestResponse;
import com.neighbornest.notificationservice.client.NestServiceClient;
import com.neighbornest.notificationservice.client.UserProfileResponse;
import com.neighbornest.notificationservice.client.UserServiceClient;
import com.neighbornest.notificationservice.config.NotificationServiceProperties;
import com.neighbornest.notificationservice.constants.AppConstants;
import com.neighbornest.notificationservice.entity.TrackedNest;
import com.neighbornest.notificationservice.enums.NotificationType;
import com.neighbornest.notificationservice.enums.TrackedNestStatus;
import com.neighbornest.notificationservice.event.NestCreatedEvent;
import com.neighbornest.notificationservice.event.NestDisbandedEvent;
import com.neighbornest.notificationservice.event.NestGraduatedEvent;
import com.neighbornest.notificationservice.repository.TrackedNestRepository;
import com.neighbornest.notificationservice.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link NestEventListener}, focusing on the member resolution
 * fallback between a live nest-service lookup and the local tracked registry.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("NestEventListener Unit Tests")
class NestEventListenerTest {

    @Mock
    private NotificationService notificationService;

    @Mock
    private UserServiceClient userServiceClient;

    @Mock
    private NestServiceClient nestServiceClient;

    @Mock
    private NotificationServiceProperties properties;

    @Mock
    private TrackedNestRepository trackedNestRepository;

    @InjectMocks
    private NestEventListener listener;

    private static final Long NEST_ID = 1L;

    @BeforeEach
    void setUp() {
        // Lenient: not every path builds a deep link.
        lenient().when(properties.getBaseUrl()).thenReturn("http://localhost:8080");
    }

    /**
     * Builds a tracked nest for the registry with the given member ids.
     */
    private TrackedNest trackedNest(final Long... memberIds) {
        final TrackedNest tracked = TrackedNest.builder()
                .nestId(NEST_ID)
                .name("Mission Mates")
                .status(TrackedNestStatus.ACTIVE)
                .build();
        tracked.setMemberIds(List.of(memberIds));
        return tracked;
    }

    @Nested
    @DisplayName("handleNestCreated")
    class CreatedTests {

        @Test
        @DisplayName("Should track the nest and welcome every member")
        void shouldTrackAndWelcomeMembers() {
            when(trackedNestRepository.findByNestId(NEST_ID)).thenReturn(Optional.empty());
            when(trackedNestRepository.save(any(TrackedNest.class))).thenAnswer(inv -> inv.getArgument(0));
            when(userServiceClient.getProfile(7L))
                    .thenReturn(UserProfileResponse.builder().id(7L).fullName("Jane Doe").build());
            when(userServiceClient.getProfile(12L)).thenReturn(null);

            listener.handleNestCreated(new NestCreatedEvent(
                    NEST_ID, "Mission Mates", "San Francisco",
                    List.of(7L, 12L), List.of(7L), LocalDateTime.now()));

            verify(trackedNestRepository).save(argThat(tracked ->
                    tracked.getNestId().equals(NEST_ID)
                            && tracked.getStatus() == TrackedNestStatus.ACTIVE
                            && tracked.memberIdsAsList().containsAll(List.of(7L, 12L))));
            verify(notificationService).dispatchEmail(
                    eq(7L), eq(NotificationType.NEST_CREATED), anyString(),
                    eq(AppConstants.TEMPLATE_NEST_WELCOME), anyMap(), anyString(), anyString(),
                    eq(AppConstants.RELATED_ENTITY_NEST), eq(NEST_ID));
            verify(notificationService).dispatchEmail(
                    eq(12L), eq(NotificationType.NEST_CREATED), anyString(),
                    eq(AppConstants.TEMPLATE_NEST_WELCOME), anyMap(), anyString(), anyString(),
                    eq(AppConstants.RELATED_ENTITY_NEST), eq(NEST_ID));
        }
    }

    @Nested
    @DisplayName("handleNestGraduated")
    class GraduatedTests {

        @Test
        @DisplayName("Should use the live nest lookup when available")
        void shouldUseLiveNest() {
            when(nestServiceClient.getNest(NEST_ID)).thenReturn(NestResponse.builder()
                    .id(NEST_ID)
                    .name("Mission Mates")
                    .members(List.of(NestMemberResponse.builder()
                            .userId(7L).fullName("Jane Doe").status("ACCEPTED").build()))
                    .build());
            when(trackedNestRepository.findByNestId(NEST_ID)).thenReturn(Optional.of(trackedNest(7L)));

            listener.handleNestGraduated(new NestGraduatedEvent(
                    NEST_ID, "Mission Mates", "San Francisco", LocalDate.now(), LocalDateTime.now()));

            verify(notificationService).dispatchEmail(
                    eq(7L), eq(NotificationType.NEST_GRADUATED), anyString(),
                    eq(AppConstants.TEMPLATE_NEST_GRADUATE), anyMap(), anyString(), anyString(),
                    eq(AppConstants.RELATED_ENTITY_NEST), eq(NEST_ID));
            verify(trackedNestRepository).save(argThat(tracked ->
                    tracked.getStatus() == TrackedNestStatus.GRADUATED));
        }

        @Test
        @DisplayName("Should fall back to the tracked registry when the live lookup is unavailable")
        void shouldFallBackToRegistry() {
            when(nestServiceClient.getNest(NEST_ID)).thenReturn(null);
            when(trackedNestRepository.findByNestId(NEST_ID)).thenReturn(Optional.of(trackedNest(7L)));
            when(userServiceClient.getProfile(7L))
                    .thenReturn(UserProfileResponse.builder().id(7L).fullName("Jane Doe").build());

            listener.handleNestGraduated(new NestGraduatedEvent(
                    NEST_ID, "Mission Mates", "San Francisco", LocalDate.now(), LocalDateTime.now()));

            verify(notificationService).dispatchEmail(
                    eq(7L), eq(NotificationType.NEST_GRADUATED), anyString(),
                    eq(AppConstants.TEMPLATE_NEST_GRADUATE), anyMap(), anyString(), anyString(),
                    eq(AppConstants.RELATED_ENTITY_NEST), eq(NEST_ID));
            verify(trackedNestRepository).save(argThat(tracked ->
                    tracked.getStatus() == TrackedNestStatus.GRADUATED));
        }

        @Test
        @DisplayName("Should skip when no recipients can be resolved")
        void shouldSkipWithoutRecipients() {
            when(nestServiceClient.getNest(NEST_ID)).thenReturn(null);
            when(trackedNestRepository.findByNestId(NEST_ID)).thenReturn(Optional.empty());

            listener.handleNestGraduated(new NestGraduatedEvent(
                    NEST_ID, "Mission Mates", "San Francisco", LocalDate.now(), LocalDateTime.now()));

            verify(notificationService, never()).dispatchEmail(
                    any(), any(), anyString(), anyString(), anyMap(), anyString(), anyString(),
                    anyString(), any());
        }
    }

    @Nested
    @DisplayName("handleNestDisbanded")
    class DisbandedTests {

        @Test
        @DisplayName("Should fall back to the tracked registry for disband notices")
        void shouldFallBackToRegistry() {
            when(nestServiceClient.getNest(NEST_ID)).thenReturn(null);
            when(trackedNestRepository.findByNestId(NEST_ID)).thenReturn(Optional.of(trackedNest(12L)));
            when(userServiceClient.getProfile(12L)).thenReturn(null);

            listener.handleNestDisbanded(new NestDisbandedEvent(NEST_ID, "Conflicts", LocalDateTime.now()));

            verify(notificationService).dispatchEmail(
                    eq(12L), eq(NotificationType.NEST_DISBANDED), anyString(),
                    eq(AppConstants.TEMPLATE_NEST_DISBANDED), anyMap(), anyString(), anyString(),
                    eq(AppConstants.RELATED_ENTITY_NEST), eq(NEST_ID));
            verify(trackedNestRepository).save(argThat(tracked ->
                    tracked.getStatus() == TrackedNestStatus.DISBANDED));
        }
    }
}
