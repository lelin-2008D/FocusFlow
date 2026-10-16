import React, { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '../common/Button'
import focusflowLogo from '../../images/focusflow-centered.png'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export const InstallPromptBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    setIsStandalone(isInstalled)

    // Check if iOS device
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIosDevice)

    // Check if dismissed previously in session
    const dismissed = sessionStorage.getItem('focusflow_install_dismissed')
    if (dismissed) {
      setIsDismissed(true)
    }

    // Listen for beforeinstallprompt on Chromium browsers
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  if (isStandalone || isDismissed) {
    return null
  }

  // If neither Chromium prompt nor iOS, don't show
  if (!deferredPrompt && !isIOS) {
    return null
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    sessionStorage.setItem('focusflow_install_dismissed', 'true')
  }

  return (
    <div className="fixed bottom-16 md:bottom-5 right-4 left-4 md:left-auto md:max-w-md z-40 animate-slide-up">
      <div className="rounded-2xl glass-panel p-4 shadow-2xl border border-violet-500/30 backdrop-blur-glass flex items-start gap-3.5 bg-navy-900/95 light:bg-white/95">
        <div className="h-11 w-11 rounded-xl bg-navy-950/70 border border-violet-500/30 shrink-0 flex items-center justify-center">
          <img src={focusflowLogo} alt="FocusFlow" className="h-11 w-11 object-contain" />
        </div>

        <div className="flex-1 min-w-0 text-xs">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-white light:text-slate-900 text-sm">
              Install FocusFlow App
            </h4>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-md text-slate-400 hover:text-white light:hover:text-slate-900 transition-colors"
              aria-label="Dismiss install banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-1 text-slate-300 light:text-slate-600 leading-relaxed">
            {isIOS ? (
              <span>
                To install on iOS: Tap <strong className="text-violet-400">Share</strong> (box with arrow) in Safari, then select <strong className="text-violet-400">"Add to Home Screen"</strong>.
              </span>
            ) : (
              'Install for offline instant launch, task reminders, and a distraction-free window.'
            )}
          </p>

          {!isIOS && deferredPrompt && (
            <div className="mt-3 flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleInstallClick}
                leftIcon={<Download className="h-3.5 w-3.5" />}
              >
                Install App
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                Not now
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
