package com.neighbornest.nest.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * JPA entity linking a user to a Nest with their role and membership status.
 * <p>
 * {@code userId} references a {@code UserProfile} ID from the user-service.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Entity
@Table(name = "nest_members", indexes = {
        @Index(name = "idx_nest_member_user", columnList = "user_id"),
        @Index(name = "idx_nest_member_nest", columnList = "nest_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NestMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nest_id", nullable = false)
    private Long nestId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "role_in_nest", nullable = false, length = 20)
    private NestRole roleInNest;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private NestMemberStatus status = NestMemberStatus.INVITED;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    @Column(nullable = false)
    @Builder.Default
    private boolean graduated = false;
}
