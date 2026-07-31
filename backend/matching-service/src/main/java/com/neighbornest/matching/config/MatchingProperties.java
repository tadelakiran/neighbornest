package com.neighbornest.matching.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for the matching engine.
 * <p>
 * Bound to the {@code app.matching} prefix in application.yml. Centralizes
 * tunable knobs so no magic numbers live in the algorithm code.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Component
@Data
@ConfigurationProperties(prefix = "app.matching")
public class MatchingProperties {

    /** Number of top compatible users returned by the compatibles endpoint. */
    private int topN = 20;

    /** Proposal validity window in hours. */
    private long proposalExpiryHours = 72;

    /** Weight configuration for the scoring dimensions. */
    private Weights weights = new Weights();

    /**
     * Weight breakdown for the three scoring dimensions.
     */
    @Data
    public static class Weights {
        /** Weight of values alignment (default 40%). */
        private double values = 0.40;

        /** Weight of lifestyle alignment (default 35%). */
        private double lifestyle = 0.35;

        /** Weight of interest overlap (default 25%). */
        private double interest = 0.25;

        /**
         * Returns the sum of all weights (used to normalize).
         *
         * @return the total weight
         */
        public double total() {
            return values + lifestyle + interest;
        }
    }
}
