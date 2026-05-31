import { TeamPlayerStat } from '../../types/teamstats';

export interface TeamDetails {
  team_id: number;
  team_name: string;
  team_city: string;
  abbreviation: string;
  year_founded: number;
  arena: string;
  arena_capacity?: number;
  owner: string;
  general_manager: string;
  head_coach: string;
}

export type TabValue = 'profile' | 'schedule' | 'stats';

export type TeamStatsForBanner = {
  ppg?: { rank: number; value: number };
  rpg?: { rank: number; value: number };
  apg?: { rank: number; value: number };
  oppg?: { rank: number; value: number };
};

export type TeamLeaders = {
  points: TeamPlayerStat;
  rebounds: TeamPlayerStat;
  assists: TeamPlayerStat;
  steals: TeamPlayerStat;
  blocks: TeamPlayerStat;
};
