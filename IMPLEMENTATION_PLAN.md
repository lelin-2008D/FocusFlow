# FocusFlow — Implementation Plan

**Project:** FocusFlow — Smart Reminder & To-Do PWA  
**Architecture:** Offline-First, Cross-Device PWA (React + TypeScript + Vite + Tailwind CSS + Dexie IndexedDB + Supabase Auth & PostgreSQL RLS + Web Push VAPID + Server Scheduled Worker)  
**Status:** In Progress (Phase 1 Initialized)  

---

## Architecture Overview

```
+-----------------------------------------------------------------------------------+
|                                  FocusFlow UI                                     |
|  - React 18+ & TypeScript & Tailwind CSS (Dark Navy Glassmorphism & Light Mode)  |
|  - Views: Today, Upcoming, Overdue, Completed, Projects, Categories, Trash        |
|  - Task Modal, Subtasks, Recurring Rules, Snooze, Sound Chimes, Search/Filters    |
+----------------------------------------+------------------------------------------+
                                         | Reads & Optimistic Writes
                                         v
+-----------------------------------------------------------------------------------+
|                         Dexie.js IndexedDB (Client Local DB)                      |
|  - Tables: tasks, subtasks, projects, reminders, mutation_queue, user_settings   |
|  - Instant UI responsiveness, 100% offline-functional                             |
+----------------------------------------+------------------------------------------+
                                         | Durable Outbox Mutation Queue
                                         v
+-----------------------------------------------------------------------------------+
|                             Sync Engine (Client)                                  |
|  - Conflict resolution (LWW with server timestamp tracking)                       |
|  - Exponential backoff retry with jitter                                          |
|  - Multi-tab synchronization via BroadcastChannel                                 |
+----------------------------------------+------------------------------------------+
                                         | HTTPS / WSS (Supabase Client)
                                         v
+-----------------------------------------------------------------------------------+
|                          Supabase Backend (PostgreSQL)                            |
|  - Auth (Email/Password, OAuth optional)                                         |
|  - Tables with strict Row Level Security (RLS) enforcing `auth.uid() = user_id`:  |
|    * profiles, tasks, subtasks, projects, reminders, reminder_deliveries,         |
|      push_subscriptions, user_settings                                            |
+----------------------------------------+------------------------------------------+
                                         ^
                                         | Scheduled Cron / Worker
+----------------------------------------+------------------------------------------+
|                  Scheduled Reminder & Web Push Worker                             |
|  - Node.js / Supabase Edge Worker with VAPID Web Push                             |
|  - Transactional reminder claiming (`status = 'processing'`) to prevent duplicates|
|  - Overdue reconciliation, burst prevention, quiet hours enforcement              |
|  - Generates next occurrences for recurring reminders                             |
+-----------------------------------------------------------------------------------+
```

---

## Detailed Phase Breakdown

### Phase 1: Project Scaffolding, UI, Task CRUD, and IndexedDB Persistence (COMPLETED)
- [x] Inspect existing directory, tools, and git repository.
- [x] Author comprehensive `IMPLEMENTATION_PLAN.md` and `TESTING_CHECKLIST.md`.
- [x] Configure scaffolding: Vite + React 18 + TypeScript + Tailwind CSS + PostCSS + Autoprefixer.
- [x] Configure testing tooling: Vitest, React Testing Library, jsdom, fake-indexeddb.
- [x] Set up environment variable schemas and `.env.example`.
- [x] Design System & Styling:
  - [x] Dark Navy glassmorphism palette (`#060A13`, `#0A0F1D`, `#0E162A`, border rgba, blue/violet gradients and glow accents).
  - [x] High-contrast, clean Light Mode palette with polished frosted glass.
  - [x] Smooth micro-interactions, accessible focus rings, reduced-motion media query support.
  - [x] Mobile bottom navigation, desktop responsive sidebar, responsive modals and drawers.
- [x] Local Database (Dexie.js):
  - [x] Schemas for `tasks`, `subtasks`, `projects`, `settings`, `outbox`.
  - [x] Database service with reactive queries (`useLiveQuery`).
  - [x] Simulated browser reload persistence verified via tests.
- [x] Task Management Features:
  - [x] CRUD operations: create, edit, inline quick-add, soft delete (trash), restore, permanent delete.
  - [x] Attributes: priority (Urgent, High, Medium, Low), categories (Coding, Work, Personal, etc.), project tags, due date/time.
  - [x] Subtask checklist with real-time progress calculation and toggle audio.
  - [x] Views: Today, Upcoming, Overdue, Completed, All, Project filtered, Trash.
  - [x] Full-text search and multi-facet filtering (priority, category) and sorting (due date, priority, title, created date).
- [x] Audio chime generator via Web Audio API (zero external broken assets).
- [x] Verified clean production build (`npm run build`) and 100% passing tests (12/12).

### Phase 3: Authentication, Database Schema, Security Policies & Supabase Sync
- [ ] Supabase SQL Migrations:
  - Tables: `profiles`, `projects`, `tasks`, `subtasks`, `reminders`, `reminder_deliveries`, `push_subscriptions`, `user_settings`.
  - Row Level Security (RLS) policies on every table ensuring users only read/write their own records.
  - Foreign key constraints with cascading deletes where appropriate.
  - Optimized indexes on `user_id`, `due_date`, `status`, `remind_at`.
- [ ] Auth Integration:
  - Supabase Auth state listener, sign-up, sign-in, password reset, guest/offline mode support.
  - Automatic migration/claim of local tasks created while guest when user signs up/logs in.
- [ ] Initial Cloud Sync Layer:
  - Pull remote changes, push local changes, handle initial account hydration.

### Phase 4: Offline Mutation Queue, Conflict Resolution & Multi-Device Sync
- [ ] Durable Mutation Outbox Queue:
  - Every change creates a local mutation record before sync.
  - Sync engine processes queue with exponential backoff and network status awareness (`navigator.onLine`).
- [ ] Conflict Handling:
  - Last-Write-Wins (LWW) utilizing updated_at timestamps with field-level reconciliation where safe.
  - Duplicate prevention with client-generated UUIDs (v4).
- [ ] Multi-tab synchronization using `BroadcastChannel`.

### Phase 5: Scheduled Reminders, Web Push, Recurring Rules, Snooze & Recovery
- [ ] Reminder Engine:
  - One-time reminders and recurring rules (daily, weekly, monthly, weekdays, custom recurrence).
  - Due reminder evaluation engine: in-app chime + banner when app is open.
  - Snooze actions: 5 minutes, 15 minutes, 1 hour, tomorrow morning.
  - Quiet hours preference logic (e.g. 22:00 - 07:00 suppression or silent delivery).
- [ ] Web Push & Service Worker:
  - Push subscription manager storing browser endpoint + p256dh + auth keys to Supabase.
  - Service worker `push` event handler rendering rich system notifications with action buttons (Complete, Snooze).
  - Service worker `notificationclick` handler routing to appropriate task or executing background action.
- [ ] Server Reminder Worker:
  - Node.js / Supabase Edge scheduled runner querying due reminders.
  - Atomically claims reminders (`status = 'processing'`) to guarantee exactly-once or at-most-once delivery without duplicate bursts.
  - Calculates and creates next recurrence instances upon completion or trigger.

### Phase 6: PWA Installation, Accessibility, Performance & Production Build
- [ ] Web App Manifest & Service Worker caching:
  - Complete PWA manifest: icons, theme colors, display standalone, shortcuts.
  - Offline asset caching with Workbox / `vite-plugin-pwa`.
  - In-app custom install promotion banner and deferred install prompt (`beforeinstallprompt`).
- [ ] Accessibility & Responsive Verification:
  - Full keyboard navigation (Tab, Enter, Escape, Arrow navigation).
  - ARIA attributes (`aria-expanded`, `aria-label`, `role="dialog"`, etc.).
  - Proper color contrast ratios (WCAG AA compliant in dark and light modes).
  - Touch target sizing (minimum 44x44px for mobile controls).
- [ ] Performance Optimization:
  - Code-splitting, dynamic imports, lightweight bundle sizes.
  - Verified clean production build (`npm run build`).

### Phase 7: Automated Tests, Regression Testing & Documentation
- [ ] Vitest unit tests:
  - Dexie operations, task filtering/sorting, reminder recurrence calculations, quiet hours logic, mutation queue processing.
- [ ] Playwright E2E tests:
  - Offline task creation, filtering, keyboard shortcuts, PWA metadata.
- [ ] Complete `README.md` with:
  - Setup instructions, environment configuration, database schema deployment, VAPID key generation, troubleshooting, known platform constraints (iOS WebKit vs Android vs Desktop).
- [ ] Final verification against all criteria in `TESTING_CHECKLIST.md`.
