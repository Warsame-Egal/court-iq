import { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { getCurrentSeason, getSeasonOptions } from '../utils/season';
import { PAGE_WRAPPER } from '../utils/styles';
import RosterTab from '../components/players/RosterTab';
import LeadersTab from '../components/players/LeadersTab';
import LeagueLeadersDashboard from '../components/players/LeagueLeadersDashboard';

type TabValue = 'roster' | 'leaders';

const Players = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabValue>(
    (searchParams.get('tab') as TabValue) || 'roster',
  );
  const season = searchParams.get('season') || getCurrentSeason();
  const seasonOptions = getSeasonOptions(5);

  const handleTabChange = (_: unknown, newValue: TabValue) => {
    setActiveTab(newValue);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', newValue);
      return next;
    });
  };

  const handleSeasonChange = (newSeason: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('season', newSeason);
      return next;
    });
  };

  return (
    <Box sx={{ minHeight: '100dvh', backgroundColor: 'background.default', width: '100%', overflowX: 'hidden' }}>
      <Box sx={PAGE_WRAPPER}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
          Players
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
            <Tab label="Roster" value="roster" />
            <Tab label="Leaders" value="leaders" />
          </Tabs>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 280px' }, gap: 3, alignItems: 'start' }}>
          <Box>
            {activeTab === 'roster' && <RosterTab />}
            <LeadersTab
              season={season}
              seasonOptions={seasonOptions}
              onSeasonChange={handleSeasonChange}
              visible={activeTab === 'leaders'}
            />
          </Box>
          <Box sx={{ display: { xs: 'none', lg: 'block' }, position: 'sticky', top: 16 }}>
            <LeagueLeadersDashboard season={season} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Players;
