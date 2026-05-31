// Shared sx style objects — import these instead of repeating inline sx blocks

// Table header cell
export const TH = {
  fontWeight: 600,
  py: 1.5,
  color: 'text.secondary',
  fontSize: '0.75rem',
} as const;

// Table data cell
export const TD = {
  py: 1.5,
  fontSize: '0.8125rem',
} as const;

// Clickable table row hover
export const TR = {
  cursor: 'pointer',
  '&:hover': { backgroundColor: 'action.hover' },
} as const;

// Standard section card (replaces the 5-line Paper sx block used everywhere)
export const CARD_SX = {
  p: 3,
  mb: 3,
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1.5,
} as const;

// Page wrapper
export const PAGE_WRAPPER = {
  maxWidth: 1400,
  mx: 'auto',
  px: { xs: 2, sm: 3, md: 4 },
  py: { xs: 2, sm: 3 },
  width: '100%',
} as const;
