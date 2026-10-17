import React from 'react'
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  ListTodo,
  Trash2,
  Folder,
} from 'lucide-react'
import { useTaskCounts, useProjects } from '../../hooks/useTasks'
import { cn } from '../../utils/cn'

export type ActiveView = 'today' | 'upcoming' | 'overdue' | 'all' | 'completed' | 'trash'

interface SidebarProps {
  activeView: ActiveView
  onSelectView: (view: ActiveView) => void
  selectedProjectId?: string | 'all'
  onSelectProject: (projectId: string | 'all') => void
  className?: string
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  selectedProjectId = 'all',
  onSelectProject,
  className,
}) => {
  const counts = useTaskCounts()
  const projects = useProjects()

  const navItems = [
    {
      id: 'today' as ActiveView,
      label: 'Today',
      icon: Calendar,
      count: counts.today,
      badgeColor: 'bg-emerald-700/25 light:bg-mint-100 text-mint-300 light:text-forest-900 border border-mint-400/25 light:border-forest-700/20',
    },
    {
      id: 'upcoming' as ActiveView,
      label: 'Upcoming',
      icon: Clock,
      count: counts.upcoming,
      badgeColor: 'bg-forest-800/80 light:bg-mint-100 text-mint-200 light:text-forest-900 border border-mint-400/25 light:border-forest-700/20',
    },
    {
      id: 'overdue' as ActiveView,
      label: 'Overdue',
      icon: AlertCircle,
      count: counts.overdue,
      badgeColor: counts.overdue > 0 ? 'bg-rose-500/20 light:bg-rose-50 text-rose-400 light:text-rose-800 font-bold border border-rose-500/30 light:border-rose-700/20' : 'bg-forest-900/80 text-forest-500 border border-forest-800/40',
    },
    {
      id: 'all' as ActiveView,
      label: 'All Active',
      icon: ListTodo,
      count: counts.allActive,
      badgeColor: 'bg-mint-400/20 light:bg-mint-100 text-mint-100 light:text-forest-900 border border-mint-400/25 light:border-forest-700/20',
    },
    {
      id: 'completed' as ActiveView,
      label: 'Completed',
      icon: CheckCircle2,
      count: counts.completed,
      badgeColor: 'bg-emerald-600/20 light:bg-emerald-50 text-emerald-300 light:text-emerald-800 border border-emerald-500/30 light:border-emerald-700/20',
    },
    {
      id: 'trash' as ActiveView,
      label: 'Trash',
      icon: Trash2,
      count: counts.trash,
      badgeColor: 'bg-forest-900/60 text-forest-400 border border-forest-800/40',
    },
  ]

  return (
    <aside
      className={cn(
        'w-64 glass-panel border-r border-mint-400/15 light:border-forest-700/15 p-4 flex flex-col justify-between shrink-0 h-[calc(100vh-61px)] sticky top-[61px] overflow-y-auto',
        className
      )}
    >
      <div className="space-y-6">
        {/* Navigation list */}
        <div>
          <h3 className="text-[11px] font-semibold text-forest-500 uppercase tracking-wider px-3 mb-2">
            Views
          </h3>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeView === item.id && selectedProjectId === 'all'

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectView(item.id)
                    onSelectProject('all')
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150',
                    isActive
                      ? 'bg-gradient-to-r from-forest-900/90 to-forest-800/90 text-mint-100 light:text-white border border-mint-400/30 shadow-sm'
                      : 'text-forest-400 light:text-forest-700 hover:text-mint-100 light:hover:text-forest-950 hover:bg-forest-800/40 light:hover:bg-mint-100/60'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn('h-4 w-4', isActive ? 'text-mint-200 light:text-white' : 'text-forest-500')} />
                    <span>{item.label}</span>
                  </div>

                  {item.count > 0 && (
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide',
                        item.badgeColor
                      )}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Projects section */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className="text-[11px] font-semibold text-forest-500 uppercase tracking-wider">
              Projects
            </h3>
          </div>
          <div className="space-y-1">
            <button
              onClick={() => onSelectProject('all')}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors',
                selectedProjectId === 'all'
                  ? 'text-mint-100 light:text-forest-950 bg-forest-800/70 light:bg-mint-100 border border-mint-400/25'
                  : 'text-forest-400 light:text-forest-700 hover:text-mint-100 light:hover:text-forest-950 hover:bg-forest-800/40 light:hover:bg-mint-100/60'
              )}
            >
              <Folder className="h-4 w-4 text-mint-400" />
              <span>All Projects</span>
            </button>

            {projects.map((proj) => {
              const isSelected = selectedProjectId === proj.id

              return (
                <button
                  key={proj.id}
                  onClick={() => onSelectProject(proj.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors',
                    isSelected
                      ? 'text-mint-100 light:text-forest-950 bg-forest-800/70 light:bg-mint-100 border border-mint-400/25'
                      : 'text-forest-400 light:text-forest-700 hover:text-mint-100 light:hover:text-forest-950 hover:bg-forest-800/40 light:hover:bg-mint-100/60'
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: proj.color }}
                    />
                    <span className="truncate">{proj.name}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 rounded-xl bg-forest-900/70 light:bg-mint-100/70 border border-forest-800/70 light:border-mint-200 text-[11px] text-forest-400 light:text-forest-700 space-y-1">
        <div className="font-semibold text-mint-200 light:text-forest-900">IndexedDB Local Engine</div>
        <div>100% Offline Compatible</div>
        <div className="text-[10px] text-mint-400 font-medium">Luxury Forest Edition</div>
      </div>
    </aside>
  )
}
