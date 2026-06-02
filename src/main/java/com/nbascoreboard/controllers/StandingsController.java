package com.nbascoreboard.controllers;

import com.nbascoreboard.config.StandardApiResponses;
import com.nbascoreboard.services.StandingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import org.springframework.util.MultiValueMap;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@Tag(name = "Standings", description = "Season win/loss records and playoff rankings")
@Validated
@RestController
@RequestMapping("/api/v1/standings")
public class StandingsController {

    private final StandingsService standingsService;

    public StandingsController(StandingsService standingsService) {
        this.standingsService = standingsService;
    }

    @Operation(
            summary = "Standings for a season",
            description =
                    "Paginated team standings. Response envelope: data, page, pageSize, total.")
    @ApiResponse(
            responseCode = "200",
            description = "Paginated standings JSON",
            content = @Content(mediaType = "application/json"))
    @StandardApiResponses
    @GetMapping("/season/{season}")
    public Mono<String> getStandings(
            @Parameter(description = "NBA season", example = "2023-24")
                    @PathVariable
                    @Pattern(regexp = "\\d{4}-\\d{2}", message = "Season must be YYYY-YY")
                    String season,
            @Parameter(description = "Page number (1-based)", example = "1")
                    @RequestParam(defaultValue = "1")
                    @Min(1)
                    int page,
            @Parameter(description = "Items per page", example = "20")
                    @RequestParam(defaultValue = "20")
                    @Min(1)
                    @Max(100)
                    int pageSize,
            @Parameter(description = "Additional query params forwarded to FastAPI (e.g. filters)")
                    @RequestParam(required = false)
                    MultiValueMap<String, String> params) {
        return standingsService.getStandings(season, page, pageSize, params);
    }
}
