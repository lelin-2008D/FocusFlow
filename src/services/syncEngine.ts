import { db, type MutationRecord } from '../db'
import { supabase, isSupabaseConfigured } from './supabaseClient'
import type { Task, Subtask } from '../types/task'

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error'

export class SyncEngine {
  private syncInProgress = false
  private syncInterval: number | null = null
  private channel: BroadcastChannel | null = null
  private listeners: Set<(status: SyncStatus) => void> = new Set()
  private currentStatus: SyncStatus = 'idle'

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('focusflow_sync_channel')
      this.channel.onmessage = (event) => {
        if (event.data?.type === 'SYNC_EVENT') {
          this.notifyStatus(this.currentStatus)
        }
      }

      window.addEventListener('online', () => {
        this.notifyStatus('idle')
        this.sync()
      })
      window.addEventListener('offline', () => {
        this.notifyStatus('offline')
      })
    }
  }

  onStatusChange(cb: (status: SyncStatus) => void): () => void {
    this.listeners.add(cb)
    cb(this.currentStatus)
    return () => this.listeners.delete(cb)
  }

  private notifyStatus(status: SyncStatus) {
    this.currentStatus = status
    this.listeners.forEach((cb) => cb(status))
  }

  startPeriodicSync(intervalMs = 30000) {
    if (this.syncInterval) clearInterval(this.syncInterval)
    this.syncInterval = window.setInterval(() => {
      this.sync()
    }, intervalMs)
  }

  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  /**
   * Enqueue a mutation into the durable IndexedDB outbox queue
   */
  async enqueueMutation(
    entity: 'task' | 'subtask' | 'project' | 'settings',
    entityId: string,
    operation: 'create' | 'update' | 'delete',
    payload: any
  ): Promise<string> {
    const id = `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const record: MutationRecord = {
      id,
      entity,
      entityId,
      operation,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
    }

    await db.outbox.add(record)

    // Notify other tabs via BroadcastChannel
    this.channel?.postMessage({ type: 'MUTATION_ENQUEUED', entityId })

    // Trigger optimistic sync if online and configured
    if (navigator.onLine && isSupabaseConfigured()) {
      this.sync().catch(() => {})
    }

    return id
  }

  /**
   * Main synchronization cycle:
   * 1. Flush pending outbox mutations to Supabase (idempotent upserts / deletes)
   * 2. Pull remote changes updated since last sync (Last-Write-Wins conflict resolution)
   */
  async sync(): Promise<{ pushed: number; pulled: number }> {
    if (this.syncInProgress) return { pushed: 0, pulled: 0 }
    if (!navigator.onLine) {
      this.notifyStatus('offline')
      return { pushed: 0, pulled: 0 }
    }
    if (!isSupabaseConfigured()) {
      this.notifyStatus('idle')
      return { pushed: 0, pulled: 0 }
    }

    const { data: authData } = await supabase.auth.getSession()
    const user = authData?.session?.user
    if (!user) {
      this.notifyStatus('idle')
      return { pushed: 0, pulled: 0 }
    }

    this.syncInProgress = true
    this.notifyStatus('syncing')

    let pushed = 0
    let pulled = 0

    try {
      // 1. PUSH OUTBOX MUTATIONS
      const pendingMutations = await db.outbox
        .where('status')
        .equals('pending')
        .sortBy('createdAt')

      for (const mut of pendingMutations) {
        try {
          await this.processMutation(mut, user.id)
          await db.outbox.delete(mut.id)
          pushed++
        } catch (err: any) {
          console.warn(`Sync failed for mutation ${mut.id}:`, err)
          const newRetryCount = mut.retryCount + 1
          if (newRetryCount >= 5) {
            await db.outbox.update(mut.id, { status: 'failed', retryCount: newRetryCount })
          } else {
            await db.outbox.update(mut.id, { retryCount: newRetryCount })
          }
        }
      }

      // 2. PULL REMOTE CHANGES
      pulled = await this.pullRemoteChanges(user.id)

      this.notifyStatus('idle')
    } catch (err) {
      console.error('Sync cycle error:', err)
      this.notifyStatus('error')
    } finally {
      this.syncInProgress = false
    }

    return { pushed, pulled }
  }

  /**
   * Process a single mutation idempotently with Supabase
   */
  private async processMutation(mut: MutationRecord, userId: string): Promise<void> {
    const table = mut.entity === 'task' ? 'tasks' : mut.entity === 'subtask' ? 'subtasks' : 'projects'

    if (mut.operation === 'delete') {
      const { error } = await supabase.from(table).delete().eq('id', mut.entityId).eq('user_id', userId)
      if (error) throw error
      return
    }

    if (mut.entity === 'task') {
      const task: Task = mut.payload
      const row = {
        id: task.id,
        user_id: userId,
        title: task.title,
        description: task.description || null,
        priority: task.priority,
        category: task.category,
        project_id: task.projectId || null,
        due_date: task.dueDate || null,
        due_time: task.dueTime || null,
        completed: task.completed,
        completed_at: task.completedAt || null,
        is_trash: task.isTrash,
        trashed_at: task.trashedAt || null,
        order_index: task.order,
        reminder_enabled: task.reminderEnabled ?? false,
        reminder_time: task.reminderTime || null,
        reminder_rule: task.reminderRule || null,
        client_updated_at: task.updatedAt || new Date().toISOString(),
      }

      const { error } = await supabase.from('tasks').upsert(row, { onConflict: 'id' })
      if (error) throw error
    } else if (mut.entity === 'subtask') {
      const sub: Subtask = mut.payload
      const row = {
        id: sub.id,
        task_id: sub.taskId,
        user_id: userId,
        title: sub.title,
        completed: sub.completed,
        order_index: sub.order,
        client_updated_at: sub.createdAt || new Date().toISOString(),
      }

      const { error } = await supabase.from('subtasks').upsert(row, { onConflict: 'id' })
      if (error) throw error
    }
  }

  /**
   * Pull remote changes from Supabase and reconcile using Last-Write-Wins (LWW)
   */
  private async pullRemoteChanges(userId: string): Promise<number> {
    const { data: remoteTasks, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)

    if (taskError) throw taskError

    let updatedCount = 0

    if (remoteTasks && remoteTasks.length > 0) {
      for (const remote of remoteTasks) {
        // Check if there is an un-synced outbox mutation for this task
        const pendingMut = await db.outbox
          .where('entityId')
          .equals(remote.id)
          .and((m) => m.status === 'pending')
          .first()

        // If local has un-synced mutation, local wins this cycle
        if (pendingMut) {
          continue
        }

        const local = await db.tasks.get(remote.id)
        const remoteUpdatedAt = remote.updated_at || remote.client_updated_at

        if (!local || new Date(remoteUpdatedAt).getTime() > new Date(local.updatedAt).getTime()) {
          // Remote is newer: update local Dexie record
          await db.tasks.put({
            id: remote.id,
            title: remote.title,
            description: remote.description || '',
            priority: remote.priority,
            category: remote.category,
            projectId: remote.project_id || undefined,
            dueDate: remote.due_date || undefined,
            dueTime: remote.due_time || undefined,
            completed: remote.completed,
            completedAt: remote.completed_at || undefined,
            isTrash: remote.is_trash,
            trashedAt: remote.trashed_at || undefined,
            order: remote.order_index,
            reminderEnabled: remote.reminder_enabled,
            reminderTime: remote.reminder_time || undefined,
            reminderRule: remote.reminder_rule || undefined,
            createdAt: remote.created_at,
            updatedAt: remoteUpdatedAt,
          })
          updatedCount++
        }
      }
    }

    // Pull Subtasks
    const { data: remoteSubtasks, error: subError } = await supabase
      .from('subtasks')
      .select('*')
      .eq('user_id', userId)

    if (!subError && remoteSubtasks) {
      for (const remoteSub of remoteSubtasks) {
        const pendingSub = await db.outbox
          .where('entityId')
          .equals(remoteSub.id)
          .and((m) => m.status === 'pending')
          .first()

        if (pendingSub) continue

        await db.subtasks.put({
          id: remoteSub.id,
          taskId: remoteSub.task_id,
          title: remoteSub.title,
          completed: remoteSub.completed,
          order: remoteSub.order_index,
          createdAt: remoteSub.created_at,
        })
      }
    }

    return updatedCount
  }
}

export const syncEngine = new SyncEngine()
