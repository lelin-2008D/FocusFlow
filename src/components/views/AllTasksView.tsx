import React, { useState } from 'react'
import { ListTodo } from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'
import { QuickAddTask } from '../tasks/QuickAddTask'
import { TaskList } from '../tasks/TaskList'
import { SearchBar } from '../common/SearchBar'
import { TaskFilters } from '../tasks/TaskFilters'
import type { Task, Priority, Category } from '../../types/task'

interface AllTasksViewProps {
  onEditTask: (task: Task) => void
  projectId?: string | 'all'
}

export const AllTasksView: React.FC<AllTasksViewProps> = ({ onEditTask, projectId = 'all' }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [priority, setPriority] = useState<Priority | 'all'>('all')
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title' | 'createdAt'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const { tasks, isLoading } = useTasks('all', {
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
            <ListTodo className="h-6 w-6 text-brand-violet" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white light:text-slate-900">
              All Tasks
            </h2>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-600 mt-0.5">
            Full view across all your projects and categories
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
        emptyMessage="No tasks found"
        emptySubtext="Add tasks using the input above."
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  )
}
