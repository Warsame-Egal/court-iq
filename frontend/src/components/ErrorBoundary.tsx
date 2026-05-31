import { Component, ReactNode } from 'react';
import { Box, Button, Typography } from '@mui/material';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center', minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
          <Box>
            <Typography sx={{ fontSize: '5rem', lineHeight: 1, color: 'primary.main', fontWeight: 800, mb: 1 }}>
              !
            </Typography>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Something went wrong
            </Typography>
            {import.meta.env.DEV && this.state.error && (
              <Typography
                variant="caption"
                sx={{ display: 'block', mb: 2, color: 'text.secondary', maxWidth: 600, wordBreak: 'break-all' }}
              >
                {String(this.state.error)}
              </Typography>
            )}
            <Button variant="contained" onClick={() => window.location.assign('/')}>
              Go back home
            </Button>
          </Box>
        </Box>
      );
    }
    return this.props.children;
  }
}
