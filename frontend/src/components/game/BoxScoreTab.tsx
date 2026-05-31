import {
  Box,
  Typography,
  Paper,
  useMediaQuery,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import type { ScoreSection } from '../../types/gameDetail';
import type { BoxScoreResponse } from '../../types/scoreboard';
import { TH, TD, TR } from '../../utils/styles';
import { formatMinutes } from './gameDetailUtils';

interface BoxScoreTabProps {
  boxScore: BoxScoreResponse;
  score: ScoreSection;
}

export default function BoxScoreTab({ boxScore, score }: BoxScoreTabProps) {
  const isDesktop = useMediaQuery(useTheme().breakpoints.up('md'));

  const home = boxScore.home_team;
  const away = boxScore.away_team;
  const homePlayers = home.players ?? [];
  const awayPlayers = away.players ?? [];
  const maxAwayPts = awayPlayers.length ? Math.max(...awayPlayers.map(p => p.points ?? 0)) : 0;
  const maxHomePts = homePlayers.length ? Math.max(...homePlayers.map(p => p.points ?? 0)) : 0;

  const renderPlayerCard = (
    p: (typeof homePlayers)[0],
    teamLabel: string,
    isLeadingScorer: boolean,
  ) => (
    <Paper
      key={String(p.player_id ?? p.name)}
      variant="outlined"
      sx={{
        p: 1.5,
        backgroundColor: isLeadingScorer ? 'action.hover' : 'background.paper',
        borderRadius: 1,
      }}
    >
      <Typography variant="body2" fontWeight={600}>
        {p.name}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {teamLabel} · {formatMinutes(p.minutes)} MIN · PTS {p.points} REB {p.rebounds} AST {p.assists}
      </Typography>
    </Paper>
  );

  const renderTeamTable = (
    players: typeof homePlayers,
    teamLabel: string,
    maxPts: number,
  ) => (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        {teamLabel}
      </Typography>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" stickyHeader sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...TH, position: 'sticky', left: 0, zIndex: 1 }}>Player</TableCell>
              <TableCell align="center" sx={TH}>MIN</TableCell>
              <TableCell align="center" sx={TH}>PTS</TableCell>
              <TableCell align="center" sx={TH}>REB</TableCell>
              <TableCell align="center" sx={TH}>AST</TableCell>
              <TableCell align="center" sx={TH}>STL</TableCell>
              <TableCell align="center" sx={TH}>BLK</TableCell>
              <TableCell align="center" sx={TH}>TO</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {players.map(p => {
              const pts = p.points ?? 0;
              const isLeadingScorer = maxPts > 0 && pts === maxPts;
              return (
                <TableRow
                  key={String(p.player_id ?? p.name)}
                  sx={isLeadingScorer ? { ...TR, backgroundColor: 'action.hover' } : TR}
                >
                  <TableCell sx={{ ...TD, fontWeight: 600, position: 'sticky', left: 0, zIndex: 1 }}>
                    {p.name}
                  </TableCell>
                  <TableCell align="center" sx={TD}>{formatMinutes(p.minutes)}</TableCell>
                  <TableCell align="center" sx={{ ...TD, fontWeight: 700 }}>
                    {pts}
                  </TableCell>
                  <TableCell align="center" sx={TD}>{p.rebounds}</TableCell>
                  <TableCell align="center" sx={TD}>{p.assists}</TableCell>
                  <TableCell align="center" sx={TD}>{p.steals}</TableCell>
                  <TableCell align="center" sx={TD}>{p.blocks}</TableCell>
                  <TableCell align="center" sx={TD}>{p.turnovers}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  if (!isDesktop) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          {away.team_name ?? score.away_team.name}
        </Typography>
        {awayPlayers.map(p =>
          renderPlayerCard(p, away.team_name, maxAwayPts > 0 && (p.points ?? 0) === maxAwayPts),
        )}
        <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 2 }}>
          {home.team_name ?? score.home_team.name}
        </Typography>
        {homePlayers.map(p =>
          renderPlayerCard(p, home.team_name, maxHomePts > 0 && (p.points ?? 0) === maxHomePts),
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {renderTeamTable(awayPlayers, away.team_name ?? score.away_team.name, maxAwayPts)}
      <Box sx={{ mt: 2 }}>{renderTeamTable(homePlayers, home.team_name ?? score.home_team.name, maxHomePts)}</Box>
    </Box>
  );
}
