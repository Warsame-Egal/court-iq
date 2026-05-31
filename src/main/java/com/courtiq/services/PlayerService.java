package com.courtiq.services;

import static com.courtiq.config.CacheConfig.PLAYERS;
import static com.courtiq.services.PaginationSupport.normalizeEnvelope;
import static com.courtiq.services.PaginationSupport.queryParams;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class PlayerService {

    private final WebClient webClient;

    public PlayerService(WebClient webClient) {
        this.webClient = webClient;
    }

    @Cacheable(value = PLAYERS, key = "#playerId")
    public Mono<String> getPlayer(String playerId) {
        return ProxySupport.get(webClient, "/api/v1/player/{playerId}", playerId);
    }

    public Mono<String> getGameLog(String playerId, MultiValueMap<String, String> query) {
        return ProxySupport.getWithQuery(webClient, "/api/v1/player/{playerId}/game-log", query, playerId);
    }

    public Mono<String> searchPlayers(
            String searchTerm, int page, int pageSize, MultiValueMap<String, String> extraQuery) {
        return normalizeEnvelope(ProxySupport.getWithQuery(
                webClient,
                "/api/v1/players/search/{searchTerm}",
                queryParams(page, pageSize, extraQuery),
                searchTerm));
    }

    public Mono<String> getSeasonLeaders(int page, int pageSize, MultiValueMap<String, String> extraQuery) {
        return normalizeEnvelope(ProxySupport.getWithQuery(
                webClient, "/api/v1/players/season-leaders", queryParams(page, pageSize, extraQuery)));
    }

    @Cacheable(value = PLAYERS, key = "'roster'")
    public Mono<String> getLeagueRoster() {
        return ProxySupport.get(webClient, "/api/v1/players/league-roster");
    }
}
