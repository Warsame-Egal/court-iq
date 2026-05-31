import { Box, Typography, Avatar } from '@mui/material';
import { getTeamColors } from '../../utils/teams';
import { logoFallback } from './imageFallbacks';
import { TeamStatsForBanner } from './types';

export function TeamBanner({
  teamId,
  teamCity,
  teamName,
  abbreviation,
  record,
  conferenceRank,
  conference,
  teamStats,
}: {
  teamId: number;
  teamCity: string;
  teamName: string;
  abbreviation: string;
  record?: string;
  conferenceRank?: number;
  conference?: string;
  teamStats?: TeamStatsForBanner;
}) {
  const colors = getTeamColors(teamId);
  const ordinal = (n: number) => {
    const j = n % 10;
    const k = n % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };
  const statItems = teamStats
    ? [
        { label: 'PPG', data: teamStats.ppg },
        { label: 'RPG', data: teamStats.rpg },
        { label: 'APG', data: teamStats.apg },
        { label: 'OPPG', data: teamStats.oppg },
      ].filter(s => s.data)
    : [];

  return (
    <Box sx={{ width: '100%', backgroundColor: colors.primary, color: colors.text, py: 3, px: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 3 }}>
        <Avatar
          src={`/logos/${abbreviation}.svg`}
          alt={`${teamCity} ${teamName}`}
          sx={{ width: { xs: 64, sm: 80 }, height: { xs: 64, sm: 80 }, border: `2px solid ${colors.text}`, flexShrink: 0 }}
          onError={logoFallback}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }, color: colors.text, mb: 0.5 }}>
            {teamCity} {teamName}
          </Typography>
          {(record || conferenceRank) && (
            <Typography variant="body2" sx={{ fontSize: '0.875rem', color: colors.text, opacity: 0.9, fontWeight: 500, mb: statItems.length ? 2 : 0 }}>
              {record}
              {conferenceRank && conference && (
                <span>
                  {' '}
                  • {conferenceRank}
                  {ordinal(conferenceRank)} in {conference}
                </span>
              )}
            </Typography>
          )}
          {statItems.length > 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2, mt: 2 }}>
              {statItems.map(({ label, data }) => (
                <Box key={label}>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, opacity: 0.8, fontSize: '0.75rem' }}>
                    {label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    {data!.rank}
                    {ordinal(data!.rank)} • {data!.value.toFixed(1)}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
