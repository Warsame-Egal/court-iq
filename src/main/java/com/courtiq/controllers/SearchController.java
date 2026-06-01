package com.courtiq.controllers;

import com.courtiq.config.StandardApiResponses;
import com.courtiq.services.SearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@Tag(name = "Search", description = "Cross-entity search for players and teams")
@Validated
@RestController
@RequestMapping("/api/v1")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @Operation(
            summary = "Search players and teams",
            description = "Unified search by name or abbreviation. Requires query param `q`.")
    @ApiResponse(
            responseCode = "200",
            description = "Search results JSON from FastAPI",
            content = @Content(mediaType = "application/json"))
    @StandardApiResponses
    @GetMapping("/search")
    public Mono<String> search(
            @Parameter(description = "Search text", example = "lebron")
                    @RequestParam
                    @NotBlank(message = "Search query must not be empty")
                    String q) {
        return searchService.search(q);
    }
}
