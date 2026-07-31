package com.neighbornest.nest.controller;

import com.neighbornest.nest.dto.request.CreateNestRequest;
import com.neighbornest.nest.dto.request.ExpenseRequest;
import com.neighbornest.nest.dto.request.MeetingRequest;
import com.neighbornest.nest.dto.request.VibeCheckRequest;
import com.neighbornest.nest.dto.response.ExpenseResponse;
import com.neighbornest.nest.dto.response.MeetingResponse;
import com.neighbornest.nest.dto.response.NestResponse;
import com.neighbornest.nest.dto.response.VibeCheckResponse;
import com.neighbornest.nest.dto.response.VibeCheckStatusResponse;
import com.neighbornest.nest.security.AuthenticatedUser;
import com.neighbornest.nest.service.ExpenseService;
import com.neighbornest.nest.service.MeetingService;
import com.neighbornest.nest.service.NestService;
import com.neighbornest.nest.service.VibeCheckService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for Nest operations.
 * <p>
 * Exposes endpoints for Nest creation, retrieval, meetings, expenses, vibe
 * checks, and lifecycle transitions. All endpoints require a valid JWT.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@RestController
@RequestMapping(value = "/api/nests", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Nests", description = "Nest lifecycle, meetings, expenses and vibe check endpoints")
@SecurityRequirement(name = "bearerAuth")
public class NestController {

    private final NestService nestService;
    private final MeetingService meetingService;
    private final ExpenseService expenseService;
    private final VibeCheckService vibeCheckService;

    /**
     * Creates a Nest (called by the matching-service via Feign).
     *
     * @param request the nest creation request
     * @return the created Nest with status 201 CREATED
     */
    @PostMapping
    @Operation(summary = "Create Nest",
            description = "Creates a Nest from an accepted proposal. Primarily called by the matching-service via Feign.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Nest created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data")
    })
    public ResponseEntity<NestResponse> createNest(@Valid @RequestBody final CreateNestRequest request) {
        log.debug("POST /api/nests - creating nest");
        final NestResponse response = nestService.createNest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Returns a Nest's details with members.
     *
     * @param nestId the nest ID
     * @return the Nest details
     */
    @GetMapping("/{nestId}")
    @Operation(summary = "Get Nest details",
            description = "Returns Nest details including its members.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Nest retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Nest not found")
    })
    public ResponseEntity<NestResponse> getNest(@PathVariable("nestId") final Long nestId) {
        log.debug("GET /api/nests/{} - fetching nest", nestId);
        return ResponseEntity.ok(nestService.getNest(nestId));
    }

    /**
     * Returns the current user's active or graduated Nests.
     *
     * @param principal the authenticated user from the JWT
     * @return the list of Nests
     */
    @GetMapping("/my-nests")
    @Operation(summary = "Get my Nests",
            description = "Returns all active or graduated Nests the current user belongs to.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Nests retrieved successfully")
    })
    public ResponseEntity<List<NestResponse>> getMyNests(
            @AuthenticationPrincipal final AuthenticatedUser principal) {

        log.debug("GET /api/nests/my-nests - for userId: {}", principal.userId());
        return ResponseEntity.ok(nestService.getMyNests(principal.userId()));
    }

    /**
     * Schedules a meeting for a Nest.
     *
     * @param nestId  the nest ID
     * @param request the meeting request
     * @return the created meeting with status 201 CREATED
     */
    @PostMapping("/{nestId}/meetings")
    @Operation(summary = "Schedule meeting",
            description = "Schedules a new meeting for a Nest.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Meeting scheduled successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "404", description = "Nest not found")
    })
    public ResponseEntity<MeetingResponse> scheduleMeeting(
            @PathVariable("nestId") final Long nestId,
            @Valid @RequestBody final MeetingRequest request) {

        log.debug("POST /api/nests/{}/meetings - scheduling meeting", nestId);
        final MeetingResponse response = meetingService.scheduleMeeting(nestId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Lists meetings for a Nest.
     *
     * @param nestId the nest ID
     * @return the list of meetings
     */
    @GetMapping("/{nestId}/meetings")
    @Operation(summary = "List meetings",
            description = "Returns all meetings for a Nest.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Meetings retrieved successfully")
    })
    public ResponseEntity<List<MeetingResponse>> listMeetings(@PathVariable("nestId") final Long nestId) {
        log.debug("GET /api/nests/{}/meetings - listing meetings", nestId);
        return ResponseEntity.ok(meetingService.listMeetings(nestId));
    }

    /**
     * Creates an expense with splits for a Nest.
     *
     * @param nestId    the nest ID
     * @param principal the authenticated user from the JWT (payer)
     * @param request   the expense request
     * @return the created expense with status 201 CREATED
     */
    @PostMapping("/{nestId}/expenses")
    @Operation(summary = "Create expense",
            description = "Creates an expense with EQUAL or CUSTOM splits for a Nest.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Expense created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data or splits"),
            @ApiResponse(responseCode = "404", description = "Nest not found")
    })
    public ResponseEntity<ExpenseResponse> createExpense(
            @PathVariable("nestId") final Long nestId,
            @AuthenticationPrincipal final AuthenticatedUser principal,
            @Valid @RequestBody final ExpenseRequest request) {

        log.debug("POST /api/nests/{}/expenses - creating expense", nestId);
        final ExpenseResponse response = expenseService.createExpense(nestId, principal.userId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Lists expenses for a Nest.
     *
     * @param nestId the nest ID
     * @return the list of expenses
     */
    @GetMapping("/{nestId}/expenses")
    @Operation(summary = "List expenses",
            description = "Returns all expenses for a Nest with their splits.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Expenses retrieved successfully")
    })
    public ResponseEntity<List<ExpenseResponse>> listExpenses(@PathVariable("nestId") final Long nestId) {
        log.debug("GET /api/nests/{}/expenses - listing expenses", nestId);
        return ResponseEntity.ok(expenseService.listExpenses(nestId));
    }

    /**
     * Submits a vibe check for the current user.
     *
     * @param nestId    the nest ID
     * @param principal the authenticated user from the JWT
     * @param request   the vibe check request
     * @return the submitted vibe check with status 201 CREATED
     */
    @PostMapping("/{nestId}/vibe-check")
    @Operation(summary = "Submit vibe check",
            description = "Submits a vibe check for the current user on a Nest.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Vibe check submitted successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "404", description = "Nest not found")
    })
    public ResponseEntity<VibeCheckResponse> submitVibeCheck(
            @PathVariable("nestId") final Long nestId,
            @AuthenticationPrincipal final AuthenticatedUser principal,
            @Valid @RequestBody final VibeCheckRequest request) {

        log.debug("POST /api/nests/{}/vibe-check - submitting check", nestId);
        final VibeCheckResponse response = vibeCheckService.submit(nestId, principal.userId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Returns the aggregated vibe check status for a Nest (admin view).
     *
     * @param nestId the nest ID
     * @return the aggregated status
     */
    @GetMapping("/{nestId}/vibe-check/status")
    @Operation(summary = "Get vibe check status",
            description = "Returns the aggregated vibe check scores for a Nest.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Status retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Nest not found")
    })
    public ResponseEntity<VibeCheckStatusResponse> getVibeCheckStatus(@PathVariable("nestId") final Long nestId) {
        log.debug("GET /api/nests/{}/vibe-check/status - fetching status", nestId);
        return ResponseEntity.ok(vibeCheckService.getStatus(nestId));
    }

    /**
     * Marks a Nest as graduated.
     *
     * @param nestId the nest ID
     * @return the updated Nest
     */
    @PostMapping("/{nestId}/graduate")
    @Operation(summary = "Graduate Nest",
            description = "Marks a Nest as graduated and publishes a graduation event.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Nest graduated successfully"),
            @ApiResponse(responseCode = "404", description = "Nest not found"),
            @ApiResponse(responseCode = "409", description = "Nest is not active")
    })
    public ResponseEntity<NestResponse> graduate(@PathVariable("nestId") final Long nestId) {
        log.debug("POST /api/nests/{}/graduate - graduating nest", nestId);
        return ResponseEntity.ok(nestService.graduate(nestId));
    }

    /**
     * Marks a Nest as disbanded.
     *
     * @param nestId the nest ID
     * @return the updated Nest
     */
    @PostMapping("/{nestId}/disband")
    @Operation(summary = "Disband Nest",
            description = "Marks a Nest as disbanded.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Nest disbanded successfully"),
            @ApiResponse(responseCode = "404", description = "Nest not found"),
            @ApiResponse(responseCode = "409", description = "Nest has already ended")
    })
    public ResponseEntity<NestResponse> disband(@PathVariable("nestId") final Long nestId) {
        log.debug("POST /api/nests/{}/disband - disbanding nest", nestId);
        return ResponseEntity.ok(nestService.disband(nestId));
    }
}
