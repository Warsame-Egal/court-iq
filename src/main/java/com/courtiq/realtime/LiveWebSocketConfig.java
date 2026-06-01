package com.courtiq.realtime;

import java.util.HashMap;
import java.util.Map;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.HandlerMapping;
import org.springframework.web.reactive.handler.SimpleUrlHandlerMapping;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.server.support.WebSocketHandlerAdapter;

@Configuration
public class LiveWebSocketConfig {

    @Bean
    public HandlerMapping webSocketHandlerMapping(
            ScoreboardWebSocketHandler scoreboardHandler, PlayByPlayWebSocketHandler playByPlayHandler) {
        Map<String, WebSocketHandler> map = new HashMap<>();
        map.put("/api/v1/ws", scoreboardHandler);
        map.put("/api/v1/ws/*/play-by-play", playByPlayHandler);
        SimpleUrlHandlerMapping mapping = new SimpleUrlHandlerMapping();
        mapping.setUrlMap(map);
        mapping.setOrder(-1);
        return mapping;
    }

    @Bean
    public WebSocketHandlerAdapter handlerAdapter() {
        return new WebSocketHandlerAdapter();
    }
}
