# FlyMusic Safe Implementation Plan

## Guiding rules

- Do not push directly to main.
- Do not merge into main.
- Use preview branches and focused PRs.
- Do not change payment, ledger, subscription, payout, pricing, revenue split, ranking, or economic logic without explicit approval.
- Preserve fan, artist, admin, and brand separation.
- Treat client-side gates as UX only; enforce security server-side.

## Phase 1: safe cleanup

Suggested branch: `cleanup/app-routing-lint-foundation`

Goals:
- Fix correctness lint blockers, especially hook-order violations.
- Split route declarations out of `src/App.tsx` without changing behavior.
- Add route group files for public, fan, studio, admin, brand, community, spotlight, legal, and checkout.
- Keep all route paths unchanged.

Likely files:
- `src/App.tsx`
- `src/routes/*`
- `src/components/discover/TasteDebugPanel.tsx`
- `src/pages/studio/StudioGoals.tsx`
- `tailwind.config.ts`

Checks:
- `npm install`
- `npm run lint`
- `npm run build`

Rollback:
- Revert the route module PR; routes should remain behavior-equivalent.

## Phase 2: UX clarity improvements

Suggested branch: `ux/fan-artist-core-loop-clarity`

Goals:
- Add shared “impact receipt” and clear success states after fan actions.
- Add Wave/preview/locked labels without enabling hidden features.
- Improve fan and artist onboarding copy for role clarity and ownership.

Likely files:
- Fan pages under `src/pages/fan/*`
- Artist studio dashboard/onboarding files under `src/pages/studio/*`
- Shared components under `src/components/*`
- i18n files under `src/i18n/*`

Checks:
- `npm install`
- `npm run lint`
- `npm run build`
- Manual mobile smoke test of fan sign-in/onboarding/dashboard/vote/follow flows.

Rollback:
- Disable new copy/components by reverting the UX PR; no database or economic changes allowed.

## Phase 3: UI system improvements

Suggested branch: `ui/flymusic-design-system-pass`

Goals:
- Create a small FlyMusic design layer over shadcn/Radix.
- Standardize dashboard cards, badges, forms, buttons, empty states, and trust/ownership badges.
- Remove generic Lovable feel from key Wave 1 screens.

Likely files:
- `src/components/ui/*`
- `src/components/*`
- `src/index.css`
- Key fan/studio/admin dashboard files

Checks:
- `npm install`
- `npm run lint`
- `npm run build`
- Screenshot review for landing, fan dashboard, studio dashboard, admin dashboard, mobile nav.

Rollback:
- Revert component styling PR; preserve route and data behavior.

## Phase 4: motion/parallax preview

Suggested branch: `preview/motion-parallax-flymusic`

Goals:
- Add reduced-motion-aware motion primitives.
- Add subtle landing hero parallax and card lift previews.
- Add fan action feedback animation.
- Avoid persistent heavy animations on mobile.

Likely files:
- `src/components/motion/*`
- Landing/home components
- Fan action components
- Artist cards
- `src/index.css`

Checks:
- `npm install`
- `npm run lint`
- `npm run build`
- Reduced-motion browser check.
- Mobile performance smoke test.

Rollback:
- Feature flag motion primitives or revert the preview branch.

## Phase 5: security and performance hardening

Suggested branch: `hardening/auth-roles-performance-wave-gates`

Goals:
- Review `ProtectedRoute` admin bypass behavior.
- Add a route/Wave gating matrix.
- Lazy-load heavy route groups.
- Add bundle budget checks and optimize large images.
- Review server-side enforcement for sensitive mutations.

Likely files:
- `src/components/ProtectedRoute.tsx`
- `src/contexts/AuthContext.tsx`
- `src/App.tsx` / `src/routes/*`
- `src/integrations/supabase/*`
- Supabase functions and migrations only if explicitly approved for non-economic hardening
- Asset files if optimized

Checks:
- `npm install`
- `npm run lint`
- `npm run build`
- Bundle-size comparison.
- Role smoke test: fan cannot enter studio/admin; artist cannot enter fan-only mutating flows; admin cannot mutate as fan/artist without explicit audited admin mode.

Rollback:
- Revert hardening PR if route access regressions appear; keep docs and matrix.

## Suggested PR order

1. `cleanup/app-routing-lint-foundation`
2. `hardening/auth-roles-performance-wave-gates` route gating and lazy-load subset, no economic changes
3. `ux/fan-artist-core-loop-clarity`
4. `ui/flymusic-design-system-pass`
5. `preview/motion-parallax-flymusic`
6. Dedicated economic/payment/security PRs only after explicit approval

## Test plan

Minimum for every PR:
- `npm install`
- `npm run lint`
- `npm run build`

Manual smoke tests:
- Public landing and sign-in routes.
- Fan onboarding, dashboard, vote/follow/support/save feedback.
- Artist studio onboarding, dashboard, profile/tracks/videos read/write checks.
- Admin dashboard, user list, audit/activity surfaces.
- Wrong-role attempts.
- Mobile viewport navigation.
- Reduced-motion mode for animated surfaces.

## Rollback plan

- Keep each phase as a separate PR and avoid database/economic changes in UX/UI/motion branches.
- For route splitting, preserve exact paths and use snapshot route inventory before/after.
- For role hardening, add temporary diagnostics and clear rollback instructions before deployment.
- For UI/motion changes, keep data logic untouched so revert is low-risk.
