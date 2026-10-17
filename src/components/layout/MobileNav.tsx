import React from 'react'
import {
  Calendar,
  Clock,
  ListTodo,
  CheckCircle2,
  Plus,
} from 'lucide-react'
import type { ActiveView } from './Sidebar'
import { cn } from '../../utils/cn'

interface MobileNavProps {
  activeView: ActiveView
  onSelectView: (view: ActiveView) => void
  onOpenNewTaskModal: () => void
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeView,
  onSelectView,
  onOpenNewTaskModal,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-navbar border-t border-forest-800/80 light:border-forest-700/20 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
      <div className="flex items-center justify-around">
        <button
          onClick={() => onSelectView('today')}
          className={cn(
            'flex min-h-11 min-w-[3.25rem] flex-col items-center justify-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-colors',
            activeView === 'today' ? 'text-mint-400 font-bold' : 'text-forest-400 light:text-forest-600'
          )}
        >
          <Calendar className="h-4 w-4" />
          <span>Today</span>
        </button>

        <button
          onClick={() => onSelectView('upcoming')}
          className={cn(
            'flex min-h-11 min-w-[3.25rem] flex-col items-center justify-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-colors',
            activeView === 'upcoming' ? 'text-mint-300 light:text-forest-700 font-bold' : 'text-forest-400 light:text-forest-600'
          )}
        >
          <Clock className="h-4 w-4" />
          <span>Upcoming</span>
        </button>

        {/* Center Quick Add Button */}
        <button
          onClick={onOpenNewTaskModal}
          className="flex items-center justify-center -mt-5 h-12 w-12 rounded-full bg-gradient-to-tr from-forest-900 via-forest-800 to-emerald-700 text-mint-100 shadow-glass-glow border-2 border-forest-950 light:border-mint-50 active:scale-95 transition-transform"
          aria-label="Add new task"
        >
          <Plus className="h-6 w-6" />
        </button>

        <button
          onClick={() => onSelectView('all')}
          className={cn(
            'flex min-h-11 min-w-[3.25rem] flex-col items-center justify-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-colors',
            activeView === 'all' ? 'text-mint-200 light:text-forest-700 font-bold' : 'text-forest-400 light:text-forest-600'
          )}
        >
          <ListTodo className="h-4 w-4" />
          <span>All Tasks</span>
        </button>

        <button
          onClick={() => onSelectView('completed')}
          className={cn(
            'flex min-h-11 min-w-[3.25rem] flex-col items-center justify-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-colors',
            activeView === 'completed' ? 'text-emerald-400 light:text-emerald-700 font-bold' : 'text-forest-400 light:text-forest-600'
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Done</span>
        </button>
      </div>
    </div>
  )
}
