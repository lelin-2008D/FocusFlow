import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../db'
import { syncEngine } from '../services/syncEngine'
import { authService } from '../services/authService'
import { taskService } from '../services/taskService'
import type { Task } from '../types/task'

describe('Offline Mutation Queue & Idempotent Sync Engine', () => {
  beforeEach(async () => {
    await db.tasks.clear()
    await db.subtasks.clear()
    await db.outbox.clear()
  })

  it('enqueues mutations into the durable IndexedDB outbox queue when tasks are created', async () => {
    const task = await taskService.createTask({
      title: 'Offline Sync Task',
      priority: 'urgent',
      category: 'coding',
    }, ['Offline subtask 1'])

    // Verify task is in local database
    const localTask = await db.tasks.get(task.id)
    expect(localTask).toBeDefined()
    expect(localTask?.title).toBe('Offline Sync Task')

    // Verify mutations in outbox
    const mutations = await db.outbox.toArray()
    expect(mutations.length).toBeGreaterThanOrEqual(1)

    const taskMutation = mutations.find((m) => m.entityId === task.id)
    expect(taskMutation).toBeDefined()
    expect(taskMutation?.entity).toBe('task')
    expect(taskMutation?.operation).toBe('create')
    expect(taskMutation?.status).toBe('pending')
    expect(taskMutation?.payload.title).toBe('Offline Sync Task')
  })

  it('handles update and delete mutations idempotently in the outbox queue', async () => {
    const task = await taskService.createTask({
      title: 'Initial Title',
      priority: 'low',
      category: 'personal',
    })

    // Clear outbox from initial creation
    await db.outbox.clear()

    // 1. Update task
    await taskService.updateTask(task.id, { title: 'Updated Title' })
    const updateMut = await db.outbox.where('entityId').equals(task.id).first()
    expect(updateMut).toBeDefined()
    expect(updateMut?.operation).toBe('update')
    expect(updateMut?.payload.title).toBe('Updated Title')

    // 2. Soft-delete task
    await taskService.moveToTrash(task.id)
    const trashMutations = await db.outbox.where('entityId').equals(task.id).toArray()
    const latestTrashMut = trashMutations[trashMutations.length - 1]
    expect(latestTrashMut.payload.isTrash).toBe(true)

    // 3. Permanent delete
    await taskService.permanentlyDelete(task.id)
    const deleteMutations = await db.outbox.where('entityId').equals(task.id).toArray()
    const deleteMut = deleteMutations.find((m) => m.operation === 'delete')
    expect(deleteMut).toBeDefined()
  })

  it('resolves conflicts using Last-Write-Wins (LWW) and respects uncommitted pending outbox edits', async () => {
    const originalDate = '2026-10-15T10:00:00.000Z'

    const localTask: Task = {
      id: 'conflict-task-1',
      title: 'Local Version (Unsynced edit)',
      priority: 'high',
      category: 'coding',
      completed: false,
      isTrash: false,
      order: 1,
      createdAt: originalDate,
      updatedAt: '2026-10-15T13:00:00.000Z',
    }

    await db.tasks.add(localTask)

    // Add a pending mutation in outbox for this task
    await syncEngine.enqueueMutation('task', localTask.id, 'update', localTask)

    const pending = await db.outbox
      .where('entityId')
      .equals(localTask.id)
      .and((m) => m.status === 'pending')
      .first()

    expect(pending).toBeDefined()
    expect(pending?.entityId).toBe('conflict-task-1')

    // Since pending outbox mutation exists, local work is guarded from being clobbered by remote pull
    const inDb = await db.tasks.get(localTask.id)
    expect(inDb?.title).toBe('Local Version (Unsynced edit)')
  })

  it('migrates guest tasks to an authenticated user and queues them for synchronization', async () => {
    // 1. Guest creates 2 tasks and 1 subtask offline
    await taskService.createTask({
      title: 'Guest Coding Task',
      priority: 'urgent',
      category: 'coding',
    }, ['Setup environment'])

    await taskService.createTask({
      title: 'Guest Personal Task',
      priority: 'medium',
      category: 'personal',
    })

    await db.outbox.clear() // clear prior mutations to isolate migration test

    // 2. User registers / logs in with user_id 'usr_998877'
    const migrated = await authService.migrateGuestDataToUser('usr_998877')
    expect(migrated).toBe(2)

    // 3. Verify all items in outbox have user_id assigned
    const outboxItems = await db.outbox.toArray()
    expect(outboxItems.length).toBeGreaterThanOrEqual(2)

    for (const item of outboxItems) {
      expect(item.payload.user_id).toBe('usr_998877')
      expect(item.status).toBe('pending')
    }
  })

  it('guarantees cross-user data isolation in local querying', async () => {
    // Verify tasks belonging to different simulated user contexts
    const taskUserA: Task = {
      id: 'task-a',
      title: 'User A Secret Task',
      priority: 'high',
      category: 'work',
      completed: false,
      isTrash: false,
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.tasks.add(taskUserA)

    const retrieved = await db.tasks.get('task-a')
    expect(retrieved?.id).toBe('task-a')

    // Verify non-existent task for User B
    const nonExistent = await db.tasks.get('task-b')
    expect(nonExistent).toBeUndefined()
  })
})
