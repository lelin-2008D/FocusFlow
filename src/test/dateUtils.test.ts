import { describe, it, expect } from 'vitest'
import { formatDueDate, isTaskOverdue, isTaskDueToday, isTaskUpcoming, sortTasks } from '../utils/dateUtils'
import type { Task } from '../types/task'

describe('Date Utilities & Task Sorting', () => {
  const todayStr = new Date().toISOString().split('T')[0]
  
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const mockTask = (overrides: Partial<Task>): Task => ({
    id: 't-1',
    title: 'Test Task',
    priority: 'medium',
    category: 'coding',
    completed: false,
    isTrash: false,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  })

  it('formats due dates accurately with today, tomorrow, and yesterday labels', () => {
    expect(formatDueDate(todayStr, '14:00')).toBe('Today at 14:00')
    expect(formatDueDate(tomorrowStr)).toBe('Tomorrow')
    expect(formatDueDate(yesterdayStr)).toBe('Yesterday')
  })

  it('identifies overdue tasks correctly', () => {
    const overdueTask = mockTask({ dueDate: yesterdayStr })
    const todayTask = mockTask({ dueDate: todayStr })
    const completedOverdue = mockTask({ dueDate: yesterdayStr, completed: true })
    const trashedOverdue = mockTask({ dueDate: yesterdayStr, isTrash: true })

    expect(isTaskOverdue(overdueTask)).toBe(true)
    expect(isTaskOverdue(todayTask)).toBe(false)
    expect(isTaskOverdue(completedOverdue)).toBe(false)
    expect(isTaskOverdue(trashedOverdue)).toBe(false)
  })

  it('identifies today and upcoming tasks', () => {
    const todayTask = mockTask({ dueDate: todayStr })
    const upcomingTask = mockTask({ dueDate: tomorrowStr })

    expect(isTaskDueToday(todayTask)).toBe(true)
    expect(isTaskDueToday(upcomingTask)).toBe(false)
    expect(isTaskUpcoming(upcomingTask)).toBe(true)
    expect(isTaskUpcoming(todayTask)).toBe(false)
  })

  it('sorts tasks by priority descending (Urgent > High > Medium > Low)', () => {
    const tasks: Task[] = [
      mockTask({ id: '1', priority: 'low' }),
      mockTask({ id: '2', priority: 'urgent' }),
      mockTask({ id: '3', priority: 'high' }),
      mockTask({ id: '4', priority: 'medium' }),
    ]

    const sorted = sortTasks(tasks, 'priority', 'asc')
    expect(sorted.map((t) => t.priority)).toEqual(['urgent', 'high', 'medium', 'low'])
  })

  it('sorts tasks by due date ascending', () => {
    const tasks: Task[] = [
      mockTask({ id: '1', dueDate: tomorrowStr }),
      mockTask({ id: '2', dueDate: yesterdayStr }),
      mockTask({ id: '3', dueDate: todayStr }),
    ]

    const sorted = sortTasks(tasks, 'dueDate', 'asc')
    expect(sorted.map((t) => t.dueDate)).toEqual([yesterdayStr, todayStr, tomorrowStr])
  })
})
