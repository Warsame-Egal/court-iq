package com.courtiq.services;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class ScheduleService {

    private final WebClient webClient;

    public ScheduleService(WebClient webClient) {
        this.webClient = webClient;
    }

    public Mono<String> getByDate(String date) {
        return ProxySupport.get(webClient, "/api/v1/schedule/date/{date}", date);
    }
}
