import { format, parseISO } from 'date-fns';
import type { SxProps, Theme } from '@mui/material';
import { Game } from '../types/scoreboard';
import { GameSummary } from '../types/schedule';

export type GameStatus = 'live' | 'upcoming' | 'completed';

/** NBA live/scoreboard feed: 1 = scheduled, 2 = in progress, 3 = final */
export function getLiveGameStatus(game: Game): GameStatus {
  if (game.gameStatus === 3) return 'completed';
  if (game.gameStatus === 1) return 'upcoming';
  if (game.gameStatus === 2) return 'live';
  const text = game.gameStatusText?.toLowerCase() ?? '';
  if (text.includes('final')) return 'completed';
  if (
    text.includes('live') ||
    text.includes('in progress') ||
    text.includes('halftime') ||
    /\bq\d\b/.test(text) ||
    text.includes(' ot')
  ) {
    return 'live';
  }
  return 'upcoming';
}

export function getGameStatus(game: Game | GameSummary): GameStatus {
  if ('homeTeam' in game) {
    return getLiveGameStatus(game);
  }
  if ('game_status' in game && typeof game.game_status === 'string') {
    const lower = game.game_status.toLowerCase();
    if (lower.includes('final')) return 'completed';
    if (lower.includes('live') || lower.includes('in progress')) return 'live';
    return 'upcoming';
  }
  return 'upcoming';
}

export const TEAM_LOGOS: Record<string, string> = {
  ATL: '/logos/ATL.svg',
  BOS: '/logos/BOS.svg',
  BKN: '/logos/BKN.svg',
  CHA: '/logos/CHA.svg',
  CHI: '/logos/CHI.svg',
  CLE: '/logos/CLE.svg',
  DAL: '/logos/DAL.svg',
  DEN: '/logos/DEN.svg',
  DET: '/logos/DET.svg',
  GSW: '/logos/GSW.svg',
  HOU: '/logos/HOU.svg',
  IND: '/logos/IND.svg',
  LAC: '/logos/LAC.svg',
  LAL: '/logos/LAL.svg',
  MEM: '/logos/MEM.svg',
  MIA: '/logos/MIA.svg',
  MIL: '/logos/MIL.svg',
  MIN: '/logos/MIN.svg',
  NOP: '/logos/NOP.svg',
  NYK: '/logos/NYK.svg',
  OKC: '/logos/OKC.svg',
  ORL: '/logos/ORL.svg',
  PHI: '/logos/PHI.svg',
  PHX: '/logos/PHX.svg',
  POR: '/logos/POR.svg',
  SAC: '/logos/SAC.svg',
  SAS: '/logos/SAS.svg',
  TOR: '/logos/TOR.svg',
  UTA: '/logos/UTA.svg',
  WAS: '/logos/WAS.svg',
  NBA: '/logos/NBA.svg',
};

export function getGameTime(game: Game | GameSummary): string {
  const isLive = 'homeTeam' in game;
  if (isLive) {
    const g = game as Game;
    if (g.gameEt) {
      try {
        const parsed = parseISO(g.gameEt);
        if (!isNaN(parsed.getTime())) return format(parsed, 'h:mm a');
      } catch {
        //
      }
    }
    if (g.gameTimeUTC) {
      try {
        const parsed = parseISO(g.gameTimeUTC);
        if (!isNaN(parsed.getTime())) return format(parsed, 'h:mm a');
      } catch {
        //
      }
    }
    return 'TBD';
  }
  const g = game as GameSummary;
  if (g.game_time_utc && g.game_time_utc.trim() !== '') {
    try {
      let parsed = parseISO(g.game_time_utc);
      if (isNaN(parsed.getTime())) parsed = new Date(g.game_time_utc);
      if (!isNaN(parsed.getTime())) return format(parsed, 'h:mm a');
    } catch {
      //
    }
  }
  if ('gameTimeUTC' in g && g.gameTimeUTC && typeof g.gameTimeUTC === 'string') {
    try {
      const parsed = parseISO(g.gameTimeUTC);
      if (!isNaN(parsed.getTime())) return format(parsed, 'h:mm a');
    } catch {
      //
    }
  }
  if (g.game_date) {
    try {
      const parsed = parseISO(g.game_date);
      if (!isNaN(parsed.getTime()) && (parsed.getHours() !== 0 || parsed.getMinutes() !== 0)) {
        return format(parsed, 'h:mm a');
      }
    } catch {
      //
    }
  }
  return 'TBD';
}

export function getStatusLabel(game: Game | GameSummary): string {
  const isLive = 'homeTeam' in game;
  const status = isLive ? (game as Game).gameStatusText : (game as GameSummary).game_status || '';
  const lower = status.toLowerCase();
  if (lower.includes('final')) return 'FINAL';
  const g = game as Game;
  if (isLive && g.period != null && g.gameClock) return `${g.period}Q ${g.gameClock}`;
  if (lower.includes('live') || (status.match(/\b[1-4]q\b/i) && !lower.includes('final')))
    return 'LIVE';
  return getGameTime(game);
}

export const LIVE_PULSE: SxProps<Theme> = {
  '@keyframes pulse': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },
  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
};

export const LIVE_DOT_STYLE: SxProps<Theme> = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: 'error.main',
  flexShrink: 0,
  ...LIVE_PULSE,
};

export function formatGamesBack(gb: string) {
  if (!gb || gb === '0.0' || gb === '0') return '—';
  return gb;
}

export function formatPercentage(pct: number) {
  return (pct * 100).toFixed(1);
}

export function formatDiff(diff: number | null | undefined) {
  if (diff === null || diff === undefined) return '—';
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${diff.toFixed(1)}`;
}
