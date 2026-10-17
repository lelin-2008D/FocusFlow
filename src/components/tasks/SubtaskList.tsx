import React, { useState } from 'react'
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { useTaskSubtasks } from '../../hooks/useTasks'
import { taskService } from '../../services/taskService'

interface SubtaskListProps {
  taskId: string
  isEditable?: boolean
}

export const SubtaskList: React.FC<SubtaskListProps> = ({ taskId, isEditable = true }) => {
  const { subtasks, completedCount, totalCount, progress } = useTaskSubtasks(taskId)
  const [newTitle, setNewTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!newTitle.trim()) return

    try {
      await taskService.addSubtask(taskId, newTitle.trim())
      setNewTitle('')
      setIsAdding(false)
    } catch (err) {
      console.error('Failed to add subtask:', err)
    }
  }

  const handleToggle = async (id: string) => {
    try {
      await taskService.toggleSubtask(id)
    } catch (err) {
      console.error('Failed to toggle subtask:', err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await taskService.deleteSubtask(id)
    } catch (err) {
      console.error('Failed to delete subtask:', err)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-forest-800/60 light:border-mint-200">
      {/* Progress header */}
      <div className="flex items-center justify-between text-xs text-forest-400 light:text-forest-600 mb-2">
        <span className="font-medium">
          Subtasks ({completedCount}/{totalCount})
        </span>
        <span className="text-mint-400 font-semibold">{progress}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-forest-900/90 light:bg-mint-100 rounded-full overflow-hidden mb-3 border border-forest-800/40">
        <div
          className="h-full bg-gradient-to-r from-emerald-700 via-mint-400 to-mint-100 rounded-full transition-all duration-300 shadow-sm"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Subtask items */}
      <div className="space-y-1.5">
        {subtasks.map((sub) => (
          <div
            key={sub.id}
            className="group flex items-center justify-between py-1 px-2 rounded-lg hover:bg-forest-800/40 light:hover:bg-mint-100/60 transition-colors"
          >
            <button
              onClick={() => handleToggle(sub.id)}
              className="flex items-center gap-2 text-left flex-1 text-xs focus:outline-none focus:ring-1 focus:ring-mint-400 rounded"
              aria-label={`Mark subtask "${sub.title}" as ${sub.completed ? 'incomplete' : 'complete'}`}
            >
              {sub.completed ? (
                <CheckCircle2 className="h-4 w-4 text-mint-400 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-forest-500 shrink-0 hover:text-mint-300" />
              )}
              <span className={sub.completed ? 'line-through text-forest-500 light:text-forest-400' : 'text-mint-100 light:text-forest-900'}>
                {sub.title}
              </span>
            </button>

            {isEditable && (
              <button
                onClick={() => handleDelete(sub.id)}
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-1 text-forest-500 hover:text-rose-400 light:hover:text-rose-700 transition-opacity"
                aria-label={`Delete subtask ${sub.title}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Subtask */}
      {isEditable && (
        <div className="mt-2">
          {isAdding ? (
            <form onSubmit={handleAdd} className="flex items-center gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter subtask title..."
                autoFocus
                className="flex-1 text-xs px-2.5 py-1.5 rounded-lg glass-input"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsAdding(false)
                }}
              />
              <button
                type="submit"
                className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-mint-100 font-medium border border-mint-400/30 shadow-sm"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs px-2 py-1.5 text-forest-400 hover:text-mint-100"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1.5 text-xs text-forest-400 hover:text-mint-400 pt-1 font-medium transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add subtask</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
