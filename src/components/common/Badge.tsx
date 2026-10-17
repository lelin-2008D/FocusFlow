import React from 'react'
import { cn } from '../../utils/cn'
import type { Priority, Category } from '../../types/task'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'priority' | 'category' | 'default' | 'overdue' | 'success'
  priority?: Priority
  category?: Category
  size?: 'sm' | 'md'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  priority,
  category,
  size = 'md',
  className,
}) => {
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'

  let variantStyles = 'bg-forest-900/80 light:bg-mint-100 text-mint-300 light:text-forest-900 border border-forest-700/60 light:border-forest-700/20'

  if (variant === 'priority' && priority) {
    switch (priority) {
      case 'urgent':
        variantStyles = 'bg-rose-500/15 light:bg-rose-50 text-rose-400 light:text-rose-700 border border-rose-500/30 light:border-rose-700/20'
        break
      case 'high':
        variantStyles = 'bg-amber-500/15 light:bg-amber-50 text-amber-400 light:text-amber-800 border border-amber-500/30 light:border-amber-700/20'
        break
      case 'medium':
        variantStyles = 'bg-emerald-700/20 light:bg-mint-100 text-mint-300 light:text-forest-900 border border-mint-400/30 light:border-forest-700/20'
        break
      case 'low':
        variantStyles = 'bg-forest-800/50 light:bg-mint-100 text-forest-300 light:text-forest-900 border border-forest-700/40 light:border-forest-700/20'
        break
    }
  } else if (variant === 'category' && category) {
    switch (category) {
      case 'coding':
        variantStyles = 'bg-forest-800/80 light:bg-mint-100 text-mint-300 light:text-forest-900 border border-mint-400/30 light:border-forest-700/20'
        break
      case 'work':
        variantStyles = 'bg-emerald-700/25 light:bg-mint-100 text-mint-200 light:text-forest-900 border border-emerald-600/30 light:border-forest-700/20'
        break
      case 'personal':
        variantStyles = 'bg-emerald-600/20 light:bg-mint-100 text-mint-300 light:text-forest-900 border border-emerald-500/30 light:border-forest-700/20'
        break
      case 'study':
        variantStyles = 'bg-forest-800/60 light:bg-mint-100 text-mint-200 light:text-forest-900 border border-mint-300/30 light:border-forest-700/20'
        break
      case 'health':
        variantStyles = 'bg-rose-400/15 light:bg-rose-50 text-rose-400 light:text-rose-700 border border-rose-400/30 light:border-rose-700/20'
        break
      case 'finance':
        variantStyles = 'bg-emerald-800/40 light:bg-mint-100 text-mint-300 light:text-forest-900 border border-emerald-600/30 light:border-forest-700/20'
        break
      default:
        variantStyles = 'bg-forest-900/60 light:bg-mint-100 text-mint-400 light:text-forest-900 border border-forest-700/40 light:border-forest-700/20'
    }
  } else if (variant === 'overdue') {
    variantStyles = 'bg-red-500/20 light:bg-red-50 text-red-400 light:text-red-700 border border-red-500/40 light:border-red-700/20'
  } else if (variant === 'success') {
    variantStyles = 'bg-emerald-700/25 light:bg-mint-100 text-mint-300 light:text-forest-900 border border-mint-400/30 light:border-forest-700/20'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full backdrop-blur-xs tracking-wide',
        sizeStyles,
        variantStyles,
        className
      )}
    >
      {children}
    </span>
  )
}
