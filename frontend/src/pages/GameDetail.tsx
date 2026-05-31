import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Skeleton,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from '@mui/material';
import { ArrowBack, ExpandMore } from '@mui/icons-material';
import { fetchBoxScore, getWebSocketUrl } from '../utils/api';
import WebSocketService from '../services/websocketService';
import type { ScoreSection } from '../types/gameDetail';
import type { BoxScoreResponse, ScoreboardResponse } from '../types/scoreboard';
import { parseTeamNameForColors, getTeamColorsByName } from '../utils/teams';
import PlayByPlay from '../components/PlayByPlay';
import { CARD_SX } from '../utils/styles';
import { normalizeStatus, scoreFromBoxScore } from '../components/game/gameDetailUtils';
import BoxScoreTab from '../components/game/BoxScoreTab';
import ScoreHeader from '../components/game/ScoreHeader';

export default function GameDetail() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const [boxScore, setBoxScore] = useState<BoxScoreResponse | null>(null);
  const [score, setScore] = useState<ScoreSection | null>(null);
  const [status, setStatus] = useState<'live' | 'completed' | 'upcoming'>('upcoming');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBoxScore = useCallback(() => {
    if (!gameId) return;
    setLoading(true);
    setError(null);
    fetchBoxScore(gameId)
      .then(data => {
        setBoxScore(data);
        setScore(scoreFromBoxScore(data));
        setStatus(normalizeStatus(data.status));
      })
      .catch(err => {
        console.error('Failed to fetch box score', err);
        setError(err instanceof Error ? err.message : 'Failed to load game');
        setBoxScore(null);
        setScore(null);
      })
      .finally(() => setLoading(false));
  }, [gameId]);

  useEffect(() => {
    loadBoxScore();
  }, [loadBoxScore]);

  useEffect(() => {
    if (!gameId || status !== 'live') return;
    const wsUrl = getWebSocketUrl('/api/v1/ws');
    const handleScoreboardUpdate = (data: ScoreboardResponse) => {
      const games = data?.scoreboard?.games;
      if (!games) return;
      const game = games.find(g => 'gameId' in g && g.gameId === gameId);
      if (!game || !('homeTeam' in game)) return;
      setScore(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          home_team: {
            ...prev.home_team,
            score: game.homeTeam?.score ?? prev.home_team.score,
          },
          away_team: {
            ...prev.away_team,
            score: game.awayTeam?.score ?? prev.away_team.score,
          },
          period: game.period ?? prev.period,
          clock: game.gameClock ?? prev.clock,
        };
      });
    };
    WebSocketService.connect(wsUrl);
    WebSocketService.subscribe(handleScoreboardUpdate);
    return () => {
      WebSocketService.unsubscribe(handleScoreboardUpdate);
    };
  }, [gameId, status]);

  const gradientColors = useMemo(() => {
    if (!score) return { home: '#333333', away: '#333333' };
    const homeParsed = parseTeamNameForColors(score.home_team.name ?? '');
    const awayParsed = parseTeamNameForColors(score.away_team.name ?? '');
    return {
      away: getTeamColorsByName(awayParsed.city, awayParsed.teamName).primary,
      home: getTeamColorsByName(homeParsed.city, homeParsed.teamName).primary,
    };
  }, [score]);

  if (!gameId) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary">Missing game ID.</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, sm: 3 }, width: '100%' }}>
        <IconButton onClick={() => navigate(-1)} aria-label="Go back" sx={{ mb: 1 }}>
          <ArrowBack fontSize="small" />
        </IconButton>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (loading || !score || !boxScore) {
    return (
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, sm: 3 }, width: '100%' }}>
        <Skeleton variant="text" width={120} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 2 }} />
        <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100dvh', backgroundColor: 'background.default' }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, sm: 3 }, width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <IconButton
          onClick={() => navigate(-1)}
          aria-label="Go back"
          sx={{ display: { xs: 'inline-flex', md: 'none' }, width: 'fit-content' }}
        >
          <ArrowBack fontSize="small" />
        </IconButton>
        <Box
          component={Link}
          to="/"
          sx={{
            display: { xs: 'none', md: 'inline-flex' },
            alignItems: 'center',
            gap: 1,
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          <ArrowBack fontSize="small" /> Back to scoreboard
        </Box>

        <ScoreHeader score={score} status={status} gradientColors={gradientColors} />

        <Accordion defaultExpanded disableGutters>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography fontWeight={700}>Box score</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <BoxScoreTab boxScore={boxScore} score={score} />
          </AccordionDetails>
        </Accordion>

        <Paper sx={CARD_SX}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Play-by-play
          </Typography>
          <PlayByPlay gameId={gameId} isLiveGame={status === 'live'} autoScrollToLatest />
        </Paper>
      </Box>
    </Box>
  );
}
