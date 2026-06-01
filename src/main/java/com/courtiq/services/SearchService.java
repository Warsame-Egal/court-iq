package com.courtiq.services;

import static com.courtiq.config.CacheConfig.SEARCH;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class SearchService {

    private final WebClient webClient;

    public SearchService(WebClient webClient) {
        this.webClient = webClient;
    }

    @Cacheable(value = SEARCH, key = "#q.toLowerCase()")
    public Mono<String> search(String q) {
        var query = new LinkedMultiValueMap<String, String>();
        query.add("q", q);
        return ProxySupport.getWithQuery(webClient, "/api/v1/search", query);
    }
}
