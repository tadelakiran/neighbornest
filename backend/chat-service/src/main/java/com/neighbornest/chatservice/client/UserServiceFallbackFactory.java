package com.neighbornest.chatservice.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

/**
 * Fallback factory for {@link UserServiceClient}.
 * <p>
 * Invoked when the user-service is unreachable. Returns {@code null} from
 * profile lookups so message enrichment degrades gracefully (senders fall back
 * to a generated display name) instead of failing the whole request.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Component
@Slf4j
public class UserServiceFallbackFactory implements FallbackFactory<UserServiceClient> {

    /**
     * Creates a fallback implementation that returns {@code null} profiles.
     *
     * @param cause the underlying cause of the failure
     * @return a fallback {@link UserServiceClient} instance
     */
    @Override
    public UserServiceClient create(final Throwable cause) {
        log.warn("User-service is unavailable, returning null profile fallback. Cause: {}", cause.getMessage());
        return new UserServiceClient() {
            @Override
            public UserProfileResponse getProfile(final Long userId) {
                return null;
            }

            @Override
            public UserProfileResponse getMyProfile() {
                return null;
            }
        };
    }
}
