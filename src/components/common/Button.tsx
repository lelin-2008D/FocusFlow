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
      primary: 'bg-gradient-to-r from-forest-900 via-forest-800 to-emerald-700 text-mint-100 hover:from-forest-800 hover:to-emerald-600 shadow-md hover:shadow-glass-glow focus:ring-mint-400 focus:ring-offset-forest-950 border border-mint-400/25',
      secondary: 'glass-panel text-mint-100 light:text-forest-900 hover:bg-forest-800/70 light:hover:bg-mint-50 hover:border-mint-400/35 focus:ring-mint-400 focus:ring-offset-forest-950',
      outline: 'border border-mint-400/30 light:border-forest-700/30 text-mint-100 light:text-forest-900 hover:bg-forest-800/40 light:hover:bg-mint-50 focus:ring-mint-400',
      danger: 'bg-rose-600/90 text-white hover:bg-rose-500 shadow-sm focus:ring-rose-500 focus:ring-offset-forest-950 border border-rose-500/30',
      ghost: 'text-forest-400 hover:text-mint-100 light:hover:text-forest-950 hover:bg-forest-800/40 light:hover:bg-forest-700/10 focus:ring-mint-400',
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
