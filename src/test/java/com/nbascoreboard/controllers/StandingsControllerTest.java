package com.nbascoreboard.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.nbascoreboard.services.StandingsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

@WebFluxTest(StandingsController.class)
class StandingsControllerTest {

    @Autowired private WebTestClient webTestClient;

    @MockBean private StandingsService standingsService;

    @Test
    void getStandings_returnsProxiedBody() {
        String body =
                "{\"data\":[{\"team_id\":1,\"wins\":50,\"losses\":32}],\"page\":1,\"pageSize\":30,\"total\":30}";

        when(standingsService.getStandings(eq("2024-25"), eq(1), eq(30), any())).thenReturn(Mono.just(body));

        webTestClient
                .get()
                .uri(uriBuilder ->
                        uriBuilder
                                .path("/api/v1/standings/season/2024-25")
                                .queryParam("page", "1")
                                .queryParam("pageSize", "30")
                                .build())
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody(String.class)
                .isEqualTo(body);
    }
}
