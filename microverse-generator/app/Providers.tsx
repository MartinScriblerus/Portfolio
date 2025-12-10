'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import { ReactNode } from 'react';
import ClientRoot from './ClientRoot';
import theme from '../src/theme';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <ClientRoot>{children}</ClientRoot>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}

