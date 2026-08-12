package com.neighbornest.chatservice.util;

import com.neighbornest.chatservice.client.UserProfileResponse;
import com.neighbornest.chatservice.client.UserServiceClient;
import com.neighbornest.chatservice.constants.AppConstants;
import com.neighbornest.chatservice.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Optional;

/**
 * Resolves the current caller's chat-domain identity (the user-service
 * <em>profile</em> id) for REST requests.
 * <p>
 * Two sources are supported, in order:
 * <ol>
 *   <li>The {@code X-User-Id} request header, when the API gateway is
 *       configured to inject it (forward-compatible with the gateway's planned
 *       header-based identity propagation).</li>
 *   <li>The user-service {@code GET /api/users/me} lookup, which bridges the
 *       JWT's auth-service user id to the profile id via the forwarded
 *       Authorization header — the same convention used by the
 *       nest-service and matching-service.</li>
 * </ol>
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserContext {

    private final UserServiceClient userServiceClient;

    /**
     * Resolves the current caller's profile id or fails the request.
     *
     * @return the user-service profile id of the caller
     * @throws BadRequestException if the profile cannot be resolved
     */
    public Long requireProfileId() {
        final Optional<Long> headerId = profileIdFromHeader();
        if (headerId.isPresent()) {
            return headerId.get();
        }

        final String authorizationHeader = authorizationHeaderFromRequest();
        final UserProfileResponse profile = userServiceClient.getMyProfile(authorizationHeader);
        if (profile == null || profile.getId() == null) {
            log.warn("Could not resolve profile id for the current caller");
            throw new BadRequestException("Could not resolve your user profile. Complete your profile first.");
        }
        return profile.getId();
    }

    /**
     * Reads the Authorization header from the current HTTP request.
     *
     * @return the raw Authorization header value, or {@code null}
     */
    private String authorizationHeaderFromRequest() {
        final ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            return attributes.getRequest().getHeader(AppConstants.AUTHORIZATION_HEADER);
        }
        return null;
    }

    /**
     * Reads the {@code X-User-Id} header if present and valid.
     *
     * @return the header value as a profile id, or empty
     */
    public Optional<Long> profileIdFromHeader() {
        final ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            final String header = attributes.getRequest().getHeader(AppConstants.X_USER_ID_HEADER);
            if (StringUtils.hasText(header)) {
                try {
                    return Optional.of(Long.valueOf(header.trim()));
                } catch (final NumberFormatException e) {
                    log.warn("Invalid {} header value: {}", AppConstants.X_USER_ID_HEADER, header);
                }
            }
        }
        return Optional.empty();
    }
}
