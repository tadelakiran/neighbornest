package com.neighbornest.auth.repository;

import com.neighbornest.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for {@link RefreshToken} entity operations.
 * <p>
 * Provides methods for looking up refresh tokens by their token value,
 * deleting tokens by user ID, and standard CRUD operations.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    /**
     * Finds a refresh token by its token string.
     *
     * @param token the token string to search for
     * @return an {@link Optional} containing the refresh token if found, or empty otherwise
     */
    Optional<RefreshToken> findByToken(final String token);

    /**
     * Deletes all refresh tokens associated with the given user ID.
     *
     * @param userId the ID of the user whose tokens should be deleted
     */
    void deleteByUserId(final Long userId);
}
