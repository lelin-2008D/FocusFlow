import React, { useState } from 'react'
import { Plus, Tag, Flame } from 'lucide-react'
import { taskService } from '../../services/taskService'
import type { Priority, Category } from '../../types/task'

interface QuickAddTaskProps {
  defaultCategory?: Category
  onTaskCreated?: () => void
}

export const QuickAddTask: React.FC<QuickAddTaskProps> = ({
  defaultCategory = 'coding',
  onTaskCreated,
}) => {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [category, setCategory] = useState<Category>(defaultCategory)
  const [dueDate, setDueDate] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await taskService.createTask({
        title: title.trim(),
        priority,
        category,
        dueDate: dueDate || undefined,
      })

      setTitle('')
      setIsExpanded(false)
      onTaskCreated?.()
    } catch (err) {
      console.error('Failed to create task:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const setToday = () => {
    setDueDate(new Date().toISOString().split('T')[0])
  }

  const setTomorrow = () => {
    const tmrw = new Date()
    tmrw.setDate(tmrw.getDate() + 1)
    setDueDate(tmrw.toISOString().split('T')[0])
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel rounded-2xl p-3 border border-slate-700/60 light:border-slate-300 shadow-glass-sm focus-within:border-brand-violet/50 focus-within:shadow-glass-glow transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!title.trim() || isSubmitting}
          className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white disabled:opacity-40 hover:from-blue-500 hover:to-violet-500 transition-all shrink-0"
          aria-label="Add task"
        >
          <Plus className="h-4 w-4" />
        </button>

        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (!isExpanded && e.target.value.length > 0) {
              setIsExpanded(true)
            }
          }}
          onFocus={() => setIsExpanded(true)}
          placeholder="Add a new task (e.g. Refactor API routes)..."
          className="flex-1 bg-transparent border-none text-sm text-slate-100 light:text-slate-900 placeholder:text-slate-500 focus:outline-none"
        />

        {title && (
          <button
            type="submit"
            className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium shadow-sm transition-colors"
          >
            Add
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 light:border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Priority, Category, Date Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Selector */}
            <div className="flex items-center gap-1 bg-navy-950/60 light:bg-slate-100 rounded-lg px-2 py-1 border border-slate-800 light:border-slate-300">
              <Flame className="h-3 w-3 text-amber-400" />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="bg-transparent text-slate-300 light:text-slate-700 focus:outline-none"
              >
                <option value="urgent" className="bg-navy-900 text-white">Urgent</option>
                <option value="high" className="bg-navy-900 text-white">High</option>
                <option value="medium" className="bg-navy-900 text-white">Medium</option>
                <option value="low" className="bg-navy-900 text-white">Low</option>
              </select>
            </div>

            {/* Category Selector */}
            <div className="flex items-center gap-1 bg-navy-950/60 light:bg-slate-100 rounded-lg px-2 py-1 border border-slate-800 light:border-slate-300">
              <Tag className="h-3 w-3 text-cyan-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="bg-transparent text-slate-300 light:text-slate-700 focus:outline-none"
              >
                <option value="coding" className="bg-navy-900 text-white">Coding</option>
                <option value="work" className="bg-navy-900 text-white">Work</option>
                <option value="personal" className="bg-navy-900 text-white">Personal</option>
                <option value="study" className="bg-navy-900 text-white">Study</option>
                <option value="health" className="bg-navy-900 text-white">Health</option>
                <option value="finance" className="bg-navy-900 text-white">Finance</option>
                <option value="other" className="bg-navy-900 text-white">Other</option>
              </select>
            </div>

            {/* Quick Date Presets */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={setToday}
                className={`px-2 py-1 rounded-lg border text-[11px] transition-colors ${
                  dueDate === new Date().toISOString().split('T')[0]
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                    : 'bg-navy-950/40 light:bg-slate-100 text-slate-400 border-slate-800 light:border-slate-300 hover:text-slate-200'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={setTomorrow}
                className="px-2 py-1 rounded-lg border text-[11px] bg-navy-950/40 light:bg-slate-100 text-slate-400 border-slate-800 light:border-slate-300 hover:text-slate-200 transition-colors"
              >
                Tomorrow
              </button>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-navy-950/60 light:bg-slate-100 text-slate-300 light:text-slate-700 border border-slate-800 light:border-slate-300 rounded-lg px-2 py-0.5 text-[11px] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsExpanded(false)
              setTitle('')
            }}
            className="text-slate-500 hover:text-slate-300 text-xs"
          >
            Cancel
          </button>
        </div>
      )}
    </form>
  )
}
