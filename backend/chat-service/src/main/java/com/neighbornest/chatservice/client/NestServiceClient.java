package com.neighbornest.chatservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.List;

/**
 * Feign client for communicating with the nest-service.
 * <p>
 * Used for membership validation (group chat) and DM eligibility (shared Nest).
 * Chat operations fail closed: the {@link NestServiceFallbackFactory} throws
 * {@link com.neighbornest.chatservice.exception.ServiceUnavailableException}
 * when the nest-service is down, so a message is never delivered to a room
 * whose membership could not be verified.
 * </p>
 * <p>
 * The nest-service embeds the member list inside {@link NestResponse} (there is
 * no standalone {@code GET /api/nests/{nestId}/members} endpoint yet), so
 * membership checks use {@link #getNest(Long)}.
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
     * Fetches a Nest including its members, with an explicit Authorization
     * header (used by the WebSocket layer where the STOMP thread cannot
     * rely on thread-local header propagation).
     *
     * @param nestId              the nest id
     * @param authorizationHeader the raw Authorization header value
     * @return the Nest response
     */
    @GetMapping("/api/nests/{nestId}")
    NestResponse getNest(@PathVariable("nestId") Long nestId,
                         @RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader);

    /**
     * Fetches the caller's active and graduated Nests (the Authorization
     * header is forwarded by the Feign interceptor, so the nest-service
     * resolves the caller's profile itself).
     *
     * @return the list of Nests the caller belongs to
     */
    @GetMapping("/api/nests/my-nests")
    List<NestResponse> getMyNests();

    /**
     * Fetches the caller's active and graduated Nests with an explicit
     * Authorization header (used by the WebSocket layer where the STOMP
     * thread cannot rely on thread-local header propagation).
     *
     * @param authorizationHeader the raw Authorization header value
     * @return the list of Nests the caller belongs to
     */
    @GetMapping("/api/nests/my-nests")
    List<NestResponse> getMyNests(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader);
}
