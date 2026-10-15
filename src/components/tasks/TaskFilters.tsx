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
    <div className="flex flex-wrap items-center justify-between gap-2.5 py-2 text-xs">
      {/* Filter Pickers */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 bg-navy-900/60 light:bg-slate-100 border border-slate-800 light:border-slate-300 rounded-xl px-2.5 py-1 text-slate-300 light:text-slate-700">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[11px] text-slate-500 font-medium">Priority:</span>
          <select
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value as any)}
            className="bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-navy-900 text-white">All Priorities</option>
            <option value="urgent" className="bg-navy-900 text-white">Urgent</option>
            <option value="high" className="bg-navy-900 text-white">High</option>
            <option value="medium" className="bg-navy-900 text-white">Medium</option>
            <option value="low" className="bg-navy-900 text-white">Low</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 bg-navy-900/60 light:bg-slate-100 border border-slate-800 light:border-slate-300 rounded-xl px-2.5 py-1 text-slate-300 light:text-slate-700">
          <span className="text-[11px] text-slate-500 font-medium">Category:</span>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as any)}
            className="bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-navy-900 text-white">All Categories</option>
            <option value="coding" className="bg-navy-900 text-white">Coding</option>
            <option value="work" className="bg-navy-900 text-white">Work</option>
            <option value="personal" className="bg-navy-900 text-white">Personal</option>
            <option value="study" className="bg-navy-900 text-white">Study</option>
            <option value="health" className="bg-navy-900 text-white">Health</option>
            <option value="finance" className="bg-navy-900 text-white">Finance</option>
            <option value="other" className="bg-navy-900 text-white">Other</option>
          </select>
        </div>
      </div>

      {/* Sort Selector */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-navy-900/60 light:bg-slate-100 border border-slate-800 light:border-slate-300 rounded-xl px-2.5 py-1 text-slate-300 light:text-slate-700">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[11px] text-slate-500 font-medium">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as any)}
            className="bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="dueDate" className="bg-navy-900 text-white">Due Date</option>
            <option value="priority" className="bg-navy-900 text-white">Priority</option>
            <option value="title" className="bg-navy-900 text-white">Title</option>
            <option value="createdAt" className="bg-navy-900 text-white">Created Date</option>
          </select>
          <button
            onClick={onSortOrderToggle}
            className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 hover:bg-slate-700 text-violet-400"
            title={`Switch to ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          >
            {sortOrder}
          </button>
        </div>
      </div>
    </div>
  )
}
