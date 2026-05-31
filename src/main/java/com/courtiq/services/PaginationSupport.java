package com.courtiq.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

final class PaginationSupport {

    static final int DEFAULT_PAGE = 1;
    static final int DEFAULT_PAGE_SIZE = 20;
    static final int MAX_PAGE_SIZE = 100;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private PaginationSupport() {}

    static MultiValueMap<String, String> queryParams(int page, int pageSize, MultiValueMap<String, String> extra) {
        LinkedMultiValueMap<String, String> query = new LinkedMultiValueMap<>();
        if (extra != null) {
            query.addAll(extra);
        }
        query.set("page", String.valueOf(page));
        query.set("limit", String.valueOf(pageSize));
        return query;
    }

    static Mono<String> normalizeEnvelope(Mono<String> upstream) {
        return upstream.map(PaginationSupport::normalizeEnvelope);
    }

    static String normalizeEnvelope(String json) {
        try {
            JsonNode root = MAPPER.readTree(json);
            if (!root.isObject() || !root.has("data") || !root.has("limit")) {
                return json;
            }
            ObjectNode out = (ObjectNode) root.deepCopy();
            out.put("pageSize", root.get("limit").asInt());
            out.remove("limit");
            out.remove("has_more");
            return MAPPER.writeValueAsString(out);
        } catch (Exception e) {
            return json;
        }
    }
}
