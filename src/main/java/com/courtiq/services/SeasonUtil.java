package com.courtiq.services;

import java.time.LocalDate;
import java.util.regex.Pattern;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

public final class SeasonUtil {

    private static final Pattern SEASON = Pattern.compile("\\d{4}-\\d{2}");

    private SeasonUtil() {}

    public static String currentSeason() {
        LocalDate now = LocalDate.now();
        int y = now.getYear();
        return now.getMonthValue() >= 10
                ? y + "-" + String.format("%02d", (y + 1) % 100)
                : (y - 1) + "-" + String.format("%02d", y % 100);
    }

    public static boolean isValid(String s) {
        return s != null && SEASON.matcher(s).matches();
    }

    public static String resolveSeason(String season) {
        if (season == null || season.isBlank()) {
            return currentSeason();
        }
        return season;
    }

    public static MultiValueMap<String, String> queryWithSeason(String season) {
        LinkedMultiValueMap<String, String> query = new LinkedMultiValueMap<>();
        query.add("season", resolveSeason(season));
        return query;
    }
}
