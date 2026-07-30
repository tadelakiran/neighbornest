package com.neighbornest.auth.repository;

import com.neighbornest.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for {@link User} entity operations.
 * <p>
 * Provides standard CRUD operations along with custom queries
 * for looking up users by email and checking email existence.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Finds a user by their email address.
     *
     * @param email the email address to search for
     * @return an {@link Optional} containing the user if found, or empty if not found
     */
    Optional<User> findByEmail(final String email);

    /**
     * Checks whether a user with the given email already exists.
     *
     * @param email the email address to check
     * @return {@code true} if a user with the given email exists, {@code false} otherwise
     */
    boolean existsByEmail(final String email);
}
