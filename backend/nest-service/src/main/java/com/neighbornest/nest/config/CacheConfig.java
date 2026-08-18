package com.neighbornest.nest.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.Map;

/**
 * Enables Spring Cache backed by an in-memory Caffeine cache.
 * <p>
 * The My Nest / Dashboard / Messages tabs re-fetch the same nests, meetings,
 * expenses and vibe-check results on every switch; those reads are served
 * from this cache and invalidated by every write. TTLs are short so data
 * stays fresh.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /** Cache name → time-to-live before an entry is considered stale. */
    private static final Map<String, Duration> TTL_BY_CACHE = Map.of(
            "nests", Duration.ofMinutes(2),
            "myNests", Duration.ofSeconds(30),
            "meetings", Duration.ofMinutes(1),
            "expenses", Duration.ofMinutes(1),
            "vibeChecks", Duration.ofMinutes(1)
    );

    /**
     * Caffeine-backed cache manager with one bounded cache per name.
     *
     * @return the cache manager
     */
    @Bean
    public CacheManager cacheManager() {
        final CaffeineCacheManager manager = new CaffeineCacheManager();
        manager.setCaffeine(Caffeine.newBuilder().maximumSize(10_000));
        TTL_BY_CACHE.forEach((name, ttl) ->
                manager.registerCustomCache(name,
                        Caffeine.newBuilder()
                                .maximumSize(10_000)
                                .expireAfterWrite(ttl)
                                .build()));
        return manager;
    }
}
