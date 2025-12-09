'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListChecks, FilePieChart, Home, Images, Building2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { href: '/overview', label: 'Overview', icon: Home },
  { href: '/triage', label: 'Triage', icon: LayoutDashboard },
  { href: '/assignments', label: 'Assignments', icon: ListChecks },
  { href: '/properties', label: 'Properties', icon: Building2 },
  { href: '/evidence', label: 'Evidence', icon: Images },
  { href: '/analytics', label: 'Analytics', icon: FilePieChart }
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside
      aria-label="Main navigation"
      className="sticky top-4 h-fit w-full max-w-[240px] space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-[var(--color-primary-muted)]" />
        <div>
          <p className="text-sm font-semibold">Rentfix Agent</p>
          <p className="text-xs text-[var(--color-muted)]">Operational console</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1" aria-label="Primary">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-[var(--color-text)] transition',
                active ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]' : 'hover:bg-[var(--color-primary-muted)]'
              )}
              href={item.href}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="rounded-md bg-[var(--color-primary-muted)] px-3 py-3 text-xs text-[var(--color-text)]">
        <p className="font-semibold text-[var(--color-primary)]">AI assist</p>
        <p className="mt-1 text-[var(--color-muted)]">LLM triage recommendations and reliability scores are refreshed every 15 minutes.</p>
      </div>
    </aside>
  );
}
