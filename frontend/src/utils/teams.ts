export const TEAM_ABBREVIATIONS: { [key: string]: string } = {
  'Atlanta Hawks': 'ATL',
  'Boston Celtics': 'BOS',
  'Brooklyn Nets': 'BKN',
  'Charlotte Hornets': 'CHA',
  'Chicago Bulls': 'CHI',
  'Cleveland Cavaliers': 'CLE',
  'Dallas Mavericks': 'DAL',
  'Denver Nuggets': 'DEN',
  'Detroit Pistons': 'DET',
  'Golden State Warriors': 'GSW',
  'Houston Rockets': 'HOU',
  'Indiana Pacers': 'IND',
  'LA Clippers': 'LAC',
  'Los Angeles Lakers': 'LAL',
  'Memphis Grizzlies': 'MEM',
  'Miami Heat': 'MIA',
  'Milwaukee Bucks': 'MIL',
  'Minnesota Timberwolves': 'MIN',
  'New Orleans Pelicans': 'NOP',
  'New York Knicks': 'NYK',
  'Oklahoma City Thunder': 'OKC',
  'Orlando Magic': 'ORL',
  'Philadelphia 76ers': 'PHI',
  'Phoenix Suns': 'PHX',
  'Portland Trail Blazers': 'POR',
  'Sacramento Kings': 'SAC',
  'San Antonio Spurs': 'SAS',
  'Toronto Raptors': 'TOR',
  'Utah Jazz': 'UTA',
  'Washington Wizards': 'WAS',
};

const NICKNAME_TO_TRICODE: Record<string, string> = {
  Hawks: 'ATL', Celtics: 'BOS', Nets: 'BKN', Hornets: 'CHA', Bulls: 'CHI', Cavaliers: 'CLE',
  Mavericks: 'DAL', Nuggets: 'DEN', Pistons: 'DET', Warriors: 'GSW', Rockets: 'HOU', Pacers: 'IND',
  Clippers: 'LAC', Lakers: 'LAL', Grizzlies: 'MEM', Heat: 'MIA', Bucks: 'MIL', Timberwolves: 'MIN',
  Pelicans: 'NOP', Knicks: 'NYK', Thunder: 'OKC', Magic: 'ORL', '76ers': 'PHI', Suns: 'PHX',
  'Trail Blazers': 'POR', Kings: 'SAC', Spurs: 'SAS', Raptors: 'TOR', Jazz: 'UTA', Wizards: 'WAS',
};

export const getTeamAbbreviation = (teamName: string): string =>
  TEAM_ABBREVIATIONS[teamName] || teamName.substring(0, 3).toUpperCase();

export const getTeamLogo = (teamName: string, abbreviation?: string | null): string => {
  if (abbreviation) return `/logos/${abbreviation}.svg`;
  const tricode = TEAM_ABBREVIATIONS[teamName];
  if (tricode) return `/logos/${tricode}.svg`;
  const nickname = NICKNAME_TO_TRICODE[teamName];
  if (nickname) return `/logos/${nickname}.svg`;
  return '/logos/NBA.svg';
};

export const getTeamInfo = (teamName: string): { abbreviation: string; logo: string } => ({
  abbreviation: getTeamAbbreviation(teamName),
  logo: getTeamLogo(teamName),
});

export function parseTeamNameForColors(name: string): { city: string; teamName: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return { city: parts[0], teamName: parts.slice(1).join(' ') };
  return { city: '', teamName: name };
}

export interface TeamColors {
  primary: string;
  secondary?: string;
  text: string;
}

export const teamColors: { [teamId: number]: TeamColors } = {
  1610612738: { primary: '#007A33', secondary: '#BA9653', text: '#FFFFFF' },
  1610612751: { primary: '#000000', secondary: '#FFFFFF', text: '#FFFFFF' },
  1610612752: { primary: '#1D1160', secondary: '#C8102E', text: '#FFFFFF' },
  1610612755: { primary: '#006BB6', secondary: '#ED174C', text: '#FFFFFF' },
  1610612761: { primary: '#CE1141', secondary: '#000000', text: '#FFFFFF' },
  1610612739: { primary: '#860038', secondary: '#FDBB30', text: '#FFFFFF' },
  1610612765: { primary: '#C8102E', secondary: '#1D42BA', text: '#FFFFFF' },
  1610612754: { primary: '#002D62', secondary: '#FDBB30', text: '#FFFFFF' },
  1610612749: { primary: '#0C2340', secondary: '#C8102E', text: '#FFFFFF' },
  1610612741: { primary: '#CE1141', secondary: '#000000', text: '#FFFFFF' },
  1610612737: { primary: '#E03A3E', secondary: '#C1D32F', text: '#FFFFFF' },
  1610612766: { primary: '#1D1160', secondary: '#00788C', text: '#FFFFFF' },
  1610612748: { primary: '#98002E', secondary: '#F9A01B', text: '#FFFFFF' },
  1610612753: { primary: '#0077C0', secondary: '#C4CED4', text: '#FFFFFF' },
  1610612764: { primary: '#002B5C', secondary: '#E31837', text: '#FFFFFF' },
  1610612743: { primary: '#0E2240', secondary: '#FEC524', text: '#FFFFFF' },
  1610612750: { primary: '#0C2340', secondary: '#236192', text: '#FFFFFF' },
  1610612760: { primary: '#007AC1', secondary: '#EF3B24', text: '#FFFFFF' },
  1610612757: { primary: '#E03A3E', secondary: '#000000', text: '#FFFFFF' },
  1610612762: { primary: '#002B5C', secondary: '#F9A01B', text: '#FFFFFF' },
  1610612744: { primary: '#1D1160', secondary: '#E56020', text: '#FFFFFF' },
  1610612746: { primary: '#C8102E', secondary: '#552583', text: '#FFFFFF' },
  1610612747: { primary: '#552583', secondary: '#FDB927', text: '#FFFFFF' },
  1610612756: { primary: '#1D1160', secondary: '#E56020', text: '#FFFFFF' },
  1610612758: { primary: '#5D76A9', secondary: '#FDB927', text: '#FFFFFF' },
  1610612742: { primary: '#0C2340', secondary: '#C8102E', text: '#FFFFFF' },
  1610612745: { primary: '#CE1141', secondary: '#000000', text: '#FFFFFF' },
  1610612763: { primary: '#5D76A9', secondary: '#12173F', text: '#FFFFFF' },
  1610612740: { primary: '#0C2340', secondary: '#C8102E', text: '#FFFFFF' },
  1610612759: { primary: '#C8102E', secondary: '#000000', text: '#FFFFFF' },
};

export const getTeamColors = (teamId: number): TeamColors =>
  teamColors[teamId] || { primary: '#1976d2', text: '#FFFFFF' };

const teamNameToId: { [key: string]: number } = {
  'Atlanta Hawks': 1610612737, 'Boston Celtics': 1610612738, 'Brooklyn Nets': 1610612751,
  'Charlotte Hornets': 1610612766, 'Chicago Bulls': 1610612741, 'Cleveland Cavaliers': 1610612739,
  'Dallas Mavericks': 1610612742, 'Denver Nuggets': 1610612743, 'Detroit Pistons': 1610612765,
  'Golden State Warriors': 1610612744, 'Houston Rockets': 1610612745, 'Indiana Pacers': 1610612754,
  'LA Clippers': 1610612746, 'Los Angeles Clippers': 1610612746, 'Los Angeles Lakers': 1610612747,
  'Memphis Grizzlies': 1610612763, 'Miami Heat': 1610612748, 'Milwaukee Bucks': 1610612749,
  'Minnesota Timberwolves': 1610612750, 'New Orleans Pelicans': 1610612740, 'New York Knicks': 1610612752,
  'Oklahoma City Thunder': 1610612760, 'Orlando Magic': 1610612753, 'Philadelphia 76ers': 1610612755,
  'Phoenix Suns': 1610612756, 'Portland Trail Blazers': 1610612757, 'Sacramento Kings': 1610612758,
  'San Antonio Spurs': 1610612759, 'Toronto Raptors': 1610612761, 'Utah Jazz': 1610612762,
  'Washington Wizards': 1610612764,
};

export const getTeamColorsByName = (teamCity: string, teamName: string): TeamColors => {
  const teamId = teamNameToId[`${teamCity} ${teamName}`];
  return teamId ? getTeamColors(teamId) : { primary: '#1976d2', text: '#FFFFFF' };
};

const TRICODE_TO_ID: Record<string, number> = {
  ATL: 1610612737, BOS: 1610612738, BKN: 1610612751, CHA: 1610612766, CHI: 1610612741,
  CLE: 1610612739, DAL: 1610612742, DEN: 1610612743, DET: 1610612765, GSW: 1610612744,
  HOU: 1610612745, IND: 1610612754, LAC: 1610612746, LAL: 1610612747, MEM: 1610612763,
  MIA: 1610612748, MIL: 1610612749, MIN: 1610612750, NOP: 1610612740, NYK: 1610612752,
  OKC: 1610612760, ORL: 1610612753, PHI: 1610612755, PHX: 1610612756, POR: 1610612757,
  SAC: 1610612758, SAS: 1610612759, TOR: 1610612761, UTA: 1610612762, WAS: 1610612764,
};

export const getTeamColorsByTricode = (tricode: string): TeamColors => {
  const id = TRICODE_TO_ID[tricode?.trim()?.toUpperCase() ?? ''];
  return id ? getTeamColors(id) : { primary: '#1976d2', text: '#FFFFFF' };
};
