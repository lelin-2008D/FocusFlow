import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../db'
import { taskService } from '../services/taskService'

describe('TaskService & Dexie Persistence', () => {
  beforeEach(async () => {
    if (!db.isOpen()) {
      await db.open()
    }
    await db.tasks.clear()
    await db.subtasks.clear()
    await db.outbox.clear()
  })

  it('creates a new task and persists it in IndexedDB', async () => {
    const task = await taskService.createTask({
      title: 'Complete Phase 1 FocusFlow',
      priority: 'urgent',
      category: 'coding',
      dueDate: '2026-10-15',
      dueTime: '18:00',
    }, ['Write Vitest tests', 'Verify builds'])

    expect(task.id).toBeDefined()
    expect(task.title).toBe('Complete Phase 1 FocusFlow')
    expect(task.priority).toBe('urgent')
    expect(task.completed).toBe(false)

    // Verify stored in Dexie
    const retrieved = await db.tasks.get(task.id)
    expect(retrieved).toBeDefined()
    expect(retrieved?.title).toBe('Complete Phase 1 FocusFlow')

    // Verify subtasks were created
    const subtasks = await db.subtasks.where('taskId').equals(task.id).toArray()
    expect(subtasks).toHaveLength(2)
    expect(subtasks[0].title).toBe('Write Vitest tests')
    expect(subtasks[0].completed).toBe(false)
  })

  it('toggles task completion and records completedAt', async () => {
    const task = await taskService.createTask({
      title: 'Toggling task',
      priority: 'medium',
      category: 'personal',
    })

    const completed = await taskService.toggleComplete(task.id, false)
    expect(completed).toBe(true)

    const updated = await db.tasks.get(task.id)
    expect(updated?.completed).toBe(true)
    expect(updated?.completedAt).toBeDefined()

    // Toggle back
    const toggledAgain = await taskService.toggleComplete(task.id, false)
    expect(toggledAgain).toBe(false)
    const reverted = await db.tasks.get(task.id)
    expect(reverted?.completed).toBe(false)
  })

  it('soft-deletes to trash and restores from trash', async () => {
    const task = await taskService.createTask({
      title: 'Trashable task',
      priority: 'low',
      category: 'other',
    })

    await taskService.moveToTrash(task.id)
    let inDb = await db.tasks.get(task.id)
    expect(inDb?.isTrash).toBe(true)
    expect(inDb?.trashedAt).toBeDefined()

    await taskService.restoreFromTrash(task.id)
    inDb = await db.tasks.get(task.id)
    expect(inDb?.isTrash).toBe(false)
  })

  it('permanently deletes task and cascades to subtasks', async () => {
    const task = await taskService.createTask({
      title: 'Task with subtasks',
      priority: 'high',
      category: 'work',
    }, ['Subtask 1', 'Subtask 2'])

    await taskService.permanentlyDelete(task.id)

    const inDb = await db.tasks.get(task.id)
    expect(inDb).toBeUndefined()

    const subtasks = await db.subtasks.where('taskId').equals(task.id).toArray()
    expect(subtasks).toHaveLength(0)
  })
})
