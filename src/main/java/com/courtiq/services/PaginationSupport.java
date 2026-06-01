package com.courtiq.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
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

    static MultiValueMap<String, String> forwardQuery(MultiValueMap<String, String> extra) {
        LinkedMultiValueMap<String, String> query = new LinkedMultiValueMap<>();
        if (extra == null) {
            return query;
        }
        extra.forEach((name, values) -> {
            if (!"page".equals(name) && !"pageSize".equals(name) && !"limit".equals(name)) {
                query.addAll(name, values);
            }
        });
        return query;
    }

    static Mono<String> paginate(Mono<String> upstreamArray, int page, int pageSize) {
        return upstreamArray.map(json -> paginate(json, page, pageSize));
    }

    static String paginate(String json, int page, int pageSize) {
        try {
            JsonNode arr = MAPPER.readTree(json);
            if (!arr.isArray()) {
                return json;
            }
            int total = arr.size();
            int from = Math.min((page - 1) * pageSize, total);
            int to = Math.min(from + pageSize, total);
            ArrayNode slice = MAPPER.createArrayNode();
            for (int i = from; i < to; i++) {
                slice.add(arr.get(i));
            }
            ObjectNode out = MAPPER.createObjectNode();
            out.set("data", slice);
            out.put("page", page);
            out.put("pageSize", pageSize);
            out.put("total", total);
            return MAPPER.writeValueAsString(out);
        } catch (Exception e) {
            return json;
        }
    }
}
