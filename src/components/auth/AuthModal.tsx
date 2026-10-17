import React, { useState } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { authService } from '../../services/authService'
import { isSupabaseConfigured } from '../../services/supabaseClient'
import { LogIn, UserPlus, Info } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const configured = isSupabaseConfigured()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setIsLoading(true)

    try {
      if (tab === 'signup') {
        await authService.signUp(email.trim(), password)
        setSuccessMsg('Account created successfully! Migrating local tasks...')
        setTimeout(() => {
          onClose()
        }, 1200)
      } else {
        await authService.signIn(email.trim(), password)
        setSuccessMsg('Signed in! Syncing tasks...')
        setTimeout(() => {
          onClose()
        }, 1200)
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tab === 'signin' ? 'Sign In to FocusFlow' : 'Create an Account'}
      description="Cross-device sync, backup, and secure storage for your tasks."
      maxWidth="sm"
    >
      {!configured ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 light:text-amber-800 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <Info className="h-4 w-4" />
              <span>Offline-First Mode Active</span>
            </div>
            <p className="leading-relaxed">
              FocusFlow is functioning in <strong>100% offline-first mode</strong> using your browser's IndexedDB.
            </p>
            <p className="leading-relaxed text-amber-400/80 light:text-amber-800/80">
              To enable cloud synchronization across multiple devices, configure your Supabase credentials in <code className="px-1.5 py-0.5 rounded bg-forest-950/60 light:bg-forest-200 font-mono">.env</code>:
            </p>
            <pre className="bg-forest-950/80 light:bg-forest-100 p-2 rounded text-[11px] font-mono text-forest-300 light:text-forest-800 overflow-x-auto border border-mint-400/10">
              VITE_SUPABASE_URL=https://xyz.supabase.co&#10;VITE_SUPABASE_ANON_KEY=eyJhbGci...
            </pre>
          </div>
          <Button variant="secondary" className="w-full" onClick={onClose}>
            Continue in Offline Mode
          </Button>
        </div>
      ) : (
        <div>
          {/* Tab buttons */}
          <div className="flex rounded-xl bg-forest-950/70 light:bg-mint-100 p-1 mb-4 border border-mint-400/10">
            <button
              type="button"
              onClick={() => {
                setTab('signin')
                setError(null)
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                tab === 'signin'
                  ? 'bg-gradient-to-r from-forest-800 to-emerald-700 text-mint-100 shadow-sm border border-mint-400/20'
                  : 'text-forest-400 light:text-forest-600 hover:text-white light:hover:text-forest-950'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup')
                setError(null)
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                tab === 'signup'
                  ? 'bg-gradient-to-r from-forest-800 to-emerald-700 text-mint-100 shadow-sm border border-mint-400/20'
                  : 'text-forest-400 light:text-forest-600 hover:text-white light:hover:text-forest-950'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 light:bg-rose-50 border border-rose-500/30 light:border-rose-700/20 text-rose-300 light:text-rose-800 text-xs">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/15 light:bg-emerald-50 border border-emerald-500/30 light:border-emerald-700/20 text-emerald-300 light:text-emerald-800 text-xs">
                {successMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-forest-300 light:text-forest-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                className="w-full px-3 py-2 rounded-xl glass-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-forest-300 light:text-forest-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl glass-input text-sm"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-4"
              isLoading={isLoading}
              leftIcon={tab === 'signin' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            >
              {tab === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        </div>
      )}
    </Modal>
  )
}
