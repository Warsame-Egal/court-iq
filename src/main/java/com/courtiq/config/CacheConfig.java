package com.courtiq.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import java.util.concurrent.TimeUnit;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String PLAYERS   = "players";
    public static final String TEAMS     = "teams";
    public static final String STANDINGS = "standings";
    public static final String LEAGUE    = "leagueLeaders";
    public static final String SEARCH    = "search";

    @Bean
    public CaffeineCacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager();
        manager.setAsyncCacheMode(true);

        manager.registerCustomCache(PLAYERS, asyncBuilder(10, TimeUnit.MINUTES, 500));
        manager.registerCustomCache(TEAMS, asyncBuilder(10, TimeUnit.MINUTES, 200));
        manager.registerCustomCache(STANDINGS, asyncBuilder(10, TimeUnit.MINUTES, 50));
        manager.registerCustomCache(LEAGUE, asyncBuilder(10, TimeUnit.MINUTES, 100));
        manager.registerCustomCache(SEARCH, asyncBuilder(2, TimeUnit.MINUTES, 200));

        return manager;
    }

    private static com.github.benmanes.caffeine.cache.AsyncCache<Object, Object> asyncBuilder(
            long duration, TimeUnit unit, long maxSize) {
        return Caffeine.newBuilder()
                .expireAfterWrite(duration, unit)
                .maximumSize(maxSize)
                .recordStats()
                .buildAsync();
    }
}
