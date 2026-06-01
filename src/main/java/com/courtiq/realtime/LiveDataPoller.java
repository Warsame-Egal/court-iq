package com.courtiq.realtime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Component
public class LiveDataPoller {

    private static final Logger log = LoggerFactory.getLogger(LiveDataPoller.class);

    private final WebClient webClient;
    private final LiveDataHub hub;
    private volatile boolean running = true;

    public LiveDataPoller(WebClient webClient, LiveDataHub hub) {
        this.webClient = webClient;
        this.hub = hub;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void start() {
        scheduleScoreboardPoll(0);
        schedulePlayByPlayPoll(0);
    }

    public void requestScoreboardRefresh() {
        scheduleScoreboardPoll(0);
    }

    public void requestPlayByPlayRefresh(String gameId) {
        Mono.delay(java.time.Duration.ZERO)
                .flatMap(ignored -> pollPlayByPlay(gameId))
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe();
    }

    private void scheduleScoreboardPoll(long delayMs) {
        Mono.delay(java.time.Duration.ofMillis(delayMs))
                .flatMap(ignored -> pollScoreboard())
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(
                        ignored -> {},
                        e -> log.warn("Scoreboard poll failed: {}", e.getMessage()),
                        () -> {
                            if (!running) {
                                return;
                            }
                            long next = hub.hasScoreboardSubscribers() ? hub.nextScoreboardPollIntervalMs() : 5_000L;
                            scheduleScoreboardPoll(next);
                        });
    }

    private void schedulePlayByPlayPoll(long delayMs) {
        Mono.delay(java.time.Duration.ofMillis(delayMs))
                .flatMap(ignored -> pollAllPlayByPlay())
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(
                        ignored -> {},
                        e -> log.warn("Play-by-play poll failed: {}", e.getMessage()),
                        () -> {
                            if (!running) {
                                return;
                            }
                            long next = hub.hasPlayByPlaySubscribers() ? 2_000L : 5_000L;
                            schedulePlayByPlayPoll(next);
                        });
    }

    private Mono<Void> pollScoreboard() {
        if (!hub.hasScoreboardSubscribers()) {
            return Mono.empty();
        }
        return webClient
                .get()
                .uri("/api/v1/scoreboard/today")
                .retrieve()
                .bodyToMono(String.class)
                .doOnNext(json -> {
                    if (hub.shouldBroadcastScoreboard(json)) {
                        hub.publishScoreboard(json);
                    }
                })
                .then();
    }

    private Mono<Void> pollAllPlayByPlay() {
        if (!hub.hasPlayByPlaySubscribers()) {
            return Mono.empty();
        }
        return Flux.fromIterable(hub.activePlayByPlayGameIds())
                .flatMap(this::pollPlayByPlay)
                .then();
    }

    private Mono<Void> pollPlayByPlay(String gameId) {
        return webClient
                .get()
                .uri("/api/v1/scoreboard/game/{gameId}/play-by-play", gameId)
                .retrieve()
                .bodyToMono(String.class)
                .doOnNext(json -> {
                    if (hub.shouldBroadcastPlayByPlay(gameId, json)) {
                        hub.publishPlayByPlay(gameId, json);
                    }
                })
                .onErrorResume(
                        e -> {
                            log.debug("Play-by-play fetch failed for {}: {}", gameId, e.getMessage());
                            return Mono.empty();
                        })
                .then();
    }
}
