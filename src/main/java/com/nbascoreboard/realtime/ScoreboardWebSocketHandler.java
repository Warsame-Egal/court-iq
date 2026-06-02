package com.nbascoreboard.realtime;

import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Mono;

@Component
public class ScoreboardWebSocketHandler implements WebSocketHandler {

    private final LiveDataHub hub;
    private final LiveDataPoller poller;

    public ScoreboardWebSocketHandler(LiveDataHub hub, LiveDataPoller poller) {
        this.hub = hub;
        this.poller = poller;
    }

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        if (hub.onScoreboardSubscribed()) {
            poller.requestScoreboardRefresh();
        }
        return session.send(hub.scoreboardFlux().map(session::textMessage))
                .doFinally(signal -> hub.onScoreboardUnsubscribed());
    }
}
