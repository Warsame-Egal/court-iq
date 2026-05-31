import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Alert,
  IconButton,
  Skeleton,
} from '@mui/material';
import { Search, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PlayerSummary } from '../../types/player';
import { fetchJson, API_BASE_URL } from '../../utils/api';
import { TH, TD, TR, CARD_SX } from '../../utils/styles';
import { imgFallback, fmtStat, fmtFg } from './playersFormatters';

const ROWS_PER_PAGE = 25;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function RosterTab() {
  const navigate = useNavigate();
  const [roster, setRoster] = useState<PlayerSummary[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('All Players');
  const [selectedTeam, setSelectedTeam] = useState('All Teams');
  const [selectedPosition, setSelectedPosition] = useState('All Positions');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (roster.length > 0) return;
    const load = async () => {
      setRosterLoading(true);
      try {
        const data = await fetchJson<PlayerSummary[]>(
          `${API_BASE_URL}/api/v1/players/league-roster`,
          {},
          { maxRetries: 3, retryDelay: 1000, timeout: 30000 },
        );
        if (data) setRoster(data);
      } catch (err) {
        console.error('Error fetching league roster:', err);
      } finally {
        setRosterLoading(false);
      }
    };
    load();
  }, [roster.length]);

  const filteredRoster = useMemo(() => {
    let filtered = [...roster];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        `${p.PLAYER_FIRST_NAME} ${p.PLAYER_LAST_NAME}`.toLowerCase().includes(query),
      );
    }
    if (selectedLetter !== 'All Players') {
      filtered = filtered.filter(p => (p.PLAYER_LAST_NAME?.charAt(0).toUpperCase() || '') === selectedLetter);
    }
    if (selectedTeam !== 'All Teams') {
      filtered = filtered.filter(p => (p.TEAM_NAME || '') === selectedTeam);
    }
    if (selectedPosition !== 'All Positions') {
      filtered = filtered.filter(p => {
        const pos = p.POSITION || '';
        if (selectedPosition === 'Guard') return pos.includes('G');
        if (selectedPosition === 'Forward') return pos.includes('F');
        if (selectedPosition === 'Center') return pos.includes('C');
        return false;
      });
    }
    return filtered;
  }, [roster, searchQuery, selectedLetter, selectedTeam, selectedPosition]);

  const uniqueTeams = useMemo(() => {
    const teams = new Set<string>();
    roster.forEach(p => {
      if (p.TEAM_NAME) teams.add(p.TEAM_NAME);
    });
    return Array.from(teams).sort();
  }, [roster]);

  const totalPages = Math.ceil(filteredRoster.length / ROWS_PER_PAGE) || 1;
  const paginatedRoster = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredRoster.slice(start, start + ROWS_PER_PAGE);
  }, [filteredRoster, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLetter, selectedTeam, selectedPosition]);

  const selectMenuProps = {
    anchorOrigin: { vertical: 'bottom' as const, horizontal: 'left' as const },
    transformOrigin: { vertical: 'top' as const, horizontal: 'left' as const },
    PaperProps: { sx: { maxHeight: '50vh', mt: 0.5 } },
  };

  return (
    <Box>
      <TextField
        fullWidth
        size="small"
        placeholder="Search players"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>All Players</InputLabel>
          <Select value={selectedLetter} label="All Players" onChange={e => setSelectedLetter(e.target.value)} MenuProps={selectMenuProps}>
            <MenuItem value="All Players">All Players</MenuItem>
            {ALPHABET.map(letter => (
              <MenuItem key={letter} value={letter}>
                {letter}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>All Teams</InputLabel>
          <Select value={selectedTeam} label="All Teams" onChange={e => setSelectedTeam(e.target.value)} MenuProps={selectMenuProps}>
            <MenuItem value="All Teams">All Teams</MenuItem>
            {uniqueTeams.map(team => (
              <MenuItem key={team} value={team}>
                {team}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>All Positions</InputLabel>
          <Select value={selectedPosition} label="All Positions" onChange={e => setSelectedPosition(e.target.value)} MenuProps={selectMenuProps}>
            <MenuItem value="All Positions">All Positions</MenuItem>
            <MenuItem value="Guard">Guard</MenuItem>
            <MenuItem value="Forward">Forward</MenuItem>
            <MenuItem value="Center">Center</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {filteredRoster.length} players • Page {currentPage} of {totalPages}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
            <NavigateBefore />
          </IconButton>
          <FormControl size="small" sx={{ minWidth: 70 }}>
            <Select value={currentPage} onChange={e => setCurrentPage(Number(e.target.value))}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <MenuItem key={page} value={page}>
                  {page}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton size="small" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
            <NavigateNext />
          </IconButton>
        </Box>
      </Box>

      {rosterLoading && roster.length === 0 ? (
        <>
          <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1.5, mb: 1 }} />
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={48} sx={{ borderRadius: 1, mb: 0.5 }} />
          ))}
        </>
      ) : roster.length === 0 ? (
        <Alert severity="info">No roster data available.</Alert>
      ) : filteredRoster.length === 0 ? (
        <Alert severity="info">No players found matching your filters.</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ ...CARD_SX, mb: 0 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={TH}>#</TableCell>
                <TableCell sx={TH}>Player</TableCell>
                <TableCell sx={TH}>Team</TableCell>
                <TableCell sx={TH}>Pos</TableCell>
                <TableCell sx={TH} align="right">
                  PPG
                </TableCell>
                <TableCell sx={TH} align="right">
                  RPG
                </TableCell>
                <TableCell sx={TH} align="right">
                  APG
                </TableCell>
                <TableCell sx={TH} align="right">
                  FG%
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRoster.map((player, idx) => {
                const fullName = `${player.PLAYER_FIRST_NAME} ${player.PLAYER_LAST_NAME}`;
                const playerId = player.PERSON_ID;
                const rowNum = (currentPage - 1) * ROWS_PER_PAGE + idx + 1;
                return (
                  <TableRow key={playerId} sx={TR} onClick={() => navigate(`/player/${playerId}`)}>
                    <TableCell sx={TD}>{rowNum}</TableCell>
                    <TableCell sx={TD}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${playerId}.png`}
                          alt={fullName}
                          sx={{ width: 36, height: 36, border: '1px solid', borderColor: 'divider' }}
                          onError={imgFallback}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {fullName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={TD}>{player.TEAM_ABBREVIATION || '—'}</TableCell>
                    <TableCell sx={TD}>{player.POSITION || '—'}</TableCell>
                    <TableCell sx={TD} align="right">
                      {fmtStat(player.PTS)}
                    </TableCell>
                    <TableCell sx={TD} align="right">
                      {fmtStat(player.REB)}
                    </TableCell>
                    <TableCell sx={TD} align="right">
                      {fmtStat(player.AST)}
                    </TableCell>
                    <TableCell sx={TD} align="right">
                      {fmtFg(player)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
