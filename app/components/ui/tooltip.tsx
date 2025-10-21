'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

type TooltipContentProps = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>;

const TooltipContent = ({ className, sideOffset = 6, ...props }: TooltipContentProps) => (
  <TooltipPrimitive.Content
    sideOffset={sideOffset}
    className={`rounded-md border border-[color:var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--foreground)] shadow-lg ${className ?? ''}`}
    {...props}
  />
);

TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
