'use client';

import * as React from 'react';

type ButtonVariant = 'default' | 'outline' | 'ghost';
type ButtonSize = 'default' | 'sm' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'bg-[var(--interactive)] text-[var(--interactive-foreground)] hover:opacity-90 focus-visible:outline-[var(--interactive)]',
  outline:
    'border border-[var(--interactive)] bg-[var(--surface)] text-[var(--interactive)] hover:bg-[var(--interactive)]/10 focus-visible:outline-[var(--interactive)]',
  ghost:
    'text-[var(--interactive)] hover:bg-[var(--interactive)]/10 focus-visible:outline-[var(--interactive)]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  default: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

const cn = (...inputs: Array<string | undefined | null | false>) =>
  inputs.filter(Boolean).join(' ');

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = 'Button';
