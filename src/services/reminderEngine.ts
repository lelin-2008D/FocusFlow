import { db } from '../db'
import { taskService } from './taskService'
import { pushManager } from './pushManager'
import {
  computeNextOccurrence,
  isWithinQuietHours,
  isOverdueBeyondThreshold,
} from '../utils/recurrenceUtils'
import type { Task, UserSettings } from '../types/task'

export class ReminderEngine {
  private intervalId: any = null
  private notifiedTaskKeys: Set<string> = new Set()
  private isChecking = false

  constructor() {
    // Restore already notified keys in current session
    try {
      const stored = sessionStorage.getItem('focusflow_notified_reminders')
      if (stored) {
        const arr = JSON.parse(stored)
        if (Array.isArray(arr)) {
          this.notifiedTaskKeys = new Set(arr)
        }
      }
    } catch {
      // ignore
    }
  }

  /**
   * Starts periodic scanning for due reminders and tasks
   */
  start(intervalMs = 12000): void {
    if (this.intervalId) return

    // Run initial scan
    this.checkReminders().catch(() => {})

    // Periodic interval
    this.intervalId = setInterval(() => {
      this.checkReminders().catch(() => {})
    }, intervalMs)

    // Run when browser tab becomes active/visible
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', this.handleVisibilityOrFocus)
      document.addEventListener('visibilitychange', this.handleVisibilityOrFocus)
    }
  }

  /**
   * Stops periodic scanning
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', this.handleVisibilityOrFocus)
      document.removeEventListener('visibilitychange', this.handleVisibilityOrFocus)
    }
  }

  private handleVisibilityOrFocus = (): void => {
    if (typeof document !== 'undefined' && !document.hidden) {
      this.checkReminders().catch(() => {})
    }
  }

  /**
   * Scans active tasks for due reminders
   */
  async checkReminders(): Promise<void> {
    if (this.isChecking) return
    this.isChecking = true

    try {
      const now = new Date()
      const nowTime = now.getTime()

      // Fetch user settings (quiet hours, sound preference)
      let settings: UserSettings
      try {
        settings = await taskService.getSettings()
      } catch {
        settings = {
          id: 'current_user_settings',
          theme: 'dark',
          soundEnabled: true,
          quietHoursEnabled: false,
          quietHoursStart: '22:00',
          quietHoursEnd: '07:00',
          defaultPriority: 'medium',
          defaultCategory: 'coding',
        }
      }

      // Query active non-completed tasks from IndexedDB
      const tasks = await db.tasks
        .filter((t: Task) => !t.completed && !t.isTrash && (!!t.reminderEnabled || !!t.dueDate))
        .toArray()

      for (const task of tasks) {
        const dueTimestamp = this.resolveDueTimestamp(task)
        if (!dueTimestamp) continue

        const dueTime = dueTimestamp.getTime()

        // Check if the task is due (now >= dueTime)
        if (nowTime >= dueTime) {
          // Burst prevention: if task is more than 24h overdue, suppress alert
          if (isOverdueBeyondThreshold(dueTimestamp, 24, now)) {
            continue
          }

          const notificationKey = `${task.id}_${dueTime}`
          if (this.notifiedTaskKeys.has(notificationKey)) {
            continue
          }

          // Check Quiet Hours
          const inQuietHours =
            settings.quietHoursEnabled &&
            isWithinQuietHours(now, settings.quietHoursStart, settings.quietHoursEnd)

          // If in quiet hours, skip audio and alert delivery for now
          if (inQuietHours) {
            continue
          }

          // Mark as notified
          this.notifiedTaskKeys.add(notificationKey)
          this.persistNotifiedKeys()

          // Trigger local push notification and audio alert
          const title = `Task Reminder: ${task.title}`
          const body = task.description
            ? task.description
            : task.dueTime
            ? `Scheduled for ${task.dueTime}`
            : 'This task is due today.'

          await pushManager.showLocalPreview(title, body, task.id, settings.soundEnabled)

          // If task has recurring rule (daily, weekdays, weekly, monthly), advance to next occurrence
          if (task.reminderRule && task.reminderRule !== 'once') {
            const nextDate = computeNextOccurrence(dueTimestamp, task.reminderRule, task.dueTime)
            if (nextDate) {
              const datePart = nextDate.toISOString().split('T')[0]
              await taskService.updateTask(task.id, {
                dueDate: datePart,
                reminderTime: nextDate.toISOString(),
              })
            }
          }
        }
      }
    } catch (err) {
      console.warn('ReminderEngine check failed:', err)
    } finally {
      this.isChecking = false
    }
  }

  /**
   * Resolves Date object for when a task is due or when reminder is set
   */
  private resolveDueTimestamp(task: Task): Date | null {
    if (task.reminderTime) {
      const d = new Date(task.reminderTime)
      if (!isNaN(d.getTime())) return d
    }

    if (task.dueDate) {
      const timeStr = task.dueTime || '09:00'
      const combined = `${task.dueDate}T${timeStr}:00`
      const d = new Date(combined)
      if (!isNaN(d.getTime())) return d
    }

    return null
  }

  private persistNotifiedKeys(): void {
    try {
      const arr = Array.from(this.notifiedTaskKeys).slice(-100) // keep last 100
      sessionStorage.setItem('focusflow_notified_reminders', JSON.stringify(arr))
    } catch {
      // ignore
    }
  }
}

export const reminderEngine = new ReminderEngine()
