import React from 'react'
import { cn } from '../../utils/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]'

    const variants = {
      primary: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white hover:from-blue-500 hover:to-violet-500 shadow-md hover:shadow-glass-glow focus:ring-violet-500 focus:ring-offset-navy-950 border border-violet-500/20',
      secondary: 'glass-panel text-slate-200 light:text-slate-700 hover:bg-navy-800/80 light:hover:bg-slate-100 hover:border-slate-500/30 focus:ring-blue-500 focus:ring-offset-navy-950',
      outline: 'border border-slate-700 light:border-slate-300 text-slate-300 light:text-slate-700 hover:bg-slate-800/40 light:hover:bg-slate-100 focus:ring-blue-500',
      danger: 'bg-rose-600/90 text-white hover:bg-rose-500 shadow-sm focus:ring-rose-500 focus:ring-offset-navy-950 border border-rose-500/30',
      ghost: 'text-slate-400 hover:text-slate-100 light:hover:text-slate-900 hover:bg-slate-800/40 light:hover:bg-slate-200/60 focus:ring-slate-500',
    }

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 rounded-lg gap-1.5',
      md: 'text-sm px-3.5 py-2 rounded-xl gap-2',
      lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5',
      icon: 'p-2 rounded-lg',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'
