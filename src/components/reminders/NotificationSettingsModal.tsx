import React, { useState, useEffect } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { pushManager, type PushStatus } from '../../services/pushManager'
import { taskService } from '../../services/taskService'
import type { UserSettings } from '../../types/task'
import {
  Bell,
  Moon,
  Send,
  HelpCircle,
  Volume2,
} from 'lucide-react'
import { soundService } from '../../services/audioService'

interface NotificationSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [status, setStatus] = useState<PushStatus>({
    isSupported: true,
    permission: 'default',
    isSubscribed: false,
  })
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    if (isOpen) {
      pushManager.getStatus().then(setStatus)
      taskService.getSettings().then(setSettings)
    }
  }, [isOpen])

  const handleTogglePush = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      if (status.isSubscribed) {
        await pushManager.unsubscribe()
        setMessage({ text: 'Push notifications disabled.', type: 'info' })
      } else {
        await pushManager.subscribe()
        setMessage({ text: 'Subscribed to Web Push reminders successfully!', type: 'success' })
      }
      const updated = await pushManager.getStatus()
      setStatus(updated)
    } catch (err: any) {
      setMessage({ text: err?.message || 'Failed to update push subscription.', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlayTestSound = () => {
    try {
      soundService.playReminder()
      setMessage({ text: 'Played reminder alert chime sound 🔔', type: 'info' })
    } catch (err: any) {
      setMessage({ text: err?.message || 'Could not play alert sound.', type: 'error' })
    }
  }

  const handleTestNotification = async () => {
    try {
      await pushManager.showLocalPreview(
        'FocusFlow Reminder Alert',
        'Web push notifications and audio chimes are active.',
        undefined,
        true
      )
      setMessage({ text: 'Test notification and chime sound triggered! 🔔', type: 'success' })
      const updated = await pushManager.getStatus()
      setStatus(updated)
    } catch (err: any) {
      setMessage({ text: err?.message || 'Failed to trigger test notification.', type: 'error' })
    }
  }

  const handleQuietHoursToggle = async () => {
    if (!settings) return
    const nextVal = !settings.quietHoursEnabled
    const updated = { ...settings, quietHoursEnabled: nextVal }
    setSettings(updated)
    await taskService.updateSettings({ quietHoursEnabled: nextVal })
  }

  const handleQuietHoursChange = async (field: 'quietHoursStart' | 'quietHoursEnd', val: string) => {
    if (!settings) return
    const updated = { ...settings, [field]: val }
    setSettings(updated)
    await taskService.updateSettings({ [field]: val })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notification & Reminder Settings"
      description="Manage Web Push alerts, quiet hours, and delivery preferences."
      maxWidth="md"
    >
      <div className="space-y-5 text-xs text-forest-300 light:text-forest-700">
        {message && (
          <div
            className={`p-3 rounded-xl border text-xs ${
              message.type === 'success'
                ? 'bg-emerald-500/15 light:bg-emerald-50 border-emerald-500/30 light:border-emerald-700/20 text-emerald-300 light:text-emerald-800'
                : message.type === 'error'
                ? 'bg-rose-500/15 light:bg-rose-50 border-rose-500/30 light:border-rose-700/20 text-rose-300 light:text-rose-800'
                : 'bg-mint-400/10 light:bg-mint-50 border-mint-400/30 light:border-forest-700/20 text-mint-200 light:text-forest-900'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Web Push Subscription Section */}
        <div className="p-4 rounded-xl glass-panel space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-forest-800/80 text-mint-300 border border-mint-400/20">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white light:text-forest-900">
                  Web Push Notifications
                </h4>
                <p className="text-[11px] text-forest-400">
                  Receive server-driven alerts for due tasks even when the app is closed.
                </p>
              </div>
            </div>

            <Button
              variant={status.isSubscribed ? 'outline' : 'primary'}
              size="sm"
              isLoading={isLoading}
              onClick={handleTogglePush}
            >
              {status.isSubscribed ? 'Disable' : 'Enable'}
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-forest-800 light:border-forest-200">
            <div className="flex items-center gap-2">
              <span className="text-forest-400">Permission:</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  status.permission === 'granted'
                    ? 'bg-emerald-500/20 light:bg-emerald-50 text-emerald-400 light:text-emerald-800'
                    : status.permission === 'denied'
                    ? 'bg-rose-500/20 light:bg-rose-50 text-rose-400 light:text-rose-800'
                    : 'bg-amber-500/20 light:bg-amber-50 text-amber-400 light:text-amber-800'
                }`}
              >
                {status.permission}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePlayTestSound}
                className="flex items-center gap-1.5 text-xs text-mint-300 light:text-forest-700 hover:text-mint-100 light:hover:text-forest-950 font-medium transition-colors"
                title="Play test alert chime sound"
              >
                <Volume2 className="h-3.5 w-3.5 text-mint-400" />
                <span>Test Sound</span>
              </button>

              <button
                type="button"
                onClick={handleTestNotification}
                className="flex items-center gap-1.5 text-xs text-mint-400 light:text-forest-700 hover:text-mint-300 light:hover:text-forest-900 font-medium transition-colors"
                title="Trigger test push/local notification"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send Test Alert</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quiet Hours Section */}
        <div className="p-4 rounded-xl glass-panel space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-900/40 text-mint-300 border border-mint-400/20">
                <Moon className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white light:text-forest-900">
                  Quiet Hours
                </h4>
                <p className="text-[11px] text-forest-400">
                  Suppress alert sounds and postpone push delivery during sleep hours.
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={settings?.quietHoursEnabled ?? false}
              onChange={handleQuietHoursToggle}
              className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
            />
          </div>

          {settings?.quietHoursEnabled && (
            <div className="flex items-center gap-3 pt-2 border-t border-forest-800 light:border-forest-200">
              <div className="flex items-center gap-1.5">
                <span className="text-forest-400 text-xs">From:</span>
                <input
                  type="time"
                  value={settings.quietHoursStart}
                  onChange={(e) => handleQuietHoursChange('quietHoursStart', e.target.value)}
                  className="px-2 py-1 rounded-lg glass-input text-xs"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-forest-400 text-xs">To:</span>
                <input
                  type="time"
                  value={settings.quietHoursEnd}
                  onChange={(e) => handleQuietHoursChange('quietHoursEnd', e.target.value)}
                  className="px-2 py-1 rounded-lg glass-input text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Platform Limitations & Technical Guarantees Guide */}
        <div className="p-4 rounded-xl bg-forest-950/80 light:bg-mint-50/80 border border-mint-400/20 light:border-mint-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-forest-200 light:text-forest-800">
            <HelpCircle className="h-4 w-4 text-mint-400" />
            <span>Platform Requirements & Battery Delivery Notes</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-forest-400 light:text-forest-600 leading-relaxed">
            <li>
              <strong>iPhone / iPad (iOS 16.4+):</strong> Apple requires adding FocusFlow to your Home Screen (Share → "Add to Home Screen") before enabling Web Push.
            </li>
            <li>
              <strong>Android & Windows:</strong> Fully supported in Chrome, Edge, and Firefox. Ensure system battery optimization doesn't restrict background notifications.
            </li>
            <li>
              <strong>Delivery Tracking:</strong> Notifications are logged only when accepted by the push service. Overdue reminders (&gt;24h) are suppressed to prevent notification bursts.
            </li>
          </ul>
        </div>
      </div>
    </Modal>
  )
}
