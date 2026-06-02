package com.nbascoreboard.controllers;

import com.nbascoreboard.config.StandardApiResponses;
import com.nbascoreboard.services.PlayerService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Pattern;
import org.springframework.util.MultiValueMap;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@Tag(name = "Players", description = "Player profiles, game logs, search, and season leaders")
@Validated
@RestController
@RequestMapping("/api/v1")
public class PlayerController {

    private final PlayerService playerService;

    public PlayerController(PlayerService playerService) {
        this.playerService = playerService;
    }

    @Operation(summary = "Player profile", description = "Summary stats and bio for one NBA player.")
    @ApiResponse(
            responseCode = "200",
            description = "Player JSON from FastAPI",
            content = @Content(mediaType = "application/json"))
    @StandardApiResponses
    @GetMapping("/player/{playerId}")
    public Mono<String> getPlayer(
            @Parameter(description = "NBA player ID", example = "2544")
                    @PathVariable
                    @Pattern(regexp = "\\d+", message = "playerId must be numeric")
                    String playerId) {
        return playerService.getPlayer(playerId);
    }

    @Operation(
            summary = "Player game log",
            description = "Game-by-game stats for a player in a season (defaults to current season).")
    @ApiResponse(
            responseCode = "200",
            description = "Game log JSON from FastAPI",
            content = @Content(mediaType = "application/json"))
    @StandardApiResponses
    @GetMapping("/player/{playerId}/game-log")
    public Mono<String> getGameLog(
            @Parameter(description = "NBA player ID", example = "2544") @PathVariable String playerId,
            @Parameter(description = "NBA season", example = "2023-24")
                    @RequestParam(required = false)
                    @Pattern(regexp = "\\d{4}-\\d{2}", message = "Season must be YYYY-YY")
                    String season) {
        return playerService.getGameLog(playerId, season);
    }

    @Operation(
            summary = "Search players by name",
            description = "Paginated player search. Envelope: data, page, pageSize, total.")
    @ApiResponse(
            responseCode = "200",
            description = "Paginated player list JSON",
            content = @Content(mediaType = "application/json"))
    @StandardApiResponses
    @GetMapping("/players/search/{searchTerm}")
    public Mono<String> searchPlayers(
            @Parameter(description = "Name or partial name", example = "james") @PathVariable String searchTerm,
            @Parameter(description = "Page number (1-based)", example = "1")
                    @RequestParam(defaultValue = "1")
                    @Min(1)
                    int page,
            @Parameter(description = "Items per page", example = "20")
                    @RequestParam(defaultValue = "20")
                    @Min(1)
                    @Max(100)
                    int pageSize,
            @Parameter(description = "Additional query params forwarded to FastAPI")
                    @RequestParam(required = false)
                    MultiValueMap<String, String> params) {
        return playerService.searchPlayers(searchTerm, page, pageSize, params);
    }

    @Operation(
            summary = "Season stat leaders by category",
            description = "League-wide season leaders grouped by stat category. Paginated.")
    @ApiResponse(
            responseCode = "200",
            description = "Paginated season leaders JSON",
            content = @Content(mediaType = "application/json"))
    @StandardApiResponses
    @GetMapping("/players/season-leaders")
    public Mono<String> getSeasonLeaders(
            @Parameter(description = "Page number (1-based)", example = "1")
                    @RequestParam(defaultValue = "1")
                    @Min(1)
                    int page,
            @Parameter(description = "Items per page", example = "20")
                    @RequestParam(defaultValue = "20")
                    @Min(1)
                    @Max(100)
                    int pageSize,
            @Parameter(description = "NBA season", example = "2023-24")
                    @RequestParam(required = false)
                    @Pattern(regexp = "\\d{4}-\\d{2}", message = "Season must be YYYY-YY")
                    String season) {
        return playerService.getSeasonLeaders(page, pageSize, season);
    }

    @Operation(
            summary = "Full league roster index",
            description = "All active players in the current league roster index.")
    @ApiResponse(
            responseCode = "200",
            description = "Player roster JSON from FastAPI",
            content = @Content(mediaType = "application/json"))
    @StandardApiResponses
    @GetMapping("/players/league-roster")
    public Mono<String> getLeagueRoster() {
        return playerService.getLeagueRoster();
    }
}
