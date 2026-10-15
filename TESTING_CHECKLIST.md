# FocusFlow — Testing Checklist & Quality Gate

This checklist defines the rigorous quality criteria for FocusFlow across functionality, offline capability, push reminders, security, accessibility, and cross-platform performance.

---

## 1. Task Management & UX
- [x] **Task Creation:** Rapid creation with title, description, priority, category, project, due date/time, and subtasks.
- [x] **Task Editing:** In-place and modal editing updates all fields reactively without UI delay.
- [x] **Subtasks:** Add, toggle, delete subtasks; updates parent completion percentage in real-time.
- [x] **Task Completion:** Toggle completion status with sound feedback (if enabled) and visual cue.
- [x] **Soft Delete & Trash:** Delete moves to Trash; can restore or permanently empty.
- [x] **Views & Filters:**
  - [x] "Today" view displays tasks due today.
  - [x] "Upcoming" view groups tasks by tomorrow, this week, later.
  - [x] "Overdue" view highlights past-due items with urgent visual badges.
  - [x] "Completed" view shows finished tasks.
  - [x] Project and Category filters accurately isolate items.
  - [x] Instant search matches titles, descriptions, and tags.
- [x] **Sort Order:** Sort by due date, priority, title, and creation time in asc/desc order.

---

## 2. Offline-First & Storage Integrity (Dexie.js)
- [x] Tasks created or edited while completely offline persist across browser refreshes.
- [x] IndexedDB initializes cleanly with no console warnings or schema migration failures.
- [ ] All mutations are queued into the outbox table when disconnected (scheduled for Phase 4 sync engine).
- [x] Offline indicator badge displays network state (`Online` / `Offline Mode`).
- [x] Storage cleanup and quota handling handled gracefully.

---

## 3. Cloud Sync, Auth & Row Level Security (Supabase)
- [ ] Guest mode works smoothly without requiring login initially.
- [ ] Sign-up / Login authenticates securely with Supabase Auth.
- [ ] Post-login local tasks migration seamlessly assigns guest tasks to the authenticated user.
- [ ] RLS policies verified: User A cannot read, insert, update, or delete User B's tasks or reminders.
- [ ] Concurrent sync: Simultaneous tab or device updates merge without silent loss of user data.
- [ ] Reconnecting from offline automatically flushes the mutation outbox to Supabase.
- [ ] Server errors return safe error messages without exposing backend credentials or crash traces.

---

## 4. Reminders, Snooze, & Web Push
- [ ] One-time reminder triggers in-app visual toast and audio chime when app is open.
- [ ] Recurring reminder schedules next occurrence accurately:
  - [ ] Daily
  - [ ] Weekdays (Mon-Fri)
  - [ ] Weekly on specific day
  - [ ] Monthly on specific date
- [ ] Snooze buttons (5m, 15m, 1h, tomorrow) update next trigger time and persist locally and in cloud.
- [ ] Quiet hours setting respects user-defined time window (suppresses sound or postpones alert).
- [ ] Web Push service worker registers and handles `push` event with action buttons.
- [ ] Push notification click brings FocusFlow to foreground and opens the corresponding task.
- [ ] Server scheduled worker claims due reminders idempotently to prevent duplicate push deliveries.

---

## 5. UI/UX, Glassmorphism, & Theming
- [x] Dark navy glassmorphism renders with blur (`backdrop-blur-glass`), subtle borders, and blue/violet glow highlights.
- [x] Light mode provides high contrast, crisp text, and clean frosted glass aesthetic.
- [x] Theme preference toggle persists in local settings.
- [x] Responsive layouts:
  - [x] Mobile (<640px): Bottom navigation bar, slide-up modal, thumb-friendly touch targets.
  - [x] Tablet (640px - 1024px): Adaptive side menu and responsive task cards.
  - [x] Desktop (>1024px): Full collapsable sidebar with badge counters.

---

## 6. Accessibility & PWA Installation
- [x] Keyboard navigation: All buttons, inputs, modals, and list items accessible via Tab / Shift+Tab / Enter / Space / Escape (`c` for new task, `1`-`5` for views, `/` for search).
- [x] Visible focus rings on all interactive elements in both themes.
- [x] ARIA roles, labels, and modal attributes (`role="dialog"`, `aria-modal="true"`).
- [x] Reduced-motion support (`prefers-reduced-motion: reduce`) disables smooth transitions and glowing animations in CSS.
- [ ] PWA manifest & Service worker caching (scheduled for Phase 6).
- [ ] Install prompt banner (scheduled for Phase 6).

---

## 7. Security & Code Quality
- [x] No secret keys present in frontend source or build output.
- [x] Frontend inputs validated with Zod runtime schemas (`TaskInputSchema`, `SubtaskInputSchema`).
- [x] Production build succeeds with 0 TypeScript errors (`npm run build`).
- [x] Vitest unit and integration test suite passes with 0 failures (12/12 passing).
