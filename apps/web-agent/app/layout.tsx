import './globals.css';
import React from 'react';
import Providers from './providers';

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
