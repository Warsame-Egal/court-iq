package com.courtiq.controllers;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.courtiq.services.ScoreboardService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

@WebFluxTest(ScoreboardController.class)
class ScoreboardControllerTest {

    @Autowired private WebTestClient webTestClient;

    @MockBean private ScoreboardService scoreboardService;

    @Test
    void getToday_withDate_forwardsToService() {
        String body = "{\"scoreboard\":{\"gameDate\":\"2024-01-15\",\"games\":[]}}";
        when(scoreboardService.getToday(eq("2024-01-15"))).thenReturn(Mono.just(body));

        webTestClient
                .get()
                .uri(uriBuilder ->
                        uriBuilder.path("/api/v1/scoreboard/today").queryParam("date", "2024-01-15").build())
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody(String.class)
                .isEqualTo(body);
    }
}
