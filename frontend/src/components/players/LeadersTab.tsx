import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Skeleton,
  Grid,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { SeasonLeadersResponse, SeasonLeadersCategory } from '../../types/league';
import { fetchJson, API_BASE_URL } from '../../utils/api';
import { CARD_SX } from '../../utils/styles';
import { formatLeaderValue } from './playersFormatters';

export interface LeadersTabProps {
  season: string;
  seasonOptions: string[];
  onSeasonChange: (newSeason: string) => void;
  visible?: boolean;
}

export default function LeadersTab({ season, seasonOptions, onSeasonChange, visible = true }: LeadersTabProps) {
  const [seasonLeaders, setSeasonLeaders] = useState<SeasonLeadersResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (visible) setLoading(true);
      try {
        const data = await fetchJson<{ data: SeasonLeadersCategory[] }>(
          `${API_BASE_URL}/api/v1/players/season-leaders?season=${encodeURIComponent(season)}&page=1&pageSize=20`,
          {},
          { maxRetries: 3, retryDelay: 1000, timeout: 30000 },
        );
        if (!cancelled && data?.data) {
          setSeasonLeaders({ season, categories: data.data });
        }
      } catch (err) {
        if (!cancelled) console.error('Error fetching season leaders:', err);
      } finally {
        if (visible) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [season, visible]);

  if (!visible) return null;

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Season</InputLabel>
          <Select value={season} label="Season" onChange={e => onSeasonChange(e.target.value)}>
            {seasonOptions.map(s => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading || !seasonLeaders ? (
        <>
          <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1.5, mb: 2 }} />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={100} sx={{ borderRadius: 1.5, mb: 2 }} />
          ))}
        </>
      ) : (
        <Grid container spacing={2}>
          {seasonLeaders.categories.map((category, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Paper sx={CARD_SX}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                  {category.category}
                </Typography>
                {category.leaders.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No data available
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {category.leaders.map((leader, leaderIdx) => (
                      <Typography
                        key={leader.player_id}
                        component={Link}
                        to={`/player/${leader.player_id}`}
                        variant="body2"
                        sx={{
                          textDecoration: 'none',
                          color: 'text.primary',
                          fontWeight: leaderIdx === 0 ? 600 : 400,
                          '&:hover': { color: 'primary.main' },
                        }}
                      >
                        {leaderIdx + 1}. {leader.player_name}
                        {leader.team_abbreviation ? ` (${leader.team_abbreviation})` : ''} —{' '}
                        {formatLeaderValue(category.category, leader.value)}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
