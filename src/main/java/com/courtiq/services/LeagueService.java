package com.courtiq.services;

import static com.courtiq.config.CacheConfig.LEAGUE;
import static com.courtiq.services.SeasonUtil.resolveSeason;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class LeagueService {

    private final WebClient webClient;

    public LeagueService(WebClient webClient) {
        this.webClient = webClient;
    }

    @Cacheable(value = LEAGUE, key = "#statCategory + '-' + #season")
    public Mono<String> getLeaders(String statCategory, String season) {
        MultiValueMap<String, String> query = new LinkedMultiValueMap<>();
        query.add("stat_category", statCategory);
        query.add("season", resolveSeason(season));
        return ProxySupport.getWithQuery(webClient, "/api/v1/league/leaders", query);
    }
}
