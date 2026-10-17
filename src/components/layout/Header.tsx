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
    <header className="sticky top-0 z-30 w-full glass-navbar border-b border-forest-800/80 light:border-forest-700/20 px-3 sm:px-6 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] pb-2.5 sm:py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-forest-900 via-forest-800 to-emerald-700 shadow-glass-glow border border-mint-400/30">
            <img src={focusflowLogo} alt="" className="h-8 w-8 sm:h-10 sm:w-10 object-contain" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-lg font-bold tracking-tight bg-gradient-to-r from-mint-300 via-mint-100 to-mint-400 bg-clip-text text-transparent truncate">
                FocusFlow
              </h1>
              <span className="hidden sm:inline-block text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-forest-800/80 text-mint-300 border border-mint-400/30">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-forest-400 light:text-forest-600 hidden md:block">
              Smart Offline-First Task Engine
            </p>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Sync & Network Status Pill */}
          <button
            onClick={handleManualSync}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-xs transition-colors focus:outline-none ${
              syncStatus === 'syncing'
                ? 'bg-emerald-700/20 light:bg-mint-100 text-mint-300 light:text-forest-900 border-mint-400/30 light:border-forest-700/20'
                : isOnline
                ? 'bg-emerald-700/15 light:bg-emerald-50 text-mint-300 light:text-emerald-800 border-emerald-600/30 light:border-emerald-700/20 hover:bg-emerald-700/25'
                : 'bg-amber-500/15 light:bg-amber-50 text-amber-300 light:text-amber-800 border-amber-500/40 light:border-amber-700/20 animate-pulse'
            }`}
            title="Click to trigger cloud synchronization"
          >
            {syncStatus === 'syncing' ? (
              <RefreshCw className="h-3 w-3 animate-spin text-mint-300 light:text-forest-800" />
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
            <div className="flex items-center gap-1 bg-forest-900/80 light:bg-mint-100/80 border border-forest-700/60 light:border-mint-200 rounded-xl px-1.5 sm:px-2.5 py-1">
              <div className="h-5 w-5 rounded-full bg-emerald-700/40 border border-mint-400/40 flex items-center justify-center text-[10px] text-mint-200 font-bold">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-xs text-mint-100 light:text-forest-950 hidden lg:inline max-w-[120px] truncate">
                {user?.email}
              </span>
              <button
                onClick={() => signOut()}
                className="p-0.5 sm:p-1 text-forest-400 hover:text-rose-400 transition-colors"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium bg-forest-900 light:bg-mint-100/80 border border-forest-700/60 light:border-mint-200 text-mint-100 light:text-forest-950 hover:border-mint-400/50 transition-colors"
            >
              <User className="h-3.5 w-3.5 text-mint-400" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* Notification / Reminders Settings Button */}
          <button
            onClick={onOpenNotificationSettingsModal}
            className="min-h-11 min-w-11 p-1.5 sm:p-2 rounded-xl text-forest-400 hover:text-mint-100 light:hover:text-forest-950 hover:bg-forest-800/50 light:hover:bg-mint-200/50 transition-colors focus:outline-none"
            aria-label="Notification and Reminder settings"
            title="Notification & Reminder Settings"
          >
            <Bell className="h-4 w-4" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="min-h-11 min-w-11 p-1.5 sm:p-2 rounded-xl text-forest-400 hover:text-mint-100 light:hover:text-forest-950 hover:bg-forest-800/50 light:hover:bg-mint-200/50 transition-colors focus:outline-none"
            aria-label={soundEnabled ? 'Mute sound chimes' : 'Unmute sound chimes'}
            title={soundEnabled ? 'Sound is ON' : 'Sound is OFF'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-mint-400" /> : <VolumeX className="h-4 w-4 text-forest-500" />}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="min-h-11 min-w-11 p-1.5 sm:p-2 rounded-xl text-forest-400 hover:text-mint-100 light:hover:text-forest-950 hover:bg-forest-800/50 light:hover:bg-mint-200/50 transition-colors focus:outline-none"
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-300" />
            ) : (
              <Moon className="h-4 w-4 text-emerald-700" />
            )}
          </button>

          {/* New Task CTA (hidden on mobile; MobileNav provides bottom center quick-add button) */}
          <Button
            onClick={onOpenNewTaskModal}
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            className="shadow-glass-glow hidden sm:inline-flex"
          >
            <span>New Task</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
