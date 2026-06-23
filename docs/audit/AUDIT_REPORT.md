# FlyMusic Full Code, Product, UX, UI, Security, Performance Audit

Branch: `audit/full-flymusic-code-ux-ui`

## Executive summary

FlyMusic has a broad product surface with clear ambition around an artist-owned ecosystem, but the current app is carrying too much product area in one eagerly loaded shell. The route map, global providers, and feature modules show that fan, artist, brand, admin, community, spotlight, live, subscription, payout, and debug/QA surfaces have all accumulated in `src/App.tsx`. This creates high bundle-size risk, high regression risk, and makes Wave discipline harder to enforce.

The strongest parts of the codebase are the existence of explicit role-gated routes, Supabase typed client integration, many dedicated hooks, visible audit/admin tooling, and a legal/trust information surface. The weakest parts are lint/type quality, monolithic routing, global provider over-mounting, incomplete lazy loading, client-side feature exposure risk, mixed UX primitives, and unclear user feedback loops for `LISTEN -> ACT -> SEE EFFECT -> BELONG`.

## Current app health score

**5.5 / 10**

Rationale:
- Product scope and role separation are present, but hard to reason about because almost every feature is imported into the initial app shell.
- Build succeeds, but the JavaScript bundle is very large and Vite warns about chunking.
- Lint fails with hundreds of issues, including hook-order violations and many `any` types.
- Auth and admin routes exist, but `ProtectedRoute` currently lets admins access all protected routes, which should be reviewed against identity separation and “users must never act as another identity.”
- Motion is already available and used in places, but there is no obvious app-wide motion policy or reduced-motion abstraction.

## Audit constraints and branch note

Attempted to fetch and branch from `origin/main`, but this checkout has no configured `origin` remote. The audit branch was created from the current local repository state instead. No push or merge into `main` was performed.

## Critical risks

1. **Lint is failing before any implementation work.** `npm run lint` reports **505 problems: 326 errors and 179 warnings**. Representative blockers include hook-order violations in `src/components/discover/TasteDebugPanel.tsx` and `src/pages/studio/StudioGoals.tsx`, extensive `@typescript-eslint/no-explicit-any`, `prefer-const`, empty block statements, and `tailwind.config.ts` requiring a CommonJS import.
2. **Initial bundle is too large.** `npm run build` succeeds, but emits a single app JS asset of about **4.2 MB minified / 1.11 MB gzip** and warns that chunks exceed 500 kB. This is consistent with `src/App.tsx` statically importing most pages and dashboards.
3. **Role separation needs tightening.** `ProtectedRoute` treats any admin or super admin as globally allowed for all protected routes. That may be operationally convenient, but it conflicts with the non-negotiable principle that users must never act as another identity unless every downstream action is also server-authorized and audited.
4. **Client-side feature gating must not be treated as security.** The app has visible feature flag and feature access hooks, but all sensitive access must remain enforced by Supabase RLS, RPCs, and edge functions.
5. **Economic and payment surfaces are broad.** There are subscription, checkout, payout, Stripe Connect, supporter tier, pricing override, and revenue-related surfaces. These should be frozen except for audited hardening until explicit approval is given.
6. **Wave leakage risk.** Many public and protected routes are mounted in the app shell. If inactive Wave surfaces are not hidden by both route-level gating and server-side access rules, users can discover or attempt to enter unfinished experiences.

## High-priority fixes

1. Split `src/App.tsx` into route modules by public, fan, artist/studio, admin, brand, community, spotlight, legal, and checkout groups.
2. Lazy-load heavy dashboards and admin/studio/brand routes with route-level loading states.
3. Review `ProtectedRoute` semantics so admin access to fan/artist/brand pages is explicitly preview/audit-only and cannot mutate as that identity.
4. Add or standardize server-side authorization checks for all mutations touching identity, admin, payouts, pricing, subscriptions, supporter tiers, votes, follows, and artist-owned assets.
5. Fix hook-order lint blockers first; they are correctness issues, not style issues.
6. Create a Wave-gating matrix that lists every route and whether it is public, Wave 1, hidden, admin-only, role-gated, or feature-flagged.
7. Add reusable empty, loading, error, and success states for the main fan and artist loops.
8. Add bundle analysis and route chunk budgets before adding new visuals or motion.

## Medium-priority fixes

1. Consolidate duplicated list/card/button/badge patterns into a small FlyMusic UI layer on top of shadcn/Radix.
2. Reduce global provider nesting by moving contextual providers closer to routes that need them.
3. Replace repeated raw Supabase queries with typed query hooks and stable query keys.
4. Add React Query default options for retry behavior, stale times, and error handling.
5. Standardize feature flag names, labels, fallback behavior, and “not available yet” messaging.
6. Add a motion token system: short, soft durations; warm easing; reduced-motion guardrails.
7. Optimize large PNG assets and ensure responsive image loading.
8. Add per-route skeletons for studio, admin, feed, and discovery.

## Low-priority improvements

1. Improve naming consistency where product eras overlap: “Flightdeck,” “Spotlight,” “Pulse,” “FanPortal,” “GlobalHomeFeed,” and community/feed terminology.
2. Add documentation for product vocabulary and the intended fan/artist/admin mental model.
3. Add visual QA snapshots for landing, fan dashboard, artist studio, admin dashboard, and mobile navigation.
4. Add microcopy polish so fan actions always explain the artist benefit.
5. Add optional premium motion to landing-page hero and artist cards after performance work.

## What not to touch yet

Do **not** change these without explicit approval:
- Payment, ledger, subscription, payout, pricing, revenue split, or Stripe logic.
- Voting/ranking economics or hidden ranking rules.
- Artist ownership data model.
- Admin role grants or role-management flows.
- Supabase RLS migrations tied to money, ownership, payouts, subscriptions, or roles.
- Any unfinished Wave feature except to hide, gate, or document it.

## Risk areas around auth, roles, payments, admin, and privacy

- **Auth:** `AuthContext` fetches roles and profile client-side; this is useful for UI, but all sensitive authorization must be rechecked server-side.
- **Roles:** Multi-role support exists through `user_roles`, while `primaryRole` computes a single role. This should be documented and tested to prevent identity leaks.
- **Admin:** Admin routes are gated, but the global admin bypass in `ProtectedRoute` should be reviewed and paired with audit logs for admin preview actions.
- **Payments:** Checkout, subscriptions, supporter tiers, Stripe Connect, payout, and pricing override surfaces exist. Treat as change-frozen until a dedicated economic/security review.
- **Privacy/GDPR:** Legal pages exist, but user-facing privacy controls, export/delete flows, consent records, and auditability need a dedicated GDPR matrix.
- **Feature flags:** Flags are good for Wave control, but route hiding must not be the only enforcement mechanism.

## Areas where Lovable-generated structure needs cleanup

- App name remains `vite_react_shadcn_ts` in `package.json`.
- `src/App.tsx` is a generated-style monolith with hundreds of static imports and inline route declarations.
- Many pages appear to own their own fetching, loading, and error state patterns instead of shared query primitives.
- Lint debt suggests generated or rapid-prototype code was accepted without type hardening.
- UI components mix generic shadcn primitives with product-specific components, but the FlyMusic design system is not clearly formalized.

## Test/check results

- `npm install`: passed, but warned that the current environment uses Node `v20.20.2` while `package.json` requires Node `24.x`.
- `npm run lint`: failed with 505 problems, including 326 errors and 179 warnings. Safest fix: first repair hook-order errors, then replace high-risk `any` types in auth/admin/economic/role code, then address remaining type/style debt by route group.
- `npm run build`: passed, but warned about stale Browserslist data, ambiguous Tailwind arbitrary classes, a dynamic/static import conflict for `VideoSessionContext`, and oversized chunks. Safest fix: route-level code splitting before adding new features.
