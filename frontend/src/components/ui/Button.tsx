import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'subtle';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none';

    const variants = {
      primary: 'bg-[#171717] text-[#D6B875] shadow-xs hover:bg-black active:scale-[0.98]',
      secondary: 'bg-slate-900 text-white shadow-sm hover:bg-slate-800 active:scale-[0.98]',
      outline: 'border border-[#E4DEC8] bg-[#FAF8F3] text-[#171717] hover:bg-[#ECEAE4] active:bg-[#E4DEC8]',
      ghost: 'text-[#686359] hover:bg-[#ECEAE4] hover:text-[#171717]',
      danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:scale-[0.98]',
      subtle: 'bg-[#FAF8F3] text-[#171717] border border-[#E4DEC8] hover:bg-[#ECEAE4]',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5',
      icon: 'h-10 w-10 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
