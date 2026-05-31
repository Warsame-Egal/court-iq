import type { ScoreSection } from '../../types/gameDetail';
import type { BoxScoreResponse } from '../../types/scoreboard';

export const formatMinutes = (value: unknown): string => {
  if (value == null) return '—';
  const raw = String(value).trim();
  if (!raw) return '—';
  if (/^\d{1,2}:\d{2}$/.test(raw)) return raw;
  if (raw.startsWith('PT')) {
    const match = raw.match(/^PT(?:(\d+)M)?(?:(\d+)S)?$/);
    if (match) {
      const mins = parseInt(match[1] || '0', 10);
      const secs = parseInt(match[2] || '0', 10);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  }
  const asNumber = Number(raw);
  if (!Number.isNaN(asNumber) && asNumber >= 0) return asNumber.toFixed(1);
  return raw;
};

export function normalizeStatus(status: string): 'live' | 'completed' | 'upcoming' {
  const s = status.toLowerCase();
  if (s.includes('final')) return 'completed';
  if (
    s.includes('live') ||
    s.includes('in progress') ||
    s.includes('halftime') ||
    /\bq\d\b/.test(s) ||
    s.includes(' ot')
  ) {
    return 'live';
  }
  return 'upcoming';
}

export function scoreFromBoxScore(box: BoxScoreResponse): ScoreSection {
  return {
    home_team: {
      name: box.home_team.team_name,
      score: box.home_team.score,
    },
    away_team: {
      name: box.away_team.team_name,
      score: box.away_team.score,
    },
  };
}
