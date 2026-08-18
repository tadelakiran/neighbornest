package com.neighbornest.user.config;

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
 * Tab switches in the UI re-fetch the same profile/onboarding/anchor data,
 * so the read endpoints are served from this cache (see the {@code @Cacheable}
 * annotations in the service layer) and invalidated by every write. TTLs are
 * deliberately short so data never goes stale for long.
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
            "userProfiles", Duration.ofMinutes(2),
            "publicProfiles", Duration.ofMinutes(2),
            "onboardingStatus", Duration.ofMinutes(2),
            "readyForMatch", Duration.ofSeconds(30),
            "anchorApplications", Duration.ofMinutes(2),
            "anchorApplicationLists", Duration.ofMinutes(2)
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
