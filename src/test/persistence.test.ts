import { describe, it, expect, beforeEach } from 'vitest'
import { FocusFlowDatabase } from '../db'
import { taskService } from '../services/taskService'

describe('IndexedDB Persistence & Refresh Survival', () => {
  beforeEach(async () => {
    const tempDb = new FocusFlowDatabase()
    await tempDb.tasks.clear()
    await tempDb.subtasks.clear()
    await tempDb.settings.clear()
    tempDb.close()
  })

  it('survives simulated browser restart/refresh with multiple tasks and subtasks', async () => {
    // 1. Session 1: Create tasks and subtasks via service
    const task1 = await taskService.createTask({
      title: 'Architect offline queue',
      priority: 'urgent',
      category: 'coding',
      dueDate: '2026-10-20',
      dueTime: '10:00',
    }, ['Step 1: Outbox table', 'Step 2: Sync loop'])

    const task2 = await taskService.createTask({
      title: 'Design glassmorphic dark mode',
      priority: 'high',
      category: 'work',
    })

    await taskService.toggleComplete(task2.id, false)

    // 2. Simulate browser tab close / refresh by closing the Dexie database
    const initialDb = new FocusFlowDatabase()
    initialDb.close()

    // 3. Session 2: Fresh browser session opens database
    const refreshedDb = new FocusFlowDatabase()
    await refreshedDb.open()

    // 4. Verify all records survived
    const retrievedTask1 = await refreshedDb.tasks.get(task1.id)
    expect(retrievedTask1).toBeDefined()
    expect(retrievedTask1?.title).toBe('Architect offline queue')
    expect(retrievedTask1?.priority).toBe('urgent')
    expect(retrievedTask1?.completed).toBe(false)

    const retrievedTask2 = await refreshedDb.tasks.get(task2.id)
    expect(retrievedTask2).toBeDefined()
    expect(retrievedTask2?.title).toBe('Design glassmorphic dark mode')
    expect(retrievedTask2?.completed).toBe(true)

    // Verify subtasks survived
    const subtasks = await refreshedDb.subtasks.where('taskId').equals(task1.id).toArray()
    expect(subtasks).toHaveLength(2)
    expect(subtasks[0].title).toBe('Step 1: Outbox table')
    expect(subtasks[1].title).toBe('Step 2: Sync loop')

    refreshedDb.close()
  })
})
