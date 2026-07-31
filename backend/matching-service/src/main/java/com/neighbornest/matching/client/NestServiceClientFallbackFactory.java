package com.neighbornest.matching.client;

import com.neighbornest.matching.client.dto.CreateNestRequest;
import com.neighbornest.matching.exception.ServiceUnavailableException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

/**
 * Fallback factory for {@link NestServiceClient}.
 * <p>
 * Invoked when the nest-service is unreachable. Reports a 503 via
 * {@link ServiceUnavailableException} so the proposal execution can be
 * retried.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Component
@Slf4j
public class NestServiceClientFallbackFactory implements FallbackFactory<NestServiceClient> {

    /**
     * Creates a fallback implementation that throws on use.
     *
     * @param cause the underlying cause of the failure
     * @return a fallback {@link NestServiceClient} instance
     */
    @Override
    public NestServiceClient create(final Throwable cause) {
        log.warn("Nest-service is unavailable, returning 503 fallback. Cause: {}", cause.getMessage());
        return new NestServiceClient() {
            @Override
            public void createNest(final CreateNestRequest request) {
                throw new ServiceUnavailableException("Nest-service is temporarily unavailable");
            }
        };
    }
}
