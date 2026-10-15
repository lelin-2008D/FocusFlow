import React from 'react'
import { CheckCircle, Inbox } from 'lucide-react'
import type { Task } from '../../types/task'
import { TaskCard } from './TaskCard'
import { sortTasks } from '../../utils/dateUtils'

interface TaskListProps {
  tasks: Task[]
  isLoading?: boolean
  emptyMessage?: string
  emptySubtext?: string
  onEditTask?: (task: Task) => void
  isTrashView?: boolean
  sortBy?: 'dueDate' | 'priority' | 'title' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  isLoading = false,
  emptyMessage = 'No tasks found',
  emptySubtext = 'Create a task or change your filters to see your work.',
  onEditTask,
  isTrashView = false,
  sortBy = 'dueDate',
  sortOrder = 'asc',
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="h-24 rounded-2xl glass-panel animate-pulse-subtle bg-slate-800/30"
          />
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center border-dashed border-slate-700/60 light:border-slate-300">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500/10 to-violet-500/15 border border-violet-500/20 text-violet-400 mb-4">
          {isTrashView ? (
            <Inbox className="h-7 w-7" />
          ) : (
            <CheckCircle className="h-7 w-7" />
          )}
        </div>
        <h3 className="text-base font-semibold text-slate-100 light:text-slate-800 mb-1">
          {emptyMessage}
        </h3>
        <p className="text-xs text-slate-400 light:text-slate-600 max-w-sm mx-auto">
          {emptySubtext}
        </p>
      </div>
    )
  }

  const sortedTasks = sortTasks(tasks, sortBy, sortOrder)

  return (
    <div className="space-y-2.5">
      {sortedTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onEdit={onEditTask}
          isTrashView={isTrashView}
        />
      ))}
    </div>
  )
}
