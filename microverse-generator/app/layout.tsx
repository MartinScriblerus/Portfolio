import './globals.css';
import ClientRoot from './ClientRoot';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { Roboto } from 'next/font/google';
import { ThemeProvider } from '@mui/material/styles';

import { Noto_Sans_Display } from 'next/font/google';
import theme from '../src/theme';

const myFont = Noto_Sans_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-myFont',
});

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={myFont.className}>
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <ClientRoot>{children}</ClientRoot>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}