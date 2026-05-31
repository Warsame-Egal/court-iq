export interface TeamPlayerStat {
  player_id: number;
  player_name: string;
  position?: string | null;
  jersey_number?: string | null;
  games_played: number;
  games_started: number;
  minutes: number;
  points: number;
  offensive_rebounds: number;
  defensive_rebounds: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  personal_fouls: number;
  assist_to_turnover?: number | null;
}

export interface TeamPlayerStatsResponse {
  team_id: number;
  season: string;
  players: TeamPlayerStat[];
}

export interface TeamStatSummary {
  team_id: number;
  team_name: string;
  team_abbreviation?: string;
  value: number;
}

export interface TeamStatCategory {
  category_name: string;
  teams: TeamStatSummary[];
}

export interface TeamStatsResponse {
  season: string;
  categories: TeamStatCategory[];
}
