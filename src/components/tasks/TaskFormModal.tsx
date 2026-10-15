import React, { useState, useEffect } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { useProjects } from '../../hooks/useTasks'
import { taskService } from '../../services/taskService'
import type { Task, Priority, Category, RecurrenceRule } from '../../types/task'

interface TaskFormModalProps {
  isOpen: boolean
  onClose: () => void
  taskToEdit?: Task | null
  defaultDueDate?: string
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  defaultDueDate,
}) => {
  const projects = useProjects()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [category, setCategory] = useState<Category>('coding')
  const [projectId, setProjectId] = useState<string>('')
  const [dueDate, setDueDate] = useState<string>('')
  const [dueTime, setDueTime] = useState<string>('')
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [reminderRule, setReminderRule] = useState<RecurrenceRule>('once')
  const [subtasksInput, setSubtasksInput] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title)
      setDescription(taskToEdit.description || '')
      setPriority(taskToEdit.priority)
      setCategory(taskToEdit.category)
      setProjectId(taskToEdit.projectId || '')
      setDueDate(taskToEdit.dueDate || '')
      setDueTime(taskToEdit.dueTime || '')
      setReminderEnabled(taskToEdit.reminderEnabled || false)
      setReminderRule(taskToEdit.reminderRule || 'once')
      setSubtasksInput('')
    } else {
      setTitle('')
      setDescription('')
      setPriority('medium')
      setCategory('coding')
      setProjectId('')
      setDueDate(defaultDueDate || '')
      setDueTime('')
      setReminderEnabled(false)
      setReminderRule('once')
      setSubtasksInput('')
    }
    setError(null)
  }, [taskToEdit, isOpen, defaultDueDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Please provide a task title')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        category,
        projectId: projectId || undefined,
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
        reminderEnabled,
        reminderRule: reminderEnabled ? reminderRule : undefined,
      }

      if (taskToEdit) {
        await taskService.updateTask(taskToEdit.id, payload)
      } else {
        const initialSubtasks = subtasksInput
          .split('\n')
          .map((s) => s.trim())
          .filter((s) => s.length > 0)

        await taskService.createTask(payload, initialSubtasks)
      }

      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to save task')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Edit Task' : 'Create New Task'}
      description={taskToEdit ? 'Update details, priority, or due dates' : 'Add a task to your workflow with subtasks and priority'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Task Title */}
        <div>
          <label className="block text-xs font-medium text-slate-300 light:text-slate-700 mb-1">
            Task Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Implement Web Push service worker"
            autoFocus
            className="w-full px-3 py-2 rounded-xl glass-input text-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-300 light:text-slate-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Context, specifications, or notes..."
            className="w-full px-3 py-2 rounded-xl glass-input text-sm resize-none"
          />
        </div>

        {/* Priority & Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 light:text-slate-700 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full px-3 py-2 rounded-xl glass-input text-sm"
            >
              <option value="urgent" className="bg-navy-900 text-white">🔴 Urgent</option>
              <option value="high" className="bg-navy-900 text-white">🟠 High</option>
              <option value="medium" className="bg-navy-900 text-white">🔵 Medium</option>
              <option value="low" className="bg-navy-900 text-white">⚪ Low</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 light:text-slate-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-3 py-2 rounded-xl glass-input text-sm"
            >
              <option value="coding" className="bg-navy-900 text-white">💻 Coding</option>
              <option value="work" className="bg-navy-900 text-white">💼 Work</option>
              <option value="personal" className="bg-navy-900 text-white">👤 Personal</option>
              <option value="study" className="bg-navy-900 text-white">📚 Study</option>
              <option value="health" className="bg-navy-900 text-white">🧘 Health</option>
              <option value="finance" className="bg-navy-900 text-white">💰 Finance</option>
              <option value="other" className="bg-navy-900 text-white">📌 Other</option>
            </select>
          </div>
        </div>

        {/* Project Selector & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 light:text-slate-700 mb-1">
              Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-sm"
            >
              <option value="" className="bg-navy-900 text-white">No Project</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id} className="bg-navy-900 text-white">
                  {proj.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 light:text-slate-700 mb-1">
              Due Date & Time
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-sm"
              />
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-28 px-2 py-2 rounded-xl glass-input text-sm"
              />
            </div>
          </div>
        </div>

        {/* Reminder & Recurrence Controls */}
        <div className="p-3 rounded-xl bg-navy-950/60 light:bg-slate-100 border border-slate-800 light:border-slate-300 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-300 light:text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="h-4 w-4 rounded accent-violet-600 cursor-pointer"
              />
              <span>Enable Reminder & Web Push Notification</span>
            </label>
          </div>

          {reminderEnabled && (
            <div className="pt-2 border-t border-slate-800 light:border-slate-200 flex items-center gap-3">
              <label className="text-xs text-slate-400">Recurrence:</label>
              <select
                value={reminderRule}
                onChange={(e) => setReminderRule(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg glass-input text-xs"
              >
                <option value="once" className="bg-navy-900 text-white">One-time alert</option>
                <option value="daily" className="bg-navy-900 text-white">Daily</option>
                <option value="weekdays" className="bg-navy-900 text-white">Weekdays (Mon-Fri)</option>
                <option value="weekly" className="bg-navy-900 text-white">Weekly</option>
                <option value="monthly" className="bg-navy-900 text-white">Monthly</option>
              </select>
            </div>
          )}
        </div>

        {/* Initial Subtasks (for new task creation) */}
        {!taskToEdit && (
          <div>
            <label className="block text-xs font-medium text-slate-300 light:text-slate-700 mb-1">
              Initial Subtasks (one per line)
            </label>
            <textarea
              value={subtasksInput}
              onChange={(e) => setSubtasksInput(e.target.value)}
              rows={2}
              placeholder="Subtask 1&#10;Subtask 2"
              className="w-full px-3 py-2 rounded-xl glass-input text-xs resize-none"
            />
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 light:border-slate-200 flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {taskToEdit ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
