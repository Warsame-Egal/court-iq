import { createTheme, ThemeOptions } from '@mui/material/styles';

/**
 * Modern Material UI theme for 2025
 * Follows Material Design 3 principles with improved typography, spacing, and colors
 */

const SHADOW_BUTTON_HOVER = '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)';
const SHADOW_BUTTON_CONTAINED_HOVER =
  '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)';
const SHADOW_CARD_HOVER = SHADOW_BUTTON_CONTAINED_HOVER;
const SHADOW_DIALOG = '0 24px 48px rgba(0, 0, 0, 0.2)';
const SHADOW_DRAWER = '0 8px 32px rgba(0, 0, 0, 0.12)';
const SHADOW_MENU = '0 8px 24px rgba(0, 0, 0, 0.12)';
const SHADOW_TOOLTIP = '0 4px 12px rgba(0, 0, 0, 0.15)';
const ELEVATION_SHADOWS = {
  1: SHADOW_BUTTON_HOVER,
  2: SHADOW_BUTTON_CONTAINED_HOVER,
  4: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
} as const;

type ThemeMode = 'dark' | 'light';

const SEMANTIC_PALETTE = {
  dark: {
    error: { main: '#FF3B3B', light: '#FF6B6B', dark: '#D92D2D' },
    success: { main: '#00D4AA', light: '#2CE0BC', dark: '#00B090' },
    warning: { main: '#FFA726', light: '#FFB74D', dark: '#F57C00' },
    info: { main: '#42A5F5', light: '#64B5F6', dark: '#1976D2' },
  },
  light: {
    error: { main: '#D32F2F', light: '#EF5350', dark: '#C62828' },
    success: { main: '#388E3C', light: '#66BB6A', dark: '#2E7D32' },
    warning: { main: '#F57C00', light: '#FFA726', dark: '#E65100' },
    info: { main: '#1976D2', light: '#42A5F5', dark: '#1565C0' },
  },
} as const;

const MODE_SURFACES = {
  dark: {
    paper: '#111111',
    elevated: '#121212',
    border: '#222222',
    borderHover: 'rgba(255, 255, 255, 0.2)',
    cardHoverShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
    focusBorder: '#FF5722',
    inputBg: '#111111',
    tableHeadBg: 'rgba(255, 255, 255, 0.05)',
    tableHeadColor: 'rgba(255, 255, 255, 0.7)',
    tableHeadBorder: 'rgba(255, 255, 255, 0.12)',
    menuBorder: 'rgba(255, 255, 255, 0.12)',
  },
  light: {
    paper: '#FFFFFF',
    elevated: '#FFFFFF',
    border: 'rgba(0, 0, 0, 0.12)',
    borderHover: 'rgba(0, 0, 0, 0.2)',
    cardHoverShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
    focusBorder: '#1976D2',
    inputBg: 'rgba(0, 0, 0, 0.02)',
    tableHeadBg: 'rgba(0, 0, 0, 0.02)',
    tableHeadColor: 'rgba(0, 0, 0, 0.6)',
    tableHeadBorder: 'rgba(0, 0, 0, 0.12)',
    menuBorder: 'rgba(0, 0, 0, 0.12)',
  },
} as const;

const baseTheme: ThemeOptions = {
  typography: {
    fontFamily: [
      '"DM Sans"',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
      '@media (min-width:600px)': { fontSize: '2.5rem' },
      '@media (min-width:900px)': { fontSize: '3rem' },
    },
    h2: {
      fontWeight: 700,
      fontSize: '1.75rem',
      lineHeight: 1.25,
      letterSpacing: '-0.015em',
      '@media (min-width:600px)': { fontSize: '2rem' },
      '@media (min-width:900px)': { fontSize: '2.5rem' },
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
      '@media (min-width:600px)': { fontSize: '1.75rem' },
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.35,
      letterSpacing: '-0.005em',
      '@media (min-width:600px)': { fontSize: '1.5rem' },
    },
    h5: { fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.4, letterSpacing: '0em' },
    h6: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.4, letterSpacing: '0.005em' },
    body1: { fontSize: '0.9375rem', lineHeight: 1.55, letterSpacing: '0.01em', fontWeight: 400 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5, letterSpacing: '0.01em', fontWeight: 400 },
    subtitle1: {
      fontSize: '0.9375rem',
      lineHeight: 1.5,
      fontWeight: 600,
      letterSpacing: '0.005em',
    },
    subtitle2: {
      fontSize: '0.8125rem',
      lineHeight: 1.5,
      fontWeight: 600,
      letterSpacing: '0.005em',
    },
    button: { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem', letterSpacing: '0.01em' },
    caption: { fontSize: '0.75rem', lineHeight: 1.5, letterSpacing: '0.02em', fontWeight: 400 },
    overline: {
      fontSize: '0.6875rem',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(155, 155, 155, 0.5) transparent',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(155, 155, 155, 0.5)',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'rgba(155, 155, 155, 0.7)',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 20px',
          fontWeight: 500,
          fontSize: '0.875rem',
          textTransform: 'none',
          boxShadow: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: SHADOW_BUTTON_HOVER,
          },
        },
        contained: {
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          '&:hover': {
            backgroundColor: 'primary.dark',
            boxShadow: SHADOW_BUTTON_CONTAINED_HOVER,
          },
        },
        outlined: {
          borderWidth: '1px',
          borderColor: 'divider',
          '&:hover': {
            borderWidth: '1px',
            backgroundColor: 'action.hover',
          },
        },
        sizeSmall: {
          borderRadius: 16,
          padding: '6px 16px',
          fontSize: '0.875rem',
        },
        sizeLarge: {
          borderRadius: 24,
          padding: '14px 32px',
          fontSize: '1rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: 'none',
          backgroundColor: 'background.paper',
          '&:hover': {
            boxShadow: SHADOW_CARD_HOVER,
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 8,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        elevation0: {
          boxShadow: 'none',
        },
        elevation1: {
          boxShadow: ELEVATION_SHADOWS[1],
        },
        elevation2: {
          boxShadow: ELEVATION_SHADOWS[2],
        },
        elevation4: {
          boxShadow: ELEVATION_SHADOWS[4],
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundColor: 'transparent',
            '& fieldset': {
              borderWidth: '1.5px',
              borderColor: 'divider',
              transition: 'border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            },
            '&:hover fieldset': {
              borderWidth: '1.5px',
              borderColor: 'text.secondary',
            },
            '&.Mui-focused fieldset': {
              borderWidth: '2px',
              borderColor: 'primary.main',
            },
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '0.9375rem',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          border: '1px solid',
          boxShadow: SHADOW_DIALOG,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid',
          boxShadow: SHADOW_DRAWER,
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            fontSize: '0.8125rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            borderBottom: '2px solid',
            padding: '16px 12px',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
          '&:last-child td': {
            borderBottom: 'none',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'divider',
          padding: '14px 12px',
          fontSize: '0.9375rem',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
          fontSize: '0.75rem',
          height: 24,
          padding: '0 6px',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid',
          borderColor: 'divider',
          borderRadius: 0, // Flat, straight - no rounded corners
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: '0.8125rem',
          padding: '8px 12px',
          boxShadow: SHADOW_TOOLTIP,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 48,
        },
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9375rem',
          minHeight: 48,
          padding: '12px 20px',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: '1px solid',
          boxShadow: SHADOW_MENU,
          marginTop: 8,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          padding: '10px 16px',
          minHeight: 40,
          '&:hover': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: '1.5px solid',
          borderColor: 'divider',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'divider',
        },
      },
    },
  },
};

function mergeComponentStyle<T extends Record<string, unknown>>(
  base: T | undefined,
  override: Partial<T>,
): T {
  return { ...(base ?? {}), ...override } as T;
}

function createModeComponents(mode: ThemeMode): ThemeOptions['components'] {
  const surface = MODE_SURFACES[mode];
  const cardRoot = baseTheme.components?.MuiCard?.styleOverrides?.root as Record<string, unknown>;
  const paperRoot = baseTheme.components?.MuiPaper?.styleOverrides?.root as Record<string, unknown>;
  const textFieldRoot = baseTheme.components?.MuiTextField?.styleOverrides?.root as Record<
    string,
    unknown
  >;
  const dialogPaper = baseTheme.components?.MuiDialog?.styleOverrides?.paper as Record<
    string,
    unknown
  >;
  const drawerPaper = baseTheme.components?.MuiDrawer?.styleOverrides?.paper as Record<
    string,
    unknown
  >;
  const tableHeadRoot = baseTheme.components?.MuiTableHead?.styleOverrides?.root as Record<
    string,
    unknown
  >;
  const menuPaper = baseTheme.components?.MuiMenu?.styleOverrides?.paper as Record<string, unknown>;

  return {
    ...baseTheme.components,
    MuiCard: {
      styleOverrides: {
        root: mergeComponentStyle(cardRoot, {
          backgroundColor: surface.paper,
          borderColor: surface.border,
          '&:hover': {
            borderColor: surface.borderHover,
            boxShadow: surface.cardHoverShadow,
          },
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: mergeComponentStyle(paperRoot, {
          backgroundColor: surface.paper,
          borderColor: surface.border,
        }),
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: mergeComponentStyle(textFieldRoot, {
          '& .MuiOutlinedInput-root': {
            backgroundColor: surface.inputBg,
            '& fieldset': {
              borderColor: surface.border,
            },
            '&:hover fieldset': {
              borderColor: mode === 'dark' ? surface.focusBorder : surface.borderHover,
            },
            '&.Mui-focused fieldset': {
              borderColor: surface.focusBorder,
            },
          },
        }),
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: mergeComponentStyle(dialogPaper, {
          backgroundColor: surface.elevated,
          borderColor: surface.menuBorder,
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: mergeComponentStyle(drawerPaper, {
          backgroundColor: surface.elevated,
          borderColor: surface.menuBorder,
        }),
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: mergeComponentStyle(tableHeadRoot, {
          backgroundColor: surface.tableHeadBg,
          '& .MuiTableCell-head': {
            color: surface.tableHeadColor,
            borderBottomColor: surface.tableHeadBorder,
          },
        }),
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: mergeComponentStyle(menuPaper, {
          backgroundColor: surface.elevated,
          borderColor: surface.menuBorder,
        }),
      },
    },
  };
}

const DARK_ACTION = {
  hover: 'rgba(255, 255, 255, 0.08)',
  selected: 'rgba(255, 255, 255, 0.12)',
  disabled: 'rgba(255, 255, 255, 0.26)',
  disabledBackground: 'rgba(255, 255, 255, 0.12)',
};

const LIGHT_ACTION = {
  hover: 'rgba(0, 0, 0, 0.04)',
  selected: 'rgba(0, 0, 0, 0.08)',
  disabled: 'rgba(0, 0, 0, 0.26)',
  disabledBackground: 'rgba(0, 0, 0, 0.12)',
};

// Dark theme
export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#FF5722',
      light: '#FF8A61',
      dark: '#E64A19',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#0A0A0A',
      paper: MODE_SURFACES.dark.paper,
    },
    text: {
      primary: '#F5F5F5',
      secondary: '#888888',
      disabled: 'rgba(255, 255, 255, 0.5)',
    },
    ...SEMANTIC_PALETTE.dark,
    divider: MODE_SURFACES.dark.border,
    action: DARK_ACTION,
  },
  components: createModeComponents('dark'),
});

// Light theme
export const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: {
      main: '#1565C0',
      light: '#1976D2',
      dark: '#0D47A1',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F0F4F8',
      paper: MODE_SURFACES.light.paper,
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
    ...SEMANTIC_PALETTE.light,
    divider: MODE_SURFACES.light.border,
    action: LIGHT_ACTION,
  },
  components: createModeComponents('light'),
});

// Default export (will be overridden by ThemeContext)
export const theme = darkTheme;
