import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { TeamGameLogResponse } from '../../types/gamelogs';
import { TeamPlayerStat } from '../../types/teamstats';
import { CARD_SX } from '../../utils/styles';
import { imgFallback } from './imageFallbacks';

export const SeasonSelect = ({
  season,
  seasonOptions,
  onSeasonChange,
}: {
  season: string;
  seasonOptions: string[];
  onSeasonChange: (s: string) => void;
}) => (
  <FormControl size="small" sx={{ minWidth: { xs: 160, sm: 180 } }}>
    <InputLabel>Season</InputLabel>
    <Select value={season} label="Season" onChange={e => onSeasonChange(e.target.value)} sx={{ borderRadius: 1 }}>
      {seasonOptions.map(s => (
        <MenuItem key={s} value={s}>
          {s}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

export const StreakDots = ({ games, count, label }: { games: TeamGameLogResponse['games']; count: number; label: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 2, flexWrap: 'wrap' }}>
    <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
      {label}
    </Typography>
    {games.slice(0, count).map((g, i) => {
      const isWin = (g.win_loss ?? '').toUpperCase() === 'W';
      return (
        <Box
          key={g.game_id ?? i}
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: isWin ? 'success.main' : 'error.main',
            flexShrink: 0,
          }}
          title={isWin ? 'Win' : 'Loss'}
        />
      );
    })}
  </Box>
);

export const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 500 }}>
      {value}
    </Typography>
  </Box>
);

export const StatMiniCard = ({ label, value }: { label: string; value: string }) => (
  <Paper elevation={0} sx={{ ...CARD_SX, mb: 0, p: 2, textAlign: 'center' }}>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
      {label}
    </Typography>
    <Typography variant="h6" sx={{ fontWeight: 700 }}>
      {value}
    </Typography>
  </Paper>
);

export const LeaderCard = ({
  category,
  player,
  value,
  formatValue,
}: {
  category: string;
  player: TeamPlayerStat;
  value: number;
  formatValue: (v: number) => string;
}) => {
  const navigate = useNavigate();
  return (
    <Box
      onClick={() => navigate(`/player/${player.player_id}`)}
      sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, backgroundColor: 'background.default', cursor: 'pointer', '&:hover': { borderColor: 'primary.main', backgroundColor: 'action.hover' } }}
    >
      <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', mb: 1, display: 'block' }}>
        {category}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <Avatar
          src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${player.player_id}.png`}
          sx={{ width: 40, height: 40, border: '1px solid', borderColor: 'divider' }}
          onError={imgFallback}
        />
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{player.player_name}</Typography>
          {player.position && (
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
              {player.position}
            </Typography>
          )}
        </Box>
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatValue(value)}</Typography>
    </Box>
  );
};
