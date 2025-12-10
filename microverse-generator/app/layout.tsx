import './globals.css';
import { Noto_Sans_Display } from 'next/font/google';
import Providers from './Providers';

const myFont = Noto_Sans_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-myFont',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={myFont.className}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}