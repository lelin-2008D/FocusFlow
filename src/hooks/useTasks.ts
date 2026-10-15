import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Priority, Category } from '../types/task'
import { isTaskOverdue, isTaskDueToday, isTaskUpcoming } from '../utils/dateUtils'

export interface TaskFilterOptions {
  searchQuery?: string
  priority?: Priority | 'all'
  category?: Category | 'all'
  projectId?: string | 'all'
  sortBy?: 'dueDate' | 'priority' | 'title' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export function useTasks(view: 'today' | 'upcoming' | 'overdue' | 'completed' | 'all' | 'trash', filters: TaskFilterOptions = {}) {
  const tasks = useLiveQuery(
    async () => {
      let collection = db.tasks.toCollection()

      const allTasks = await collection.toArray()

      // 1. Filter by View
      let filtered = allTasks.filter((task) => {
        if (view === 'trash') {
          return task.isTrash === true
        }

        // Active views ignore trashed tasks
        if (task.isTrash) return false

        switch (view) {
          case 'today':
            return isTaskDueToday(task) && !task.completed
          case 'upcoming':
            return isTaskUpcoming(task) && !task.completed
          case 'overdue':
            return isTaskOverdue(task)
          case 'completed':
            return task.completed === true
          case 'all':
            return true
          default:
            return true
        }
      })

      // 2. Filter by search query
      if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
        const query = filters.searchQuery.toLowerCase().trim()
        filtered = filtered.filter(
          (t) =>
            t.title.toLowerCase().includes(query) ||
            (t.description && t.description.toLowerCase().includes(query)) ||
            t.category.toLowerCase().includes(query)
        )
      }

      // 3. Filter by priority
      if (filters.priority && filters.priority !== 'all') {
        filtered = filtered.filter((t) => t.priority === filters.priority)
      }

      // 4. Filter by category
      if (filters.category && filters.category !== 'all') {
        filtered = filtered.filter((t) => t.category === filters.category)
      }

      // 5. Filter by project
      if (filters.projectId && filters.projectId !== 'all') {
        filtered = filtered.filter((t) => t.projectId === filters.projectId)
      }

      return filtered
    },
    [view, filters.searchQuery, filters.priority, filters.category, filters.projectId]
  )

  return {
    tasks: tasks ?? [],
    isLoading: tasks === undefined,
  }
}

export function useTaskCounts() {
  const counts = useLiveQuery(async () => {
    const all = await db.tasks.toArray()
    let today = 0
    let upcoming = 0
    let overdue = 0
    let completed = 0
    let allActive = 0
    let trash = 0

    all.forEach((task) => {
      if (task.isTrash) {
        trash++
        return
      }
      if (task.completed) {
        completed++
      } else {
        allActive++
        if (isTaskDueToday(task)) today++
        else if (isTaskUpcoming(task)) upcoming++
        else if (isTaskOverdue(task)) overdue++
      }
    })

    return { today, upcoming, overdue, completed, allActive, trash }
  })

  return counts ?? { today: 0, upcoming: 0, overdue: 0, completed: 0, allActive: 0, trash: 0 }
}

export function useTaskSubtasks(taskId: string) {
  const subtasks = useLiveQuery(
    async () => {
      if (!taskId) return []
      return await db.subtasks.where('taskId').equals(taskId).sortBy('order')
    },
    [taskId]
  )

  const completedCount = subtasks?.filter((s) => s.completed).length ?? 0
  const totalCount = subtasks?.length ?? 0

  return {
    subtasks: subtasks ?? [],
    completedCount,
    totalCount,
    progress: totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100),
  }
}

export function useProjects() {
  const projects = useLiveQuery(async () => {
    return await db.projects.toArray()
  })

  return projects ?? []
}
