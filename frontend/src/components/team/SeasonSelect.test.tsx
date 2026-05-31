import { createTheme, ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SeasonSelect } from './shared';

const theme = createTheme();

describe('SeasonSelect', () => {
  it('calls onSeasonChange when a new season is selected', async () => {
    const user = userEvent.setup();
    const onSeasonChange = vi.fn();

    render(
      <ThemeProvider theme={theme}>
        <SeasonSelect
          season="2024-25"
          seasonOptions={['2024-25', '2023-24']}
          onSeasonChange={onSeasonChange}
        />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: '2023-24' }));

    expect(onSeasonChange).toHaveBeenCalledWith('2023-24');
  });
});
