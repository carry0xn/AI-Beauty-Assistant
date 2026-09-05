import type { Metadata } from 'next';
import { Fraunces, Space_Grotesk } from 'next/font/google';
import ChatWidget from '../components/chat-widget';
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
  title: 'Aura | Descubrí tu estilo',
  description: 'Una guía personal para explorar tu rostro, tus colores y tu estilo.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${headingFont.variable} ${bodyFont.variable}`}>
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
