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
}
