import * as React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'muted';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
    default: 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]',
    success: 'bg-[rgba(31,157,85,0.15)] text-[#166534]',
    warning: 'bg-[rgba(234,88,12,0.12)] text-[#9a3412]',
    danger: 'bg-[rgba(225,29,72,0.14)] text-[#9f1239]',
    muted: 'bg-[var(--color-border)] text-[var(--color-muted)]'
  };
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', variants[variant], className)}
      {...props}
    />
  );
}
