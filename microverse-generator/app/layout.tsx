import './globals.css';
import ClientRoot from './ClientRoot';

import { Noto_Sans_Display } from 'next/font/google';

const myFont = Noto_Sans_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-myFont',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={myFont.className}>
      <body>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}