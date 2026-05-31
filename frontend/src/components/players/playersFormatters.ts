import { PlayerSummary } from '../../types/player';

export const LEADER_CATEGORIES = ['PTS', 'REB', 'AST', 'STL', 'BLK'] as const;
export const LEADER_LABELS: Record<(typeof LEADER_CATEGORIES)[number], string> = {
  PTS: 'Points',
  REB: 'Rebounds',
  AST: 'Assists',
  STL: 'Steals',
  BLK: 'Blocks',
};

export const imgFallback = (e: React.SyntheticEvent<HTMLImageElement>) => {
  (e.target as HTMLImageElement).src = '';
};

export const fmtStat = (v?: number) => (v != null ? v.toFixed(1) : '—');

export const fmtFg = (player: PlayerSummary) => {
  const fg = (player as PlayerSummary & { FG_PCT?: number }).FG_PCT;
  return fg != null ? `${(fg * 100).toFixed(1)}%` : '—';
};

export const formatLeaderValue = (categoryName: string, value: number): string => {
  const lower = categoryName.toLowerCase();
  if (lower.includes('percentage') || lower.includes('pct')) return `${value.toFixed(1)}%`;
  if (lower.includes('made') || lower.includes('total')) return value.toString();
  return value.toFixed(1);
};
