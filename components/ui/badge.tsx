import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/90',
        secondary:
          'border-white/60 bg-white/40 text-[#2477A8] dark:border-border dark:bg-secondary dark:text-secondary-foreground',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'border-white/60 text-[#2477A8] dark:border-border dark:text-foreground',
        botanical:
          'border-emerald-500/30 bg-emerald-500/15 text-emerald-800 hover:bg-emerald-500/25 dark:border-emerald-500/30 dark:bg-emerald-950/60 dark:text-emerald-400',
        sale:
          'border-rose-500/30 bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 dark:border-rose-500/30 dark:bg-rose-950/60 dark:text-rose-400',
        citrus:
          'border-amber-500/30 bg-amber-500/15 text-amber-800 hover:bg-amber-500/25 dark:border-amber-500/30 dark:bg-amber-950/60 dark:text-amber-400',
        brand:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/90',
        pill:
          'border-white/65 bg-white/45 text-[#2477A8] hover:bg-white/65 dark:bg-card dark:border-border dark:text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
