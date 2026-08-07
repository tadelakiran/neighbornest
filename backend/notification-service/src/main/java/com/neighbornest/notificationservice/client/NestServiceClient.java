package com.neighbornest.notificationservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

/**
 * Feign client for communicating with the nest-service.
 * <p>
 * Used to resolve Nest members when an event does not carry member ids
 * (e.g. graduation) and by the scheduler for meeting/expense/vibe-check
 * reminders. The nest-service embeds the member list inside
 * {@link NestResponse} (there is no standalone members endpoint), so member
 * resolution goes through {@link #getNest(Long)}.
 * </p>
 * <p>
 * All methods degrade gracefully: the {@link NestServiceFallbackFactory}
 * returns {@code null} / empty lists when the nest-service is unreachable or
 * an endpoint does not exist yet, so scheduled jobs run safely as no-ops until
 * the required nest-service query endpoints are added.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@FeignClient(name = "nest-service", fallbackFactory = NestServiceFallbackFactory.class)
public interface NestServiceClient {

    /**
     * Fetches a Nest including its members.
     *
     * @param nestId the nest id
     * @return the Nest response
     */
    @GetMapping("/api/nests/{nestId}")
    NestResponse getNest(@PathVariable("nestId") Long nestId);

    /**
     * Lists all active Nests for the scheduler.
     * <p>
     * <strong>TODO:</strong> the nest-service does not expose an admin
     * "list all nests" endpoint yet — the fallback returns an empty list, so
     * scheduled jobs no-op safely until it is added.
     * </p>
     *
     * @return the list of active Nests (empty until the endpoint exists)
     */
    @GetMapping("/api/nests")
    List<NestResponse> listActiveNests();

    /**
     * Fetches the meetings of a Nest.
     *
     * @param nestId the nest id
     * @return the meetings (empty when unavailable)
     */
    @GetMapping("/api/nests/{nestId}/meetings")
    List<MeetingResponse> getMeetings(@PathVariable("nestId") Long nestId);

    /**
     * Fetches the expenses of a Nest.
     *
     * @param nestId the nest id
     * @return the expenses (empty when unavailable)
     */
    @GetMapping("/api/nests/{nestId}/expenses")
    List<ExpenseResponse> getExpenses(@PathVariable("nestId") Long nestId);

    /**
     * Fetches the aggregated vibe check status of a Nest.
     *
     * @param nestId the nest id
     * @return the vibe check status, or {@code null} when unavailable
     */
    @GetMapping("/api/nests/{nestId}/vibe-check/status")
    VibeCheckStatusResponse getVibeCheckStatus(@PathVariable("nestId") Long nestId);
}
