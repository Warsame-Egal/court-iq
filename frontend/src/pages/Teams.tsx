import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, FormControl, InputLabel, Select, MenuItem,
  TextField, InputAdornment, Avatar, Paper, Skeleton,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { StandingRecord } from '../types/standings';
import { fetchJson, API_BASE_URL } from '../utils/api';
import { getTeamInfo } from '../utils/teams';
import { getCurrentSeason, getSeasonOptions } from '../utils/season';
import { PAGE_WRAPPER, CARD_SX } from '../utils/styles';

const gridSx = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 2 };

const Teams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [standings, setStandings] = useState<StandingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const season = searchParams.get('season') || getCurrentSeason();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchJson<{ data: StandingRecord[] }>(
          `${API_BASE_URL}/api/v1/standings/season/${season}?page=1&pageSize=100`, {}, { maxRetries: 3, retryDelay: 1000, timeout: 30000 },
        );
        if (data?.data) setStandings(data.data);
      } catch { setError('Failed to load team data'); }
      finally { setLoading(false); }
    })();
  }, [season]);

  const teams = useMemo(() => {
    const q = search.trim().toLowerCase();
    return standings.filter(t => {
      if (!q) return true;
      const name = `${t.team_city} ${t.team_name}`.toLowerCase();
      return name.includes(q) || getTeamInfo(`${t.team_city} ${t.team_name}`).abbreviation.toLowerCase().includes(q);
    }).sort((a, b) => a.playoff_rank - b.playoff_rank);
  }, [standings, search]);

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <Box sx={PAGE_WRAPPER}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Season</InputLabel>
            <Select value={season} label="Season" onChange={e => setSearchParams({ season: e.target.value })}>
              {getSeasonOptions(5).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        <TextField fullWidth size="small" placeholder="Search teams..." value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} sx={{ mb: 3 }} />
        {loading && !standings.length ? (
          <Box sx={gridSx}>{[...Array(12)].map((_, i) => <Skeleton key={i} variant="rectangular" height={120} sx={{ borderRadius: 1.5 }} />)}</Box>
        ) : error && !standings.length ? (
          <Typography color="error">{error}</Typography>
        ) : !teams.length ? (
          <Typography color="text.secondary">No teams match your search.</Typography>
        ) : (
          <Box sx={gridSx}>
            {teams.map(t => {
              const name = `${t.team_city} ${t.team_name}`, { logo, abbreviation } = getTeamInfo(name);
              return (
                <Paper key={t.team_id} sx={{ ...CARD_SX, mb: 0, p: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => navigate(`/team/${t.team_id}`)}>
                  <Avatar src={logo} alt={name} sx={{ width: 56, height: 56, mx: 'auto', mb: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{abbreviation || t.team_city}</Typography>
                  <Typography variant="caption" color="text.secondary">{t.wins}-{t.losses}</Typography>
                </Paper>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Teams;
