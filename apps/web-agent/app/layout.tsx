import './globals.css';
import React from 'react';
import { Inter } from 'next/font/google';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'Rentfix Agent Dashboard',
  description: 'Operational console for property agents and coordinators.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Providers>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
