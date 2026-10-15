import React, { useState } from 'react'
import {
  CheckCircle2,
  Circle,
  Clock,
  Edit2,
  Trash2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Tag,
  AlertCircle,
  Bell,
  Timer,
} from 'lucide-react'
import type { Task } from '../../types/task'
import { Badge } from '../common/Badge'
import { SubtaskList } from './SubtaskList'
import { formatDueDate, isTaskOverdue } from '../../utils/dateUtils'
import { computeSnooze, type SnoozeDuration } from '../../utils/recurrenceUtils'
import { taskService } from '../../services/taskService'
import { useTaskSubtasks } from '../../hooks/useTasks'
import { cn } from '../../utils/cn'

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  isTrashView?: boolean
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  isTrashView = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const isOverdue = isTaskOverdue(task)
  const formattedDue = formatDueDate(task.dueDate, task.dueTime)
  const { totalCount, completedCount } = useTaskSubtasks(task.id)

  const handleToggle = async () => {
    if (isTrashView) return
    try {
      await taskService.toggleComplete(task.id)
    } catch (err) {
      console.error('Failed to toggle task:', err)
    }
  }

  const handleMoveToTrash = async () => {
    try {
      await taskService.moveToTrash(task.id)
    } catch (err) {
      console.error('Failed to move to trash:', err)
    }
  }

  const handleRestore = async () => {
    try {
      await taskService.restoreFromTrash(task.id)
    } catch (err) {
      console.error('Failed to restore task:', err)
    }
  }

  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false)

  const handleSnooze = async (duration: SnoozeDuration) => {
    try {
      const targetDate = computeSnooze(duration)
      const datePart = targetDate.toISOString().split('T')[0]
      const hours = String(targetDate.getHours()).padStart(2, '0')
      const mins = String(targetDate.getMinutes()).padStart(2, '0')
      const timePart = `${hours}:${mins}`

      await taskService.updateTask(task.id, {
        dueDate: datePart,
        dueTime: timePart,
        reminderTime: targetDate.toISOString(),
      })
      setShowSnoozeMenu(false)
    } catch (err) {
      console.error('Failed to snooze task:', err)
    }
  }

  const handlePermanentDelete = async () => {
    if (window.confirm('Permanently delete this task and all its subtasks?')) {
      try {
        await taskService.permanentlyDelete(task.id)
      } catch (err) {
        console.error('Failed to delete permanently:', err)
      }
    }
  }

  return (
    <div
      className={cn(
        'group relative rounded-2xl border transition-all duration-200 p-4.5',
        task.completed
          ? 'bg-navy-900/40 light:bg-slate-50/80 border-slate-800/60 light:border-slate-200/80 opacity-75'
          : 'glass-panel glass-panel-hover',
        isOverdue && !task.completed && 'border-rose-500/40 shadow-[0_0_15px_-3px_rgba(244,63,94,0.15)]'
      )}
    >
      <div className="flex items-start gap-3.5">
        {/* Completion Checkbox */}
        {!isTrashView ? (
          <button
            onClick={handleToggle}
            className="mt-0.5 text-slate-400 hover:text-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-full transition-transform active:scale-90"
            aria-label={`Mark task "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
          >
            {task.completed ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
            ) : (
              <Circle className="h-5 w-5 text-slate-500 group-hover:text-slate-300 transition-colors" />
            )}
          </button>
        ) : (
          <div className="mt-0.5 text-slate-600">
            <Trash2 className="h-4 w-4" />
          </div>
        )}

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              onClick={() => !isTrashView && onEdit && onEdit(task)}
              className={cn(
                'text-sm font-semibold tracking-tight transition-colors cursor-pointer select-text',
                task.completed
                  ? 'line-through text-slate-500 light:text-slate-400'
                  : 'text-slate-100 light:text-slate-900 hover:text-brand-blue'
              )}
            >
              {task.title}
            </h3>

            {/* Action buttons */}
            <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              {!isTrashView ? (
                <>
                  {!task.completed && (
                    <div className="relative">
                      <button
                        onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
                        className="p-1 rounded-md text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                        title="Snooze task"
                        aria-label="Snooze task"
                      >
                        <Timer className="h-3.5 w-3.5" />
                      </button>

                      {showSnoozeMenu && (
                        <div className="absolute right-0 top-full mt-1 w-36 rounded-xl glass-panel shadow-2xl p-1 z-30 border border-slate-700 light:border-slate-300 text-left">
                          <button
                            onClick={() => handleSnooze('5m')}
                            className="w-full text-left px-2 py-1.5 text-[11px] rounded-lg hover:bg-slate-800 light:hover:bg-slate-100 text-slate-300 light:text-slate-700"
                          >
                            + 5 minutes
                          </button>
                          <button
                            onClick={() => handleSnooze('15m')}
                            className="w-full text-left px-2 py-1.5 text-[11px] rounded-lg hover:bg-slate-800 light:hover:bg-slate-100 text-slate-300 light:text-slate-700"
                          >
                            + 15 minutes
                          </button>
                          <button
                            onClick={() => handleSnooze('1h')}
                            className="w-full text-left px-2 py-1.5 text-[11px] rounded-lg hover:bg-slate-800 light:hover:bg-slate-100 text-slate-300 light:text-slate-700"
                          >
                            + 1 hour
                          </button>
                          <button
                            onClick={() => handleSnooze('tomorrow_morning')}
                            className="w-full text-left px-2 py-1.5 text-[11px] rounded-lg hover:bg-slate-800 light:hover:bg-slate-100 text-slate-300 light:text-slate-700"
                          >
                            Tomorrow 9 AM
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {onEdit && (
                    <button
                      onClick={() => onEdit(task)}
                      className="p-1 rounded-md text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-slate-800 light:hover:bg-slate-200 transition-colors"
                      aria-label="Edit task"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={handleMoveToTrash}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    aria-label="Move to trash"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleRestore}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded-md text-emerald-400 hover:bg-emerald-500/15 transition-colors"
                    aria-label="Restore task"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={handlePermanentDelete}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded-md text-rose-400 hover:bg-rose-500/15 transition-colors"
                    aria-label="Delete permanently"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className="mt-1 text-xs text-slate-400 light:text-slate-600 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Badges & Metadata */}
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Badge variant="priority" priority={task.priority} size="sm">
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Badge>

            <Badge variant="category" category={task.category} size="sm">
              <Tag className="h-2.5 w-2.5 mr-0.5" />
              {task.category}
            </Badge>

            {formattedDue && (
              <Badge
                variant={isOverdue ? 'overdue' : 'default'}
                size="sm"
                className={cn(isOverdue ? 'text-rose-400' : 'text-slate-400')}
              >
                {isOverdue ? <AlertCircle className="h-2.5 w-2.5 mr-0.5 text-rose-400" /> : <Clock className="h-2.5 w-2.5 mr-0.5" />}
                {formattedDue}
              </Badge>
            )}

            {task.reminderEnabled && (
              <Badge size="sm" className="text-amber-400 bg-amber-500/10 border-amber-500/30">
                <Bell className="h-2.5 w-2.5 mr-0.5" />
                <span>{task.reminderRule && task.reminderRule !== 'once' ? `${task.reminderRule}` : 'Reminder'}</span>
              </Badge>
            )}

            {/* Subtasks expand trigger */}
            {totalCount > 0 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-800/80 text-violet-300 border border-violet-500/30 hover:bg-violet-500/20 transition-colors"
              >
                <span>{completedCount}/{totalCount} subtasks</span>
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
          </div>

          {/* Collapsible Subtask Checklist */}
          {isExpanded && !isTrashView && (
            <SubtaskList taskId={task.id} isEditable={true} />
          )}
        </div>
      </div>
    </div>
  )
}
