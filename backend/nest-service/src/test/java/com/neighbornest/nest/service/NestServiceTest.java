package com.neighbornest.nest.service;

import com.neighbornest.nest.client.UserProfileSummary;
import com.neighbornest.nest.client.UserServiceClient;
import com.neighbornest.nest.dto.request.CreateNestRequest;
import com.neighbornest.nest.dto.response.NestResponse;
import com.neighbornest.nest.entity.Nest;
import com.neighbornest.nest.entity.NestMember;
import com.neighbornest.nest.entity.NestMemberStatus;
import com.neighbornest.nest.entity.NestRole;
import com.neighbornest.nest.entity.NestStatus;
import com.neighbornest.nest.event.NestCreatedEvent;
import com.neighbornest.nest.event.NestEventPublisher;
import com.neighbornest.nest.event.NestGraduatedEvent;
import com.neighbornest.nest.exception.ForbiddenException;
import com.neighbornest.nest.exception.InvalidOperationException;
import com.neighbornest.nest.exception.ResourceNotFoundException;
import com.neighbornest.nest.repository.NestMemberRepository;
import com.neighbornest.nest.repository.NestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link NestService}.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("NestService Unit Tests")
class NestServiceTest {

    @Mock
    private NestRepository nestRepository;

    @Mock
    private NestMemberRepository nestMemberRepository;

    @Mock
    private UserServiceClient userServiceClient;

    @Mock
    private NestEventPublisher nestEventPublisher;

    private NestService nestService;

    @BeforeEach
    void setUp() {
        nestService = new NestService(nestRepository, nestMemberRepository, userServiceClient, nestEventPublisher);
    }

    @Nested
    @DisplayName("createNest method")
    class CreateNestTests {

        @Test
        @DisplayName("Should create an ACTIVE nest with accepted members and publish an event")
        void shouldCreateActiveNestAndPublishEvent() {
            final Nest saved = nest(1L, "Mission Mates", NestStatus.ACTIVE);
            when(nestRepository.save(any(Nest.class))).thenReturn(saved);
            when(userServiceClient.getProfile(1L)).thenReturn(profile(1L, "John Doe"));
            when(userServiceClient.getProfile(2L)).thenReturn(profile(2L, "Jane Doe"));

            final CreateNestRequest request = CreateNestRequest.builder()
                    .name("Mission Mates")
                    .city("San Francisco")
                    .memberUserIds(List.of(1L, 2L))
                    .anchorUserIds(List.of(1L))
                    .build();

            final NestResponse response = nestService.createNest(request);

            assertThat(response.getId()).isEqualTo(1L);
            assertThat(response.getStatus()).isEqualTo(NestStatus.ACTIVE);
            assertThat(response.getMembers()).hasSize(2);
            assertThat(response.getMembers().get(0).getFullName()).isEqualTo("John Doe");

            final ArgumentCaptor<List<NestMember>> memberCaptor = ArgumentCaptor.forClass(List.class);
            verify(nestMemberRepository).saveAll(memberCaptor.capture());
            assertThat(memberCaptor.getValue()).allMatch(m -> m.getStatus() == NestMemberStatus.ACCEPTED);
            assertThat(memberCaptor.getValue().get(0).getRoleInNest()).isEqualTo(NestRole.ANCHOR);
            assertThat(memberCaptor.getValue().get(1).getRoleInNest()).isEqualTo(NestRole.MEMBER);

            final ArgumentCaptor<NestCreatedEvent> eventCaptor = ArgumentCaptor.forClass(NestCreatedEvent.class);
            verify(nestEventPublisher).publishNestCreated(eventCaptor.capture());
            assertThat(eventCaptor.getValue().nestId()).isEqualTo(1L);
            assertThat(eventCaptor.getValue().anchorUserIds()).containsExactly(1L);
        }

        @Test
        @DisplayName("Should reject duplicate members")
        void shouldRejectDuplicateMembers() {
            final CreateNestRequest request = CreateNestRequest.builder()
                    .name("Dupe Nest")
                    .city("San Francisco")
                    .memberUserIds(List.of(1L, 1L))
                    .build();

            assertThatThrownBy(() -> nestService.createNest(request))
                    .isInstanceOf(com.neighbornest.nest.exception.BadRequestException.class)
                    .hasMessageContaining("duplicates");
        }
    }

    @Nested
    @DisplayName("getNest method")
    class GetNestTests {

        @Test
        @DisplayName("Should return nest details with members")
        void shouldReturnNestDetails() {
            when(nestRepository.findById(1L)).thenReturn(Optional.of(nest(1L, "Mission Mates", NestStatus.ACTIVE)));
            when(nestMemberRepository.findByNestId(1L)).thenReturn(List.of(member(1L, 7L, NestRole.MEMBER)));
            when(userServiceClient.getProfile(7L)).thenReturn(profile(7L, "John Doe"));

            final NestResponse response = nestService.getNest(1L);

            assertThat(response.getId()).isEqualTo(1L);
            assertThat(response.getMembers()).hasSize(1);
            assertThat(response.getMembers().get(0).getUserId()).isEqualTo(7L);
        }

        @Test
        @DisplayName("Should throw when nest does not exist")
        void shouldThrowWhenNestMissing() {
            when(nestRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> nestService.getNest(99L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Nest not found");
        }
    }

    @Nested
    @DisplayName("graduate method")
    class GraduateTests {

        @Test
        @DisplayName("Should graduate an active nest and publish an event")
        void shouldGraduateActiveNest() {
            final Nest nest = nest(1L, "Mission Mates", NestStatus.ACTIVE);
            when(nestRepository.findById(1L)).thenReturn(Optional.of(nest));
            when(nestRepository.save(any(Nest.class))).thenReturn(nest);
            when(nestMemberRepository.findByNestId(1L)).thenReturn(List.of());

            final NestResponse response = nestService.graduate(1L);

            assertThat(response.getStatus()).isEqualTo(NestStatus.GRADUATED);
            assertThat(response.getEndDate()).isEqualTo(LocalDate.now());

            final ArgumentCaptor<NestGraduatedEvent> eventCaptor = ArgumentCaptor.forClass(NestGraduatedEvent.class);
            verify(nestEventPublisher).publishNestGraduated(eventCaptor.capture());
            assertThat(eventCaptor.getValue().nestId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("Should reject graduating a non-active nest")
        void shouldRejectGraduatingNonActiveNest() {
            when(nestRepository.findById(1L)).thenReturn(Optional.of(nest(1L, "Old Nest", NestStatus.DISBANDED)));

            assertThatThrownBy(() -> nestService.graduate(1L))
                    .isInstanceOf(InvalidOperationException.class)
                    .hasMessageContaining("Only active nests can graduate");
        }
    }

    @Nested
    @DisplayName("leave method")
    class LeaveTests {

        @Test
        @DisplayName("Should mark the member as LEFT")
        void shouldMarkMemberAsLeft() {
            final Nest nest = nest(1L, "Mission Mates", NestStatus.ACTIVE);
            final NestMember actor = member(1L, 7L, NestRole.MEMBER);
            when(nestRepository.findById(1L)).thenReturn(Optional.of(nest));
            when(nestMemberRepository.findByNestIdAndUserId(1L, 7L)).thenReturn(Optional.of(actor));
            when(nestMemberRepository.findByNestId(1L)).thenReturn(List.of(actor));
            when(userServiceClient.getProfile(7L)).thenReturn(profile(7L, "John Doe"));

            final NestResponse response = nestService.leave(1L, 7L);

            assertThat(actor.getStatus()).isEqualTo(NestMemberStatus.LEFT);
            verify(nestMemberRepository).save(actor);
            assertThat(response.getMembers().get(0).getStatus()).isEqualTo(NestMemberStatus.LEFT);
        }

        @Test
        @DisplayName("Should reject leaving an ended nest")
        void shouldRejectLeavingEndedNest() {
            when(nestRepository.findById(1L)).thenReturn(Optional.of(nest(1L, "Done Nest", NestStatus.DISBANDED)));

            assertThatThrownBy(() -> nestService.leave(1L, 7L))
                    .isInstanceOf(InvalidOperationException.class)
                    .hasMessageContaining("already ended");
        }

        @Test
        @DisplayName("Should reject a user who is not an active member")
        void shouldRejectNonMember() {
            when(nestRepository.findById(1L)).thenReturn(Optional.of(nest(1L, "Mission Mates", NestStatus.ACTIVE)));
            when(nestMemberRepository.findByNestIdAndUserId(1L, 7L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> nestService.leave(1L, 7L))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("not an active member");
        }
    }

    @Nested
    @DisplayName("removeMember method")
    class RemoveMemberTests {

        @Test
        @DisplayName("Should let an anchor remove a member")
        void shouldLetAnchorRemoveMember() {
            final Nest nest = nest(1L, "Mission Mates", NestStatus.ACTIVE);
            final NestMember anchor = member(1L, 7L, NestRole.ANCHOR);
            final NestMember target = member(1L, 8L, NestRole.MEMBER);
            when(nestRepository.findById(1L)).thenReturn(Optional.of(nest));
            when(nestMemberRepository.findByNestIdAndUserId(1L, 7L)).thenReturn(Optional.of(anchor));
            when(nestMemberRepository.findByNestIdAndUserId(1L, 8L)).thenReturn(Optional.of(target));
            when(nestMemberRepository.findByNestId(1L)).thenReturn(List.of(anchor, target));
            when(userServiceClient.getProfile(7L)).thenReturn(profile(7L, "Jane Anchor"));
            when(userServiceClient.getProfile(8L)).thenReturn(profile(8L, "John Doe"));

            final NestResponse response = nestService.removeMember(1L, 7L, 8L);

            assertThat(target.getStatus()).isEqualTo(NestMemberStatus.REMOVED);
            verify(nestMemberRepository).save(target);
            assertThat(response.getMembers()).hasSize(2);
        }

        @Test
        @DisplayName("Should forbid a non-anchor from removing a member")
        void shouldForbidNonAnchor() {
            when(nestRepository.findById(1L)).thenReturn(Optional.of(nest(1L, "Mission Mates", NestStatus.ACTIVE)));
            when(nestMemberRepository.findByNestIdAndUserId(1L, 7L))
                    .thenReturn(Optional.of(member(1L, 7L, NestRole.MEMBER)));

            assertThatThrownBy(() -> nestService.removeMember(1L, 7L, 8L))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("Only anchors");
        }

        @Test
        @DisplayName("Should forbid an anchor from removing themselves")
        void shouldForbidSelfRemoval() {
            when(nestRepository.findById(1L)).thenReturn(Optional.of(nest(1L, "Mission Mates", NestStatus.ACTIVE)));
            when(nestMemberRepository.findByNestIdAndUserId(1L, 7L))
                    .thenReturn(Optional.of(member(1L, 7L, NestRole.ANCHOR)));

            assertThatThrownBy(() -> nestService.removeMember(1L, 7L, 7L))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("use leave instead");
        }
    }

    @Nested
    @DisplayName("requireMember method")
    class AccessControlTests {

        @Test
        @DisplayName("Should allow an active member")
        void shouldAllowActiveMember() {
            when(nestRepository.findById(1L)).thenReturn(Optional.of(nest(1L, "Mission Mates", NestStatus.ACTIVE)));
            when(nestMemberRepository.findByNestIdAndUserId(1L, 7L))
                    .thenReturn(Optional.of(member(1L, 7L, NestRole.MEMBER)));

            nestService.requireMember(1L, 7L);
        }

        @Test
        @DisplayName("Should throw when the user is not an active member")
        void shouldRejectNonMember() {
            when(nestRepository.findById(1L)).thenReturn(Optional.of(nest(1L, "Mission Mates", NestStatus.ACTIVE)));
            when(nestMemberRepository.findByNestIdAndUserId(1L, 7L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> nestService.requireMember(1L, 7L))
                    .isInstanceOf(ForbiddenException.class);
        }

        @Test
        @DisplayName("Should throw when the nest does not exist")
        void shouldRejectMissingNest() {
            when(nestRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> nestService.requireMember(99L, 7L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("disband method")
    class DisbandTests {

        @Test
        @DisplayName("Should disband an active nest")
        void shouldDisbandActiveNest() {
            final Nest nest = nest(1L, "Mission Mates", NestStatus.ACTIVE);
            when(nestRepository.findById(1L)).thenReturn(Optional.of(nest));
            when(nestRepository.save(any(Nest.class))).thenReturn(nest);
            when(nestMemberRepository.findByNestId(1L)).thenReturn(List.of());

            final NestResponse response = nestService.disband(1L);

            assertThat(response.getStatus()).isEqualTo(NestStatus.DISBANDED);
        }

        @Test
        @DisplayName("Should reject disbanding an already disbanded nest")
        void shouldRejectDisbandingDisbandedNest() {
            when(nestRepository.findById(1L)).thenReturn(Optional.of(nest(1L, "Done Nest", NestStatus.DISBANDED)));

            assertThatThrownBy(() -> nestService.disband(1L))
                    .isInstanceOf(InvalidOperationException.class)
                    .hasMessageContaining("already ended");
        }
    }

    /**
     * Builds a nest entity.
     */
    private Nest nest(final Long id, final String name, final NestStatus status) {
        final Nest nest = new Nest();
        nest.setId(id);
        nest.setName(name);
        nest.setCity("San Francisco");
        nest.setStatus(status);
        nest.setStartDate(LocalDate.now());
        nest.setCreatedAt(LocalDateTime.now());
        return nest;
    }

    /**
     * Builds a nest member entity.
     */
    private NestMember member(final Long nestId, final Long userId, final NestRole role) {
        final NestMember member = new NestMember();
        member.setId(1L);
        member.setNestId(nestId);
        member.setUserId(userId);
        member.setRoleInNest(role);
        member.setStatus(NestMemberStatus.ACCEPTED);
        member.setJoinedAt(LocalDateTime.now());
        return member;
    }

    /**
     * Builds a user profile summary.
     */
    private UserProfileSummary profile(final Long id, final String name) {
        return UserProfileSummary.builder().id(id).fullName(name).build();
    }
}
