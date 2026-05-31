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
import { TeamRoster } from '../../types/team';
import { TeamGameLogResponse } from '../../types/gamelogs';
import { StandingRecord } from '../../types/standings';
import { TH, TD, TR, CARD_SX } from '../../utils/styles';
import { imgFallback } from './imageFallbacks';
import { InfoItem, SeasonSelect, StatMiniCard, StreakDots } from './shared';
import { TeamDetails, TeamStatsForBanner } from './types';

export function TeamProfileTab({
  team,
  roster,
  gameLog,
  season,
  seasonOptions,
  onSeasonChange,
  teamStanding,
  teamStatsForBanner,
}: {
  team: TeamDetails;
  roster: TeamRoster | null;
  gameLog: TeamGameLogResponse | null;
  season: string;
  seasonOptions: string[];
  onSeasonChange: (s: string) => void;
  teamStanding: StandingRecord | null | undefined;
  teamStatsForBanner: TeamStatsForBanner | undefined;
}) {
  const navigate = useNavigate();

  const netRating =
    teamStanding?.diff != null
      ? `${teamStanding.diff > 0 ? '+' : ''}${teamStanding.diff.toFixed(1)}`
      : teamStanding?.ppg != null && teamStanding?.opp_ppg != null
        ? `${teamStanding.ppg - teamStanding.opp_ppg > 0 ? '+' : ''}${(teamStanding.ppg - teamStanding.opp_ppg).toFixed(1)}`
        : '—';

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <SeasonSelect season={season} seasonOptions={seasonOptions} onSeasonChange={onSeasonChange} />
      </Box>
      {gameLog?.games?.length ? <StreakDots games={gameLog.games} count={10} label="Last 10:" /> : null}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <StatMiniCard label="Record" value={teamStanding != null ? `${teamStanding.wins}-${teamStanding.losses}` : '—'} />
        <StatMiniCard
          label="PPG"
          value={
            teamStanding?.ppg != null
              ? teamStanding.ppg.toFixed(1)
              : teamStatsForBanner?.ppg?.value != null
                ? teamStatsForBanner.ppg.value.toFixed(1)
                : '—'
          }
        />
        <StatMiniCard
          label="Opp PPG"
          value={
            teamStanding?.opp_ppg != null
              ? teamStanding.opp_ppg.toFixed(1)
              : teamStatsForBanner?.oppg?.value != null
                ? teamStatsForBanner.oppg.value.toFixed(1)
                : '—'
          }
        />
        <StatMiniCard label="Net Rating" value={netRating} />
      </Box>
      <Paper elevation={0} sx={CARD_SX}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          <InfoItem label="Founded" value={team.year_founded?.toString() ?? 'N/A'} />
          <InfoItem label="Arena" value={team.arena ?? 'N/A'} />
          {team.arena_capacity && <InfoItem label="Capacity" value={team.arena_capacity.toLocaleString()} />}
          <InfoItem label="Owner" value={team.owner ?? 'N/A'} />
          <InfoItem label="GM" value={team.general_manager ?? 'N/A'} />
          <InfoItem label="Coach" value={team.head_coach ?? 'N/A'} />
        </Box>
      </Paper>
      {roster?.players?.length ? (
        <Paper elevation={0} sx={CARD_SX}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Roster
          </Typography>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={TH}>Player</TableCell>
                  <TableCell align="center" sx={TH}>#</TableCell>
                  <TableCell align="center" sx={TH}>Pos</TableCell>
                  <TableCell align="center" sx={TH}>Height</TableCell>
                  <TableCell align="center" sx={TH}>Weight</TableCell>
                  <TableCell align="center" sx={TH}>Birthdate</TableCell>
                  <TableCell align="center" sx={TH}>Age</TableCell>
                  <TableCell align="center" sx={TH}>Exp</TableCell>
                  <TableCell sx={TH}>School</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roster.players.map(player => (
                  <TableRow key={player.player_id} onClick={() => navigate(`/player/${player.player_id}`)} sx={TR}>
                    <TableCell sx={TD}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${player.player_id}.png`}
                          alt={player.name}
                          sx={{ width: 40, height: 40, border: '1px solid', borderColor: 'divider' }}
                          onError={imgFallback}
                        />
                        <Typography sx={{ fontWeight: 500 }}>{player.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={TD}>{player.jersey_number || '—'}</TableCell>
                    <TableCell align="center" sx={TD}>{player.position || '—'}</TableCell>
                    <TableCell align="center" sx={TD}>{player.height || '—'}</TableCell>
                    <TableCell align="center" sx={TD}>{player.weight ? `${player.weight} LBS` : '—'}</TableCell>
                    <TableCell align="center" sx={TD}>
                      {player.birth_date ? format(new Date(player.birth_date), 'MMM d, yyyy') : '—'}
                    </TableCell>
                    <TableCell align="center" sx={TD}>{player.age ? `${player.age} years` : '—'}</TableCell>
                    <TableCell align="center" sx={TD}>{player.experience || '—'}</TableCell>
                    <TableCell sx={TD}>{player.school || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : null}
    </Box>
  );
}
