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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-slate-800/80 light:border-slate-300 backdrop-blur-glass px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
      <div className="flex items-center justify-around">
        <button
          onClick={() => onSelectView('today')}
          className={cn(
            'flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-colors',
            activeView === 'today' ? 'text-brand-blue font-bold' : 'text-slate-400'
          )}
        >
          <Calendar className="h-4 w-4" />
          <span>Today</span>
        </button>

        <button
          onClick={() => onSelectView('upcoming')}
          className={cn(
            'flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-colors',
            activeView === 'upcoming' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          )}
        >
          <Clock className="h-4 w-4" />
          <span>Upcoming</span>
        </button>

        {/* Center Quick Add Button */}
        <button
          onClick={onOpenNewTaskModal}
          className="flex items-center justify-center -mt-5 h-12 w-12 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-glass-glow border-2 border-navy-950 active:scale-95 transition-transform"
          aria-label="Add new task"
        >
          <Plus className="h-6 w-6" />
        </button>

        <button
          onClick={() => onSelectView('all')}
          className={cn(
            'flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-colors',
            activeView === 'all' ? 'text-brand-violet font-bold' : 'text-slate-400'
          )}
        >
          <ListTodo className="h-4 w-4" />
          <span>All Tasks</span>
        </button>

        <button
          onClick={() => onSelectView('completed')}
          className={cn(
            'flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-colors',
            activeView === 'completed' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Done</span>
        </button>
      </div>
    </div>
  )
}
