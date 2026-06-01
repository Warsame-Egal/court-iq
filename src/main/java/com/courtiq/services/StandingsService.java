package com.courtiq.services;

import static com.courtiq.config.CacheConfig.STANDINGS;
import static com.courtiq.services.PaginationSupport.forwardQuery;
import static com.courtiq.services.PaginationSupport.paginate;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class StandingsService {

    private final WebClient webClient;

    public StandingsService(WebClient webClient) {
        this.webClient = webClient;
    }

    @Cacheable(value = STANDINGS, key = "#season + '-' + #page + '-' + #pageSize")
    public Mono<String> getStandings(
            String season, int page, int pageSize, MultiValueMap<String, String> extraQuery) {
        return paginate(
                ProxySupport.getWithQuery(
                        webClient,
                        "/api/v1/standings/season/{season}",
                        forwardQuery(extraQuery),
                        season),
                page,
                pageSize);
    }
}
