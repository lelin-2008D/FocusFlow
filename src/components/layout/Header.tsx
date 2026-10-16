import React, { useState, useEffect } from 'react'
import {
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Plus,
  Wifi,
  WifiOff,
  RefreshCw,
  User,
  LogOut,
  Bell,
} from 'lucide-react'
import { Button } from '../common/Button'
import { useTheme } from '../../hooks/useTheme'
import { taskService } from '../../services/taskService'
import { syncEngine, type SyncStatus } from '../../services/syncEngine'
import { useAuth } from '../../hooks/useAuth'
import focusflowLogo from '../../images/focusflow-centered.png'

interface HeaderProps {
  onOpenNewTaskModal: () => void
  onOpenAuthModal: () => void
  onOpenNotificationSettingsModal: () => void
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewTaskModal,
  onOpenAuthModal,
  onOpenNotificationSettingsModal,
}) => {
  const { theme, toggleTheme } = useTheme()
  const { user, isAuthenticated, signOut } = useAuth()
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    taskService.getSettings().then((s) => {
      setSoundEnabled(s.soundEnabled)
    })

    const unsubscribeSync = syncEngine.onStatusChange(setSyncStatus)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      unsubscribeSync()
    }
  }, [])

  const toggleSound = async () => {
    const nextVal = !soundEnabled
    setSoundEnabled(nextVal)
    await taskService.updateSettings({ soundEnabled: nextVal })
  }

  const handleManualSync = () => {
    syncEngine.sync().catch(() => {})
  }

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-800/80 light:border-slate-200/80 backdrop-blur-glass px-4 sm:px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 shadow-glass-glow border border-violet-400/30">
            <img src={focusflowLogo} alt="" className="h-10 w-10 object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
                FocusFlow
              </h1>
              <span className="hidden sm:inline-block text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 light:text-slate-500 hidden md:block">
              Smart Offline-First Task Engine
            </p>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2.5">
          {/* Sync & Network Status Pill */}
          <button
            onClick={handleManualSync}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-xs transition-colors focus:outline-none focus:ring-1 focus:ring-violet-500 ${
              syncStatus === 'syncing'
                ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                : isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/40 animate-pulse'
            }`}
            title="Click to trigger cloud synchronization"
          >
            {syncStatus === 'syncing' ? (
              <RefreshCw className="h-3 w-3 animate-spin text-blue-400" />
            ) : isOnline ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            <span className="text-[11px]">
              {syncStatus === 'syncing' ? 'Syncing...' : isOnline ? 'Synced' : 'Offline'}
            </span>
          </button>

          {/* User Auth Profile / Login Button */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5 bg-navy-900/80 light:bg-slate-200/80 border border-slate-700/60 light:border-slate-300 rounded-xl px-2.5 py-1">
              <div className="h-5 w-5 rounded-full bg-violet-600/30 border border-violet-400/40 flex items-center justify-center text-[10px] text-violet-300 font-bold">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-xs text-slate-300 light:text-slate-700 hidden lg:inline max-w-[120px] truncate">
                {user?.email}
              </span>
              <button
                onClick={() => signOut()}
                className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-navy-900 light:bg-slate-200 border border-slate-700/60 light:border-slate-300 text-slate-200 light:text-slate-800 hover:border-violet-500/50 transition-colors"
            >
              <User className="h-3.5 w-3.5 text-violet-400" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* Notification / Reminders Settings Button */}
          <button
            onClick={onOpenNotificationSettingsModal}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 light:hover:text-slate-900 hover:bg-slate-800/50 light:hover:bg-slate-200/60 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
            aria-label="Notification and Reminder settings"
            title="Notification & Reminder Settings"
          >
            <Bell className="h-4 w-4" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 light:hover:text-slate-900 hover:bg-slate-800/50 light:hover:bg-slate-200/60 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
            aria-label={soundEnabled ? 'Mute sound chimes' : 'Unmute sound chimes'}
            title={soundEnabled ? 'Sound is ON' : 'Sound is OFF'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 light:hover:text-slate-900 hover:bg-slate-800/50 light:hover:bg-slate-200/60 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-300" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-600" />
            )}
          </button>

          {/* New Task CTA */}
          <Button
            onClick={onOpenNewTaskModal}
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            className="shadow-glass-glow"
          >
            <span className="hidden sm:inline">New Task</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
