package com.neighbornest.matching.entity;

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
 * JPA entity linking a user to a {@link MatchProposal} with their role and
 * response status.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Entity
@Table(name = "match_proposal_members", indexes = {
        @Index(name = "idx_proposal_member_user", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchProposalMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "match_proposal_id", nullable = false)
    private Long matchProposalId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "role_in_nest", nullable = false, length = 20)
    private RoleInNest roleInNest;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ProposalResponse response = ProposalResponse.PENDING;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;
}
