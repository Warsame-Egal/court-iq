export interface QuarterScores {
  home: number[];
  away: number[];
}

export interface TeamScore {
  name: string;
  abbreviation?: string | null;
  score: number;
  record?: string | null;
}

export interface ScoreSection {
  home_team: TeamScore;
  away_team: TeamScore;
  period?: number | null;
  clock?: string | null;
  quarter_scores?: QuarterScores | null;
}

export interface PlayByPlayResponse {
  gameId: string;
  plays: PlayByPlayEvent[];
}

export interface PlayByPlayEvent {
  action_number: number;
  clock: string;
  period: number;
  team_id?: number;
  team_tricode?: string;
  action_type: string;
  description: string;
  player_id?: number;
  player_name?: string;
  score_home?: string;
  score_away?: string;
}
