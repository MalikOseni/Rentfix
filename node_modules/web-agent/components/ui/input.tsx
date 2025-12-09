import * as React from 'react';
import { cn } from '../../lib/utils';

const inputBase =
  'flex h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm transition focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return <input className={cn(inputBase, className)} ref={ref} {...props} />;
  }
);
Input.displayName = 'Input';

export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return <textarea className={cn(inputBase, 'min-h-[120px]')} ref={ref} {...props} />;
  }
);
TextArea.displayName = 'TextArea';
