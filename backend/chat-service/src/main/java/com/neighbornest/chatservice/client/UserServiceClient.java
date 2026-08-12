package com.neighbornest.chatservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

/**
 * Feign client for communicating with the user-service.
 * <p>
 * Fetches sender/participant profiles for message enrichment. Falls back to
 * {@code null} via {@link UserServiceFallbackFactory} when the user-service is
 * unavailable, so chat still works with degraded sender info.
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
     * Fetches the public profile summary of a user with an explicit
     * Authorization header.
     * <p>
     * Used by the WebSocket layer, where the STOMP CONNECT may run on a
     * different thread than the Feign request — thread-local header
     * propagation is unreliable there, so the header is passed directly.
     * </p>
     *
     * @param userId            the user profile id
     * @param authorizationHeader the raw Authorization header value
     * @return the profile summary, or {@code null} when unavailable
     */
    @GetMapping("/api/users/{userId}/profile")
    UserProfileResponse getProfile(@PathVariable("userId") Long userId,
                                   @RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader);

    /**
     * Resolves the current caller's profile via the user-service {@code /me}
     * endpoint.
     * <p>
     * The JWT's {@code userId} claim is the <em>auth-service</em> user id, but
     * chat rooms and Nest members are keyed by <em>profile</em> ids. This
     * lookup bridges the two. Returns {@code null} when the caller has no
     * profile or the user-service is unavailable (see fallback factory).
     * </p>
     * <p>
     * The Authorization header is passed <strong>explicitly</strong>: the
     * WebSocket STOMP CONNECT is processed on a different thread than the
     * Feign HTTP request, so thread-local header propagation (the
     * {@code RequestInterceptor}) cannot be relied on in that path.
     * </p>
     *
     * @param authorizationHeader the raw Authorization header value (e.g.
     *                            "Bearer &lt;token&gt;")
     * @return the current user's profile (id + name), or {@code null}
     */
    @GetMapping("/api/users/me")
    UserProfileResponse getMyProfile(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader);
}
