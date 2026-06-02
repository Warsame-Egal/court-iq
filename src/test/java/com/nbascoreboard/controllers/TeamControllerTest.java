package com.nbascoreboard.controllers;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.nbascoreboard.services.TeamService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

@WebFluxTest(TeamController.class)
class TeamControllerTest {

    @Autowired private WebTestClient webTestClient;

    @MockBean private TeamService teamService;

    @Test
    void getTeam_returnsProxiedBody() {
        String body = "{\"team_id\":1610612747,\"team_name\":\"Lakers\"}";
        when(teamService.getTeam(eq("1610612747"))).thenReturn(Mono.just(body));

        webTestClient
                .get()
                .uri("/api/v1/teams/1610612747")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody(String.class)
                .isEqualTo(body);
    }
}
