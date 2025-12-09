import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '../../lib/utils';

export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('');
  return (
    <AvatarPrimitive.Root
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-muted)] text-[var(--color-primary)] font-semibold border border-[var(--color-border)]'
      )}
    >
      <AvatarPrimitive.Fallback delayMs={200}>{initials}</AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
