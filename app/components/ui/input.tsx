'use client';

import * as React from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const cn = (...inputs: Array<string | undefined | null | false>) =>
  inputs.filter(Boolean).join(' ');

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-[color:var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--foreground)] ring-offset-[var(--background)] placeholder:text-[var(--muted-foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--interactive)] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = 'Input';
