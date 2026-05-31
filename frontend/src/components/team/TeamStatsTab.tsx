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
import { TeamPlayerStatsResponse } from '../../types/teamstats';
import { TH, TD, CARD_SX } from '../../utils/styles';
import { imgFallback } from './imageFallbacks';
import { LeaderCard, SeasonSelect } from './shared';
import { TeamLeaders } from './types';

export function TeamStatsTab({
  playerStats,
  teamLeaders,
  season,
  seasonOptions,
  onSeasonChange,
}: {
  playerStats: TeamPlayerStatsResponse | null;
  teamLeaders: TeamLeaders | null;
  season: string;
  seasonOptions: string[];
  onSeasonChange: (s: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <SeasonSelect season={season} seasonOptions={seasonOptions} onSeasonChange={onSeasonChange} />
      </Box>
      {teamLeaders && (
        <Paper elevation={0} sx={CARD_SX}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Team Leaders
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 2 }}>
            <LeaderCard category="Points" player={teamLeaders.points} value={teamLeaders.points.points} formatValue={v => v.toFixed(1)} />
            <LeaderCard category="Rebounds" player={teamLeaders.rebounds} value={teamLeaders.rebounds.rebounds} formatValue={v => v.toFixed(1)} />
            <LeaderCard category="Assists" player={teamLeaders.assists} value={teamLeaders.assists.assists} formatValue={v => v.toFixed(1)} />
            <LeaderCard category="Steals" player={teamLeaders.steals} value={teamLeaders.steals.steals} formatValue={v => v.toFixed(1)} />
            <LeaderCard category="Blocks" player={teamLeaders.blocks} value={teamLeaders.blocks.blocks} formatValue={v => v.toFixed(1)} />
          </Box>
        </Paper>
      )}
      {playerStats && playerStats.players.length > 0 ? (
        <Paper elevation={0} sx={CARD_SX}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Player Stats
          </Typography>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['Player', 'GP', 'GS', 'MIN', 'PTS', 'OR', 'DR', 'REB', 'AST', 'STL', 'BLK', 'TO', 'PF', 'AST/TO'].map((h, i) => (
                    <TableCell key={h} align={i === 0 ? 'left' : 'center'} sx={TH}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {playerStats.players.map(player => (
                  <TableRow key={player.player_id}>
                    <TableCell sx={TD}>
                      <Box onClick={() => navigate(`/player/${player.player_id}`)} sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', '&:hover': { opacity: 0.7 } }}>
                        <Avatar
                          src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${player.player_id}.png`}
                          sx={{ width: 32, height: 32, border: '1px solid', borderColor: 'divider' }}
                          onError={imgFallback}
                        />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{player.player_name}</Typography>
                          {player.position && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                              {player.position}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ ...TD, color: 'text.secondary' }}>{player.games_played}</TableCell>
                    <TableCell align="center" sx={{ ...TD, color: 'text.secondary' }}>{player.games_started}</TableCell>
                    <TableCell align="center" sx={{ ...TD, color: 'text.secondary' }}>{player.minutes.toFixed(1)}</TableCell>
                    <TableCell align="center" sx={{ ...TD, fontWeight: 600 }}>{player.points.toFixed(1)}</TableCell>
                    <TableCell align="center" sx={{ ...TD, color: 'text.secondary' }}>{player.offensive_rebounds.toFixed(1)}</TableCell>
                    <TableCell align="center" sx={{ ...TD, color: 'text.secondary' }}>{player.defensive_rebounds.toFixed(1)}</TableCell>
                    <TableCell align="center" sx={{ ...TD, color: 'text.secondary' }}>{player.rebounds.toFixed(1)}</TableCell>
                    <TableCell align="center" sx={{ ...TD, color: 'text.secondary' }}>{player.assists.toFixed(1)}</TableCell>
                    <TableCell align="center" sx={{ ...TD, color: 'text.secondary' }}>{player.steals.toFixed(1)}</TableCell>
                    <TableCell align="center" sx={{ ...TD, color: 'text.secondary' }}>{player.blocks.toFixed(1)}</TableCell>
                    <TableCell align="center" sx={{ ...TD, color: 'text.secondary' }}>{player.turnovers.toFixed(1)}</TableCell>
                    <TableCell align="center" sx={{ ...TD, color: 'text.secondary' }}>{player.personal_fouls.toFixed(1)}</TableCell>
                    <TableCell align="center" sx={{ ...TD, color: 'text.secondary' }}>
                      {player.assist_to_turnover != null ? player.assist_to_turnover.toFixed(1) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        !playerStats && (
          <Paper elevation={0} sx={{ ...CARD_SX, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1, fontSize: '0.75rem' }}>
              Player statistics are not available for {season}.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              The season may not have started yet or data may not be available.
            </Typography>
          </Paper>
        )
      )}
    </Box>
  );
}
