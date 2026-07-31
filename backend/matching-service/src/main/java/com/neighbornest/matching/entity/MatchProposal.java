package com.neighbornest.matching.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * JPA entity representing a proposal to form a Nest from a set of users.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Entity
@Table(name = "match_proposals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchProposal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ProposalStatus status = ProposalStatus.PENDING;

    @Column(name = "proposed_at", nullable = false, updatable = false)
    private LocalDateTime proposedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    /**
     * Sets the {@code proposedAt} timestamp before persisting for the first time.
     */
    @PrePersist
    protected void onCreate() {
        this.proposedAt = LocalDateTime.now();
    }
}
