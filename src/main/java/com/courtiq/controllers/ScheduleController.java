package com.courtiq.controllers;

import com.courtiq.config.StandardApiResponses;
import com.courtiq.services.ScheduleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@Tag(name = "Schedule", description = "Games scheduled on a given date")
@RestController
@RequestMapping("/api/v1/schedule")
public class ScheduleController {

    private final ScheduleService scheduleService;

    public ScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @Operation(
            summary = "Games on a date",
            description = "NBA schedule for a calendar day in YYYY-MM-DD format.")
    @ApiResponse(
            responseCode = "200",
            description = "Schedule JSON from FastAPI",
            content = @Content(mediaType = "application/json"))
    @StandardApiResponses
    @GetMapping("/date/{date}")
    public Mono<String> getByDate(
            @Parameter(description = "Calendar date", example = "2024-01-15") @PathVariable String date) {
        return scheduleService.getByDate(date);
    }
}
