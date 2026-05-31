import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, addDays, subDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import {
  Typography,
  Box,
  Snackbar,
  Alert,
  ToggleButton,
  Divider,
  Skeleton,
  Button,
  IconButton,
  Collapse,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Notifications,
  Event,
  CalendarToday,
  FilterList,
  Refresh,
  Schedule,
  FiberManualRecord,
  ChevronLeft,
  ChevronRight,
  ExpandMore,
} from '@mui/icons-material';
import { useLiveCount } from '../contexts/LiveCountContext';
import GameCard from '../components/GameCard';
import { ScoreboardResponse, Game } from '../types/scoreboard';
import { GamesResponse, GameSummary, GameLeaders } from '../types/schedule';
import { getLiveGameStatus } from '../utils/gameUtils';
import WebSocketService from '../services/websocketService';
import { fetchJson } from '../utils/api';
import { API_BASE_URL, getWebSocketUrl } from '../utils/api';

const SCOREBOARD_WEBSOCKET_URL = getWebSocketUrl('/api/v1/ws');

const getLocalISODate = (): string => {
  const tzoffset = new Date().getTimezoneOffset() * 60000;
  return new Date(Date.now() - tzoffset).toISOString().slice(0, 10);
};

const getScoreboardGameStatus = (
  game: Game | GameSummary,
): 'live' | 'upcoming' | 'completed' => {
  if ('homeTeam' in game) {
    return getLiveGameStatus(game);
  }
  if ('game_status' in game && typeof game.game_status === 'string') {
    const lowerStatus = game.game_status.toLowerCase();
    if (lowerStatus.includes('final')) return 'completed';
    const isQuarterClock =
      /\b[1-4](st|nd|rd|th)?\b/.test(lowerStatus) &&
      (lowerStatus.includes('q') || lowerStatus.includes('quarter'));
    const isLiveLike =
      lowerStatus.includes('live') ||
      lowerStatus.includes('in progress') ||
      lowerStatus.includes('halftime') ||
      lowerStatus.includes('ot') ||
      isQuarterClock;
    if (isLiveLike) return 'live';
    return 'upcoming';
  }
  return 'upcoming';
};

type PreviousGameState = {
  status: string;
  isOvertime: boolean;
  isFinal: boolean;
  differential: number;
  hasStarted: boolean;
};

function useScoreboardData() {
  const [games, setGames] = useState<(Game | GameSummary)[]>([]);
  const [todayScheduleGames, setTodayScheduleGames] = useState<(Game | GameSummary)[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getLocalISODate());
  const [recentlyUpdatedGames, setRecentlyUpdatedGames] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{
    message: string;
    severity: 'info' | 'success' | 'warning' | 'error';
  } | null>(null);
  const previousScoresRef = useRef<Map<string, { homeScore: number; awayScore: number }>>(new Map());
  const previousGameStatesRef = useRef<Map<string, PreviousGameState>>(new Map());
  const scheduleGameLeadersRef = useRef<Map<string, GameLeaders>>(new Map());
  const lastFetchedDateRef = useRef<string | null>(null);

  const setupWebSocket = useCallback(() => {
    if (selectedDate === getLocalISODate()) {
      previousScoresRef.current.clear();
      previousGameStatesRef.current.clear();
      setRecentlyUpdatedGames(new Set());
      WebSocketService.connect(SCOREBOARD_WEBSOCKET_URL);
      const handleScoreboardUpdate = (data: ScoreboardResponse) => {
        if (!data?.scoreboard) {
          console.warn('Invalid scoreboard data received from WebSocket', data);
          return;
        }
        const incomingGames = data.scoreboard.games;
        if (!Array.isArray(incomingGames) || incomingGames.length === 0) return;
        const updatedGameIds = new Set<string>();
        setGames(prevGames => {
          const gameMap = new Map<string, Game | GameSummary>();
          prevGames.forEach(g => {
            const key = 'gameId' in g ? g.gameId : g.game_id;
            gameMap.set(key, g);
          });
          incomingGames.forEach(newGame => {
            const key = 'gameId' in newGame ? newGame.gameId : (newGame as GameSummary).game_id;
            const isLiveGame = 'homeTeam' in newGame;
            const newHomeScore = isLiveGame ? (newGame.homeTeam?.score ?? 0) : ((newGame as GameSummary).home_team?.points ?? 0);
            const newAwayScore = isLiveGame ? (newGame.awayTeam?.score ?? 0) : ((newGame as GameSummary).away_team?.points ?? 0);
            const status = isLiveGame ? newGame.gameStatusText : (newGame as GameSummary).game_status || '';
            const statusLower = status.toLowerCase();
            const isOvertime = statusLower.includes('ot') && !statusLower.includes('final');
            const isFinal = statusLower.includes('final');
            const hasStarted = newHomeScore > 0 || newAwayScore > 0;
            const differential = Math.abs(newHomeScore - newAwayScore);
            const homeTeamName = isLiveGame ? newGame.homeTeam?.teamName : (newGame as GameSummary).home_team?.team_abbreviation;
            const awayTeamName = isLiveGame ? newGame.awayTeam?.teamName : (newGame as GameSummary).away_team?.team_abbreviation;
            const gameName = `${awayTeamName || 'Away'} vs ${homeTeamName || 'Home'}`;
            const previousScores = previousScoresRef.current.get(key);
            if (previousScores) {
              if (previousScores.homeScore !== newHomeScore || previousScores.awayScore !== newAwayScore) {
                updatedGameIds.add(key);
              }
            } else if (newHomeScore > 0 || newAwayScore > 0) {
              updatedGameIds.add(key);
            }
            const previousState = previousGameStatesRef.current.get(key);
            if (previousState) {
              if (!previousState.hasStarted && hasStarted && (statusLower.includes('live') || statusLower.match(/\b[1-4]q\b/))) {
                setToast({ message: `${gameName} has started!`, severity: 'info' });
              } else if (!previousState.isOvertime && isOvertime && !isFinal) {
                setToast({ message: `${gameName} is going to overtime!`, severity: 'warning' });
              } else if (!previousState.isFinal && isFinal) {
                const winner = newHomeScore > newAwayScore ? homeTeamName : awayTeamName;
                setToast({ message: `${gameName} - ${winner} wins!`, severity: 'success' });
              } else if (previousState.differential > 5 && differential <= 5 && hasStarted && !isFinal) {
                setToast({ message: `${gameName} is getting close! (${differential} pts)`, severity: 'info' });
              }
            }
            previousScoresRef.current.set(key, { homeScore: newHomeScore, awayScore: newAwayScore });
            previousGameStatesRef.current.set(key, { status, isOvertime, isFinal, differential, hasStarted });
            const scheduleLeaders = scheduleGameLeadersRef.current.get(key);
            if (scheduleLeaders && (scheduleLeaders.homeLeaders || scheduleLeaders.awayLeaders) &&
              (!newGame.gameLeaders || (!newGame.gameLeaders.homeLeaders && !newGame.gameLeaders.awayLeaders))) {
              (newGame as Game).gameLeaders = {
                homeLeaders: scheduleLeaders.homeLeaders ? { ...scheduleLeaders.homeLeaders, jerseyNum: scheduleLeaders.homeLeaders.jerseyNum || 'N/A', position: scheduleLeaders.homeLeaders.position || 'N/A', teamTricode: scheduleLeaders.homeLeaders.teamTricode || '' } : null,
                awayLeaders: scheduleLeaders.awayLeaders ? { ...scheduleLeaders.awayLeaders, jerseyNum: scheduleLeaders.awayLeaders.jerseyNum || 'N/A', position: scheduleLeaders.awayLeaders.position || 'N/A', teamTricode: scheduleLeaders.awayLeaders.teamTricode || '' } : null,
              };
            }
            gameMap.set(key, newGame);
          });
          return Array.from(gameMap.values());
        });
        if (updatedGameIds.size > 0) {
          setRecentlyUpdatedGames(updatedGameIds);
          setTimeout(() => {
            setRecentlyUpdatedGames(prev => {
              const newSet = new Set(prev);
              updatedGameIds.forEach(id => newSet.delete(id));
              return newSet;
            });
          }, 2000);
        }
        setLoading(false);
      };
      WebSocketService.subscribe(handleScoreboardUpdate);
      return () => {
        WebSocketService.unsubscribe(handleScoreboardUpdate);
        WebSocketService.disconnect();
      };
    }
    return () => {};
  }, [selectedDate]);

  useEffect(() => setupWebSocket(), [setupWebSocket]);

  useEffect(() => {
    const dateChanged = lastFetchedDateRef.current !== selectedDate;
    if (dateChanged) {
      lastFetchedDateRef.current = selectedDate;
      setGames([]);
      setLoading(true);
      previousScoresRef.current.clear();
      previousGameStatesRef.current.clear();
      setRecentlyUpdatedGames(new Set());
      scheduleGameLeadersRef.current.clear();
    }
    const fetchGamesByDate = async (date: string) => {
      const opts = { maxRetries: 3, retryDelay: 1000, timeout: 30000 };
      const today = getLocalISODate();
      try {
        if (date === today) {
          const data = await fetchJson<GamesResponse>(
            `${API_BASE_URL}/api/v1/schedule/date/${date}`,
            {},
            opts,
          );
          setTodayScheduleGames(data.games);
          scheduleGameLeadersRef.current.clear();
          data.games.forEach(game => {
            if (game.gameLeaders) scheduleGameLeadersRef.current.set(game.game_id, game.gameLeaders);
          });
          setGames(prevGames => {
            if (prevGames.length === 0) return data.games;
            const wsMap = new Map(
              prevGames.map(g => {
                const key = 'gameId' in g ? g.gameId : g.game_id;
                return [key, g] as [string, Game | GameSummary];
              }),
            );
            data.games.forEach(restGame => {
              if (!wsMap.has(restGame.game_id)) wsMap.set(restGame.game_id, restGame);
            });
            return Array.from(wsMap.values());
          });
        } else {
          setTodayScheduleGames([]);
          const data = await fetchJson<ScoreboardResponse>(
            `${API_BASE_URL}/api/v1/scoreboard/today?date=${encodeURIComponent(date)}`,
            {},
            opts,
          );
          setGames(data.scoreboard?.games ?? []);
        }
      } catch (err) {
        console.error('Error fetching games for date', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGamesByDate(selectedDate);
  }, [selectedDate]);

  return { games, todayScheduleGames, loading, selectedDate, setSelectedDate, recentlyUpdatedGames, toast, setToast };
}

function DateNavigator({ selectedDate, onDateChange, expandable = true }: { selectedDate: string; onDateChange: (date: string) => void; expandable?: boolean }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const selected = parseISO(selectedDate);
  const today = new Date();
  const isToday = isSameDay(selected, today);
  const displayLabel = isToday ? `Today, ${format(selected, 'MMMM d')}` : format(selected, 'EEEE, MMMM d');
  const weekStart = startOfWeek(selected, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5, width: '100%' }}>
        <IconButton onClick={() => onDateChange(format(subDays(selected, 1), 'yyyy-MM-dd'))} size="small" sx={{ minWidth: 44, minHeight: 44, color: 'text.secondary', transition: 'all 0.2s ease', flexShrink: 0, '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main' } }}>
          <ChevronLeft fontSize="small" />
        </IconButton>
        <Box onClick={expandable ? () => setExpanded(e => !e) : undefined} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, flex: 1, py: 0.75, cursor: expandable ? 'pointer' : 'default', borderRadius: 1, transition: 'all 0.2s ease', ...(expandable && { '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.06) } }) }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>{displayLabel}</Typography>
          {expandable && <ExpandMore sx={{ fontSize: 20, color: 'text.secondary', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'all 0.2s ease' }} />}
        </Box>
        <IconButton onClick={() => onDateChange(format(addDays(selected, 1), 'yyyy-MM-dd'))} size="small" sx={{ minWidth: 44, minHeight: 44, color: 'text.secondary', transition: 'all 0.2s ease', flexShrink: 0, '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main' } }}>
          <ChevronRight fontSize="small" />
        </IconButton>
      </Box>
      {expandable && (
        <Collapse in={expanded}>
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap', pt: 1, pb: 0.5 }}>
            {weekDays.map(day => {
              const formattedDay = format(day, 'yyyy-MM-dd');
              const isSelected = formattedDay === selectedDate;
              const isTodayDay = isSameDay(day, today);
              return (
                <Box key={formattedDay} onClick={() => { onDateChange(formattedDay); setExpanded(false); }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 44, width: 44, minHeight: 44, height: 44, borderRadius: 1, cursor: 'pointer', transition: 'all 0.2s ease', backgroundColor: isSelected ? alpha(theme.palette.primary.main, 0.1) : 'transparent', color: isSelected ? 'primary.main' : isTodayDay ? 'primary.main' : 'text.secondary', '&:hover': { backgroundColor: isSelected ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.action.hover, 0.4) } }}>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 600 }}>{format(day, 'EEE').toUpperCase()}</Typography>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: isSelected ? 700 : 500 }}>{format(day, 'd')}</Typography>
                </Box>
              );
            })}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}

const Scoreboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const { games, todayScheduleGames, loading, selectedDate, setSelectedDate, recentlyUpdatedGames, toast, setToast } = useScoreboardData();
  const [gameFilter, setGameFilter] = useState<'all' | 'close' | 'blowout' | 'overtime'>('all');
  const today = getLocalISODate();
  const isToday = selectedDate === today;

  const { liveGames, upcomingGames, completedGames } = useMemo(() => {
    const filteredAll = games.filter(game => {
      if (!searchQuery) return true;
      const homeName = 'homeTeam' in game ? game.homeTeam.teamName : game.home_team.team_abbreviation;
      const awayName = 'awayTeam' in game ? game.awayTeam.teamName : game.away_team.team_abbreviation;
      return homeName.toLowerCase().includes(searchQuery.toLowerCase()) || awayName.toLowerCase().includes(searchQuery.toLowerCase());
    });
    if (selectedDate === today) {
      const scheduleSource = todayScheduleGames.length > 0 ? todayScheduleGames : games;
      const filteredSchedule = scheduleSource.filter(game => {
        if (!searchQuery) return true;
        const homeName = 'homeTeam' in game ? game.homeTeam.teamName : game.home_team.team_abbreviation;
        const awayName = 'awayTeam' in game ? game.awayTeam.teamName : game.away_team.team_abbreviation;
        return homeName.toLowerCase().includes(searchQuery.toLowerCase()) || awayName.toLowerCase().includes(searchQuery.toLowerCase());
      });
      return {
        liveGames: filteredAll.filter(game => getScoreboardGameStatus(game) === 'live'),
        upcomingGames: filteredSchedule.filter(game => getScoreboardGameStatus(game) === 'upcoming'),
        completedGames: filteredAll.filter(game => getScoreboardGameStatus(game) === 'completed'),
      };
    }
    if (selectedDate < today) return { liveGames: [] as (Game | GameSummary)[], upcomingGames: [] as (Game | GameSummary)[], completedGames: filteredAll };
    return { liveGames: [] as (Game | GameSummary)[], upcomingGames: filteredAll, completedGames: [] as (Game | GameSummary)[] };
  }, [games, searchQuery, selectedDate, todayScheduleGames, today]);

  const applyGameFilter = useCallback((gameList: (Game | GameSummary)[]) => {
    if (gameFilter === 'all') return gameList;
    return gameList.filter(game => {
      const isLiveGame = 'homeTeam' in game;
      const homeScore = isLiveGame ? (game.homeTeam?.score ?? 0) : (game.home_team?.points ?? 0);
      const awayScore = isLiveGame ? (game.awayTeam?.score ?? 0) : (game.away_team?.points ?? 0);
      const differential = Math.abs(homeScore - awayScore);
      const status = isLiveGame ? game.gameStatusText : game.game_status || '';
      switch (gameFilter) {
        case 'close': return differential <= 10 && (homeScore > 0 || awayScore > 0);
        case 'blowout': return differential >= 20 && (homeScore > 0 || awayScore > 0);
        case 'overtime': return status.toLowerCase().includes('ot') || status.toLowerCase().includes('overtime');
        default: return true;
      }
    });
  }, [gameFilter]);

  const filteredLiveGames = useMemo(() => applyGameFilter(liveGames), [liveGames, applyGameFilter]);
  const filteredUpcomingGames = useMemo(() => applyGameFilter(upcomingGames), [upcomingGames, applyGameFilter]);
  const filteredCompletedGames = useMemo(() => applyGameFilter(completedGames), [completedGames, applyGameFilter]);

  const { setLiveCount } = useLiveCount();
  useEffect(() => { setLiveCount(liveGames.length); return () => setLiveCount(0); }, [liveGames.length, setLiveCount]);

  const scoreboardGamesTitle = useMemo(() => {
    if (selectedDate === today) return "Today's Games";
    const parts = selectedDate.split('-').map(Number);
    if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) return 'Games';
    const [y, m, d] = parts;
    const date = new Date(y, m - 1, d);
    const formatted = date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', ...(date.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' as const } : {}) });
    return `Games on ${formatted}`;
  }, [selectedDate, today]);

  const gameStats = useMemo(() => {
    if (!isToday) return { totalGames: 0, gamesInProgress: 0 };
    const gamesInProgress = games.filter(game => {
      const status = 'homeTeam' in game ? game.gameStatusText : game.game_status || '';
      const statusLower = status.toLowerCase();
      const isLive = statusLower.includes('live') || (statusLower.match(/\b[1-4]q\b/) && !statusLower.includes('final')) || (statusLower.includes('ot') && !statusLower.includes('final'));
      const isLiveGame = 'homeTeam' in game;
      const homeScore = isLiveGame ? (game.homeTeam?.score ?? 0) : (game.home_team?.points ?? 0);
      const awayScore = isLiveGame ? (game.awayTeam?.score ?? 0) : (game.away_team?.points ?? 0);
      return isLive && (homeScore > 0 || awayScore > 0);
    }).length;
    return { totalGames: games.length, gamesInProgress };
  }, [games, isToday]);

  const renderGameSection = (title: string, gameList: (Game | GameSummary)[], icon?: React.ReactNode, isFirst?: boolean) => (
    <Box sx={{ mb: { xs: 1.5, sm: 2, md: 2.5 }, mt: isFirst ? 0 : undefined, minHeight: gameList.length === 0 ? 0 : undefined, visibility: gameList.length === 0 ? 'hidden' : 'visible', height: gameList.length === 0 ? 0 : 'auto', overflow: gameList.length === 0 ? 'hidden' : 'visible' }}>
      {gameList.length > 0 && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, mb: { xs: 1, sm: 1.5 }, pb: 1, borderBottom: '1px solid', borderColor: 'divider', minHeight: 56 }}>
            {icon && <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>{icon}</Box>}
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.125rem' }, color: 'text.primary', letterSpacing: '-0.01em', flex: 1 }}>{title}</Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: { xs: 2, sm: 2.5, md: 3 }, minHeight: { xs: 200, sm: 300 } }}>
            {gameList.map(game => {
              const gameId = 'gameId' in game ? game.gameId : game.game_id;
              const gameStatus = getScoreboardGameStatus(game);
              const status = 'homeTeam' in game ? game.gameStatusText : game.game_status || '';
              const isCompleted = status.toLowerCase().includes('final');
              const canClick = gameStatus === 'live' || isCompleted;
              return (
                <GameCard key={gameId} game={game} onClick={canClick ? () => navigate(`/game/${gameId}`) : undefined} isRecentlyUpdated={recentlyUpdatedGames.has(gameId)} />
              );
            })}
          </Box>
        </>
      )}
    </Box>
  );

  const renderGameList = (showRightColumn = false) => {
    if (showRightColumn) {
      return (
        <Box sx={{ display: { xs: 'none', md: 'block' }, mt: 6.5 }}>
          {renderGameSection('Tonight', filteredUpcomingGames, <Schedule sx={{ fontSize: 18 }} />, true)}
          {renderGameSection('Completed', filteredCompletedGames, <Event sx={{ fontSize: 18 }} />, false)}
        </Box>
      );
    }
    return (
      <Box>
        <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, alignItems: 'center', mb: { xs: 0.25, sm: 0.5 }, mt: 0, flexWrap: 'wrap', minHeight: 48, visibility: isToday ? 'visible' : 'hidden' }}>
          {loading && isToday ? (
            <>
              <Skeleton variant="text" width={100} height={24} sx={{ borderRadius: 0.5 }} />
              <Skeleton variant="text" width={80} height={24} sx={{ borderRadius: 0.5 }} />
              <Skeleton variant="rectangular" width={200} height={32} sx={{ borderRadius: 1, ml: 'auto' }} />
            </>
          ) : games.length > 0 && isToday && (
            <>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                {gameStats.totalGames} {gameStats.totalGames === 1 ? 'Game' : 'Games'}
              </Typography>
              {gameStats.gamesInProgress > 0 && (
                <>
                  <Divider orientation="vertical" flexItem sx={{ height: { xs: 14, sm: 16 } }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FiberManualRecord sx={{ fontSize: 8, color: 'error.main' }} />
                    <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 600, fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}>
                      {gameStats.gamesInProgress} Live
                    </Typography>
                  </Box>
                </>
              )}
            </>
          )}
        </Box>
        {loading && games.length === 0 ? (
          <Box sx={{ mb: { xs: 3, sm: 4, md: 5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, mb: { xs: 2, sm: 2.5 }, pb: 1 }}>
              <Skeleton variant="circular" width={20} height={20} />
              <Skeleton variant="text" width={140} height={28} sx={{ flex: 1 }} />
              <Skeleton variant="rectangular" width={32} height={24} sx={{ borderRadius: 0.5 }} />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 2.5, md: 3 } }}>
              {[...Array(3)].map((_, index) => <Skeleton key={index} variant="rectangular" sx={{ borderRadius: 1.5, height: { xs: 100, sm: 110 } }} />)}
            </Box>
          </Box>
        ) : isToday ? (
          <Box>
            {renderGameSection('LIVE', filteredLiveGames, <FiberManualRecord sx={{ fontSize: { xs: 16, sm: 18 }, color: 'error.main' }} />, true)}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              {renderGameSection('Tonight', filteredUpcomingGames, <Schedule sx={{ fontSize: 18 }} />, false)}
              {renderGameSection('Completed', filteredCompletedGames, <Event sx={{ fontSize: 18 }} />, false)}
            </Box>
          </Box>
        ) : (
          <Box>
            {selectedDate < today
              ? renderGameSection('Completed Games', filteredCompletedGames, <Event sx={{ fontSize: { xs: 16, sm: 18 } }} />, true)
              : renderGameSection('Future Games', filteredUpcomingGames, <Schedule sx={{ fontSize: { xs: 16, sm: 18 } }} />, true)}
          </Box>
        )}
        {!loading && games.length === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: { xs: 8, sm: 12 }, px: 3, minHeight: '50vh' }}>
            <Event sx={{ fontSize: { xs: 100, sm: 120 }, color: 'primary.main', opacity: 0.3, mb: 4 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, textAlign: 'center', color: 'text.primary' }}>No Games Scheduled</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 4, maxWidth: 500, lineHeight: 1.6 }}>
              {selectedDate === getLocalISODate() ? 'No games today — enjoy the day off.' : 'There are no NBA games scheduled for this date. Check another date or come back later!'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button variant="outlined" startIcon={<CalendarToday />} onClick={() => setSelectedDate(getLocalISODate())} sx={{ px: 3, py: 1.5, borderRadius: 1, textTransform: 'none', fontWeight: 600 }}>View Today's Games</Button>
              <Button variant="outlined" startIcon={<Schedule />} onClick={() => { const tomorrow = new Date(selectedDate); tomorrow.setDate(tomorrow.getDate() + 1); setSelectedDate(tomorrow.toISOString().split('T')[0]); }} sx={{ px: 3, py: 1.5, borderRadius: 1, textTransform: 'none', fontWeight: 600 }}>View Tomorrow</Button>
            </Box>
          </Box>
        )}
        {!loading && liveGames.length === 0 && upcomingGames.length === 0 && completedGames.length === 0 && games.length !== 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: { xs: 8, sm: 12 }, px: 3, minHeight: '50vh' }}>
            <FilterList sx={{ fontSize: { xs: 100, sm: 120 }, color: 'text.disabled', opacity: 0.3, mb: 4 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, textAlign: 'center', color: 'text.primary' }}>No Games Match Your Filters</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 4, maxWidth: 500, lineHeight: 1.6 }}>Try adjusting your filters or selecting a different date to see more games.</Typography>
            <Button variant="contained" startIcon={<Refresh />} onClick={() => setGameFilter('all')} sx={{ px: 4, py: 1.5, borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}>Clear Filters</Button>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ minHeight: '100dvh', backgroundColor: 'background.default', display: 'flex', flexDirection: 'column', maxWidth: '100vw', overflowX: 'hidden', overflowY: 'visible', width: '100%' }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, sm: 3 }, width: '100%', pt: { xs: 0.5, sm: 0.75 }, pb: { xs: 2, sm: 3 }, overflowX: 'hidden' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', gap: { xs: 1.5, sm: 2 }, mb: { xs: 0.25, sm: 0.5 }, minHeight: { xs: 48, sm: 56 }, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, flexShrink: 0, flexWrap: 'wrap' }}>
            <Box sx={{ flexShrink: 0 }}>
              <Typography sx={{ fontWeight: 700, mb: 1 }}>{scoreboardGamesTitle}</Typography>
              <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} expandable />
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5, overflowX: 'auto', flexWrap: 'nowrap', pb: 0.5, minHeight: 36, '&::-webkit-scrollbar': { height: 4 } }}>
          {[
            { value: 'all' as const, label: 'All Games' },
            ...(isToday ? [{ value: 'live' as const, label: `Live (${liveGames.length})` }] : []),
            { value: 'close' as const, label: 'Close' },
            { value: 'blowout' as const, label: 'Blowout' },
            { value: 'overtime' as const, label: 'OT' },
          ].map(({ value, label }) => {
            const isLiveChip = value === 'live';
            const active = value === 'live' ? gameFilter === 'all' && liveGames.length > 0 : gameFilter === value;
            return (
              <ToggleButton key={value} value={value} selected={active} onClick={() => { if (value === 'live') setGameFilter('all'); else setGameFilter(value); }} sx={{ flexShrink: 0, height: 28, px: 1.5, textTransform: 'none', fontSize: '0.8125rem', fontWeight: 600, borderColor: 'divider', color: 'text.secondary', '&.Mui-selected': { backgroundColor: 'primary.main', color: 'primary.contrastText', '&:hover': { backgroundColor: 'primary.dark' } }, ...(isLiveChip && liveGames.length > 0 && { color: 'error.main', '&.Mui-selected': { color: 'primary.contrastText' }, animation: 'pulse 2s ease-in-out infinite', '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.85 } } }) }}>
                {label}
              </ToggleButton>
            );
          })}
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 0, md: 3 }, alignItems: 'start' }}>
          {renderGameList()}
          {isToday && renderGameList(true)}
        </Box>
        <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} sx={{ mt: 8 }}>
          <Alert onClose={() => setToast(null)} severity={toast?.severity || 'info'} variant="filled" sx={{ width: '100%' }} icon={<Notifications />}>{toast?.message}</Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default Scoreboard;
