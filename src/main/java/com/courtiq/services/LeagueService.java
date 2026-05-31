package com.courtiq.services;

import static com.courtiq.config.CacheConfig.LEAGUE;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class LeagueService {

    private final WebClient webClient;

    public LeagueService(WebClient webClient) {
        this.webClient = webClient;
    }

    @Cacheable(value = LEAGUE, key = "#params.getFirst('stat_category') + '-' + #params.getFirst('season')")
    public Mono<String> getLeaders(MultiValueMap<String, String> params) {
        return ProxySupport.getWithQuery(webClient, "/api/v1/league/leaders", params);
    }
}
