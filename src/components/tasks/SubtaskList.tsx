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
    <div className="mt-3 pt-3 border-t border-slate-700/50 light:border-slate-200">
      {/* Progress header */}
      <div className="flex items-center justify-between text-xs text-slate-400 light:text-slate-500 mb-2">
        <span className="font-medium">
          Subtasks ({completedCount}/{totalCount})
        </span>
        <span>{progress}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-slate-800 light:bg-slate-200 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Subtask items */}
      <div className="space-y-1.5">
        {subtasks.map((sub) => (
          <div
            key={sub.id}
            className="group flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-800/40 light:hover:bg-slate-100 transition-colors"
          >
            <button
              onClick={() => handleToggle(sub.id)}
              className="flex items-center gap-2 text-left flex-1 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 rounded"
              aria-label={`Mark subtask "${sub.title}" as ${sub.completed ? 'incomplete' : 'complete'}`}
            >
              {sub.completed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-slate-500 shrink-0 hover:text-slate-300" />
              )}
              <span className={sub.completed ? 'line-through text-slate-500 light:text-slate-400' : 'text-slate-200 light:text-slate-700'}>
                {sub.title}
              </span>
            </button>

            {isEditable && (
              <button
                onClick={() => handleDelete(sub.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
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
                className="text-xs px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs px-2 py-1.5 text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-400 pt-1 font-medium transition-colors"
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
