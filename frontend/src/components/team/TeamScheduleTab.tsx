import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { TeamGameLogResponse } from '../../types/gamelogs';
import { StandingRecord } from '../../types/standings';
import { getTeamAbbreviation } from '../../utils/teams';
import { TH, TD, CARD_SX } from '../../utils/styles';
import { logoFallback } from './imageFallbacks';
import { SeasonSelect } from './shared';
import { TeamDetails } from './types';
import { TeamPerformanceChart } from './TeamPerformanceChart';

const getOpponentAbbreviation = (opponent: string) => getTeamAbbreviation(opponent) || 'default';

export function TeamScheduleTab({
  gameLog,
  season,
  seasonOptions,
  onSeasonChange,
  team,
  standings,
}: {
  gameLog: TeamGameLogResponse | null;
  season: string;
  seasonOptions: string[];
  onSeasonChange: (s: string) => void;
  team: TeamDetails;
  standings: StandingRecord[];
}) {
  const navigate = useNavigate();

  if (!gameLog?.games.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="body1" color="text.secondary">
          No schedule data available for this season.
        </Typography>
      </Box>
    );
  }

  const getOpponentTeamId = (opponentName: string) => {
    const opponent = standings.find(
      s => `${s.team_city} ${s.team_name}` === opponentName || s.team_name === opponentName,
    );
    return opponent?.team_id ?? null;
  };

  let wins = 0;
  let losses = 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          {team.team_city} {team.team_name} Schedule {season}
        </Typography>
        <SeasonSelect season={season} seasonOptions={seasonOptions} onSeasonChange={onSeasonChange} />
      </Box>
      <Box sx={{ mb: 4 }}>
        <TeamPerformanceChart data={gameLog} />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
          Last 5
        </Typography>
        {gameLog.games.slice(-5).map((g, idx) => (
          <Box
            key={g.game_id || idx}
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: g.win_loss === 'W' ? 'success.main' : g.win_loss === 'L' ? 'error.main' : 'divider',
            }}
            title={g.win_loss === 'W' ? 'Win' : g.win_loss === 'L' ? 'Loss' : '—'}
          />
        ))}
      </Box>
      <Paper elevation={0} sx={CARD_SX}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={TH}>Date</TableCell>
                <TableCell sx={TH}>Opponent</TableCell>
                <TableCell align="center" sx={TH}>Result</TableCell>
                <TableCell align="center" sx={TH}>Record</TableCell>
                <TableCell align="center" sx={TH}>PTS</TableCell>
                <TableCell align="center" sx={TH}>REB</TableCell>
                <TableCell align="center" sx={TH}>AST</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...gameLog.games].reverse().map(game => {
                const isHome = !game.matchup.includes('@');
                const opponent = isHome
                  ? game.matchup.split(/vs\.?/)[1]?.trim() || game.matchup
                  : game.matchup.split('@')[1]?.trim() || game.matchup;
                let gameDate = 'TBD';
                if (game.game_date?.trim()) {
                  try {
                    const date = new Date(game.game_date + 'T00:00:00');
                    if (!isNaN(date.getTime())) gameDate = format(date, 'EEE, MMM d');
                  } catch {
                    gameDate = game.game_date || 'TBD';
                  }
                }
                const result = game.win_loss || '—';
                if (result === 'W') wins++;
                if (result === 'L') losses++;
                const record = result !== '—' ? `${wins}-${losses}` : '—';
                const resultDisplay = result && result !== '—' && game.points > 0 ? `${result} ${game.points}` : result;
                const oppId = getOpponentTeamId(opponent);
                return (
                  <TableRow key={game.game_id}>
                    <TableCell sx={TD}>{gameDate}</TableCell>
                    <TableCell sx={TD}>
                      <Box
                        onClick={() => oppId && navigate(`/team/${oppId}?tab=schedule`)}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: oppId ? 'pointer' : 'default', '&:hover': { opacity: oppId ? 0.7 : 1 } }}
                      >
                        <Typography component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', mr: 0.5 }}>
                          {isHome ? 'vs' : '@'}
                        </Typography>
                        <Avatar src={`/logos/${getOpponentAbbreviation(opponent)}.svg`} alt={opponent} sx={{ width: 24, height: 24 }} onError={logoFallback} />
                        <Typography variant="body2">{opponent}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        ...TD,
                        fontWeight: 600,
                        color:
                          result === 'W' || result[0] === 'W'
                            ? 'success.main'
                            : result === 'L' || result[0] === 'L'
                              ? 'error.main'
                              : 'text.secondary',
                      }}
                    >
                      {resultDisplay}
                    </TableCell>
                    <TableCell align="center" sx={{ ...TD, color: 'text.secondary' }}>
                      {record}
                    </TableCell>
                    <TableCell align="center" sx={TD}>{game.points || '—'}</TableCell>
                    <TableCell align="center" sx={TD}>{game.rebounds || '—'}</TableCell>
                    <TableCell align="center" sx={TD}>{game.assists || '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
