import React, { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'
import { TaskList } from '../tasks/TaskList'
import { SearchBar } from '../common/SearchBar'
import { TaskFilters } from '../tasks/TaskFilters'
import type { Task, Priority, Category } from '../../types/task'

interface OverdueViewProps {
  onEditTask: (task: Task) => void
  projectId?: string | 'all'
}

export const OverdueView: React.FC<OverdueViewProps> = ({ onEditTask, projectId = 'all' }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [priority, setPriority] = useState<Priority | 'all'>('all')
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title' | 'createdAt'>('priority')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const { tasks, isLoading } = useTasks('overdue', {
    searchQuery,
    priority,
    category,
    projectId,
    sortBy,
    sortOrder,
  })

  return (
    <div className="space-y-5 animate-fade-in pb-24 md:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-forest-800/80 light:border-mint-200">
        <div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-rose-500 light:text-rose-700 animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-mint-100 light:text-forest-950">
              Overdue Tasks
            </h2>
          </div>
          <p className="text-xs text-rose-400/90 light:text-rose-700 mt-0.5">
            Tasks past their due date that need your immediate attention
          </p>
        </div>
      </div>

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
        emptyMessage="No overdue tasks!"
        emptySubtext="You are completely up to date. Excellent work!"
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  )
}
