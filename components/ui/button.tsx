import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-semibold',
        destructive: 'bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-sm font-medium',
        outline: 'border border-white/65 bg-white/40 text-[#2477A8] hover:bg-white/65 hover:text-primary backdrop-blur-sm dark:border-[#343A40] dark:bg-[#191C1F] dark:text-[#F5F7F8] dark:hover:bg-[#25292D] dark:hover:text-[#FFFFFF] dark:backdrop-blur-none',
        secondary: 'bg-white/40 text-[#2477A8] border border-white/65 hover:bg-white/65 hover:text-primary backdrop-blur-sm dark:bg-[#202428] dark:text-[#F5F7F8] dark:border-[#343A40] dark:hover:bg-[#2B3035] dark:hover:text-white dark:backdrop-blur-none',
        ghost: 'text-[#2477A8] hover:bg-white/40 hover:text-primary dark:text-[#A7ADB4] dark:hover:bg-[#25292D] dark:hover:text-[#F5F7F8]',
        link: 'text-primary underline-offset-4 hover:underline hover:text-primary/80',
        brand: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-semibold',
        pill: 'rounded-xl bg-white/40 text-[#2477A8] border border-white/65 hover:bg-white/65 hover:text-primary shadow-xs backdrop-blur-sm dark:bg-[#202428] dark:text-[#A7ADB4] dark:border-[#343A40] dark:hover:bg-[#25292D] dark:hover:text-[#F5F7F8] dark:backdrop-blur-none',
        pillActive: 'rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 border border-primary shadow-xs font-semibold',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-11 px-8 text-base',
        icon: 'h-10 w-10',
        pill: 'h-9 px-4 text-xs font-medium rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
