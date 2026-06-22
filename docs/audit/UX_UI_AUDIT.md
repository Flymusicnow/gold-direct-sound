# FlyMusic UX and UI Audit

## Product lens

FlyMusic should not feel like Spotify, TikTok, or a generic social network. The core loop should always be visible:

**LISTEN -> ACT -> SEE EFFECT -> BELONG**

Every fan, artist, and admin screen should answer:
1. What am I hearing or seeing?
2. What can I do now?
3. What changed because I acted?
4. Why do I belong here?

## Fan UX review

Strengths:
- Fan-specific routes exist for dashboard, feed, artists, activity, settings, playlists, supporter status, achievements, missions, voting, leaderboards, wrapped, and public profile.
- The product has raw material for a strong community loop.

Issues:
- Fan routes are numerous and may feel feature-first rather than journey-first.
- The immediate relationship between listening, voting/supporting/following, and artist impact needs stronger feedback.
- Leaderboards and achievements can accidentally shift the product toward gamified ranking unless framed around artist support and community belonging.
- Empty states should teach fans how their first action helps an artist.

Recommendations:
- Make the fan home explicitly sequence: Listen, choose one meaningful action, show impact, invite belonging.
- After vote/follow/support/save, show warm feedback: “You helped [artist] move closer to [goal].”
- Add a fan “impact receipt” component reused across voting, following, supporter, and mission flows.

## Artist UX review

Strengths:
- Studio has dedicated areas for profile, tracks, videos, collections, events, analytics, comments, testimonials, collaborations, subscription, earnings, merch, live, promo, settings, presskit, opportunities, smart links, verification, community, goals, spotlight, and pulse.
- Artist ownership has room to be made visible through studio language and trust surfaces.

Issues:
- Studio scope is very large and may overwhelm independent artists.
- It is not obvious which tools are Wave 1 stable versus future/experimental.
- Earning logic and ownership explanations must be clearer but should not be changed without approval.
- Analytics should explain “what changed because fans acted,” not just show numbers.

Recommendations:
- Create a Studio home hierarchy: today’s artist health, fan actions, next best action, ownership/trust reminder.
- Add explicit labels for locked, beta, preview, and not-yet-active tools.
- Keep economic displays read-only unless a dedicated approved payment/ledger PR is opened.

## Admin UX review

Strengths:
- Admin has many operational routes: users, artists, tracks, approvals, activity, spotlight, beta codes, payouts, features, roles, updates, smart links, inbox, verifications, waitlist, QA, event log, edge functions, pricing, onboarding debug, and repair tools.
- There is evidence of audit and QA tooling.

Issues:
- Admin can become dangerous if previewing user experiences allows mutation as another role.
- Role management and payout/pricing tools are high-risk and need extra confirmation, audit logs, and separate PR review.
- Admin navigation may be dense on mobile.

Recommendations:
- Separate admin “observe/preview” from “act/change.”
- Add irreversible-action confirmation standards.
- Make admin audit log coverage visible near sensitive actions.

## Landing page review

Strengths:
- Public routes exist for home, trust, principles, culture, safety, data, pricing, how it works, top artists, early access, beta, and role-specific sign-in/join.
- Brand assets and hero imagery are available.

Issues:
- Current architecture imports the whole product surface up front, hurting perceived landing-page speed.
- Product promise should be sharper: artist-owned community music ecosystem, not social/video/feed clone.

Recommendations:
- Landing should explain FlyMusic in one sentence and show the loop: fan listens, acts, sees effect; artist owns relationship and earns trust.
- Lazy-load everything not needed for first paint.
- Use soft gold glow and warm parallax only after bundle reduction.

## Onboarding review

Strengths:
- Separate fan, artist, brand, invite, early access, and beta paths exist.

Issues:
- Role entry points can fragment. Users need reassurance that choosing a role does not leak identity or place them in the wrong workspace.
- Artist onboarding should explain ownership, what is public, and what is not.
- Fan onboarding should explain impact and belonging, not just preferences.

Recommendations:
- Add role-confirmation copy before workspace entry.
- Add onboarding completion receipts: “You are entering as Fan/Artist/Admin.”
- Make inactive Wave features invisible or labeled preview-only.

## Mobile review

Strengths:
- Mobile-specific navigation components exist for fan/admin and swipe/back providers are present.

Issues:
- Large global providers and mini-player/video/session components mounted across the app can hurt mobile performance.
- Dashboard-heavy routes need chunking and skeletons.
- Dense admin/studio menus risk cognitive overload on small screens.

Recommendations:
- Audit mobile route waterfalls after code splitting.
- Keep bottom nav focused on core loop, not feature inventory.
- Avoid heavy hover-only UI; ensure all core actions are thumb-friendly.

## UI consistency review

Strengths:
- Tailwind, shadcn/Radix, lucide icons, and reusable UI primitives are present.
- The app can support a premium visual system.

Issues:
- Visual consistency likely varies across 147 pages and 409 components.
- Some surfaces may still feel like generic Lovable output: card grids, dashboards, badges, forms, and broad feature lists.
- Tailwind arbitrary class warnings show class syntax needs cleanup.

Recommendations:
- Define FlyMusic tokens for gold, surface, border, muted text, success, warning, danger, and motion.
- Standardize button intent names: primary action, support action, admin destructive, secondary, quiet.
- Create shared dashboard card, impact badge, artist ownership badge, and Wave/preview badge.

## Motion and parallax recommendations

Use motion only to improve understanding. Direction:
- Soft, warm, premium, musical, subtle.
- Never flashy, aggressive, cheap neon, or random 3D.
- Gold glow should breathe, not blink.

Recommended motion:
1. Landing hero: very subtle parallax on background art, disabled for reduced motion.
2. Artist cards: small hover/lift on pointer devices only.
3. Fan action feedback: short pulse or count-up after vote/support/follow/save.
4. Studio dashboard: stagger reveal for “next best action” cards.
5. Admin bulk action bar: existing Framer Motion usage is appropriate; standardize timing.

Avoid:
- Motion on dense tables.
- Persistent animated backgrounds on mobile dashboards.
- Motion that hides state changes or delays core actions.

## Top 10 UX/UI fixes ranked by impact

1. Clarify fan home around `LISTEN -> ACT -> SEE EFFECT -> BELONG`.
2. Add impact receipt feedback after fan actions.
3. Simplify Studio home into artist health, fan impact, next action, ownership reassurance.
4. Hide or label non-Wave features consistently.
5. Split navigation into journey groups rather than feature inventory.
6. Add shared empty/loading/error/success states.
7. Standardize cards/buttons/badges/forms across dashboards.
8. Add reduced-motion-safe animation primitives.
9. Optimize landing page first paint by lazy-loading app routes.
10. Replace generic dashboard copy with FlyMusic-specific artist-owned language.
