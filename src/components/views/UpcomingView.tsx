import React, { useState } from 'react'
import { Clock } from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'
import { QuickAddTask } from '../tasks/QuickAddTask'
import { TaskList } from '../tasks/TaskList'
import { SearchBar } from '../common/SearchBar'
import { TaskFilters } from '../tasks/TaskFilters'
import type { Task, Priority, Category } from '../../types/task'

interface UpcomingViewProps {
  onEditTask: (task: Task) => void
  projectId?: string | 'all'
}

export const UpcomingView: React.FC<UpcomingViewProps> = ({ onEditTask, projectId = 'all' }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [priority, setPriority] = useState<Priority | 'all'>('all')
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title' | 'createdAt'>('dueDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const { tasks, isLoading } = useTasks('upcoming', {
    searchQuery,
    priority,
    category,
    projectId,
    sortBy,
    sortOrder,
  })

  return (
    <div className="space-y-5 animate-fade-in pb-20 md:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80 light:border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-indigo-400" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white light:text-slate-900">
              Upcoming Tasks
            </h2>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-600 mt-0.5">
            Tasks scheduled for tomorrow and beyond
          </p>
        </div>
      </div>

      <QuickAddTask />

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

      <TaskList
        tasks={tasks}
        isLoading={isLoading}
        onEditTask={onEditTask}
        emptyMessage="No upcoming tasks"
        emptySubtext="Plan ahead by scheduling tasks with future due dates."
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  )
}
