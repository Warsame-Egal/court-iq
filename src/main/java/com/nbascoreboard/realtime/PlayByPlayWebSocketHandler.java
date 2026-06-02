package com.nbascoreboard.realtime;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Mono;

@Component
public class PlayByPlayWebSocketHandler implements WebSocketHandler {

    private static final Pattern GAME_ID =
            Pattern.compile("/api/v1/ws/([^/]+)/play-by-play/?$");

    private final LiveDataHub hub;
    private final LiveDataPoller poller;

    public PlayByPlayWebSocketHandler(LiveDataHub hub, LiveDataPoller poller) {
        this.hub = hub;
        this.poller = poller;
    }

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        String gameId = extractGameId(session);
        if (gameId == null) {
            return session.close();
        }
        if (hub.onPlayByPlaySubscribed(gameId)) {
            poller.requestPlayByPlayRefresh(gameId);
        }
        return session.send(hub.playByPlayFlux(gameId).map(session::textMessage))
                .doFinally(signal -> hub.onPlayByPlayUnsubscribed(gameId));
    }

    private static String extractGameId(WebSocketSession session) {
        String path = session.getHandshakeInfo().getUri().getPath();
        Matcher matcher = GAME_ID.matcher(path);
        return matcher.find() ? matcher.group(1) : null;
    }
}
