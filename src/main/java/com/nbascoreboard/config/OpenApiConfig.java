package com.nbascoreboard.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Value("${SERVER_URL:http://localhost:8080}")
    private String serverUrl;

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("NBA Scoreboard API")
                        .description(
                                "NBA statistics, live scores, standings, schedules, and player/team search. "
                                        + "Spring WebFlux proxies a FastAPI data layer backed by "
                                        + "swar/nba_api (https://github.com/swar/nba_api). "
                                        + "JSON responses are pass-through from FastAPI (paginated lists use "
                                        + "a consistent envelope). This layer adds caching, validation, and error handling.")
                        .version("1.0.0"))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local development"),
                        new Server().url(serverUrl).description("Deployed server")));
    }
}
