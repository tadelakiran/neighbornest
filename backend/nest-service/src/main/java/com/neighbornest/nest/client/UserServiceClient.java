package com.neighbornest.nest.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Feign client for communicating with the user-service.
 * <p>
 * Fetches member profiles for display. Falls back via
 * {@link UserServiceClientFallbackFactory} when the user-service is down.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@FeignClient(name = "user-service", fallbackFactory = UserServiceClientFallbackFactory.class)
public interface UserServiceClient {

    /**
     * Fetches the public profile summary of a user.
     *
     * @param userId the user profile ID
     * @return the profile summary
     */
    @GetMapping("/api/users/{userId}/profile")
    UserProfileSummary getProfile(@PathVariable("userId") Long userId);

    /**
     * Resolves the current caller's profile via the user-service {@code /me}
     * endpoint (the Authorization header is forwarded by the Feign interceptor).
     * <p>
     * The JWT's {@code userId} claim is the <em>auth-service</em> user id, but
     * Nest members are keyed by <em>profile</em> ids. This lookup bridges the
     * two so member-scoped operations (my-nests, expenses, vibe checks) query
     * the correct rows. Returns {@code null} when the caller has no profile or
     * the user-service is unavailable (see fallback factory).
     * </p>
     *
     * @return the current user's profile summary (id + name), or {@code null}
     */
    @GetMapping("/api/users/me")
    UserProfileSummary getMyProfile();
}
