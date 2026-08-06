package com.neighbornest.matching.client;

import com.neighbornest.matching.client.dto.CreateNestRequest;
import com.neighbornest.matching.client.dto.NestResponseDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * Feign client for communicating with the nest-service.
 * <p>
 * Triggers Nest creation after a proposal has been fully accepted. Falls
 * back via {@link NestServiceClientFallbackFactory} when the nest-service is
 * down.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@FeignClient(name = "nest-service", fallbackFactory = NestServiceClientFallbackFactory.class)
public interface NestServiceClient {

    /**
     * Creates a Nest within the nest-service.
     *
     * @param request the nest creation payload
     * @return the created Nest summary including its ID
     */
    @PostMapping("/api/nests")
    NestResponseDto createNest(@RequestBody CreateNestRequest request);
}
