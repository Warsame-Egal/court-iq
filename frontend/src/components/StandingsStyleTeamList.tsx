import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Avatar, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, useTheme, useMediaQuery,
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { StandingRecord } from '../types/standings';
import { getTeamInfo } from '../utils/teams';
import { formatGamesBack, formatPercentage, formatDiff } from '../utils/gameUtils';
import { TH, TD, TR, CARD_SX } from '../utils/styles';

interface Props {
  teams: StandingRecord[];
  showRank?: boolean;
  showPlayoffLines?: boolean;
}

const meta = (t: StandingRecord) => {
  const name = `${t.team_city} ${t.team_name}`;
  const info = getTeamInfo(name);
  return { name, logo: info.logo, abbr: info.abbreviation || t.team_city };
};

const rankSx = (t: StandingRecord) => {
  const po = t.playoff_rank <= 8, top = t.playoff_rank <= 3;
  return { height: 28, minWidth: 28, fontWeight: 700, fontSize: '0.75rem',
    bgcolor: top ? 'primary.main' : po ? 'rgba(25,118,210,0.1)' : 'transparent',
    color: top ? 'primary.contrastText' : 'text.primary',
    border: po && !top ? '1px solid' : 'none', borderColor: po && !top ? 'primary.main' : 'transparent' };
};

export default function StandingsStyleTeamList({ teams, showRank = true, showPlayoffLines = false }: Props) {
  const navigate = useNavigate();
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  const hasPPG = teams.length > 0 && teams[0].ppg != null;
  const go = (id: number) => navigate(`/team/${id}`);
  const cols = (showRank ? 1 : 0) + 8 + (hasPPG ? 3 : 0) + (!isMobile ? 2 : 0);

  const TeamCell = ({ t, showRankChip = false }: { t: StandingRecord; showRankChip?: boolean }) => {
    const { name, logo, abbr } = meta(t);
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        {showRankChip && <Chip label={t.playoff_rank} size="small" sx={rankSx(t)} />}
        <Avatar src={logo} alt={name} sx={{ width: 36, height: 36, border: '1px solid', borderColor: 'divider' }} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>{abbr}
            {!showRank && <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>({t.playoff_rank})</Typography>}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>{name}</Typography>
        </Box>
      </Box>
    );
  };

  return (
    <>
      <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
        {teams.map(t => {
          const top = t.playoff_rank <= 3;
          return (
            <Paper key={t.team_id} sx={{ ...CARD_SX, p: 2, cursor: 'pointer', borderLeft: top ? '3px solid' : undefined,
              borderLeftColor: top ? 'primary.main' : undefined, '&:hover': { bgcolor: 'action.hover' } }} onClick={() => go(t.team_id)}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <TeamCell t={t} showRankChip={showRank} />
                <Box sx={{ textAlign: 'right', ml: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{t.wins}-{t.losses}</Typography>
                  <Typography variant="caption" color="text.secondary">{formatPercentage(t.win_pct)}%</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, mt: 1.5 }}>
                {[['GB', formatGamesBack(t.games_back)], ['Home', t.home_record], ['Away', t.road_record]].map(([l, v]) => (
                  <Box key={l}><Typography variant="caption" color="text.secondary">{l}</Typography><Typography variant="body2">{v}</Typography></Box>
                ))}
              </Box>
            </Paper>
          );
        })}
      </Box>
      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
        <TableContainer component={Paper} sx={{ ...CARD_SX, mb: 0, overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                {showRank && <TableCell sx={TH}>Rank</TableCell>}
                <TableCell sx={TH}>Team</TableCell>
                {['Record', 'Win %', 'GB', 'Home', 'Away', 'Div', 'Conf'].map(h => <TableCell key={h} align="center" sx={TH}>{h}</TableCell>)}
                {hasPPG && ['PPG', 'Opp PPG', 'Diff'].map(h => <TableCell key={h} align="center" sx={TH}>{h}</TableCell>)}
                {!isMobile && ['Streak', 'L10'].map(h => <TableCell key={h} align="center" sx={TH}>{h}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {teams.map((t, idx) => {
                const top = t.playoff_rank <= 3, up = t.current_streak_str.startsWith('W');
                return (
                  <Fragment key={t.team_id}>
                    {showPlayoffLines && idx === 6 && (
                      <TableRow><TableCell colSpan={cols} sx={{ py: 0.75, fontWeight: 700, fontSize: '0.7rem', color: 'text.secondary', borderBottom: '1px dashed', borderColor: 'divider' }}>PLAYOFF LINE</TableCell></TableRow>
                    )}
                    {showPlayoffLines && idx === 10 && (
                      <TableRow><TableCell colSpan={cols} sx={{ py: 0.75, fontWeight: 700, fontSize: '0.7rem', bgcolor: 'warning.light', color: 'warning.dark', borderBottom: '2px solid', borderColor: 'warning.main' }}>PLAY-IN LINE</TableCell></TableRow>
                    )}
                    <TableRow sx={{ ...TR, borderLeft: top ? '3px solid' : undefined, borderLeftColor: top ? 'primary.main' : undefined }} onClick={() => go(t.team_id)}>
                      {showRank && <TableCell sx={TD}><Chip label={t.playoff_rank} size="small" sx={rankSx(t)} /></TableCell>}
                      <TableCell sx={TD}><TeamCell t={t} /></TableCell>
                      <TableCell align="center" sx={TD}>{t.wins}-{t.losses}</TableCell>
                      <TableCell align="center" sx={TD}>{formatPercentage(t.win_pct)}%</TableCell>
                      <TableCell align="center" sx={TD}>{formatGamesBack(t.games_back)}</TableCell>
                      <TableCell align="center" sx={TD}>{t.home_record}</TableCell>
                      <TableCell align="center" sx={TD}>{t.road_record}</TableCell>
                      <TableCell align="center" sx={TD}>{t.division_record}</TableCell>
                      <TableCell align="center" sx={TD}>{t.conference_record}</TableCell>
                      {hasPPG && <>
                        <TableCell align="center" sx={TD}>{t.ppg?.toFixed(1) || '—'}</TableCell>
                        <TableCell align="center" sx={TD}>{t.opp_ppg?.toFixed(1) || '—'}</TableCell>
                        <TableCell align="center" sx={{ ...TD, fontWeight: 600, color: t.diff && t.diff >= 0 ? 'success.main' : t.diff && t.diff < 0 ? 'error.main' : 'text.secondary' }}>{formatDiff(t.diff)}</TableCell>
                      </>}
                      {!isMobile && <>
                        <TableCell align="center" sx={TD}>
                          <Chip label={t.current_streak_str} size="small" icon={up ? <TrendingUp sx={{ fontSize: 14 }} /> : <TrendingDown sx={{ fontSize: 14 }} />}
                            sx={{ height: 24, fontWeight: 600, fontSize: '0.75rem', bgcolor: up ? 'rgba(76,175,80,0.1)' : 'rgba(239,83,80,0.1)', color: up ? 'success.main' : 'error.main' }} />
                        </TableCell>
                        <TableCell align="center" sx={TD}>{t.l10_record}</TableCell>
                      </>}
                    </TableRow>
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
}
