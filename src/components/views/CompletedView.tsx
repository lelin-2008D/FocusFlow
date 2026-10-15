import React, { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'
import { TaskList } from '../tasks/TaskList'
import { SearchBar } from '../common/SearchBar'
import { TaskFilters } from '../tasks/TaskFilters'
import type { Task, Priority, Category } from '../../types/task'

interface CompletedViewProps {
  onEditTask: (task: Task) => void
  projectId?: string | 'all'
}

export const CompletedView: React.FC<CompletedViewProps> = ({ onEditTask, projectId = 'all' }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [priority, setPriority] = useState<Priority | 'all'>('all')
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title' | 'createdAt'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const { tasks, isLoading } = useTasks('completed', {
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
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white light:text-slate-900">
              Completed Tasks
            </h2>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-600 mt-0.5">
            Everything you've achieved so far
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
        emptyMessage="No completed tasks yet"
        emptySubtext="When you complete tasks, they'll show up here with time stamps."
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  )
}
