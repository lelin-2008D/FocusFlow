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
      className="glass-panel rounded-2xl p-3 border border-forest-800/80 light:border-mint-200 shadow-glass-sm focus-within:border-mint-400/50 focus-within:shadow-glass-glow transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!title.trim() || isSubmitting}
          className="p-2 rounded-xl bg-gradient-to-r from-forest-900 to-emerald-700 text-mint-100 disabled:opacity-40 hover:from-forest-800 hover:to-emerald-600 border border-mint-400/20 transition-all shrink-0 shadow-sm"
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
          className="flex-1 bg-transparent border-none text-sm text-mint-100 light:text-forest-950 placeholder:text-mint-300 light:placeholder:text-forest-700 focus:outline-none"
        />

        {title && (
          <button
            type="submit"
            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-mint-100 font-medium shadow-sm transition-colors border border-mint-400/30"
          >
            Add
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-forest-800/80 light:border-mint-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Priority, Category, Date Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Selector */}
            <div className="flex items-center gap-1 bg-forest-950/60 light:bg-mint-50/80 rounded-lg px-2 py-1 border border-forest-800 light:border-mint-200">
              <Flame className="h-3 w-3 text-amber-400 light:text-amber-700" />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="bg-transparent text-mint-100 light:text-forest-900 focus:outline-none cursor-pointer"
              >
                <option value="urgent" className="bg-forest-900 text-mint-100">Urgent</option>
                <option value="high" className="bg-forest-900 text-mint-100">High</option>
                <option value="medium" className="bg-forest-900 text-mint-100">Medium</option>
                <option value="low" className="bg-forest-900 text-mint-100">Low</option>
              </select>
            </div>

            {/* Category Selector */}
            <div className="flex items-center gap-1 bg-forest-950/60 light:bg-mint-50/80 rounded-lg px-2 py-1 border border-forest-800 light:border-mint-200">
              <Tag className="h-3 w-3 text-mint-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="bg-transparent text-mint-100 light:text-forest-900 focus:outline-none cursor-pointer"
              >
                <option value="coding" className="bg-forest-900 text-mint-100">Coding</option>
                <option value="work" className="bg-forest-900 text-mint-100">Work</option>
                <option value="personal" className="bg-forest-900 text-mint-100">Personal</option>
                <option value="study" className="bg-forest-900 text-mint-100">Study</option>
                <option value="health" className="bg-forest-900 text-mint-100">Health</option>
                <option value="finance" className="bg-forest-900 text-mint-100">Finance</option>
                <option value="other" className="bg-forest-900 text-mint-100">Other</option>
              </select>
            </div>

            {/* Quick Date Presets */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={setToday}
                className={`px-2 py-1 rounded-lg border text-[11px] transition-colors ${
                  dueDate === new Date().toISOString().split('T')[0]
                    ? 'bg-emerald-700/30 text-mint-300 border-mint-400/40'
                    : 'bg-forest-950/40 light:bg-mint-50/80 text-forest-400 border-forest-800 light:border-mint-200 hover:text-mint-200'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={setTomorrow}
                className="px-2 py-1 rounded-lg border text-[11px] bg-forest-950/40 light:bg-mint-50/80 text-forest-400 border-forest-800 light:border-mint-200 hover:text-mint-200 transition-colors"
              >
                Tomorrow
              </button>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-forest-950/60 light:bg-mint-50/80 text-mint-100 light:text-forest-900 border border-forest-800 light:border-mint-200 rounded-lg px-2 py-0.5 text-[11px] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsExpanded(false)
              setTitle('')
            }}
            className="text-forest-500 hover:text-forest-300 text-xs"
          >
            Cancel
          </button>
        </div>
      )}
    </form>
  )
}
