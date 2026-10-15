import { db } from '../db'
import type { Task, Subtask, UserSettings, TaskInput } from '../types/task'
import { TaskInputSchema, SubtaskInputSchema } from '../types/task'
import { soundService } from './audioService'
import { syncEngine } from './syncEngine'

export class TaskService {
  /**
   * Create a new task with validation and Dexie persistence
   */
  async createTask(input: TaskInput, subtaskTitles: string[] = []): Promise<Task> {
    const validated = TaskInputSchema.parse(input)
    const now = new Date().toISOString()
    const id = `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Count existing tasks to determine default order
    const count = await db.tasks.count()

    const newTask: Task = {
      id,
      title: validated.title,
      description: validated.description || '',
      priority: validated.priority,
      category: validated.category,
      projectId: validated.projectId || undefined,
      dueDate: validated.dueDate || undefined,
      dueTime: validated.dueTime || undefined,
      completed: false,
      isTrash: false,
      order: count + 1,
      createdAt: now,
      updatedAt: now,
      reminderEnabled: validated.reminderEnabled ?? false,
      reminderTime: validated.reminderTime || undefined,
      reminderRule: validated.reminderRule || undefined,
    }

    await db.transaction('rw', db.tasks, db.subtasks, db.outbox, async () => {
      await db.tasks.add(newTask)
      await syncEngine.enqueueMutation('task', newTask.id, 'create', newTask)

      if (subtaskTitles.length > 0) {
        const subtasks: Subtask[] = subtaskTitles
          .filter((t) => t.trim().length > 0)
          .map((title, index) => ({
            id: `sub_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`,
            taskId: id,
            title: title.trim(),
            completed: false,
            order: index + 1,
            createdAt: now,
          }))

        if (subtasks.length > 0) {
          await db.subtasks.bulkAdd(subtasks)
          for (const sub of subtasks) {
            await syncEngine.enqueueMutation('subtask', sub.id, 'create', sub)
          }
        }
      }
    })

    return newTask
  }

  /**
   * Update task fields with validation
   */
  async updateTask(id: string, updates: Partial<TaskInput>): Promise<void> {
    const existing = await db.tasks.get(id)
    if (!existing) {
      throw new Error(`Task with id ${id} not found`)
    }

    const now = new Date().toISOString()
    const merged: Task = {
      ...existing,
      ...updates,
      updatedAt: now,
    }

    await db.transaction('rw', db.tasks, db.outbox, async () => {
      await db.tasks.update(id, merged)
      await syncEngine.enqueueMutation('task', id, 'update', merged)
    })
  }

  /**
   * Toggle task completion and play completion audio feedback
   */
  async toggleComplete(id: string, playSound: boolean = true): Promise<boolean> {
    const task = await db.tasks.get(id)
    if (!task) throw new Error('Task not found')

    const newCompleted = !task.completed
    const now = new Date().toISOString()

    const updatedTask: Task = {
      ...task,
      completed: newCompleted,
      completedAt: newCompleted ? now : undefined,
      updatedAt: now,
    }

    await db.transaction('rw', db.tasks, db.outbox, async () => {
      await db.tasks.update(id, updatedTask)
      await syncEngine.enqueueMutation('task', id, 'update', updatedTask)
    })

    if (newCompleted && playSound) {
      soundService.playComplete()
    }

    return newCompleted
  }

  /**
   * Soft-delete a task (move to Trash)
   */
  async moveToTrash(id: string): Promise<void> {
    const task = await db.tasks.get(id)
    if (!task) return

    const now = new Date().toISOString()
    const updated = {
      ...task,
      isTrash: true,
      trashedAt: now,
      updatedAt: now,
    }

    await db.transaction('rw', db.tasks, db.outbox, async () => {
      await db.tasks.update(id, updated)
      await syncEngine.enqueueMutation('task', id, 'update', updated)
    })
  }

  /**
   * Restore a task from Trash
   */
  async restoreFromTrash(id: string): Promise<void> {
    const task = await db.tasks.get(id)
    if (!task) return

    const now = new Date().toISOString()
    const updated = {
      ...task,
      isTrash: false,
      trashedAt: undefined,
      updatedAt: now,
    }

    await db.transaction('rw', db.tasks, db.outbox, async () => {
      await db.tasks.update(id, updated)
      await syncEngine.enqueueMutation('task', id, 'update', updated)
    })
  }

  /**
   * Permanently delete a task and all associated subtasks
   */
  async permanentlyDelete(id: string): Promise<void> {
    await db.transaction('rw', db.tasks, db.subtasks, db.outbox, async () => {
      const subtasks = await db.subtasks.where('taskId').equals(id).toArray()
      for (const sub of subtasks) {
        await syncEngine.enqueueMutation('subtask', sub.id, 'delete', null)
      }
      await db.subtasks.where('taskId').equals(id).delete()
      await db.tasks.delete(id)
      await syncEngine.enqueueMutation('task', id, 'delete', null)
    })
  }

  /**
   * Empty all items in Trash
   */
  async emptyTrash(): Promise<void> {
    const trashedTasks = await db.tasks.where('isTrash').equals(1 as any).toArray()
    const trashedIds = trashedTasks.map((t) => t.id)

    await db.transaction('rw', db.tasks, db.subtasks, db.outbox, async () => {
      for (const id of trashedIds) {
        const subtasks = await db.subtasks.where('taskId').equals(id).toArray()
        for (const sub of subtasks) {
          await syncEngine.enqueueMutation('subtask', sub.id, 'delete', null)
        }
        await db.subtasks.where('taskId').equals(id).delete()
        await syncEngine.enqueueMutation('task', id, 'delete', null)
      }
      await db.tasks.where('isTrash').equals(1 as any).delete()
    })
  }

  /**
   * Subtask CRUD
   */
  async addSubtask(taskId: string, title: string): Promise<Subtask> {
    SubtaskInputSchema.parse({ title })
    const now = new Date().toISOString()
    const count = await db.subtasks.where('taskId').equals(taskId).count()

    const newSubtask: Subtask = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      taskId,
      title: title.trim(),
      completed: false,
      order: count + 1,
      createdAt: now,
    }

    await db.transaction('rw', db.subtasks, db.outbox, async () => {
      await db.subtasks.add(newSubtask)
      await syncEngine.enqueueMutation('subtask', newSubtask.id, 'create', newSubtask)
    })
    return newSubtask
  }

  async toggleSubtask(id: string, playSound: boolean = true): Promise<boolean> {
    const subtask = await db.subtasks.get(id)
    if (!subtask) throw new Error('Subtask not found')

    const newCompleted = !subtask.completed
    const updated = { ...subtask, completed: newCompleted }
    
    await db.transaction('rw', db.subtasks, db.outbox, async () => {
      await db.subtasks.update(id, updated)
      await syncEngine.enqueueMutation('subtask', id, 'update', updated)
    })

    if (playSound) {
      soundService.playSubtaskToggle()
    }
    return newCompleted
  }

  async deleteSubtask(id: string): Promise<void> {
    await db.transaction('rw', db.subtasks, db.outbox, async () => {
      await db.subtasks.delete(id)
      await syncEngine.enqueueMutation('subtask', id, 'delete', null)
    })
  }

  async updateSubtaskTitle(id: string, title: string): Promise<void> {
    SubtaskInputSchema.parse({ title })
    const subtask = await db.subtasks.get(id)
    if (subtask) {
      const updated = { ...subtask, title: title.trim() }
      await db.transaction('rw', db.subtasks, db.outbox, async () => {
        await db.subtasks.update(id, updated)
        await syncEngine.enqueueMutation('subtask', id, 'update', updated)
      })
    }
  }

  /**
   * Settings
   */
  async getSettings(): Promise<UserSettings> {
    const settings = await db.settings.get('current_user_settings')
    if (settings) return settings

    const defaultSettings: UserSettings = {
      id: 'current_user_settings',
      theme: 'dark',
      soundEnabled: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      defaultPriority: 'medium',
      defaultCategory: 'coding',
    }
    await db.settings.put(defaultSettings)
    return defaultSettings
  }

  async updateSettings(updates: Partial<UserSettings>): Promise<void> {
    await db.settings.update('current_user_settings', updates)
  }
}

export const taskService = new TaskService()
