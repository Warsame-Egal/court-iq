package com.nbascoreboard.realtime;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

@Component
public class LiveDataHub {

    private static final String EMPTY_SCOREBOARD =
            "{\"scoreboard\":{\"gameDate\":\"\",\"games\":[]}}";

    private final ObjectMapper mapper = new ObjectMapper();
    private final Sinks.Many<String> scoreboardSink =
            Sinks.many().replay().latestOrDefault(EMPTY_SCOREBOARD);
    private final ConcurrentHashMap<String, Sinks.Many<String>> playByPlaySinks = new ConcurrentHashMap<>();
    private final AtomicInteger scoreboardSubscribers = new AtomicInteger(0);
    private final ConcurrentHashMap<String, AtomicInteger> playByPlaySubscribers = new ConcurrentHashMap<>();
    private final Map<String, Double> scoreboardGameTimestamps = new ConcurrentHashMap<>();
    private final Map<String, Double> playByPlayTimestamps = new ConcurrentHashMap<>();

    private volatile List<JsonNode> currentGames = List.of();
    private volatile String lastScoreboardJson = EMPTY_SCOREBOARD;
    private final ConcurrentHashMap<String, List<JsonNode>> currentPlaysByGame = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> lastPlayByPlayJsonByGame = new ConcurrentHashMap<>();

    public Flux<String> scoreboardFlux() {
        return scoreboardSink.asFlux();
    }

    public Flux<String> playByPlayFlux(String gameId) {
        return playByPlaySink(gameId).asFlux();
    }

    public boolean onScoreboardSubscribed() {
        return scoreboardSubscribers.incrementAndGet() == 1;
    }

    public void onScoreboardUnsubscribed() {
        scoreboardSubscribers.decrementAndGet();
    }

    public boolean onPlayByPlaySubscribed(String gameId) {
        return playByPlaySubscribers
                        .computeIfAbsent(gameId, id -> new AtomicInteger(0))
                        .incrementAndGet()
                == 1;
    }

    public void onPlayByPlayUnsubscribed(String gameId) {
        AtomicInteger count = playByPlaySubscribers.get(gameId);
        if (count != null && count.decrementAndGet() <= 0) {
            playByPlaySubscribers.remove(gameId);
            playByPlaySinks.remove(gameId);
            currentPlaysByGame.remove(gameId);
            lastPlayByPlayJsonByGame.remove(gameId);
        }
    }

    public boolean hasScoreboardSubscribers() {
        return scoreboardSubscribers.get() > 0;
    }

    public boolean hasPlayByPlaySubscribers() {
        return playByPlaySubscribers.values().stream().anyMatch(c -> c.get() > 0);
    }

    public Iterable<String> activePlayByPlayGameIds() {
        List<String> ids = new ArrayList<>();
        playByPlaySubscribers.forEach((gameId, count) -> {
            if (count.get() > 0) {
                ids.add(gameId);
            }
        });
        return ids;
    }

    public void publishScoreboard(String json) {
        lastScoreboardJson = json;
        try {
            JsonNode root = mapper.readTree(json);
            JsonNode games = root.path("scoreboard").path("games");
            if (games.isArray()) {
                List<JsonNode> next = new ArrayList<>();
                games.forEach(next::add);
                currentGames = List.copyOf(next);
            }
        } catch (Exception ignored) {
            // keep previous games for interval calculation
        }
        scoreboardSink.tryEmitNext(json);
    }

    public boolean shouldBroadcastScoreboard(String json) {
        try {
            JsonNode root = mapper.readTree(json);
            List<JsonNode> newGames = new ArrayList<>();
            root.path("scoreboard").path("games").forEach(newGames::add);
            return LiveChangeDetector.hasGameDataChanged(newGames, currentGames, scoreboardGameTimestamps);
        } catch (Exception e) {
            return true;
        }
    }

    public void publishPlayByPlay(String gameId, String json) {
        lastPlayByPlayJsonByGame.put(gameId, json);
        try {
            List<JsonNode> plays = new ArrayList<>();
            mapper.readTree(json).path("plays").forEach(plays::add);
            currentPlaysByGame.put(gameId, List.copyOf(plays));
        } catch (Exception ignored) {
            // ignore parse errors
        }
        playByPlaySink(gameId).tryEmitNext(json);
    }

    public boolean shouldBroadcastPlayByPlay(String gameId, String json) {
        try {
            List<JsonNode> newPlays = new ArrayList<>();
            mapper.readTree(json).path("plays").forEach(newPlays::add);
            List<JsonNode> oldPlays = currentPlaysByGame.getOrDefault(gameId, List.of());
            return LiveChangeDetector.hasPlayByPlayChanged(newPlays, oldPlays, playByPlayTimestamps);
        } catch (Exception e) {
            return true;
        }
    }

    public long nextScoreboardPollIntervalMs() {
        if (currentGames.isEmpty()) {
            return 900_000L;
        }
        boolean anyLive = false;
        boolean allFinal = true;
        for (JsonNode game : currentGames) {
            int status = game.path("gameStatus").asInt();
            if (status == LiveGameStatus.LIVE) {
                anyLive = true;
            }
            if (status != LiveGameStatus.FINAL) {
                allFinal = false;
            }
        }
        if (anyLive) {
            return 8_000L;
        }
        if (allFinal) {
            return 300_000L;
        }
        return 60_000L;
    }

    public String emptyPlayByPlayJson(String gameId) {
        return "{\"game_id\":\"" + gameId + "\",\"plays\":[]}";
    }

    private Sinks.Many<String> playByPlaySink(String gameId) {
        return playByPlaySinks.computeIfAbsent(
                gameId,
                id -> Sinks.many()
                        .replay()
                        .latestOrDefault(lastPlayByPlayJsonByGame.getOrDefault(id, emptyPlayByPlayJson(id))));
    }
}
