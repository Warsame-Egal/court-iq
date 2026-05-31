import { useEffect, useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Skeleton,
  Alert,
  IconButton,
  Avatar,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PlayerSummary } from '../types/player';
import { fetchJson, API_BASE_URL } from '../utils/api';
import { getCurrentSeason } from '../utils/season';
import { PlayerGameLogResponse } from '../types/gamelogs';
import { getTeamColorsByName } from '../utils/teams';
import { TH, TD, TR, CARD_SX, PAGE_WRAPPER } from '../utils/styles';

const PlayerProfile = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<PlayerSummary | null>(null);
  const [gameLog, setGameLog] = useState<PlayerGameLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const season = searchParams.get('season') || getCurrentSeason();
  const experience =
    player?.FROM_YEAR && player?.TO_YEAR ? `${player.TO_YEAR - player.FROM_YEAR} Years` : 'N/A';

  useEffect(() => {
    if (!playerId) return;
    const fetchPlayer = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchJson<PlayerSummary>(
          `${API_BASE_URL}/api/v1/player/${playerId}`,
          {},
          { maxRetries: 3, retryDelay: 1000, timeout: 30000 },
        );
        setPlayer(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load player. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlayer();
  }, [playerId]);

  useEffect(() => {
    if (!playerId) return;
    let cancelled = false;
    setGameLog(null);

    const base = `${API_BASE_URL}/api/v1/player/${playerId}`;
    const q = `?season=${encodeURIComponent(season)}`;
    const logOpts = { maxRetries: 3, retryDelay: 1000, timeout: 30000 };

    const fetchAll = async () => {
      const gameLogRes = await Promise.allSettled([
        fetchJson<PlayerGameLogResponse>(`${base}/game-log${q}`, {}, logOpts),
      ]);

      if (cancelled) return;
      if (gameLogRes[0].status === 'fulfilled') setGameLog(gameLogRes[0].value);
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [playerId, season]);

  const last10ForSparkline = useMemo(() => {
    if (!gameLog?.games?.length) return [];
    return gameLog.games.slice(0, 10).map(g => ({ pts: g.points })).reverse();
  }, [gameLog]);

  const seasonShootingFromLog = useMemo(() => {
    if (!gameLog?.games?.length) return null;
    let fgm = 0, fga = 0, tpm = 0, tpa = 0, ftm = 0, fta = 0;
    gameLog.games.forEach(g => {
      fgm += g.field_goals_made ?? 0;
      fga += g.field_goals_attempted ?? 0;
      tpm += g.three_pointers_made ?? 0;
      tpa += g.three_pointers_attempted ?? 0;
      ftm += g.free_throws_made ?? 0;
      fta += g.free_throws_attempted ?? 0;
    });
    return {
      fgPct: fga > 0 ? (fgm / fga) * 100 : null,
      threePct: tpa > 0 ? (tpm / tpa) * 100 : null,
      ftPct: fta > 0 ? (ftm / fta) * 100 : null,
    };
  }, [gameLog]);

  return (
    <Box sx={{ minHeight: '100dvh', backgroundColor: 'background.default', maxWidth: '100vw', overflowX: 'hidden' }}>
      <Box sx={PAGE_WRAPPER}>
        <IconButton onClick={() => navigate(-1)} aria-label="Go back" sx={{ display: { xs: 'inline-flex', md: 'none' }, mb: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        {loading ? (
          <Box sx={{ minHeight: 400, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 2 }} />
            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ minHeight: 100 }}>{error}</Alert>
        ) : !player ? (
          <Box sx={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body1" color="text.secondary" textAlign="center">Player not found.</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ position: 'relative' }}>
              <PlayerBanner
                playerId={player.PERSON_ID}
                firstName={player.PLAYER_FIRST_NAME}
                lastName={player.PLAYER_LAST_NAME}
                teamCity={player.TEAM_CITY}
                teamName={player.TEAM_NAME}
                jerseyNumber={player.JERSEY_NUMBER}
                position={player.POSITION}
                stats={{ ppg: player.PTS, rpg: player.REB, apg: player.AST }}
                height={player.HEIGHT}
                weight={player.WEIGHT}
              />
            </Box>

            {gameLog?.games?.length ? (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                  Last 10 games
                </Typography>
                <Box sx={{ width: '100%', height: 40, maxWidth: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={last10ForSparkline} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                      <Line type="monotone" dataKey="pts" stroke="var(--mui-palette-primary-main)" strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            ) : null}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 300px' }, gap: 3, alignItems: 'start' }}>
              <Box>
                <PlayerGameLogSection gameLog={gameLog} />
              </Box>
              <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', gap: 2, position: 'sticky', top: 16 }}>
                <Paper sx={CARD_SX}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary' }}>Season stats</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>PPG {player.PTS != null ? player.PTS.toFixed(1) : '—'}</Typography>
                      {last10ForSparkline.length > 0 && (
                        <Box sx={{ width: 80, height: 30 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={last10ForSparkline} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                              <Line type="monotone" dataKey="pts" stroke="var(--mui-palette-primary-main)" strokeWidth={1.5} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>
                      )}
                    </Box>
                    <Typography variant="body2">RPG {player.REB != null ? player.REB.toFixed(1) : '—'}</Typography>
                    <Typography variant="body2">APG {player.AST != null ? player.AST.toFixed(1) : '—'}</Typography>
                    <Typography variant="body2">FG% {seasonShootingFromLog?.fgPct != null ? `${seasonShootingFromLog.fgPct.toFixed(1)}%` : '—'}</Typography>
                    <Typography variant="body2">3P% {seasonShootingFromLog?.threePct != null ? `${seasonShootingFromLog.threePct.toFixed(1)}%` : '—'}</Typography>
                    <Typography variant="body2">FT% {seasonShootingFromLog?.ftPct != null ? `${seasonShootingFromLog.ftPct.toFixed(1)}%` : '—'}</Typography>
                  </Box>
                </Paper>
                <Paper sx={CARD_SX}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary' }}>Bio</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <Typography variant="body2">Height {player.HEIGHT ?? '—'}</Typography>
                    <Typography variant="body2">Weight {player.WEIGHT ? `${player.WEIGHT} lbs` : '—'}</Typography>
                    <Typography variant="body2">School {player.COLLEGE ?? '—'}</Typography>
                    <Typography variant="body2">Draft {player.FROM_YEAR ? `${player.FROM_YEAR} R1 Pick 23` : '—'}</Typography>
                    <Typography variant="body2">Experience {experience}</Typography>
                  </Box>
                </Paper>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

function PlayerBanner({
  playerId, firstName, lastName, teamCity, teamName, jerseyNumber, position, stats, height, weight,
}: {
  playerId: number; firstName: string; lastName: string; teamCity?: string; teamName?: string;
  jerseyNumber?: string; position?: string; stats?: { ppg?: number; rpg?: number; apg?: number };
  height?: string; weight?: number;
}) {
  const colors = teamCity && teamName ? getTeamColorsByName(teamCity, teamName) : { primary: '#1976d2', text: '#FFFFFF' };
  const statItems = [
    stats?.ppg !== undefined && { label: 'PPG', value: stats.ppg.toFixed(1) },
    stats?.rpg !== undefined && { label: 'RPG', value: stats.rpg.toFixed(1) },
    stats?.apg !== undefined && { label: 'APG', value: stats.apg.toFixed(1) },
    height && { label: 'HEIGHT', value: height },
    weight && { label: 'WEIGHT', value: `${weight} lbs` },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <Box sx={{ width: '100%', backgroundColor: colors.primary, color: colors.text, borderRadius: 0, py: 3, px: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 3 }}>
        <Avatar
          src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${playerId}.png`}
          alt={`${firstName} ${lastName}`}
          sx={{ width: { xs: 80, sm: 100 }, height: { xs: 80, sm: 100 }, backgroundColor: 'transparent', border: `2px solid ${colors.text}`, flexShrink: 0 }}
          onError={e => { (e.target as HTMLImageElement).src = '/fallback-player.png'; }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontSize: '0.75rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {teamName ? `${teamCity} ${teamName}` : 'Free Agent'} {jerseyNumber && `• #${jerseyNumber}`} {position && `• ${position}`}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 600, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }, color: colors.text, mb: 1 }}>
            {firstName} {lastName}
          </Typography>
          {statItems.length > 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(5, 1fr)' }, gap: 2, mt: 2 }}>
              {statItems.map(s => (
                <Box key={s.label}>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, opacity: 0.8, fontSize: '0.75rem' }}>{s.label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.value}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function PlayerPerformanceChart({ data }: { data: PlayerGameLogResponse }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const pointsColor = '#1976d2';

  const chartData = useMemo(() => {
    if (!data.games?.length) return [];
    return [...data.games].slice(0, 20).reverse().map((game, index) => ({
      index,
      date: format(parseISO(game.game_date), 'MMM d'),
      Points: game.points,
    }));
  }, [data.games]);

  const avgPoints = useMemo(() => {
    if (!chartData.length) return 0;
    return chartData.reduce((s, g) => s + g.Points, 0) / chartData.length;
  }, [chartData]);

  const maxPoints = useMemo(() => Math.max(...chartData.map(d => d.Points), 0), [chartData]);

  if (!chartData.length) {
    return (
      <Paper sx={CARD_SX}>
        <Typography variant="body2" color="text.secondary" textAlign="center">No game data available</Typography>
      </Paper>
    );
  }

  const tickInterval = (() => {
    if (isMobile) {
      if (chartData.length > 15) return 4;
      if (chartData.length > 10) return 3;
      return 2;
    }
    if (chartData.length > 15) return 2;
    if (chartData.length > 10) return 1;
    return 0;
  })();

  return (
    <Paper sx={{ ...CARD_SX, p: { xs: 2, sm: 3.5 } }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Recent Performance Trend</Typography>
      <ResponsiveContainer width="100%" height={isMobile ? 320 : 420}>
        <AreaChart data={chartData} margin={{ top: 20, right: isMobile ? 30 : 50, left: isMobile ? 20 : 30, bottom: isMobile ? 60 : 40 }}>
          <defs>
            <linearGradient id="pointsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={pointsColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={pointsColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} strokeOpacity={0.3} vertical={false} />
          <XAxis
            dataKey="index"
            stroke={theme.palette.text.secondary}
            tick={{ fill: theme.palette.text.secondary, fontSize: '0.75rem' }}
            angle={isMobile ? -45 : 0}
            textAnchor={isMobile ? 'end' : 'middle'}
            height={isMobile ? 80 : 50}
            tickFormatter={v => chartData[v as number]?.date || ''}
            interval={tickInterval}
          />
          <YAxis
            stroke={theme.palette.text.secondary}
            tick={{ fill: theme.palette.text.secondary, fontSize: '0.75rem' }}
            domain={[0, Math.ceil(maxPoints * 1.1)]}
            label={{ value: 'Points', angle: -90, position: 'insideLeft', style: { fill: pointsColor, fontWeight: 600, fontSize: '0.75rem' } }}
          />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="Points"
            stroke={pointsColor}
            fill="url(#pointsGradient)"
            strokeWidth={2}
            dot={{ r: isMobile ? 3 : 4, fill: pointsColor }}
            activeDot={{ r: isMobile ? 5 : 6, fill: pointsColor }}
            name={`Points (Avg: ${avgPoints.toFixed(1)})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Paper>
  );
}

function parseOpponent(matchup: string) {
  if (matchup.includes('@')) return matchup.split('@')[1]?.trim() || matchup;
  if (matchup.includes('vs')) return matchup.split(/vs\.?/)[1]?.trim() || matchup;
  return matchup;
}

function PlayerGameLogSection({ gameLog }: { gameLog: PlayerGameLogResponse | null }) {
  if (!gameLog?.games?.length) return null;

  const headers = ['Date', 'Opponent', 'Result', 'MIN', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'TO', 'FG', '3P', 'FT', '+/-'];
  const centerCols = new Set(['Result', 'MIN', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'TO', 'FG', '3P', 'FT', '+/-']);

  return (
    <>
      <Box sx={{ mb: { xs: 4, sm: 5 } }}>
        <PlayerPerformanceChart data={gameLog} />
      </Box>
      <Box sx={{ mb: { xs: 4, sm: 5 } }}>
        <Paper sx={CARD_SX}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Game Log</Typography>
          <TableContainer sx={{ overflowX: 'auto', minWidth: { xs: 700, sm: 'auto' } }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {headers.map(h => (
                    <TableCell key={h} align={centerCols.has(h) ? 'center' : 'left'} sx={TH}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {gameLog.games.slice(0, 20).map(game => {
                  const result = game.win_loss || '-';
                  const fgMade = game.field_goals_made ?? 0;
                  const fgAttempted = game.field_goals_attempted ?? 0;
                  const threeMade = game.three_pointers_made ?? 0;
                  const threeAttempted = game.three_pointers_attempted ?? 0;
                  const ftMade = game.free_throws_made ?? 0;
                  const ftAttempted = game.free_throws_attempted ?? 0;
                  const plusMinus =
                    game.plus_minus != null ? (game.plus_minus > 0 ? `+${game.plus_minus}` : String(game.plus_minus)) : '-';

                  return (
                    <TableRow key={game.game_id} sx={TR}>
                      <TableCell sx={TD}>{format(new Date(game.game_date), 'MMM d')}</TableCell>
                      <TableCell sx={{ ...TD, fontWeight: 600 }}>{parseOpponent(game.matchup)}</TableCell>
                      <TableCell align="center" sx={{ ...TD, fontWeight: 600, color: result === 'W' ? 'success.main' : result === 'L' ? 'error.main' : 'text.secondary' }}>{result}</TableCell>
                      <TableCell align="center" sx={TD}>{game.minutes || '-'}</TableCell>
                      <TableCell align="center" sx={{ ...TD, fontWeight: 600 }}>{game.points}</TableCell>
                      <TableCell align="center" sx={TD}>{game.rebounds}</TableCell>
                      <TableCell align="center" sx={TD}>{game.assists}</TableCell>
                      <TableCell align="center" sx={TD}>{game.steals}</TableCell>
                      <TableCell align="center" sx={TD}>{game.blocks}</TableCell>
                      <TableCell align="center" sx={TD}>{game.turnovers}</TableCell>
                      <TableCell align="center" sx={TD}>{fgAttempted > 0 ? `${fgMade}/${fgAttempted}` : '-'}</TableCell>
                      <TableCell align="center" sx={TD}>{threeAttempted > 0 ? `${threeMade}/${threeAttempted}` : '-'}</TableCell>
                      <TableCell align="center" sx={TD}>{ftAttempted > 0 ? `${ftMade}/${ftAttempted}` : '-'}</TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          ...TD,
                          color: game.plus_minus && game.plus_minus > 0 ? 'success.main' : game.plus_minus && game.plus_minus < 0 ? 'error.main' : 'text.primary',
                        }}
                      >
                        {plusMinus}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </>
  );
}

export default PlayerProfile;
