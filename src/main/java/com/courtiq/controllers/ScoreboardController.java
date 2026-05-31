package com.courtiq.controllers;

import com.courtiq.config.StandardApiResponses;
import com.courtiq.services.ScoreboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@Tag(name = "Scoreboard", description = "Live scores, box scores, play-by-play, and rosters")
@RestController
@RequestMapping("/api/v1/scoreboard")
public class ScoreboardController {

    private final ScoreboardService scoreboardService;

    public ScoreboardController(ScoreboardService scoreboardService) {
        this.scoreboardService = scoreboardService;
    }

    @Operation(
            summary = "Scoreboard for today or a date",
            description =
                    "Games and scores for today (cached) or a specific date. Optional `date` query in YYYY-MM-DD.")
    @ApiResponse(
            responseCode = "200",
            description = "Scoreboard JSON from FastAPI",
            content = @Content(mediaType = "application/json"))
    @StandardApiResponses
    @GetMapping("/today")
    public Mono<String> getToday(
            @Parameter(
                            description = "Game date (YYYY-MM-DD). Omit for today's live scoreboard.",
                            example = "2024-01-15")
                    @RequestParam(required = false)
                    String date) {
        return scoreboardService.getToday(date);
    }

    @Operation(summary = "Team roster for a season", description = "Active roster for a team in the given season.")
    @ApiResponse(
            responseCode = "200",
            description = "Roster JSON from FastAPI",
            content = @Content(mediaType = "application/json"))
    @StandardApiResponses
    @GetMapping("/team/{teamId}/roster/{season}")
    public Mono<String> getRoster(
            @Parameter(description = "NBA team ID", example = "1610612747") @PathVariable String teamId,
            @Parameter(description = "NBA season", example = "2023-24") @PathVariable String season) {
        return scoreboardService.getRoster(teamId, season);
    }

    @Operation(summary = "Game box score", description = "Full box score for a completed or in-progress game.")
    @ApiResponse(
            responseCode = "200",
            description = "Box score JSON from FastAPI",
            content = @Content(mediaType = "application/json"))
    @StandardApiResponses
    @GetMapping("/game/{gameId}/boxscore")
    public Mono<String> getBoxScore(
            @Parameter(description = "NBA game ID", example = "0022301186") @PathVariable String gameId) {
        return scoreboardService.getBoxScore(gameId);
    }

    @Operation(summary = "Play-by-play", description = "Play-by-play events for a game.")
    @ApiResponse(
            responseCode = "200",
            description = "Play-by-play JSON from FastAPI",
            content = @Content(mediaType = "application/json"))
    @StandardApiResponses
    @GetMapping("/game/{gameId}/play-by-play")
    public Mono<String> getPlayByPlay(
            @Parameter(description = "NBA game ID", example = "0022301186") @PathVariable String gameId) {
        return scoreboardService.getPlayByPlay(gameId);
    }
}
