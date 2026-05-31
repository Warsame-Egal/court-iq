import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Skeleton,
  Alert,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { fetchJson, API_BASE_URL } from '../utils/api';
import { getCurrentSeason, getSeasonOptions } from '../utils/season';
import { CARD_SX, PAGE_WRAPPER } from '../utils/styles';
import { TeamRoster } from '../types/team';
import { TeamGameLogResponse } from '../types/gamelogs';
import { StandingRecord } from '../types/standings';
import { TeamStatsResponse, TeamPlayerStatsResponse } from '../types/teamstats';
import { TeamBanner } from '../components/team/TeamBanner';
import { TeamProfileTab } from '../components/team/TeamProfileTab';
import { TeamScheduleTab } from '../components/team/TeamScheduleTab';
import { TeamStatsTab } from '../components/team/TeamStatsTab';
import { TabValue, TeamDetails, TeamLeaders, TeamStatsForBanner } from '../components/team/types';

const TeamPage = () => {
  const { team_id } = useParams<{ team_id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [roster, setRoster] = useState<TeamRoster | null>(null);
  const [gameLog, setGameLog] = useState<TeamGameLogResponse | null>(null);
  const [standings, setStandings] = useState<StandingRecord[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStatsResponse | null>(null);
  const [playerStats, setPlayerStats] = useState<TeamPlayerStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const season = searchParams.get('season') || getCurrentSeason();
  const activeTab = (searchParams.get('tab') || 'profile') as TabValue;
  const seasonOptions = getSeasonOptions(5);

  const handleSeasonChange = (newSeason: string) => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('season', newSeason);
      return p;
    });
  };

  const handleTabChange = (_: unknown, newValue: TabValue) => {
    setSearchParams({ ...Object.fromEntries(searchParams), tab: newValue });
  };

  const teamStanding = useMemo(() => {
    if (!team || !standings.length) return null;
    return standings.find(s => s.team_id === team.team_id);
  }, [team, standings]);

  const teamLeaders = useMemo((): TeamLeaders | null => {
    if (!playerStats?.players.length) return null;
    const players = playerStats.players.filter(p => p.games_played > 0);
    if (!players.length) return null;
    return {
      points: players.reduce((max, p) => (p.points > max.points ? p : max), players[0]),
      rebounds: players.reduce((max, p) => (p.rebounds > max.rebounds ? p : max), players[0]),
      assists: players.reduce((max, p) => (p.assists > max.assists ? p : max), players[0]),
      steals: players.reduce((max, p) => (p.steals > max.steals ? p : max), players[0]),
      blocks: players.reduce((max, p) => (p.blocks > max.blocks ? p : max), players[0]),
    };
  }, [playerStats]);

  const teamStatsForBanner = useMemo((): TeamStatsForBanner | undefined => {
    if (!teamStats || !team) return undefined;
    const getRankAndValue = (categoryName: string) => {
      const category = teamStats.categories.find(cat => cat.category_name === categoryName);
      if (!category) return undefined;
      const sorted = [...category.teams].sort((a, b) => b.value - a.value);
      const teamIndex = sorted.findIndex(t => t.team_id === team.team_id);
      if (teamIndex === -1) return undefined;
      return { rank: teamIndex + 1, value: sorted[teamIndex].value };
    };
    return {
      ppg: getRankAndValue('Points Per Game'),
      rpg: getRankAndValue('Rebounds Per Game'),
      apg: getRankAndValue('Assists Per Game'),
      oppg: getRankAndValue('Opponent Points Per Game'),
    };
  }, [teamStats, team]);

  useEffect(() => {
    if (!team_id) return;
    const fetchTeamData = async () => {
      setLoading(true);
      setError(null);
      const opts = { maxRetries: 3, retryDelay: 1000, timeout: 30000 };
      const [teamRes, standingsRes, statsRes, rosterRes, gameLogRes, playerStatsRes] =
        await Promise.allSettled([
        fetchJson<TeamDetails>(`${API_BASE_URL}/api/v1/teams/${team_id}`, {}, opts),
        fetchJson<{ data: StandingRecord[] }>(
          `${API_BASE_URL}/api/v1/standings/season/${season}?page=1&pageSize=100`,
          {},
          opts,
        ),
        fetchJson<TeamStatsResponse>(
          `${API_BASE_URL}/api/v1/teams/stats?season=${encodeURIComponent(season)}`,
          {},
          opts,
        ),
        fetchJson<TeamRoster>(
          `${API_BASE_URL}/api/v1/scoreboard/team/${team_id}/roster/${season}`,
          {},
          { maxRetries: 2, retryDelay: 1000, timeout: 30000 },
        ),
        fetchJson<TeamGameLogResponse>(
          `${API_BASE_URL}/api/v1/teams/${team_id}/game-log?season=${encodeURIComponent(season)}`,
          {},
          opts,
        ),
        fetchJson<TeamPlayerStatsResponse>(
          `${API_BASE_URL}/api/v1/teams/${team_id}/player-stats?season=${encodeURIComponent(season)}`,
          {},
          { maxRetries: 2, retryDelay: 1000, timeout: 30000 },
        ),
      ]);

      if (teamRes.status === 'fulfilled') setTeam(teamRes.value);
      else setError('Failed to load team information. Please try again.');
      if (standingsRes.status === 'fulfilled') setStandings(standingsRes.value.data ?? []);
      if (statsRes.status === 'fulfilled') setTeamStats(statsRes.value);
      if (rosterRes.status === 'fulfilled') setRoster(rosterRes.value);
      if (gameLogRes.status === 'fulfilled') {
        const d = gameLogRes.value;
        setGameLog(d?.games ? d : null);
      } else setGameLog(null);
      if (playerStatsRes.status === 'fulfilled') setPlayerStats(playerStatsRes.value);
      else setPlayerStats(null);
      setLoading(false);
    };
    fetchTeamData();
  }, [team_id, season]);

  return (
    <Box sx={{ minHeight: '100dvh', backgroundColor: 'background.default', maxWidth: '100vw', overflowX: 'hidden' }}>
      <Box sx={PAGE_WRAPPER}>
        <IconButton onClick={() => navigate(-1)} aria-label="Go back" sx={{ display: { xs: 'inline-flex', md: 'none' }, mb: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        {loading ? (
          <Box sx={{ minHeight: 400, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : !team ? (
          <Box sx={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Team not found.
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ position: 'relative' }}>
              <TeamBanner
                teamId={team.team_id}
                teamCity={team.team_city}
                teamName={team.team_name}
                abbreviation={team.abbreviation}
                record={teamStanding ? `${teamStanding.wins} - ${teamStanding.losses}` : undefined}
                conferenceRank={teamStanding?.playoff_rank}
                conference={teamStanding?.conference}
                teamStats={teamStatsForBanner}
              />
            </Box>
            <Paper elevation={0} sx={{ ...CARD_SX, p: 0 }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
                }}
              >
                <Tab label="Profile" value="profile" />
                <Tab label="Schedule" value="schedule" />
                <Tab label="Stats" value="stats" />
              </Tabs>
            </Paper>
            {activeTab === 'profile' && (
              <TeamProfileTab
                team={team}
                roster={roster}
                gameLog={gameLog}
                season={season}
                seasonOptions={seasonOptions}
                onSeasonChange={handleSeasonChange}
                teamStanding={teamStanding}
                teamStatsForBanner={teamStatsForBanner}
              />
            )}
            {activeTab === 'schedule' && (
              <TeamScheduleTab
                gameLog={gameLog}
                season={season}
                seasonOptions={seasonOptions}
                onSeasonChange={handleSeasonChange}
                team={team}
                standings={standings}
              />
            )}
            {activeTab === 'stats' && (
              <TeamStatsTab
                playerStats={playerStats}
                teamLeaders={teamLeaders}
                season={season}
                seasonOptions={seasonOptions}
                onSeasonChange={handleSeasonChange}
              />
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default TeamPage;
