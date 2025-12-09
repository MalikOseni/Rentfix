'use client';

import { Bell, Search } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '../ui/avatar';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export function TopBar({ onSearch }: { onSearch?: (value: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <div>
          <p className="text-sm font-semibold">Agent workspace</p>
          <p className="text-xs text-[var(--color-muted)]">Real-time triage, assignments, evidence</p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-end gap-3 min-w-[280px]">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-1 max-w-[420px]">
          <Search size={16} className="text-[var(--color-muted)]" />
          <Input
            aria-label="Search tickets"
            placeholder="Search tickets, contractors, properties"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              onSearch?.(e.target.value);
            }}
          />
        </div>
        <Button variant="ghost" aria-label="Notifications">
          <Bell size={18} />
        </Button>
        <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] px-2 py-1">
          <Avatar name="Alex Agent" />
          <div className="text-xs leading-tight">
            <p className="font-semibold">Alex Agent</p>
            <p className="text-[var(--color-muted)]">Senior Coordinator</p>
          </div>
        </div>
      </div>
    </header>
  );
}
