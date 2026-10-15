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
      badgeColor: 'bg-blue-500/20 text-blue-400',
    },
    {
      id: 'upcoming' as ActiveView,
      label: 'Upcoming',
      icon: Clock,
      count: counts.upcoming,
      badgeColor: 'bg-indigo-500/20 text-indigo-400',
    },
    {
      id: 'overdue' as ActiveView,
      label: 'Overdue',
      icon: AlertCircle,
      count: counts.overdue,
      badgeColor: counts.overdue > 0 ? 'bg-rose-500/20 text-rose-400 font-bold' : 'bg-slate-800 text-slate-500',
    },
    {
      id: 'all' as ActiveView,
      label: 'All Active',
      icon: ListTodo,
      count: counts.allActive,
      badgeColor: 'bg-violet-500/20 text-violet-400',
    },
    {
      id: 'completed' as ActiveView,
      label: 'Completed',
      icon: CheckCircle2,
      count: counts.completed,
      badgeColor: 'bg-emerald-500/20 text-emerald-400',
    },
    {
      id: 'trash' as ActiveView,
      label: 'Trash',
      icon: Trash2,
      count: counts.trash,
      badgeColor: 'bg-slate-800 text-slate-400',
    },
  ]

  return (
    <aside
      className={cn(
        'w-64 glass-panel border-r border-slate-800/80 light:border-slate-200/80 p-4 flex flex-col justify-between shrink-0 h-[calc(100vh-61px)] sticky top-[61px] overflow-y-auto',
        className
      )}
    >
      <div className="space-y-6">
        {/* Navigation list */}
        <div>
          <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
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
                      ? 'bg-gradient-to-r from-blue-600/20 to-violet-600/25 text-white light:text-slate-900 border border-violet-500/30 shadow-sm'
                      : 'text-slate-400 light:text-slate-600 hover:text-slate-100 light:hover:text-slate-900 hover:bg-slate-800/40 light:hover:bg-slate-100'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn('h-4 w-4', isActive ? 'text-violet-400' : 'text-slate-500')} />
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
            <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Projects
            </h3>
          </div>
          <div className="space-y-1">
            <button
              onClick={() => onSelectProject('all')}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors',
                selectedProjectId === 'all'
                  ? 'text-white light:text-slate-900 bg-slate-800/50 light:bg-slate-100'
                  : 'text-slate-400 light:text-slate-600 hover:text-slate-100 hover:bg-slate-800/40'
              )}
            >
              <Folder className="h-4 w-4 text-slate-500" />
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
                      ? 'text-white light:text-slate-900 bg-slate-800/60 light:bg-slate-100 border border-slate-700/80'
                      : 'text-slate-400 light:text-slate-600 hover:text-slate-100 hover:bg-slate-800/40'
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
      <div className="p-3 rounded-xl bg-navy-900/60 light:bg-slate-100 border border-slate-800 light:border-slate-300 text-[11px] text-slate-400 light:text-slate-600 space-y-1">
        <div className="font-semibold text-slate-300 light:text-slate-800">IndexedDB Local Engine</div>
        <div>100% Offline Compatible</div>
        <div className="text-[10px] text-violet-400 font-medium">Phase 1 Complete</div>
      </div>
    </aside>
  )
}
