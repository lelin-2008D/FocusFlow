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

### Phase 2: Authentication, Database Schema, RLS, Offline Mutation Queue & Conflict Resolution (COMPLETED)
- [x] Supabase SQL Migrations:
  - [x] Complete production SQL migration `supabase/migrations/20261015000000_initial_schema.sql`.
  - [x] Tables: `profiles`, `projects`, `tasks`, `subtasks`, `user_settings`.
  - [x] Foreign key constraints with cascading deletes where appropriate.
  - [x] Auto-updating `updated_at` triggers and user onboarding profile creation trigger.
  - [x] Optimized indexes on `(user_id, updated_at DESC)`, `(user_id, due_date)`, `(user_id, completed)`, `(user_id, is_trash)`.
  - [x] Strict Row Level Security (RLS) policies on every table enforcing `auth.uid() = user_id`.
- [x] Auth Integration:
  - [x] `useAuth` hook and `authService` for session state, sign-in, sign-up, sign-out.
  - [x] Safe client initialization (`isSupabaseConfigured()`) with offline-first graceful fallback.
  - [x] `AuthModal` component with Sign In / Create Account tabs and offline mode notices.
  - [x] Automatic account migration: guest tasks and subtasks are claimed and stamped with the authenticated user ID.
- [x] Durable Offline Mutation Queue:
  - [x] `syncEngine.enqueueMutation(...)` appends every local operation (create, update, delete) to Dexie `outbox`.
  - [x] Dexie transactions updated to atomically include `db.outbox`.
- [x] Idempotent Retries & Conflict Resolution:
  - [x] Idempotent upserts on Supabase using stable client-generated UUIDs.
  - [x] Retry counters and backoff handling on transient failures.
  - [x] Last-Write-Wins (LWW) conflict resolution using timestamp comparison (`updated_at` / `client_updated_at`).
  - [x] Uncommitted pending outbox mutations guarded against remote overwrites.
- [x] Multi-Device & Multi-Tab Synchronization:
  - [x] Multi-tab communication via `BroadcastChannel('focusflow_sync_channel')`.
  - [x] Periodic background sync loop (30s) and network status awareness (`online` / `offline`).
- [x] Verification:
  - [x] 17 passing tests across 5 test suites (`npm test`).
  - [x] Production build passes cleanly in 5.09s (`npm run build`).

### Phase 3: Scheduled Reminders, Web Push, Recurring Rules, Snooze & Recovery (COMPLETED)
- [x] Database Schema & Claiming Procedure:
  - [x] Migration `supabase/migrations/20261015000001_reminders_and_push.sql`.
  - [x] Tables: `reminders`, `reminder_deliveries`, `push_subscriptions`.
  - [x] Atomic job claiming stored procedure `claim_due_reminders` with `FOR UPDATE SKIP LOCKED`.
  - [x] Deadlock/worker crash lease expiration recovery (`claim_expires_at`).
  - [x] Strict Row Level Security policies on all reminder and subscription tables.
- [x] Recurrence, Snooze & Recovery Engine:
  - [x] `computeNextOccurrence` supporting daily, weekdays (skipping weekends), weekly, monthly.
  - [x] `computeSnooze` supporting 5m, 15m, 1h, and tomorrow morning (09:00).
  - [x] `isWithinQuietHours` evaluating overnight and daytime windows.
  - [x] `isOverdueBeyondThreshold` preventing notification bursts (>24h overdue).
- [x] Web Push & Service Worker:
  - [x] Service Worker `public/sw.js` handling `push`, `notificationclick` (with 'Complete' and 'Snooze 15m' actions), and `pushsubscriptionchange`.
  - [x] `PushManagerService` managing permission requests upon user gesture, VAPID key conversion, and Supabase subscription storage.
- [x] Server-Side Scheduled Reminder Worker:
  - [x] `server/reminderWorker.ts` with `web-push` VAPID delivery, quiet hours postponement, burst prevention, and HTTP 410 dead subscription cleanup.
  - [x] Comprehensive delivery logs tracking attempt timestamps, channels, and delivery statuses.
- [x] Verification & Documentation:
  - [x] 27 automated tests passing across 8 test suites (`npm test`).
  - [x] Documented platform limitations, iOS PWA Home Screen requirements, and delivery verification guarantees in `REMINDER_DELIVERY_SPEC.md`.

### Phase 4: Production-Readiness Audit, PWA Installation & Performance (COMPLETED)
- [x] Web App Manifest & Service Worker caching:
  - [x] Complete W3C PWA manifest `public/manifest.json`: icons, theme colors, display standalone, shortcuts.
  - [x] Offline asset caching via service worker (`public/sw.js`).
  - [x] In-app custom install promotion banner and deferred install prompt (`InstallPromptBanner.tsx`).
- [x] Accessibility & Responsive Verification:
  - [x] Full keyboard navigation (Tab, Enter, Escape, `c`, `/`, `1`-`5`).
  - [x] ARIA attributes (`aria-expanded`, `aria-label`, `role="dialog"`, `aria-modal="true"`).
  - [x] WCAG AA compliant contrast ratios (>14:1 in both dark and light modes).
  - [x] Mobile touch targets (>44x44px) and viewport scaling (`viewport-fit=cover`).
- [x] Performance & Bundle Optimization:
  - [x] Optimized vendor chunks: `vendor-react`, `vendor-db`, `vendor-supabase`, `vendor-icons`.
  - [x] Zero chunk size warnings; total JS gzip budget < 190 kB.
  - [x] Verified clean production build (`npm run build`) in 3.09s.
- [x] Automated Tests & Full Documentation:
  - [x] 29 passing Vitest automated tests across 9 test suites (`npm test`).
  - [x] Comprehensive `PRODUCTION_AUDIT.md` report.
  - [x] Complete `README.md` with local setup, database migration deployment, VAPID generation, and platform matrix.
  - [x] Quality criteria verified in `TESTING_CHECKLIST.md`.
