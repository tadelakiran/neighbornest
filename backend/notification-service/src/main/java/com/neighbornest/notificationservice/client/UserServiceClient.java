package com.neighbornest.notificationservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Feign client for communicating with the user-service.
 * <p>
 * Fetches recipient profiles (name, email, phone, role) for notifications and
 * admin checks. Falls back to {@code null} via {@link UserServiceFallbackFactory}
 * when the user-service is unavailable, so notification processing degrades
 * gracefully instead of failing the whole request.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@FeignClient(name = "user-service", fallbackFactory = UserServiceFallbackFactory.class)
public interface UserServiceClient {

    /**
     * Fetches the public profile summary of a user.
     *
     * @param userId the user profile id
     * @return the profile summary, or {@code null} when unavailable
     */
    @GetMapping("/api/users/{userId}/profile")
    UserProfileResponse getProfile(@PathVariable("userId") Long userId);

    /**
     * Resolves the current caller's profile (the Authorization header is
     * forwarded by the Feign interceptor), used to resolve the caller's
     * profile id for the inbox endpoints.
     *
     * @return the current user's profile, or {@code null} when unavailable
     */
    @GetMapping("/api/users/me")
    UserProfileResponse getMyProfile();
}
