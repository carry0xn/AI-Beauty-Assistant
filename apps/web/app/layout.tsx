import type { Metadata } from 'next';
import { Fraunces, Space_Grotesk } from 'next/font/google';
import './globals.css';

const headingFont = Fraunces({
  subsets: ['latin'],
  variable: '--font-heading'
});

const bodyFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body'
});

export const metadata: Metadata = {
  title: 'Aura | AI Beauty Assistant',
  description: 'Aura monorepo scaffold'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${headingFont.variable} ${bodyFont.variable}`}>{children}</body>
    </html>
  );
}
