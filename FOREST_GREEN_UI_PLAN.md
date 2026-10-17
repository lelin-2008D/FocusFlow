# FocusFlow Forest-Green UI Transformation Plan

## Repository audit

- **Framework and language:** React 18, TypeScript, Vite.
- **Styling:** Tailwind CSS 3 with `src/index.css` custom utilities and theme variables in `tailwind.config.js`.
- **Routing and state:** A single `App.tsx` switches between views; task and theme state comes from hooks and Dexie services. No router migration is needed.
- **UI structure:** Shared layout (`Header`, `Sidebar`, `MobileNav`), reusable common controls (`Button`, `Modal`, `GlassCard`, `SearchBar`, `Badge`), task and reminder components, and six task views under `src/components/views`.
- **Theme:** `useTheme` toggles `html.dark`/`html.light`; custom `light:` Tailwind variant is registered in `tailwind.config.js`.
- **Build and checks:** `npm run build` runs TypeScript project build and Vite production build. `npm test -- --run` runs Vitest. No lint script is configured.
- **Responsive and accessibility risks:** Header action density, modal height/width, filter wrapping, task card action visibility, low-emphasis text contrast, and blur fallbacks need review. Preserve all task, auth, sync, notification, and PWA behavior.

## Four-phase plan

### Phase 1 — Glassmorphism and premium interactions

- **Objective/result:** Establish readable, restrained glass surfaces and consistent interactive states in both themes.
- **Files:** `src/index.css`, `src/components/common/{Button,GlassCard,Modal,SearchBar}.tsx`, `src/components/layout/{Header,Sidebar,MobileNav}.tsx`, task/filter/form/reminder components.
- **Order:** (1) audit shared utility definitions and component usage; (2) centralize surface, border, hover, focus, and fallback behavior in CSS utilities; (3) apply glass variants only to navigation, cards, dialogs, dropdowns, and appropriate form surfaces; (4) verify touch, keyboard, disabled, and reduced-motion states.
- **Dependency:** Existing React/Tailwind setup and current theme classes.
- **Risks:** Competing utility classes may override custom backgrounds; blur can reduce contrast or mobile performance. Keep solid fallbacks and avoid changing interaction handlers.
- **Tests/acceptance:** Build and Vitest pass; both themes retain readable glass surfaces; focus rings and disabled states remain visible; no layout or behavior regressions.
- **Completion:** Shared glass and interaction styles are consistently applied and validated.

### Phase 2 — Forest color tokens and gradients

- **Objective/result:** Complete a coherent forest-green dark theme and genuine pale-mint light theme using centralized tokens.
- **Files:** `src/index.css`, `tailwind.config.js`, `src/hooks/useTheme.ts`, and existing component class names where a conflicting legacy color remains.
- **Order:** (1) define semantic CSS variables for backgrounds, surfaces, text, borders, focus, and gradients; (2) align Tailwind forest/mint aliases; (3) replace only conflicting legacy accents; (4) check light/dark transitions and semantic colors.
- **Dependency:** Phase 1 surface variants.
- **Risks:** Legacy `navy` aliases and status colors are still used; preserve aliases and semantic warning/error/success colors to avoid broad regressions.
- **Tests/acceptance:** Build and Vitest pass; theme toggling continues to persist; no unintentional blue/violet palette remnants or unreadable theme-specific controls.
- **Completion:** Tokens drive the primary palette and both themes remain distinct and legible.

### Phase 3 — UI consistency and responsive refinement

- **Objective/result:** Make existing views, controls, overlays, and empty/loading states consistent at mobile, tablet, laptop, and wide desktop sizes.
- **Files:** `src/App.tsx`, `Header`, `Sidebar`, `MobileNav`, `Modal`, `TaskFilters`, `TaskCard`, `TaskFormModal`, `AuthModal`, `NotificationSettingsModal`, and view/task list components.
- **Order:** (1) inspect header and content widths; (2) fix overflow/wrapping in filters and cards; (3) constrain dialogs to viewport height and safe areas; (4) verify mobile navigation and touch targets; (5) inspect feedback states and focus visibility.
- **Dependency:** Phases 1 and 2 token/utility conventions.
- **Risks:** Small-screen density and fixed bottom navigation can obscure content; retain existing navigation behavior and add safe-area-aware spacing without changing task flows.
- **Tests/acceptance:** Build and Vitest pass; widths around 375, 768, 1024, 1440, and 1600 px have no horizontal overflow; dialogs and controls fit; touch targets remain usable.
- **Completion:** Responsive layouts are verified and major clipping/overflow issues are fixed.

### Phase 4 — Final QA and production readiness

- **Objective/result:** Confirm the final working tree builds, tests, and renders consistently without unrelated or risky changes.
- **Files:** All scoped UI files; no new dependencies expected.
- **Order:** (1) run Vitest; (2) run production build; (3) inspect rendered dark/light and responsive states when browser preview is available; (4) review final diff and summarize limitations.
- **Dependency:** Phases 1–3 complete.
- **Risks:** Browser preview or screenshot access may be unavailable; report only checks actually completed and state visual inspection limitations honestly.
- **Tests/acceptance:** `npm test -- --run` and `npm run build` succeed; no lint command exists in `package.json`; no accidental behavior or unrelated file changes.
- **Completion:** All available automated checks pass and the final changes are reviewed.

## Progress checklist

- [x] Phase 0 audit and concrete plan recorded.
- [x] Phase 1 shared glass utilities and interactions are present; reduced motion and keyboard focus treatments are included.
- [x] Phase 2 forest/mint tokens and theme aliases are in place; dark and light muted-text and badge contrast received focused refinements.
- [x] Phase 3 responsive code review and refinements: filters wrap, date/time inputs stack on narrow screens, and dialogs respect safe areas and viewport height.
- [x] Phase 4 automated QA: all 29 Vitest tests pass, the production build succeeds, and `git diff --check` reports no whitespace errors.
- [ ] Rendered screenshot QA at mobile/tablet/desktop widths and in both themes; the in-app browser cannot connect to the local preview (`ERR_CONNECTION_TIMED_OUT` / connection closed), so this could not be verified in this session.

## Contrast and verification notes

- The muted dark-theme token `#779886` has a 4.9:1 contrast ratio against `#0B2B26`; primary and secondary text tokens have higher contrast on their base surfaces.
- Light-mode forest and mint utility text, badges, and task status labels use darker forest/semantic variants where pale surfaces would otherwise reduce contrast.
- No lint script is defined in `package.json`.
- Rendered visual QA remains the sole outstanding verification item because the local preview is inaccessible to the available browser.
