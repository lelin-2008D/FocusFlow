import { useState, useEffect } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../services/supabaseClient'
import { authService } from '../services/authService'
import { syncEngine } from '../services/syncEngine'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isConfigured = isSupabaseConfigured()

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false)
      return
    }

    // Initial session retrieval
    authService.getSession().then((initialSession) => {
      setSession(initialSession)
      setUser(initialSession?.user ?? null)
      setIsLoading(false)

      if (initialSession?.user) {
        syncEngine.sync().catch(() => {})
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        setIsLoading(false)

        if (currentSession?.user) {
          await syncEngine.sync().catch(() => {})
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [isConfigured])

  const signOut = async () => {
    await authService.signOut()
    setUser(null)
    setSession(null)
  }

  return {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    isConfigured,
    signOut,
  }
}
