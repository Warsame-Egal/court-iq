package com.courtiq.services;

import static com.courtiq.config.CacheConfig.TEAMS;
import static com.courtiq.services.SeasonUtil.queryWithSeason;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class TeamService {

    private final WebClient webClient;

    public TeamService(WebClient webClient) {
        this.webClient = webClient;
    }

    public Mono<String> getStats(String season) {
        return ProxySupport.getWithQuery(webClient, "/api/v1/teams/stats", queryWithSeason(season));
    }

    @Cacheable(value = TEAMS, key = "#teamId")
    public Mono<String> getTeam(String teamId) {
        return ProxySupport.get(webClient, "/api/v1/teams/{teamId}", teamId);
    }

    public Mono<String> getGameLog(String teamId, String season) {
        return ProxySupport.getWithQuery(
                webClient, "/api/v1/teams/{teamId}/game-log", queryWithSeason(season), teamId);
    }

    public Mono<String> getPlayerStats(String teamId, String season) {
        return ProxySupport.getWithQuery(
                webClient, "/api/v1/teams/{teamId}/player-stats", queryWithSeason(season), teamId);
    }
}
