// FocusFlow Service Worker: Offline Caching & Web Push Notifications

const CACHE_NAME = 'focusflow-shell-v4'
const APP_BASE = self.registration.scope
const SHELL_ASSETS = [
  new URL('./', APP_BASE).toString(),
  new URL('index.html', APP_BASE).toString(),
  new URL('focusflow.png', APP_BASE).toString(),
]

// 1. Install & Cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS)
    }).then(() => self.skipWaiting())
  )
})

// 2. Activate & Purge Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    }).then(() => self.clients.claim())
  )
})

// 3. Stale-While-Revalidate Network Strategy
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Skip chrome-extension, API calls or non-http protocols
  if (!url.protocol.startsWith('http')) return
  if (url.pathname.startsWith('/auth') || url.pathname.startsWith('/rest')) return

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return networkResponse
      }).catch(() => {
        // Network failed; cached response will be returned if available
        return cachedResponse
      })

      return cachedResponse || fetchPromise
    })
  )
})

// 4. Web Push Notification Event Handler
self.addEventListener('push', (event) => {
  let data = {
    title: 'FocusFlow Reminder',
    body: 'You have a task scheduled now.',
    taskId: '',
    reminderId: '',
  }

  if (event.data) {
    try {
      data = event.data.json()
    } catch {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: new URL('focusflow.png', APP_BASE).toString(),
    badge: new URL('focusflow.png', APP_BASE).toString(),
    vibrate: [200, 100, 200],
    tag: data.tag || `focusflow-task-${data.taskId || 'general'}`,
    renotify: true,
    data: {
      taskId: data.taskId,
      reminderId: data.reminderId,
      url: data.taskId
        ? new URL(`?task=${encodeURIComponent(data.taskId)}`, APP_BASE).toString()
        : APP_BASE,
      timestamp: Date.now(),
    },
    actions: [
      { action: 'complete', title: 'Mark Done' },
      { action: 'snooze_15', title: 'Snooze 15m' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// 5. Notification Click & Action Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const action = event.action
  const notificationData = event.notification.data || {}
  const targetUrl = notificationData.url || APP_BASE

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and dispatch message
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_ACTION',
            action,
            taskId: notificationData.taskId,
            reminderId: notificationData.reminderId,
          })
          return client.focus()
        }
      }

      // If no window open, open fresh window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})

// 6. Push Subscription Change (Browser auto-rotation)
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options).then((newSub) => {
      // Post message to active clients to update server subscription
      return self.clients.matchAll().then((clients) => {
        clients.forEach((c) => c.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED', subscription: newSub.toJSON() }))
      })
    })
  )
})
