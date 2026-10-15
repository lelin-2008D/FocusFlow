import { format, isToday, isTomorrow, isYesterday, parseISO, startOfDay, isBefore } from 'date-fns'
import type { Task, Priority } from '../types/task'

export function formatDueDate(dateStr?: string, timeStr?: string): string {
  if (!dateStr) return ''

  try {
    const date = parseISO(dateStr)
    let label = ''

    if (isToday(date)) {
      label = 'Today'
    } else if (isTomorrow(date)) {
      label = 'Tomorrow'
    } else if (isYesterday(date)) {
      label = 'Yesterday'
    } else {
      label = format(date, 'MMM d, yyyy')
    }

    if (timeStr) {
      return `${label} at ${timeStr}`
    }
    return label
  } catch {
    return dateStr
  }
}

export function isTaskOverdue(task: Task): boolean {
  if (task.completed || task.isTrash || !task.dueDate) return false

  try {
    const todayStart = startOfDay(new Date())
    const due = parseISO(task.dueDate)
    return isBefore(due, todayStart)
  } catch {
    return false
  }
}

export function isTaskDueToday(task: Task): boolean {
  if (task.completed || task.isTrash || !task.dueDate) return false

  try {
    const due = parseISO(task.dueDate)
    return isToday(due)
  } catch {
    return false
  }
}

export function isTaskUpcoming(task: Task): boolean {
  if (task.completed || task.isTrash || !task.dueDate) return false

  try {
    const todayStart = startOfDay(new Date())
    const due = parseISO(task.dueDate)
    return !isToday(due) && !isBefore(due, todayStart)
  } catch {
    return false
  }
}

export const PRIORITY_WEIGHTS: Record<Priority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
}

export function sortTasks(tasks: Task[], sortBy: 'dueDate' | 'priority' | 'title' | 'createdAt', order: 'asc' | 'desc' = 'asc'): Task[] {
  return [...tasks].sort((a, b) => {
    let comp = 0

    switch (sortBy) {
      case 'priority': {
        const weightA = PRIORITY_WEIGHTS[a.priority] || 0
        const weightB = PRIORITY_WEIGHTS[b.priority] || 0
        comp = weightB - weightA // higher priority first
        break
      }
      case 'dueDate': {
        if (!a.dueDate && !b.dueDate) comp = 0
        else if (!a.dueDate) comp = 1
        else if (!b.dueDate) comp = -1
        else comp = a.dueDate.localeCompare(b.dueDate)
        break
      }
      case 'title': {
        comp = a.title.localeCompare(b.title)
        break
      }
      case 'createdAt': {
        comp = a.createdAt.localeCompare(b.createdAt)
        break
      }
    }

    return order === 'desc' ? -comp : comp
  })
}
