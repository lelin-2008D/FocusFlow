import { supabase, isSupabaseConfigured } from './supabaseClient'
import { db } from '../db'
import type { User, Session } from '@supabase/supabase-js'

export class AuthService {
  async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured()) return null
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      return data.session
    } catch {
      return null
    }
  }

  async getUser(): Promise<User | null> {
    const session = await this.getSession()
    return session?.user ?? null
  }

  async signUp(email: string, password: string): Promise<{ user: User | null; session: Session | null }> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.')
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error
    if (data.user) {
      await this.migrateGuestDataToUser(data.user.id)
    }
    return data
  }

  async signIn(email: string, password: string): Promise<{ user: User | null; session: Session | null }> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.')
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    if (data.user) {
      await this.migrateGuestDataToUser(data.user.id)
    }
    return data
  }

  async signOut(): Promise<void> {
    if (!isSupabaseConfigured()) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  /**
   * Seamlessly migrate any existing local/guest tasks to the authenticated user account
   * and enqueue them for cloud sync.
   */
  async migrateGuestDataToUser(userId: string): Promise<number> {
    const tasks = await db.tasks.toArray()
    let migratedCount = 0

    await db.transaction('rw', db.tasks, db.subtasks, db.outbox, async () => {
      for (const task of tasks) {
        // Enqueue create mutation into outbox
        const mutationId = `mut_mig_${task.id}_${Date.now()}`
        await db.outbox.put({
          id: mutationId,
          entity: 'task',
          entityId: task.id,
          operation: 'create',
          payload: { ...task, user_id: userId },
          createdAt: new Date().toISOString(),
          retryCount: 0,
          status: 'pending',
        })
        migratedCount++

        // Also enqueue subtasks
        const subtasks = await db.subtasks.where('taskId').equals(task.id).toArray()
        for (const sub of subtasks) {
          await db.outbox.put({
            id: `mut_mig_${sub.id}_${Date.now()}`,
            entity: 'subtask',
            entityId: sub.id,
            operation: 'create',
            payload: { ...sub, user_id: userId },
            createdAt: new Date().toISOString(),
            retryCount: 0,
            status: 'pending',
          })
        }
      }
    })

    return migratedCount
  }
}

export const authService = new AuthService()
