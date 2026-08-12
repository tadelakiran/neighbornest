package com.neighbornest.chatservice.client;

import com.neighbornest.chatservice.exception.ServiceUnavailableException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Fallback factory for {@link NestServiceClient}.
 * <p>
 * Invoked when the nest-service is unreachable. Every method throws
 * {@link ServiceUnavailableException} so chat operations that depend on Nest
 * membership fail closed with a 503 instead of silently authorizing.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Component
@Slf4j
public class NestServiceFallbackFactory implements FallbackFactory<NestServiceClient> {

    /**
     * Creates a fallback implementation that throws 503 on every call.
     *
     * @param cause the underlying cause of the failure
     * @return a fallback {@link NestServiceClient} instance
     */
    @Override
    public NestServiceClient create(final Throwable cause) {
        log.warn("Nest-service is unavailable, failing closed with 503. Cause: {}", cause.getMessage());
        return new NestServiceClient() {
            @Override
            public NestResponse getNest(final Long nestId) {
                throw new ServiceUnavailableException("Nest service is unavailable. Please try again later.");
            }

            @Override
            public NestResponse getNest(final Long nestId, final String authorizationHeader) {
                throw new ServiceUnavailableException("Nest service is unavailable. Please try again later.");
            }

            @Override
            public List<NestResponse> getMyNests() {
                throw new ServiceUnavailableException("Nest service is unavailable. Please try again later.");
            }

            @Override
            public List<NestResponse> getMyNests(final String authorizationHeader) {
                throw new ServiceUnavailableException("Nest service is unavailable. Please try again later.");
            }
        };
    }
}
