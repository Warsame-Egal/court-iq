package com.nbascoreboard.services;

import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class ScoreboardService {

    private final WebClient webClient;

    public ScoreboardService(WebClient webClient) {
        this.webClient = webClient;
    }

    public Mono<String> getToday(String date) {
        if (date == null || date.isBlank()) {
            return ProxySupport.get(webClient, "/api/v1/scoreboard/today");
        }
        MultiValueMap<String, String> query = new LinkedMultiValueMap<>();
        query.add("date", date);
        return ProxySupport.getWithQuery(webClient, "/api/v1/scoreboard/today", query);
    }

    public Mono<String> getRoster(String teamId, String season) {
        return ProxySupport.get(webClient, "/api/v1/scoreboard/team/{teamId}/roster/{season}", teamId, season);
    }

    public Mono<String> getBoxScore(String gameId) {
        return ProxySupport.get(webClient, "/api/v1/scoreboard/game/{gameId}/boxscore", gameId);
    }

    public Mono<String> getPlayByPlay(String gameId) {
        return ProxySupport.get(webClient, "/api/v1/scoreboard/game/{gameId}/play-by-play", gameId);
    }
}
