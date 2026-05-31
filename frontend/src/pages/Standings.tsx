import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Alert, Tabs, Tab, Chip, useTheme, useMediaQuery,
  FormControl, InputLabel, Select, MenuItem, Skeleton,
} from '@mui/material';
import { StandingRecord } from '../types/standings';
import { fetchJson, API_BASE_URL } from '../utils/api';
import { getCurrentSeason, getSeasonOptions } from '../utils/season';
import { PAGE_WRAPPER } from '../utils/styles';
import StandingsStyleTeamList from '../components/StandingsStyleTeamList';

type ViewType = 'league' | 'conference' | 'division';
type Conf = 'East' | 'West';
const DIVISIONS: Record<Conf, string[]> = {
  East: ['Atlantic', 'Central', 'Southeast'],
  West: ['Northwest', 'Pacific', 'Southwest'],
};

const byRank = (a: StandingRecord, b: StandingRecord) => a.playoff_rank - b.playoff_rank;
const byConfThenRank = (a: StandingRecord, b: StandingRecord) =>
  a.conference !== b.conference ? (a.conference === 'East' ? -1 : 1) : a.playoff_rank - b.playoff_rank;

const Standings = () => {
  const { season } = useParams<{ season?: string }>();
  const navigate = useNavigate();
  const isMdUp = useMediaQuery(useTheme().breakpoints.up('md'));
  const seasonParam = season || getCurrentSeason();
  const [standings, setStandings] = useState<StandingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewType, setViewType] = useState<ViewType>('league');
  const [conf, setConf] = useState<Conf>('East');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchJson<{ data: StandingRecord[] }>(
          `${API_BASE_URL}/api/v1/standings/season/${seasonParam}?page=1&pageSize=100`,
          {},
          { maxRetries: 3, retryDelay: 1000, timeout: 30000 },
        );
        if (data?.data) setStandings(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch standings.');
      } finally {
        setLoading(false);
      }
    })();
  }, [seasonParam]);

  const league = useMemo(() => [...standings].sort(byConfThenRank), [standings]);
  const east = useMemo(() => standings.filter(t => t.conference === 'East').sort(byRank), [standings]);
  const west = useMemo(() => standings.filter(t => t.conference === 'West').sort(byRank), [standings]);
  const confTeams = useMemo(() => standings.filter(t => t.conference === conf).sort(byRank), [standings, conf]);
  const divGroups = useMemo(() => {
    const g: Record<Conf, Record<string, StandingRecord[]>> = { East: {}, West: {} };
    standings.forEach(t => {
      (g[t.conference as Conf][t.division] ??= []).push(t);
    });
    (['East', 'West'] as const).forEach(c => Object.values(g[c]).forEach(l => l.sort(byRank)));
    return g;
  }, [standings]);

  const confChips = (
    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
      {(['East', 'West'] as const).map(c => (
        <Chip key={c} label={c === 'East' ? 'Eastern Conference' : 'Western Conference'} onClick={() => setConf(c)}
          color={conf === c ? 'primary' : 'default'} variant={conf === c ? 'filled' : 'outlined'} />
      ))}
    </Box>
  );

  const content = viewType === 'league' ? (
    <StandingsStyleTeamList teams={league} showRank showPlayoffLines />
  ) : viewType === 'conference' && isMdUp ? (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
      {([['Eastern Conference', east], ['Western Conference', west]] as const).map(([label, teams]) => (
        <Box key={label}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5 }}>{label}</Typography>
          <StandingsStyleTeamList teams={teams} showRank showPlayoffLines />
        </Box>
      ))}
    </Box>
  ) : viewType === 'conference' ? (
    <Box>{confChips}<StandingsStyleTeamList teams={confTeams} showRank showPlayoffLines /></Box>
  ) : (
    <Box>
      {confChips}
      {DIVISIONS[conf].map(div => {
        const teams = divGroups[conf][div] || [];
        return teams.length ? (
          <Box key={div} sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>{div}</Typography>
            <StandingsStyleTeamList teams={teams} showRank={false} showPlayoffLines={false} />
          </Box>
        ) : null;
      })}
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <Box sx={PAGE_WRAPPER}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Standings</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Season</InputLabel>
            <Select value={seasonParam} label="Season" onChange={e => e.target.value !== seasonParam && navigate(`/standings/${e.target.value}`)}>
              {getSeasonOptions(5).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        <Tabs value={viewType} onChange={(_, v) => setViewType(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
          {(['league', 'conference', 'division'] as const).map(v => (
            <Tab key={v} label={v[0].toUpperCase() + v.slice(1)} value={v} sx={{ textTransform: 'none', fontWeight: 600 }} />
          ))}
        </Tabs>
        {loading && !standings.length ? [...Array(8)].map((_, i) => <Skeleton key={i} variant="rectangular" height={48} sx={{ borderRadius: 1, mb: 1 }} />)
          : error && !standings.length ? <Alert severity="error">{error}</Alert>
          : !standings.length ? <Typography color="text.secondary">No standings available for this season.</Typography>
          : content}
      </Box>
    </Box>
  );
};

export default Standings;
