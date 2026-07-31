package com.neighbornest.matching.client;

import com.neighbornest.matching.client.dto.UserCityDto;
import com.neighbornest.matching.client.dto.UserMatchDto;
import com.neighbornest.matching.exception.ServiceUnavailableException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Fallback factory for {@link UserServiceClient}.
 * <p>
 * Invoked when the user-service is unreachable. Reports a 503 via
 * {@link ServiceUnavailableException} so callers degrade gracefully.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Component
@Slf4j
public class UserServiceClientFallbackFactory implements FallbackFactory<UserServiceClient> {

    /**
     * Creates a fallback implementation that reports the outage.
     *
     * @param cause the underlying cause of the failure
     * @return a fallback {@link UserServiceClient} instance
     */
    @Override
    public UserServiceClient create(final Throwable cause) {
        log.warn("User-service is unavailable, returning 503 fallback. Cause: {}", cause.getMessage());
        return new UserServiceClient() {
            @Override
            public List<UserMatchDto> getReadyForMatch() {
                throw new ServiceUnavailableException("User-service is temporarily unavailable");
            }

            @Override
            public UserCityDto getUserCity(final Long userId) {
                // Allow Nest creation to proceed with an empty city during an outage.
                return UserCityDto.builder().city("").build();
            }
        };
    }
}
