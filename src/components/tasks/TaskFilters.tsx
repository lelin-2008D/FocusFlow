import React from 'react'
import { Filter, ArrowUpDown } from 'lucide-react'
import type { Priority, Category } from '../../types/task'

interface TaskFiltersProps {
  priority: Priority | 'all'
  category: Category | 'all'
  sortBy: 'dueDate' | 'priority' | 'title' | 'createdAt'
  sortOrder: 'asc' | 'desc'
  onPriorityChange: (p: Priority | 'all') => void
  onCategoryChange: (c: Category | 'all') => void
  onSortByChange: (s: 'dueDate' | 'priority' | 'title' | 'createdAt') => void
  onSortOrderToggle: () => void
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  priority,
  category,
  sortBy,
  sortOrder,
  onPriorityChange,
  onCategoryChange,
  onSortByChange,
  onSortOrderToggle,
}) => {
  return (
    <div className="flex w-full flex-wrap items-center justify-start gap-2.5 py-2 text-xs sm:justify-between">
      {/* Filter Pickers */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 bg-forest-900/70 light:bg-mint-100/90 border border-mint-400/20 light:border-forest-700/20 rounded-xl px-2.5 py-1 text-mint-100 light:text-forest-950 backdrop-blur-sm">
          <Filter className="h-3.5 w-3.5 text-mint-400 light:text-forest-700" />
          <span className="text-[11px] text-mint-300 light:text-forest-700 font-medium">Priority:</span>
          <select
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value as any)}
            aria-label="Filter tasks by priority"
            className="max-w-[10.5rem] bg-transparent cursor-pointer rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-400/70 text-mint-100 light:text-forest-950"
          >
            <option value="all" className="bg-forest-900 text-mint-100">All Priorities</option>
            <option value="urgent" className="bg-forest-900 text-mint-100">Urgent</option>
            <option value="high" className="bg-forest-900 text-mint-100">High</option>
            <option value="medium" className="bg-forest-900 text-mint-100">Medium</option>
            <option value="low" className="bg-forest-900 text-mint-100">Low</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 bg-forest-900/70 light:bg-mint-100/90 border border-mint-400/20 light:border-forest-700/20 rounded-xl px-2.5 py-1 text-mint-100 light:text-forest-950 backdrop-blur-sm">
          <span className="text-[11px] text-mint-300 light:text-forest-700 font-medium">Category:</span>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as any)}
            aria-label="Filter tasks by category"
            className="max-w-[9.5rem] bg-transparent cursor-pointer rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-400/70 text-mint-100 light:text-forest-950"
          >
            <option value="all" className="bg-forest-900 text-mint-100">All Categories</option>
            <option value="coding" className="bg-forest-900 text-mint-100">Coding</option>
            <option value="work" className="bg-forest-900 text-mint-100">Work</option>
            <option value="personal" className="bg-forest-900 text-mint-100">Personal</option>
            <option value="study" className="bg-forest-900 text-mint-100">Study</option>
            <option value="health" className="bg-forest-900 text-mint-100">Health</option>
            <option value="finance" className="bg-forest-900 text-mint-100">Finance</option>
            <option value="other" className="bg-forest-900 text-mint-100">Other</option>
          </select>
        </div>
      </div>

      {/* Sort Selector */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-forest-900/70 light:bg-mint-100/90 border border-mint-400/20 light:border-forest-700/20 rounded-xl px-2.5 py-1 text-mint-100 light:text-forest-950 backdrop-blur-sm">
          <ArrowUpDown className="h-3.5 w-3.5 text-mint-400 light:text-forest-700" />
          <span className="text-[11px] text-mint-300 light:text-forest-700 font-medium">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as any)}
            aria-label="Sort tasks by"
            className="max-w-[8rem] bg-transparent cursor-pointer rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-400/70 text-mint-100 light:text-forest-950"
          >
            <option value="dueDate" className="bg-forest-900 text-mint-100">Due Date</option>
            <option value="priority" className="bg-forest-900 text-mint-100">Priority</option>
            <option value="title" className="bg-forest-900 text-mint-100">Title</option>
            <option value="createdAt" className="bg-forest-900 text-mint-100">Created Date</option>
          </select>
          <button
            onClick={onSortOrderToggle}
            aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-forest-800 hover:bg-forest-700 light:bg-emerald-700 light:hover:bg-emerald-800 text-mint-300 light:text-white border border-mint-400/25 transition-colors"
            title={`Switch to ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          >
            {sortOrder}
          </button>
        </div>
      </div>
    </div>
  )
}
