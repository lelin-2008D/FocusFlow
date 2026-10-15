import React from 'react'
import { cn } from '../../utils/cn'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean
  glow?: boolean
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  hoverEffect = false,
  glow = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'glass-panel rounded-2xl p-5 shadow-glass-sm transition-all duration-200',
        hoverEffect && 'glass-panel-hover cursor-pointer',
        glow && 'hover:shadow-glass-glow',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
