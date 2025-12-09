'use client';

import React from 'react';
import { Sidebar } from '../navigation/sidebar';
import { TopBar } from '../navigation/top-bar';
import { cn } from '../../lib/utils';

interface DashboardShellProps {
  children: React.ReactNode;
  onSearch?: (value: string) => void;
}

export function DashboardShell({ children, onSearch }: DashboardShellProps) {
  return (
    <div className={cn('grid gap-4 px-4 py-6 md:px-8', 'lg:grid-cols-[240px_1fr]')}>
      <Sidebar />
      <div className="space-y-4">
        <TopBar onSearch={onSearch} />
        {children}
      </div>
    </div>
  );
}
