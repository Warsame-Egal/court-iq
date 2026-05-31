package com.courtiq.services;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.util.LinkedMultiValueMap;

class PaginationSupportTest {

    @Test
    void normalizeEnvelope_mapsLimitToPageSize() {
        String in = "{\"data\":[],\"page\":1,\"limit\":20,\"total\":30,\"has_more\":true}";
        String out = PaginationSupport.normalizeEnvelope(in);
        assertThat(out).contains("\"pageSize\":20").doesNotContain("\"limit\"").doesNotContain("has_more");
    }

    @Test
    void queryParams_setsPageAndLimit() {
        var extra = new LinkedMultiValueMap<String, String>();
        extra.add("season", "2023-24");
        var q = PaginationSupport.queryParams(2, 10, extra);
        assertThat(q.getFirst("page")).isEqualTo("2");
        assertThat(q.getFirst("limit")).isEqualTo("10");
        assertThat(q.getFirst("season")).isEqualTo("2023-24");
    }
}
