package com.neighbornest.notificationservice.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Fallback factory for {@link NestServiceClient}.
 * <p>
 * Invoked when the nest-service is unreachable or a query endpoint does not
 * exist yet. Returns {@code null} / empty lists so the listeners and scheduled
 * jobs degrade gracefully (skipping the affected processing) instead of
 * crashing the consumer.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Component
@Slf4j
public class NestServiceFallbackFactory implements FallbackFactory<NestServiceClient> {

    /**
     * Creates a fallback implementation returning empty data.
     *
     * @param cause the underlying cause of the failure
     * @return a fallback {@link NestServiceClient} instance
     */
    @Override
    public NestServiceClient create(final Throwable cause) {
        log.warn("Nest-service is unavailable, returning empty fallback. Cause: {}", cause.getMessage());
        return new NestServiceClient() {
            @Override
            public NestResponse getNest(final Long nestId) {
                return null;
            }

            @Override
            public List<NestResponse> listActiveNests() {
                return List.of();
            }

            @Override
            public List<MeetingResponse> getMeetings(final Long nestId) {
                return List.of();
            }

            @Override
            public List<ExpenseResponse> getExpenses(final Long nestId) {
                return List.of();
            }

            @Override
            public VibeCheckStatusResponse getVibeCheckStatus(final Long nestId) {
                return null;
            }
        };
    }
}
