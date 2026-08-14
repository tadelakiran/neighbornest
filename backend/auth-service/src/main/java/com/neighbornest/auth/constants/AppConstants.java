package com.neighbornest.auth.constants;

/**
 * Central constants for the Auth Service.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public final class AppConstants {

    private AppConstants() {
        // Utility class — no instances.
    }

    /** HTTP header carrying the service-to-service API key. */
    public static final String INTERNAL_API_KEY_HEADER = "X-Internal-Key";
}
