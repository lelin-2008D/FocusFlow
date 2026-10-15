# FocusFlow — Reminder Delivery & Web Push Technical Specification

This document details the server-scheduled reminder architecture, VAPID Web Push mechanism, atomic claiming logic, and platform limitations across mobile and desktop operating systems.

---

## 1. Architectural Overview

```
+----------------------------------------------------------------------------------+
|                            Client PWA (FocusFlow)                                |
|  - Subscribes via PushManager with VAPID Public Key                             |
|  - Saves endpoint, p256dh, and auth tokens to Supabase `push_subscriptions`      |
|  - Service Worker (`public/sw.js`) handles `push` & `notificationclick` events   |
+---------------------------------------+------------------------------------------+
                                        | Subscriptions & Reminders
                                        v
+----------------------------------------------------------------------------------+
|                          Supabase PostgreSQL DB                                  |
|  - `reminders`: scheduled occurrences, recurrence rules, and timezones           |
|  - `push_subscriptions`: user push endpoints & cryptographic keys               |
|  - `reminder_deliveries`: immutable audit trail of every delivery attempt        |
+---------------------------------------+------------------------------------------+
                                        ^
                                        | Atomic Claim (`FOR UPDATE SKIP LOCKED`)
+---------------------------------------+------------------------------------------+
|                  Server Scheduled Reminder Worker                                |
|  - Node.js background process / edge runner with `web-push`                      |
|  - Signs payloads with VAPID Private Key                                         |
|  - Enforces quiet hours, burst prevention, and subscription cleanup              |
+---------------------------------------+------------------------------------------+
                                        | Encrypted Push Payload
                                        v
+----------------------------------------------------------------------------------+
|                  Browser Push Service (FCM, Apple APNs, Mozilla)                 |
|  - Dispatches push frame to device even when browser / PWA is closed             |
+----------------------------------------------------------------------------------+
```

---

## 2. Delivery Guarantees & Verification Integrity

> [!IMPORTANT]
> **No Unverified Delivery Claims:** A reminder is only logged as `delivered` when the target Push Service (FCM, APNs, Mozilla autopush) returns an HTTP `201 Created` status code. Scheduling or enqueueing a reminder is never reported as delivery.

### Atomic Job Claiming (`FOR UPDATE SKIP LOCKED`)
To eliminate duplicate deliveries across horizontal worker replicas:
1. The worker invokes `claim_due_reminders(p_worker_id, p_limit, p_lease_seconds)`.
2. PostgreSQL acquires row-level locks using `FOR UPDATE SKIP LOCKED` on due records where `status IN ('scheduled', 'snoozed')` and `remind_at <= NOW()`.
3. Records are atomically updated to `status = 'claiming'` with a time-bounded lease (`claim_expires_at`).
4. If a worker crashes mid-delivery, the lease expires and another worker safely recovers the pending reminder without human intervention.

### Outage Recovery & Burst Prevention
If a server outage or extended offline period occurs:
- Reminders overdue by more than **24 hours** are marked as `expired` in `reminders` and logged as `expired` in `reminder_deliveries`.
- This prevents "notification storms" (e.g. 50 back-to-back push alerts firing instantly when reconnecting).

### Dead Subscription Cleanup (HTTP 410 / 404)
When a user uninstalls the PWA or clears site data, the Push Service responds with HTTP `410 Gone` or `404 Not Found`. The worker immediately sets `is_active = FALSE` in `push_subscriptions` to avoid wasteful retries.

---

## 3. Recurring Schedules & Timezones
- **One-time:** Marked `completed` after successful push delivery.
- **Daily:** Next occurrence calculated at `addDays(remind_at, 1)`.
- **Weekdays:** Skips Saturday and Sunday, jumping to the next Monday.
- **Weekly:** Calculated at `addWeeks(remind_at, 1)`.
- **Monthly:** Calculated at `addMonths(remind_at, 1)` with end-of-month capping.
- **Timezone Preservation:** The user's original time zone (e.g. `America/New_York`, `Asia/Kathmandu`) is preserved across DST transitions.

---

## 4. Quiet Hours & Snooze Logic
- **Quiet Hours:** If enabled and the current time is within `quietHoursStart` and `quietHoursEnd` (e.g. `22:00` to `07:00`), the worker logs the attempt as `suppressed_quiet_hours` and snoozes the reminder until the quiet window concludes.
- **Snooze Durations:**
  - `5m`: Now + 5 minutes
  - `15m`: Now + 15 minutes
  - `1h`: Now + 1 hour
  - `tomorrow_morning`: Tomorrow at 09:00 AM

---

## 5. Cross-Platform Limitations & Matrix

| Platform / OS | Browser / Engine | Closed-App Push | Background Sound | Requirements / Limitations |
| :--- | :--- | :--- | :--- | :--- |
| **Android** | Chrome / Edge | **Yes** | Default OS sound | Subject to OEM battery savers (Doze mode). Must allow background activity. |
| **Android** | Firefox | **Yes** | Default OS sound | Supported natively via Mozilla autopush. |
| **iOS / iPadOS** | Safari (iOS 16.4+) | **Yes (PWA only)** | Default OS sound | **Apple Requirement:** User MUST add FocusFlow to Home Screen (Share → "Add to Home Screen"). Push cannot be enabled from Safari browser tabs. |
| **Windows 10/11** | Chrome / Edge | **Yes** | Windows chime | Supported via Windows Notification Center. Subject to Windows Focus Assist / Do Not Disturb. |
| **macOS** | Safari 16+, Chrome | **Yes** | macOS chime | Requires allowing notifications in macOS System Settings. |

### Audio Limitations Note
- Foreground audio synthesis via Web Audio API delivers custom harmonic chimes when the FocusFlow window is active.
- When the app is closed, system push notifications play the OS default notification chime configured by the user's operating system. Web applications cannot force custom audio files while completely closed.
