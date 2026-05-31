import { Box, Typography, Avatar, Paper, Button, alpha, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Game } from '../types/scoreboard';
import { GameSummary } from '../types/schedule';
import { TEAM_LOGOS, getGameStatus, getGameTime } from '../utils/gameUtils';
import { LIVE_DOT_STYLE } from '../utils/gameUtils';

interface GameCardProps {
  game: Game | GameSummary;
  onClick?: () => void;
  isRecentlyUpdated?: boolean;
}

function GameCard({ game, onClick, isRecentlyUpdated = false }: GameCardProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const isLiveGame = 'homeTeam' in game;
  const gameId = isLiveGame ? game.gameId : game.game_id;
  const homeTeam = isLiveGame ? game.homeTeam?.teamTricode : game.home_team?.team_abbreviation;
  const awayTeam = isLiveGame ? game.awayTeam?.teamTricode : game.away_team?.team_abbreviation;
  const homeScore = isLiveGame ? (game.homeTeam?.score ?? 0) : (game.home_team?.points ?? 0);
  const awayScore = isLiveGame ? (game.awayTeam?.score ?? 0) : (game.away_team?.points ?? 0);
  const homeId = isLiveGame ? game.homeTeam?.teamId : game.home_team?.team_id;
  const awayId = isLiveGame ? game.awayTeam?.teamId : game.away_team?.team_id;
  const status = getGameStatus(game);
  const isLive = status === 'live';
  const isFinal = status === 'completed';
  const isUpcoming = status === 'upcoming';
  const period = isLiveGame ? game.period : undefined;
  const clock = isLiveGame ? game.gameClock : undefined;
  const homeWon = homeScore > awayScore;
  const awayWon = awayScore > homeScore;
  const gameLeaders = isLiveGame
    ? 'gameLeaders' in game
      ? game.gameLeaders
      : null
    : 'gameLeaders' in game
      ? (game as GameSummary).gameLeaders
      : null;
  const topPerformer =
    gameLeaders?.homeLeaders || gameLeaders?.awayLeaders
      ? (gameLeaders.homeLeaders?.points ?? 0) >= (gameLeaders.awayLeaders?.points ?? 0)
        ? gameLeaders.homeLeaders
        : gameLeaders.awayLeaders
      : null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick();
    else navigate(`/game/${gameId}`);
  };

  const handleTeamClick = (e: React.MouseEvent, teamId?: number | null) => {
    e.stopPropagation();
    if (teamId) navigate(`/team/${teamId}`);
  };

  const shadowSm =
    theme.palette.mode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)';
  const shadowMd =
    theme.palette.mode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.15)';
  const shadowLg =
    theme.palette.mode === 'dark' ? '0 8px 24px rgba(0, 0, 0, 0.5)' : '0 8px 24px rgba(0, 0, 0, 0.2)';

  const renderTeamRow = (
    team: string | undefined,
    teamId: number | null | undefined,
    score?: number,
    won?: boolean,
  ) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Avatar
        src={TEAM_LOGOS[team || 'NBA'] || TEAM_LOGOS['NBA']}
        alt={team}
        onClick={e => handleTeamClick(e, teamId)}
        sx={{ width: 32, height: 32, flexShrink: 0, cursor: teamId ? 'pointer' : 'default' }}
      />
      <Typography
        variant="body2"
        fontWeight={isFinal ? (won ? 700 : 500) : 600}
        color={isFinal ? (won ? 'text.primary' : 'text.secondary') : 'text.primary'}
        noWrap
        sx={{ flex: 1, minWidth: 0 }}
      >
        {team}
      </Typography>
      {!isUpcoming && score != null && (
        <Typography
          sx={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: isFinal ? (won ? 800 : 500) : 800,
            fontSize: isFinal ? { xs: '1.25rem', sm: '1.375rem' } : { xs: '1.5rem', sm: '1.75rem' },
            color: isFinal ? (won ? 'text.primary' : 'text.secondary') : 'text.primary',
            minWidth: isFinal ? 44 : 48,
            textAlign: 'right',
            flexShrink: 0,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {score}
        </Typography>
      )}
    </Box>
  );

  return (
    <Paper
      elevation={isLive ? 2 : 1}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 1.5,
        overflow: 'hidden',
        boxShadow: shadowSm,
        transition: 'all 0.2s ease',
        opacity: isUpcoming ? 0.92 : 1,
        backgroundColor: 'background.paper',
        border: isLive ? undefined : '1px solid',
        borderColor: 'divider',
        ...(isLive && {
          borderLeft: '4px solid',
          borderLeftColor: 'primary.main',
          '@keyframes livePulse': {
            '0%, 100%': { borderLeftColor: 'error.main' },
            '50%': { borderLeftColor: 'error.light' },
          },
          '@keyframes scoreUpdateGlow': {
            '0%': { boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.75)}` },
            '100%': { boxShadow: shadowMd },
          },
          animation: 'livePulse 2s ease-in-out infinite',
          ...(isRecentlyUpdated && {
            animation: 'livePulse 2s ease-in-out infinite, scoreUpdateGlow 0.8s ease-out 1',
          }),
        }),
        '&:hover': {
          boxShadow: isLive ? shadowLg : shadowMd,
          transform: isLive ? { md: 'translateY(-2px) scale(1.01)' } : 'translateY(-2px)',
          opacity: 1,
          backgroundColor: 'action.hover',
        },
      }}
    >
      <Box
        onClick={handleClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: { xs: 2, sm: 2.5 },
          cursor: 'pointer',
          backgroundColor: isRecentlyUpdated ? alpha(theme.palette.primary.main, 0.06) : 'transparent',
          transition: 'all 0.2s ease',
          '&:hover': { backgroundColor: 'action.hover' },
        }}
      >
        {isLive && (
          <Box sx={{ minWidth: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            <Box sx={LIVE_DOT_STYLE} />
            <Typography
              variant="caption"
              sx={{
                fontFamily: '"Barlow Condensed", sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 600,
                color: 'error.main',
                textAlign: 'center',
                fontVariantNumeric: 'tabular-nums',
                fontSize: '0.65rem',
              }}
            >
              {period != null && clock ? `Q${period} ${clock}` : 'LIVE'}
            </Typography>
          </Box>
        )}
        {isFinal && (
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '0.08em', width: 40, flexShrink: 0, textAlign: 'center' }}>
            FINAL
          </Typography>
        )}
        {isUpcoming && (
          <Box sx={{ minWidth: 52, textAlign: 'center', flexShrink: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.8125rem' }}>
              {getGameTime(game)}
            </Typography>
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {renderTeamRow(awayTeam, awayId, awayScore, awayWon)}
          {renderTeamRow(homeTeam, homeId, homeScore, homeWon)}
        </Box>
      </Box>
      <Box
        sx={{
          px: 2,
          pb: 2,
          pt: topPerformer && topPerformer.name && isFinal ? 1 : isUpcoming || isLive ? 1 : 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: topPerformer && topPerformer.name && isFinal ? 'space-between' : 'flex-end',
          borderTop: topPerformer && topPerformer.name && isFinal ? '0' : '1px solid',
          borderColor: 'divider',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        {isFinal && topPerformer && topPerformer.name && (
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1, minWidth: 0 }}>
            Top: {topPerformer.name} — {Math.round(topPerformer.points)} PTS
            {typeof topPerformer.rebounds === 'number' && ` ${Math.round(topPerformer.rebounds)} REB`}
            {typeof topPerformer.assists === 'number' && ` ${Math.round(topPerformer.assists)} AST`}
          </Typography>
        )}
        <Button variant="outlined" size="small" onClick={handleClick} sx={{ textTransform: 'none', ml: 'auto' }}>
          View Game
        </Button>
      </Box>
    </Paper>
  );
}

export default GameCard;
