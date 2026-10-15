import React, { useState } from 'react'
import { format } from 'date-fns'
import { Calendar } from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'
import { QuickAddTask } from '../tasks/QuickAddTask'
import { TaskList } from '../tasks/TaskList'
import { SearchBar } from '../common/SearchBar'
import { TaskFilters } from '../tasks/TaskFilters'
import type { Task, Priority, Category } from '../../types/task'

interface TodayViewProps {
  onEditTask: (task: Task) => void
  projectId?: string | 'all'
}

export const TodayView: React.FC<TodayViewProps> = ({ onEditTask, projectId = 'all' }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [priority, setPriority] = useState<Priority | 'all'>('all')
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title' | 'createdAt'>('priority')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const { tasks, isLoading } = useTasks('today', {
    searchQuery,
    priority,
    category,
    projectId,
    sortBy,
    sortOrder,
  })

  const todayFormatted = format(new Date(), 'EEEE, MMMM d, yyyy')

  return (
    <div className="space-y-5 animate-fade-in pb-20 md:pb-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80 light:border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-brand-blue" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white light:text-slate-900">
              Today
            </h2>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-600 mt-0.5">{todayFormatted}</p>
        </div>
      </div>

      {/* Quick Add Task */}
      <QuickAddTask />

      {/* Search and Filters */}
      <div className="space-y-2">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <TaskFilters
          priority={priority}
          category={category}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onPriorityChange={setPriority}
          onCategoryChange={setCategory}
          onSortByChange={setSortBy}
          onSortOrderToggle={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
        />
      </div>

      {/* Task List */}
      <TaskList
        tasks={tasks}
        isLoading={isLoading}
        onEditTask={onEditTask}
        emptyMessage="Nothing due today!"
        emptySubtext="Enjoy your day or add a task above to keep your momentum going."
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  )
}
