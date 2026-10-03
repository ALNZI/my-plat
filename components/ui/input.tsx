import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-xl border border-white/65 bg-white/45 px-3.5 py-2 text-sm text-[#155A82] placeholder:text-[#6FA7C8] backdrop-blur-md focus-visible:outline-none focus-visible:border-[#84C9F8] focus-visible:ring-3 focus-visible:ring-[#84C9F8]/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors dark:border-[#343A40] dark:bg-[#202428] dark:text-[#F5F7F8] dark:placeholder:text-[#737A82] dark:ring-offset-[#111315] dark:focus-visible:border-[#10B981] dark:focus-visible:ring-1 dark:focus-visible:ring-[#10B981] dark:backdrop-blur-none',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
