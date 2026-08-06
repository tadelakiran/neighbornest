package com.neighbornest.matching.client;

import com.neighbornest.matching.client.dto.CurrentUserProfileDto;
import com.neighbornest.matching.client.dto.UserCityDto;
import com.neighbornest.matching.client.dto.UserMatchDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

/**
 * Feign client for communicating with the user-service.
 * <p>
 * Fetches eligible (match-ready) users and their onboarding data. Falls back
 * via {@link UserServiceClientFallbackFactory} when the user-service is down.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@FeignClient(name = "user-service", fallbackFactory = UserServiceClientFallbackFactory.class)
public interface UserServiceClient {

    /**
     * Fetches all users ready for matching.
     *
     * @return the list of match-ready user DTOs
     */
    @GetMapping("/api/users/ready-for-match")
    List<UserMatchDto> getReadyForMatch();

    /**
     * Fetches a single user's city for Nest formation.
     *
     * @param userId the user profile ID
     * @return the user's city
     */
    @GetMapping("/api/users/{userId}/profile")
    UserCityDto getUserCity(@PathVariable("userId") Long userId);

    /**
     * Resolves the current caller's profile id via the user-service {@code /me}
     * endpoint (the Authorization header is forwarded by the Feign interceptor).
     * <p>
     * The JWT's {@code userId} claim is the <em>auth-service</em> user id, but
     * proposals store <em>profile</em> ids. This lookup bridges the two so
     * member-scoped operations (e.g. responding to a proposal) compare against
     * the correct id space. Returns {@code null} when the caller has no profile
     * or the user-service is unavailable (see fallback factory).
     * </p>
     *
     * @return the current user's profile id, or {@code null}
     */
    @GetMapping("/api/users/me")
    CurrentUserProfileDto getMyProfile();
}
