package com.courtiq.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

final class ProxySupport {

    private static final Logger log = LoggerFactory.getLogger(ProxySupport.class);

    private ProxySupport() {}

    static Mono<String> get(WebClient client, String path, Object... uriVariables) {
        return client.get()
                .uri(path, uriVariables)
                .retrieve()
                .bodyToMono(String.class)
                .doOnError(e -> log.warn("Proxy GET {} failed: {}", path, e.getMessage()));
    }

    static Mono<String> getWithQuery(WebClient client, String path, MultiValueMap<String, String> query,
                                     Object... uriVariables) {
        return client.get()
                .uri(uriBuilder -> {
                    var builder = uriBuilder.path(path);
                    if (query != null) {
                        query.forEach((name, values) ->
                            values.forEach(value -> builder.queryParam(name, value)));
                    }
                    return builder.build(uriVariables);
                })
                .retrieve()
                .bodyToMono(String.class)
                .doOnError(e -> log.warn("Proxy GET {} failed: {}", path, e.getMessage()));
    }
}
