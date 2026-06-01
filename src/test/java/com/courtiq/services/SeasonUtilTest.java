package com.courtiq.services;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class SeasonUtilTest {

    @Test
    void currentSeason_matchesYyyyYyPattern() {
        assertThat(SeasonUtil.isValid(SeasonUtil.currentSeason())).isTrue();
    }

    @Test
    void resolveSeason_defaultsWhenBlank() {
        assertThat(SeasonUtil.resolveSeason(null)).isEqualTo(SeasonUtil.currentSeason());
        assertThat(SeasonUtil.resolveSeason("  ")).isEqualTo(SeasonUtil.currentSeason());
    }

    @Test
    void resolveSeason_keepsExplicitValue() {
        assertThat(SeasonUtil.resolveSeason("2023-24")).isEqualTo("2023-24");
    }
}
