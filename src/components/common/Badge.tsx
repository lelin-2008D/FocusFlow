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

  let variantStyles = 'bg-slate-800/80 text-slate-300 border border-slate-700/60'

  if (variant === 'priority' && priority) {
    switch (priority) {
      case 'urgent':
        variantStyles = 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
        break
      case 'high':
        variantStyles = 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
        break
      case 'medium':
        variantStyles = 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
        break
      case 'low':
        variantStyles = 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
        break
    }
  } else if (variant === 'category' && category) {
    switch (category) {
      case 'coding':
        variantStyles = 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
        break
      case 'work':
        variantStyles = 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
        break
      case 'personal':
        variantStyles = 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
        break
      case 'study':
        variantStyles = 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
        break
      case 'health':
        variantStyles = 'bg-rose-400/15 text-rose-400 border border-rose-400/30'
        break
      case 'finance':
        variantStyles = 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
        break
      default:
        variantStyles = 'bg-slate-700/30 text-slate-400 border border-slate-600/30'
    }
  } else if (variant === 'overdue') {
    variantStyles = 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
  } else if (variant === 'success') {
    variantStyles = 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
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
