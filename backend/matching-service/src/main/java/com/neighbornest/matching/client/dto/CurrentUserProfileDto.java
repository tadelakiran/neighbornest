package com.neighbornest.matching.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight external DTO carrying just the current caller's profile id,
 * deserialized from the user-service {@code GET /api/users/me} response.
 * <p>
 * The JWT {@code userId} claim is the <em>auth-service</em> user id, but the
 * matching engine and proposals are keyed by <em>profile</em> ids. This DTO
 * bridges the two so member-scoped operations (proposal responses) use the
 * correct id space. Unknown fields from the full profile response are ignored
 * by Jackson.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CurrentUserProfileDto {

    /** Profile ID in the user-service. */
    private Long id;
}
