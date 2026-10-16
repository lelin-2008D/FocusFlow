import { supabase, isSupabaseConfigured } from './supabaseClient'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export interface PushStatus {
  isSupported: boolean
  permission: NotificationPermission | 'unsupported'
  isSubscribed: boolean
  error?: string
}

export class PushManagerService {
  isPushSupported(): boolean {
    if (typeof window === 'undefined') return false
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    )
  }

  getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!this.isPushSupported()) return 'unsupported'
    return Notification.permission
  }

  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.isPushSupported()) return null
    try {
      const reg = await navigator.serviceWorker.ready
      return await reg.pushManager.getSubscription()
    } catch {
      return null
    }
  }

  async getStatus(): Promise<PushStatus> {
    const isSupported = this.isPushSupported()
    if (!isSupported) {
      return {
        isSupported: false,
        permission: 'unsupported',
        isSubscribed: false,
      }
    }

    const permission = Notification.permission
    const sub = await this.getSubscription()

    return {
      isSupported: true,
      permission,
      isSubscribed: !!sub,
    }
  }

  /**
   * Request notification permission and subscribe to Web Push using VAPID
   */
  async subscribe(vapidPublicKey?: string): Promise<PushSubscription | null> {
    if (!this.isPushSupported()) {
      throw new Error('Web Push is not supported by this browser.')
    }

    const key = vapidPublicKey || import.meta.env.VITE_VAPID_PUBLIC_KEY
    if (!key || key === 'your-vapid-public-key-here') {
      throw new Error(
        'VAPID Public Key is not configured. Please set VITE_VAPID_PUBLIC_KEY in your .env file.'
      )
    }

    // 1. Request notification permission (must be triggered by explicit user action)
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      if (permission === 'denied') {
        throw new Error(
          'Notification permission was blocked. Please enable notifications in your browser settings for this site.'
        )
      }
      return null
    }

    // 2. Register Service Worker if needed
    const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
    })
    await navigator.serviceWorker.ready

    // 3. Subscribe with PushManager
    const convertedKey = urlBase64ToUint8Array(key)
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey as unknown as BufferSource,
    })

    // 4. Save subscription to Supabase if configured & user is logged in
    if (isSupabaseConfigured()) {
      const { data } = await supabase.auth.getSession()
      const userId = data?.session?.user?.id

      if (userId) {
        const subJson = subscription.toJSON()
        if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
          await supabase.from('push_subscriptions').upsert(
            {
              user_id: userId,
              endpoint: subJson.endpoint,
              p256dh: subJson.keys.p256dh,
              auth: subJson.keys.auth,
              user_agent: navigator.userAgent,
              is_active: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'endpoint' }
          )
        }
      }
    }

    return subscription
  }

  async unsubscribe(): Promise<boolean> {
    const sub = await this.getSubscription()
    if (!sub) return true

    const endpoint = sub.endpoint
    const successful = await sub.unsubscribe()

    if (successful && isSupabaseConfigured()) {
      await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .eq('endpoint', endpoint)
    }

    return successful
  }

  /**
   * Dispatches a local foreground preview notification (using browser Notification API)
   */
  async showLocalPreview(title: string, body: string, taskId?: string): Promise<void> {
    if (!this.isPushSupported() || Notification.permission !== 'granted') {
      return
    }

    const reg = await navigator.serviceWorker.ready
    await reg.showNotification(title, {
      body,
      icon: `${import.meta.env.BASE_URL}focusflow.png`,
      badge: `${import.meta.env.BASE_URL}focusflow.png`,
      tag: `local-reminder-${taskId || 'preview'}`,
      data: { taskId, url: import.meta.env.BASE_URL },
    })
  }
}

export const pushManager = new PushManagerService()
