package com.nbascoreboard.controllers;

import com.nbascoreboard.config.StandardApiResponses;
import com.nbascoreboard.services.TeamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Pattern;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@Tag(name = "Teams", description = "Team details, stats, game logs, and player stats")
@Validated
@RestController
@RequestMapping("/api/v1/teams")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @Operation(
            summary = "League team stats",
            description = "Aggregate team statistics for a season (defaults to current season).")
    @ApiResponse(
            responseCode = "200",
            description = "Team stats JSON from FastAPI",
            content = @Content(mediaType = "application/json"))
    @StandardApiResponses
    @GetMapping("/stats")
    public Mono<String> getStats(
            @Parameter(description = "NBA season", example = "2023-24")
                    @RequestParam(required = false)
                    @Pattern(regexp = "\\d{4}-\\d{2}", message = "Season must be YYYY-YY")
                    String season) {
        return teamService.getStats(season);
    }

    @Operation(summary = "Team profile", description = "Franchise details and metadata for one team.")
    @ApiResponse(
            responseCode = "200",
            description = "Team JSON from FastAPI",
            content = @Content(mediaType = "application/json"))
    @StandardApiResponses
    @GetMapping("/{teamId}")
    public Mono<String> getTeam(@Parameter(description = "NBA team ID", example = "1610612747") @PathVariable String teamId) {
        return teamService.getTeam(teamId);
    }

    @Operation(
            summary = "Team game log",
            description = "Game-by-game results and stats for a team in a season.")
    @ApiResponse(
            responseCode = "200",
            description = "Game log JSON from FastAPI",
            content = @Content(mediaType = "application/json"))
    @StandardApiResponses
    @GetMapping("/{teamId}/game-log")
    public Mono<String> getGameLog(
            @Parameter(description = "NBA team ID", example = "1610612747") @PathVariable String teamId,
            @Parameter(description = "NBA season", example = "2023-24")
                    @RequestParam(required = false)
                    @Pattern(regexp = "\\d{4}-\\d{2}", message = "Season must be YYYY-YY")
                    String season) {
        return teamService.getGameLog(teamId, season);
    }

    @Operation(
            summary = "Team player stats",
            description = "Per-player statistics for a team in a season.")
    @ApiResponse(
            responseCode = "200",
            description = "Player stats JSON from FastAPI",
            content = @Content(mediaType = "application/json"))
    @StandardApiResponses
    @GetMapping("/{teamId}/player-stats")
    public Mono<String> getPlayerStats(
            @Parameter(description = "NBA team ID", example = "1610612747") @PathVariable String teamId,
            @Parameter(description = "NBA season", example = "2023-24")
                    @RequestParam(required = false)
                    @Pattern(regexp = "\\d{4}-\\d{2}", message = "Season must be YYYY-YY")
                    String season) {
        return teamService.getPlayerStats(teamId, season);
    }
}
