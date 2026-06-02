package com.nbascoreboard.controllers;

import com.nbascoreboard.config.StandardApiResponses;
import com.nbascoreboard.services.LeagueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Pattern;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@Tag(name = "League", description = "League-wide leaderboards and aggregates")
@Validated
@RestController
@RequestMapping("/api/v1/league")
public class LeagueController {

    private final LeagueService leagueService;

    public LeagueController(LeagueService leagueService) {
        this.leagueService = leagueService;
    }

    @Operation(
            summary = "League stat leaders",
            description =
                    "Top players for a stat category in a season (defaults to current season and points).")
    @ApiResponse(
            responseCode = "200",
            description = "League leaders JSON from FastAPI",
            content = @Content(mediaType = "application/json"))
    @StandardApiResponses
    @GetMapping("/leaders")
    public Mono<String> getLeaders(
            @Parameter(description = "Stat category", example = "PTS")
                    @RequestParam(required = false, defaultValue = "PTS")
                    String statCategory,
            @Parameter(description = "NBA season", example = "2023-24")
                    @RequestParam(required = false)
                    @Pattern(regexp = "\\d{4}-\\d{2}", message = "Season must be YYYY-YY")
                    String season) {
        return leagueService.getLeaders(statCategory, season);
    }
}
