import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Typography, Paper, useTheme, useMediaQuery } from '@mui/material';
import { TeamGameLogResponse } from '../../types/gamelogs';
import { CARD_SX } from '../../utils/styles';

export function TeamPerformanceChart({ data }: { data: TeamGameLogResponse }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const pointsColor = '#1976d2';

  const chartData = useMemo(() => {
    if (!data.games?.length) return [];
    return [...data.games].slice(0, 20).reverse().map((game, index) => ({
      index,
      date: format(parseISO(game.game_date), 'MMM d'),
      Points: game.points,
    }));
  }, [data.games]);

  const avgPoints = useMemo(() => {
    if (!chartData.length) return 0;
    return chartData.reduce((s, g) => s + g.Points, 0) / chartData.length;
  }, [chartData]);

  const maxPoints = useMemo(() => Math.max(...chartData.map(d => d.Points), 0), [chartData]);

  if (!chartData.length) {
    return (
      <Paper elevation={0} sx={CARD_SX}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          No game data available
        </Typography>
      </Paper>
    );
  }

  const tickInterval = (() => {
    if (isMobile) {
      if (chartData.length > 15) return 4;
      if (chartData.length > 10) return 3;
      return 2;
    }
    if (chartData.length > 15) return 2;
    if (chartData.length > 10) return 1;
    return 0;
  })();

  return (
    <Paper elevation={0} sx={{ ...CARD_SX, p: { xs: 2, sm: 3.5 } }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Recent Performance Trend
      </Typography>
      <ResponsiveContainer width="100%" height={isMobile ? 320 : 420}>
        <AreaChart
          data={chartData}
          margin={{ top: 20, right: isMobile ? 30 : 50, left: isMobile ? 20 : 30, bottom: isMobile ? 60 : 40 }}
        >
          <defs>
            <linearGradient id="pointsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={pointsColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={pointsColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} strokeOpacity={0.3} vertical={false} />
          <XAxis
            dataKey="index"
            stroke={theme.palette.text.secondary}
            tick={{ fill: theme.palette.text.secondary, fontSize: '0.75rem' }}
            angle={isMobile ? -45 : 0}
            textAnchor={isMobile ? 'end' : 'middle'}
            height={isMobile ? 80 : 50}
            tickFormatter={v => chartData[v as number]?.date || ''}
            interval={tickInterval}
          />
          <YAxis
            stroke={theme.palette.text.secondary}
            tick={{ fill: theme.palette.text.secondary, fontSize: '0.75rem' }}
            domain={[0, Math.ceil(maxPoints * 1.1)]}
            label={{ value: 'Points', angle: -90, position: 'insideLeft', style: { fill: pointsColor, fontWeight: 600, fontSize: '0.75rem' } }}
          />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="Points"
            stroke={pointsColor}
            fill="url(#pointsGradient)"
            strokeWidth={2}
            dot={{ r: isMobile ? 3 : 4, fill: pointsColor }}
            activeDot={{ r: isMobile ? 5 : 6, fill: pointsColor }}
            name={`Points (Avg: ${avgPoints.toFixed(1)})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Paper>
  );
}
