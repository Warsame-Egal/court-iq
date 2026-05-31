export interface PlayerSummary {
  PERSON_ID: number;
  PLAYER_LAST_NAME: string;
  PLAYER_FIRST_NAME: string;
  PLAYER_SLUG?: string;
  TEAM_ID?: number;
  TEAM_SLUG?: string;
  IS_DEFUNCT?: number;
  TEAM_CITY?: string;
  TEAM_NAME?: string;
  TEAM_ABBREVIATION?: string;
  JERSEY_NUMBER?: string;
  POSITION?: string;
  HEIGHT?: string;
  WEIGHT?: number;
  COLLEGE?: string;
  COUNTRY?: string;
  ROSTER_STATUS?: string;
  PTS?: number;
  REB?: number;
  AST?: number;
  STL?: number;
  BLK?: number;
  STATS_TIMEFRAME?: string;
  FROM_YEAR?: number;
  TO_YEAR?: number;
  recent_games: PlayerGamePerformance[];
}

export interface PlayerGamePerformance {
  game_id: string;
  date: string;
  opponent_team_abbreviation: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
}

export type ShootingZone = {
  zone: string;
  fg_pct: number;
  league_avg: number | null;
  diff_pct: number | null;
  freq_pct: number;
};

export type PlayerShootingZonesData = {
  zones: ShootingZone[];
};

export type PlayerClutchData = {
  regular: { ppg: number | null; fg_pct: number | null; gp: number };
  clutch: { ppg: number | null; fg_pct: number | null; gp: number };
  clutch_w_l: string | null;
  clutch_plus_minus: number | null;
  ppg_diff: number | null;
  fg_pct_diff: number | null;
};

export type SplitStatRow = {
  [key: string]: number | string | null | undefined;
};
