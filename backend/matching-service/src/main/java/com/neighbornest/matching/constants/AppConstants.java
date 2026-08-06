package com.neighbornest.matching.constants;

/**
 * Central constants for the matching domain.
 * <p>
 * Keeps scoring weights, bounds and timing values out of the algorithm and
 * service code so no magic numbers are scattered across the codebase.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public final class AppConstants {

    /** Weight of the values dimension in the overall score. */
    public static final double VALUES_WEIGHT = 0.40;

    /** Weight of the lifestyle dimension in the overall score. */
    public static final double LIFESTYLE_WEIGHT = 0.35;

    /** Weight of the interest dimension in the overall score. */
    public static final double INTEREST_WEIGHT = 0.25;

    /** Points subtracted from the overall score when a dealbreaker conflicts. */
    public static final double DEALBREAKER_PENALTY = 50.0;

    /** Maximum number of compatible users returned by the compatibles endpoint. */
    public static final int MAX_COMPATIBLE_RESULTS = 20;

    /** Number of days a proposal stays open for responses. */
    public static final int PROPOSAL_EXPIRY_DAYS = 7;

    /** Minimum total people in a Nest proposal (members + anchors). */
    public static final int MIN_NEST_SIZE = 5;

    /** Maximum total people in a Nest proposal (members + anchors). */
    public static final int MAX_NEST_SIZE = 8;

    /** Minimum number of anchors required in a Nest proposal. */
    public static final int MIN_ANCHORS = 1;

    /** Maximum number of anchors allowed in a Nest proposal. */
    public static final int MAX_ANCHORS = 2;

    private AppConstants() {
        // Prevent instantiation — constants only.
    }
}
