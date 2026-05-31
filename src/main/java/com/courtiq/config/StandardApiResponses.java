package com.courtiq.config;

import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@ApiResponses({
    @ApiResponse(
            responseCode = "400",
            description = "Validation error",
            content =
                    @Content(
                            mediaType = "application/json",
                            schema =
                                    @Schema(
                                            example =
                                                    "{\"message\":\"season: Season must be YYYY-YY\","
                                                            + "\"error\":\"VALIDATION_ERROR\","
                                                            + "\"timestamp\":\"2024-01-15T12:00:00Z\"}"))),
    @ApiResponse(
            responseCode = "502",
            description = "Upstream FastAPI error (status may mirror upstream)",
            content =
                    @Content(
                            mediaType = "application/json",
                            schema =
                                    @Schema(
                                            example =
                                                    "{\"message\":\"Upstream service error\","
                                                            + "\"error\":\"UPSTREAM_ERROR\","
                                                            + "\"timestamp\":\"2024-01-15T12:00:00Z\"}"))),
    @ApiResponse(
            responseCode = "500",
            description = "Internal server error",
            content =
                    @Content(
                            mediaType = "application/json",
                            schema =
                                    @Schema(
                                            example =
                                                    "{\"message\":\"Internal server error\","
                                                            + "\"error\":\"INTERNAL_ERROR\","
                                                            + "\"timestamp\":\"2024-01-15T12:00:00Z\"}")))
})
public @interface StandardApiResponses {}
