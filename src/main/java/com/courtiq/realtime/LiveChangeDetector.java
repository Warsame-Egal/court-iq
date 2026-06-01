package com.courtiq.realtime;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

final class LiveChangeDetector {

    private LiveChangeDetector() {}

    static boolean hasGameDataChanged(
            List<JsonNode> newGames,
            List<JsonNode> oldGames,
            Map<String, Double> lastUpdateByGameId) {
        double now = System.currentTimeMillis() / 1000.0;
        Map<String, JsonNode> newMap = indexByGameId(newGames);
        Map<String, JsonNode> oldMap = indexByGameId(oldGames);

        for (Map.Entry<String, JsonNode> entry : newMap.entrySet()) {
            String gameId = entry.getKey();
            JsonNode newGame = entry.getValue();
            if (!oldMap.containsKey(gameId)) {
                return true;
            }
            JsonNode oldGame = oldMap.get(gameId);
            try {
                int newHome = newGame.path("homeTeam").path("score").asInt(0);
                int newAway = newGame.path("awayTeam").path("score").asInt(0);
                int oldHome = oldGame.path("homeTeam").path("score").asInt(0);
                int oldAway = oldGame.path("awayTeam").path("score").asInt(0);
                if (newGame.path("gameStatus").asInt() != oldGame.path("gameStatus").asInt()
                        || newGame.path("period").asInt() != oldGame.path("period").asInt()
                        || newHome != oldHome
                        || newAway != oldAway) {
                    Double last = lastUpdateByGameId.get(gameId);
                    if (last == null || (now - last) >= 5.0) {
                        lastUpdateByGameId.put(gameId, now);
                        return true;
                    }
                }
            } catch (Exception ignored) {
                return true;
            }
        }
        return false;
    }

    static boolean hasPlayByPlayChanged(
            List<JsonNode> newPlays, List<JsonNode> oldPlays, Map<String, Double> lastUpdate) {
        double now = System.currentTimeMillis() / 1000.0;
        Set<Integer> newActions = actionNumbers(newPlays);
        Set<Integer> oldActions = actionNumbers(oldPlays);
        if (!newActions.equals(oldActions)) {
            Double last = lastUpdate.get("playbyplay");
            if (last == null || (now - last) >= 2.0) {
                lastUpdate.put("playbyplay", now);
                return true;
            }
        }
        return false;
    }

    private static Map<String, JsonNode> indexByGameId(List<JsonNode> games) {
        Map<String, JsonNode> map = new HashMap<>();
        for (JsonNode game : games) {
            if (game.hasNonNull("gameId")) {
                map.put(game.get("gameId").asText(), game);
            }
        }
        return map;
    }

    private static Set<Integer> actionNumbers(List<JsonNode> plays) {
        Set<Integer> numbers = new HashSet<>();
        for (JsonNode play : plays) {
            if (play.has("action_number")) {
                numbers.add(play.get("action_number").asInt());
            }
        }
        return numbers;
    }
}
