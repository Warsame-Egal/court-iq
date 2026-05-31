export interface LeagueLeader {
  player_id: number;
  name: string;
  team: string;
  stat_value: number;
  rank: number;
  games_played: number;
}

export interface LeagueLeadersResponse {
  category: string;
  season: string;
  leaders: LeagueLeader[];
}

export type StatCategory = 'PTS' | 'REB' | 'AST' | 'STL' | 'BLK';

export interface SeasonLeader {
  player_id: number;
  player_name: string;
  team_abbreviation?: string;
  position?: string;
  value: number;
}

export interface SeasonLeadersCategory {
  category: string;
  leaders: SeasonLeader[];
}

export interface SeasonLeadersResponse {
  season: string;
  categories: SeasonLeadersCategory[];
}
