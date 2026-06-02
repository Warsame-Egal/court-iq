package com.nbascoreboard.services;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.util.LinkedMultiValueMap;

class PaginationSupportTest {

    @Test
    void paginate_slicesArrayIntoEnvelope() {
        String in = "[{\"id\":1},{\"id\":2},{\"id\":3},{\"id\":4},{\"id\":5}]";
        String out = PaginationSupport.paginate(in, 2, 2);
        assertThat(out).contains("\"page\":2").contains("\"pageSize\":2").contains("\"total\":5");
        assertThat(out).contains("\"data\":[{\"id\":3},{\"id\":4}]");
    }

    @Test
    void forwardQuery_stripsPaginationAndKeepsFilters() {
        var extra = new LinkedMultiValueMap<String, String>();
        extra.add("season", "2023-24");
        extra.add("page", "2");
        extra.add("limit", "10");
        var q = PaginationSupport.forwardQuery(extra);
        assertThat(q.getFirst("season")).isEqualTo("2023-24");
        assertThat(q.getFirst("page")).isNull();
        assertThat(q.getFirst("limit")).isNull();
    }
}
