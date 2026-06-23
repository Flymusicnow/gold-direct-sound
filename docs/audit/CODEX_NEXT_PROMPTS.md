# Ready-to-use Codex Prompts for Next Phases

## Prompt 1: Safe routing and lint foundation

Create a new preview branch from latest main named `cleanup/app-routing-lint-foundation`. Do not push directly to main and do not merge into main. Refactor `src/App.tsx` by extracting behavior-equivalent route groups into `src/routes/` modules. Preserve every existing route path and protection wrapper. Fix only correctness-level lint blockers required for hook-order validity and build/lint progress; do not change product behavior, payments, ledgers, subscriptions, payouts, ranking, or role economics. Run `npm install`, `npm run lint`, and `npm run build`. If a command fails, document the exact failure and safest fix in the PR body.

## Prompt 2: Fan and artist UX clarity

Create a new preview branch from latest main named `ux/fan-artist-core-loop-clarity`. Do not push directly to main and do not merge into main. Improve UX clarity around `LISTEN -> ACT -> SEE EFFECT -> BELONG` for fan and artist Wave 1 flows only. Add copy/components that explain fan impact after actions and artist ownership in Studio. Do not alter payment, payout, subscription, pricing, revenue split, ranking, or database economic logic. Preserve role separation and do not allow users to act as another identity. Run `npm install`, `npm run lint`, and `npm run build`. Include screenshots if visible web UI changes are made.

## Prompt 3: FlyMusic UI system pass

Create a new preview branch from latest main named `ui/flymusic-design-system-pass`. Do not push directly to main and do not merge into main. Add or refine shared FlyMusic UI primitives for cards, buttons, badges, empty states, loading states, error states, and trust/ownership labels using existing shadcn/Radix/Tailwind patterns. Keep the style soft, warm, premium, musical, and clear. Do not redesign randomly and do not change data, auth, role, payment, payout, subscription, pricing, revenue split, or ranking logic. Run `npm install`, `npm run lint`, and `npm run build`. Include screenshots for changed runnable UI.

## Prompt 4: Motion and parallax preview

Create a new preview branch from latest main named `preview/motion-parallax-flymusic`. Do not push directly to main and do not merge into main. Add reduced-motion-aware motion primitives and preview subtle motion only where it improves understanding: landing hero parallax, card hover/lift, staggered reveal, and fan action feedback. Motion must be soft, warm, premium, musical, subtle, and never flashy/aggressive/neon/random 3D. Gold glow should breathe, not blink. Do not change auth, privacy, roles, payments, payouts, subscriptions, pricing, revenue split, ranking, or feature economics. Run `npm install`, `npm run lint`, and `npm run build`. Include screenshots or screen notes for visible changes.

## Prompt 5: Security, role, Wave, and performance hardening

Create a new preview branch from latest main named `hardening/auth-roles-performance-wave-gates`. Do not push directly to main and do not merge into main. Audit and harden route-level role behavior, Wave gating, and performance. Review `ProtectedRoute` admin bypass behavior without weakening admin protection or allowing admins to mutate as other identities. Add route-level lazy loading for heavy dashboards and document bundle-size impact. Do not change payment, ledger, subscription, payout, pricing, revenue split, ranking, or economic logic without explicit approval. Run `npm install`, `npm run lint`, and `npm run build`. Document role smoke tests and rollback steps.
