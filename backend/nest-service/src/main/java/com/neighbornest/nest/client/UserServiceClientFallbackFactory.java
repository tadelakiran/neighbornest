package com.neighbornest.nest.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

/**
 * Fallback factory for {@link UserServiceClient}.
 * <p>
 * Invoked when the user-service is unreachable. Returns an anonymous profile
 * summary so Nest views still render without blocking on the outage.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Component
@Slf4j
public class UserServiceClientFallbackFactory implements FallbackFactory<UserServiceClient> {

    /**
     * Creates a fallback implementation that returns an anonymous profile.
     *
     * @param cause the underlying cause of the failure
     * @return a fallback {@link UserServiceClient} instance
     */
    @Override
    public UserServiceClient create(final Throwable cause) {
        log.warn("User-service is unavailable, returning fallback profile. Cause: {}", cause.getMessage());
        return userId -> UserProfileSummary.builder()
                .id(userId)
                .fullName("Neighbor")
                .build();
    }
}
