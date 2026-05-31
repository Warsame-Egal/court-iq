import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Skeleton } from '@mui/material';
import { Link } from 'react-router-dom';
import { LeagueLeader, LeagueLeadersResponse } from '../../types/league';
import { fetchLeagueLeaders } from '../../utils/api';
import { CARD_SX } from '../../utils/styles';
import { LEADER_CATEGORIES, LEADER_LABELS } from './playersFormatters';

interface LeagueLeadersDashboardProps {
  season: string;
}

export default function LeagueLeadersDashboard({ season }: LeagueLeadersDashboardProps) {
  const [leadersByCategory, setLeadersByCategory] = useState<Record<string, LeagueLeader[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        LEADER_CATEGORIES.map(cat => fetchLeagueLeaders(cat, season)),
      );
      const map: Record<string, LeagueLeader[]> = {};
      LEADER_CATEGORIES.forEach((cat, i) => {
        map[cat] = (results[i] as LeagueLeadersResponse).leaders?.slice(0, 3) || [];
      });
      setLeadersByCategory(map);
    } catch (err) {
      console.error('Error fetching league leaders:', err);
      setError('Failed to load league leaders');
      setLeadersByCategory({});
    } finally {
      setLoading(false);
    }
  }, [season]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <Paper sx={{ ...CARD_SX, mb: 0 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
        League Leaders
      </Typography>
      {loading ? (
        [...Array(6)].map((_, i) => <Skeleton key={i} variant="rectangular" height={72} sx={{ borderRadius: 1, mb: 1 }} />)
      ) : error ? (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
          {LEADER_CATEGORIES.map(cat => (
            <Box key={cat} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                {LEADER_LABELS[cat]}
              </Typography>
              {(leadersByCategory[cat] || []).length === 0 ? (
                <Typography variant="caption" color="text.secondary">
                  No data
                </Typography>
              ) : (
                (leadersByCategory[cat] || []).map(leader => (
                  <Typography
                    key={leader.player_id}
                    component={Link}
                    to={`/player/${leader.player_id}`}
                    variant="caption"
                    display="block"
                    sx={{ textDecoration: 'none', color: 'text.primary', mb: 0.25, '&:hover': { color: 'primary.main' } }}
                  >
                    {leader.name} — {leader.stat_value.toFixed(1)}
                  </Typography>
                ))
              )}
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
