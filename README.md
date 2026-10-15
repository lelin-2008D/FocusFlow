# FocusFlow — Smart Reminder & To-Do PWA

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Dexie.js](https://img.shields.io/badge/Dexie.js-IndexedDB-00bcd4.svg)](https://dexie.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20RLS-3ecf8e.svg)](https://supabase.com/)
[![Tests](https://img.shields.io/badge/Tests-29%20Passing-brightgreen.svg)](https://vitest.dev/)

> **FocusFlow** is an installable, cross-device productivity Progressive Web Application (PWA) tailored for software engineers and knowledge workers. It combines **offline-first local durability**, **cloud synchronization**, **scheduled Web Push notifications with VAPID**, and a **glassmorphic design system**.

---

## Architecture & System Design

```
+-----------------------------------------------------------------------------------+
|                                  FocusFlow UI                                     |
|  - React 18 & TypeScript (Strict) & Tailwind CSS                                 |
|  - Dark Navy Glassmorphism & Light Mode Palettes                                  |
|  - Views: Today, Upcoming, Overdue, All Active, Completed, Trash                  |
|  - Keyboard shortcuts, Subtask checklist, Audio Chimes, Search/Filters            |
+----------------------------------------+------------------------------------------+
                                         | Reads & Optimistic Writes
                                         v
+-----------------------------------------------------------------------------------+
|                         Dexie.js IndexedDB (Client Local DB)                      |
|  - Tables: tasks, subtasks, projects, settings, outbox                            |
|  - 100% functional without internet connectivity                                 |
+----------------------------------------+------------------------------------------+
                                         | Durable Outbox Mutation Queue
                                         v
+-----------------------------------------------------------------------------------+
|                             Sync Engine (Client)                                  |
|  - Conflict resolution (Last-Write-Wins with server timestamps)                   |
|  - Multi-tab synchronization via BroadcastChannel                                 |
|  - Exponential backoff retry logic on network reconnect                          |
+----------------------------------------+------------------------------------------+
                                         | HTTPS / WSS (Supabase Client)
                                         v
+-----------------------------------------------------------------------------------+
|                          Supabase Backend (PostgreSQL)                            |
|  - Row Level Security (RLS) enforcing `auth.uid() = user_id` on all tables:      |
|    profiles, tasks, subtasks, projects, user_settings, reminders, push_subs       |
+----------------------------------------+------------------------------------------+
                                         ^
                                         | Atomic Claim (`FOR UPDATE SKIP LOCKED`)
+----------------------------------------+------------------------------------------+
|                  Server Scheduled Reminder & Web Push Worker                      |
|  - Node.js background process with VAPID Web Push                                 |
|  - Deadlock-safe lease expiration, quiet hours, and burst prevention (>24h)       |
+-----------------------------------------------------------------------------------+
```

---

## Key Features

1. **Task Management & Subtasks:**
   - Rapid inline creation, editing, soft-delete to Trash, restore, and permanent deletion with cascading subtasks.
   - Priorities (`Urgent`, `High`, `Medium`, `Low`) and categories (`Coding`, `Work`, `Personal`, `Study`, `Health`, `Finance`, `Other`).
   - Subtasks checklist with completion percentage progress indicators.
2. **Offline-First Durability:**
   - Tasks and mutations persist directly to IndexedDB via Dexie.js before any network requests.
   - Changes survive browser reloads and tab closures while disconnected.
3. **Cloud Sync & Conflict Resolution:**
   - Last-Write-Wins (LWW) conflict resolution using timestamps (`updated_at` / `client_updated_at`).
   - Guest task migration: local guest tasks are claimed and associated with the user account upon sign-in.
   - `BroadcastChannel` propagates updates across open browser tabs without refreshing.
4. **Server-Scheduled Web Push Reminders:**
   - One-time and recurring rules: `daily`, `weekdays` (skips weekends), `weekly`, `monthly`.
   - Snooze options: `5m`, `15m`, `1h`, `Tomorrow 9AM`.
   - Quiet hours suppression (e.g. `22:00` - `07:00`).
   - Service worker push event handler with interactive action buttons (**Mark Done**, **Snooze 15m**).
   - Atomic job claiming with PostgreSQL `FOR UPDATE SKIP LOCKED` eliminates duplicate deliveries.
5. **Design System & Accessibility:**
   - Dark Navy Glassmorphism (`#060A13`, `#0A0F1D`, `#0E162A`) with frosted translucent cards and subtle glow highlights.
   - High-contrast Light Mode palette.
   - WCAG AA compliant contrast ratios (>14:1) in both modes.
   - Full keyboard navigation: `c` / `Ctrl+N` (New Task), `/` (Search), `1`-`5` (Switch Views), `Escape` (Dismiss).
   - Reduced-motion media query support (`prefers-reduced-motion: reduce`).
   - Synthesized Web Audio API harmonic completion chimes (zero external audio dependencies).

---

## Getting Started

### Prerequisites
- **Node.js:** v18.0.0 or higher (v24+ recommended)
- **npm:** v9.0.0 or higher

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-username/focusflow.git
cd focusflow
npm install
```

### 2. Environment Configuration
Copy the example environment file and configure your keys:
```bash
cp .env.example .env
```

Edit `.env`:
```ini
# Public client variables (bundled with frontend)
VITE_APP_NAME="FocusFlow"
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
VITE_VAPID_PUBLIC_KEY="your-vapid-public-key"

# Server/Worker-only variables (NEVER expose to frontend)
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
VAPID_SUBJECT="mailto:admin@example.com"
```

> [!NOTE]
> FocusFlow functions **100% offline-first out of the box** even without Supabase credentials. All tasks are saved locally in IndexedDB.

### 3. VAPID Keys Generation
To generate standard Web Push VAPID keys for push notifications:
```bash
npx web-push generate-vapid-keys
```
Place the `Public Key` in `VITE_VAPID_PUBLIC_KEY` and the `Private Key` in `VAPID_PRIVATE_KEY`.

### 4. Database Migrations Deployment
Execute the migration scripts in your Supabase SQL editor:
1. [supabase/migrations/20261015000000_initial_schema.sql](file:///c:/Users/sanju/OneDrive/Desktop/FocusFlow/supabase/migrations/20261015000000_initial_schema.sql) — Core tables, foreign keys, triggers, and Row Level Security.
2. [supabase/migrations/20261015000001_reminders_and_push.sql](file:///c:/Users/sanju/OneDrive/Desktop/FocusFlow/supabase/migrations/20261015000001_reminders_and_push.sql) — Push subscriptions, reminders, delivery logs, and `claim_due_reminders` stored procedure.

---

## Development Scripts

```bash
# Start local development server (Vite)
npm run dev

# Run Vitest automated test suite (29 tests)
npm test

# Run tests in interactive watch mode
npm run test:watch

# Typecheck and build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## Server Reminder Worker Execution

To run the background reminder claiming worker that dispatches Web Push notifications:
```bash
npx tsx server/reminderWorker.ts
```
The worker can also be scheduled via cron or deployed as a Supabase Edge Function / AWS Lambda running every 1–5 minutes.

---

## Platform Limitations & Technical Guarantees

| Platform | Web Push Support | Background Audio | Operating System Notes |
| :--- | :---: | :---: | :--- |
| **Android (Chrome, Edge, Firefox)** | **Yes** | Default OS chime | Ensure OEM battery saver (Doze Mode) is not restricting background activity. |
| **iOS / iPadOS (Safari 16.4+)** | **Yes (PWA)** | Default OS chime | **Apple Requirement:** User must add FocusFlow to the Home Screen (Share → "Add to Home Screen"). Push is unavailable in browser tabs. |
| **Windows 10/11** | **Yes** | Windows chime | Delivered via Action Center. Subject to Windows Focus Assist. |
| **macOS (Safari, Chrome)** | **Yes** | macOS chime | Delivered via Notification Center. Subject to macOS Focus modes. |

---

## Quality Gate & Verification

- **Automated Tests:** 29 passed across 9 test suites.
- **Production Build:** Passes in ~3.0s with optimized vendor chunks (`vendor-react`, `vendor-db`, `vendor-supabase`, `vendor-icons`).
- **Audit Report:** Comprehensive review available in [PRODUCTION_AUDIT.md](file:///c:/Users/sanju/OneDrive/Desktop/FocusFlow/PRODUCTION_AUDIT.md).
- **Delivery Specification:** Architectural details available in [REMINDER_DELIVERY_SPEC.md](file:///c:/Users/sanju/OneDrive/Desktop/FocusFlow/REMINDER_DELIVERY_SPEC.md).

---

## License
MIT License. Crafted with clean architecture for modern web productivity.
