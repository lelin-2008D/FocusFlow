import { describe, it, expect, vi, beforeEach } from 'vitest'
import { db } from '../db'
import { reminderEngine } from '../services/reminderEngine'
import { pushManager } from '../services/pushManager'

describe('ReminderEngine Client Scheduler', () => {
  beforeEach(async () => {
    await db.tasks.clear()
    await db.settings.clear()
    vi.restoreAllMocks()
  })

  it('scans and dispatches alert for due task', async () => {
    const showPreviewSpy = vi.spyOn(pushManager, 'showLocalPreview').mockResolvedValue(undefined)

    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

    await db.tasks.add({
      id: 'task-test-due',
      title: 'Review PR & Push to Main',
      order: 0,
      completed: false,
      isTrash: false,
      priority: 'high',
      category: 'coding',
      reminderEnabled: true,
      reminderTime: fiveMinutesAgo.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    })

    await db.settings.add({
      id: 'current_user_settings',
      theme: 'dark',
      soundEnabled: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      defaultPriority: 'medium',
      defaultCategory: 'coding',
    })

    await reminderEngine.checkReminders()

    expect(showPreviewSpy).toHaveBeenCalledWith(
      expect.stringContaining('Task Reminder: Review PR & Push to Main'),
      expect.any(String),
      'task-test-due',
      true
    )
  })

  it('suppresses audio and alert delivery when inside quiet hours', async () => {
    const showPreviewSpy = vi.spyOn(pushManager, 'showLocalPreview').mockResolvedValue(undefined)

    const now = new Date()
    const dueTime = new Date(now.getTime() - 2 * 60 * 1000)

    // Current hour
    const currentHour = now.getHours()
    const startHourStr = String(Math.max(0, currentHour - 1)).padStart(2, '0') + ':00'
    const endHourStr = String(Math.min(23, currentHour + 1)).padStart(2, '0') + ':00'

    await db.tasks.add({
      id: 'task-quiet',
      title: 'Quiet Task',
      order: 1,
      completed: false,
      isTrash: false,
      priority: 'low',
      category: 'personal',
      reminderEnabled: true,
      reminderTime: dueTime.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    })

    await db.settings.add({
      id: 'current_user_settings',
      theme: 'dark',
      soundEnabled: true,
      quietHoursEnabled: true,
      quietHoursStart: startHourStr,
      quietHoursEnd: endHourStr,
      defaultPriority: 'medium',
      defaultCategory: 'coding',
    })

    await reminderEngine.checkReminders()

    expect(showPreviewSpy).not.toHaveBeenCalled()
  })
})
