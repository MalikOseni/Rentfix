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
    <html lang="en">
      <body>
        <header>
          <h1>Rentfix Agent</h1>
          <p>Manage tickets, contractors, and communications from one place.</p>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
