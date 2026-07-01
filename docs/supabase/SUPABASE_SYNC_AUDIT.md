# Supabase Sync Audit

Date: 2026-07-02
Project ref: `suqddnnfrhrclmrtsqof`
Live site: `https://flymusic.se`
Scope: Wave 1 foundation sync between frontend, Supabase Edge Functions, preview SQL, migrations, and docs. No production SQL was run and no Edge Functions were deployed.

## Summary

The main sync gap was the `validate-invite-code` Edge Function expecting `public.validate_invite_code_universal(_code text)` through PostgREST while preview SQL either was not applied or did not return the shape the Edge Function consumes. The preview SQL now defines the RPC, creates the invite-session dependency it needs, returns the expected token fields, and grants RPC execution only to `service_role` so the Edge Function remains the invite validation boundary.

Supabase's 2026 Data API change means new public tables may not be exposed automatically. The preview patches now include explicit grants for the waitlist/invite Edge Function path while preserving RLS and avoiding public `SELECT` on waitlist emails or invite codes.

## Frontend Supabase Usage

| Frontend file | Supabase resource | Operation | Required RLS/grant | Notes |
| --- | --- | --- | --- | --- |
| `src/components/fan/WaitlistForm.tsx` | `beta_waitlist` | `insert` | `anon/authenticated INSERT`; RLS allows normalized pending fan/artist rows only | No public `SELECT` needed. |
| `src/components/fan/WaitlistForm.tsx` | `waitlist-confirmation` | Edge Function invoke | Function validates body and uses Supabase secrets only | Sends confirmation/admin email after successful insert. |
| `src/components/fan/InviteCodeUnlock.tsx` | `validate-invite-code` | Edge Function invoke | Function uses `service_role`; RPC `EXECUTE` only for `service_role` | Keeps direct invite-code table/RPC access out of frontend. |
| `src/pages/fan/FanInvite.tsx` | `validate-invite-code` | Edge Function invoke | Same as above | Stores opaque token only. |
| `src/pages/studio/ArtistInvite.tsx` | `validate-invite-code` | Edge Function invoke | Same as above | Stores opaque token and invite id for signup flow. |
| `src/hooks/useFanInviteAccess.ts` | `fan_invite_sessions` | `select`, `update` in existing frontend code | Preview SQL keeps table service-role only | Existing frontend validation will need an Edge Function boundary before this preview SQL is applied. |
| `src/hooks/useInviteAccess.ts` | `fan_invite_sessions` | `select`, `update` in existing frontend code | Preview SQL keeps table service-role only | Shared token validation should move server-side. |
| `src/pages/auth/JoinFan.tsx` | `user_roles`, `fan_beta_access`, `beta_invites` | `insert`, `insert`, `update` | Authenticated own-role insert; own beta-access insert; beta invite update currently needs authenticated update policy | Risk: invite redemption status is updated directly from frontend after signup. |
| `src/pages/auth/JoinArtist.tsx` | `user_roles`, `artist_beta_access`, `beta_invites` | `insert`, `insert`, `update` | Same role/access grants; beta invite update currently needs authenticated update policy | Risk: same direct invite redemption update. |
| `src/pages/admin/AdminWaitlist.tsx` | `beta_waitlist` | `select`, `update` through UI/actions | Authenticated admin/super_admin `SELECT/UPDATE` via RLS | Admin visibility must remain server-side/RLS backed. |
| `src/pages/admin/AdminWaitlist.tsx` | `approve-waitlist-entry`, `send-beta-invites` | Edge Function invoke | Functions verify caller JWT and admin role server-side | Preferred admin boundary for approval/invite sending. |
| `src/components/admin/AdminSidebar.tsx` | `beta_waitlist` | `select count` | Authenticated admin/super_admin `SELECT` via RLS | Used for admin badge/count. |
| `src/pages/admin/AdminOnboardingDebug.tsx` | `admin-onboarding-debug` | Edge Function invoke | Function verifies admin role server-side | Debug function touches invite data; should not expose full codes beyond admin diagnostics. |
| `src/pages/Auth.tsx`, `src/pages/RoleSelection.tsx`, auth join/sign-in pages | `user_roles`, Supabase Auth | `insert/upsert`, `signInWithPassword`, `getUser/getSession` | `authenticated` users may read only their own roles; role writes must not allow admin escalation | Existing preview read policy is own-role only. |
| Multiple app pages/hooks | domain tables and RPCs | `select/insert/update/delete/execute` | Table-specific RLS/grants or RPC `EXECUTE` with function-side authorization | Full static scan found broad app usage outside Wave 1; this audit did not alter payment, economics, ranking, voting, payouts, subscriptions, or financial logic. |

## Edge Functions

| Function | Tables | RPC | Secrets | Required grants | Risk notes |
| --- | --- | --- | --- | --- | --- |
| `admin-onboarding-debug` | `user_roles`, `beta_invites`, `profiles`, `artist_profiles`, `legal_documents`, `legal_acceptances` | - | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Service-role table access; server-side admin check | Not documented in beta plan; ensure debug responses mask codes/PII. |
| `approve-waitlist-entry` | `user_roles`, `beta_waitlist`, `beta_invites`, `admin_activity_logs`, `edge_function_logs` | - | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `APP_BASE_URL` | Service-role table access; admin/super_admin check | Documented; does not return full invite code. |
| `send-beta-invites` | `user_roles`, `beta_invites`, `beta_waitlist`, `edge_function_logs` | - | `EMAIL_FROM`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` | Service-role table access; admin/super_admin check | Logs only code prefix; ensure deployed version matches repo. |
| `validate-invite-code` | `edge_function_logs` plus RPC-owned `beta_invites`/`fan_invite_sessions` | `validate_invite_code_universal` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `service_role EXECUTE` on RPC; `edge_function_logs INSERT` | Existing function logs full original/normalized code in one step; hardening recommended before production. |
| `waitlist-confirmation` | - | - | `RESEND_API_KEY`, `EMAIL_FROM`, `WAITLIST_ADMIN_EMAIL`, `APP_BASE_URL` | No database grants in current code | Documented live-tested; admin email receives PII by design, keep secret controlled. |
| Other Edge Functions | App/payment/community/supporter/Stripe tables | Various RPCs including `check_artist_pricing_status`, `resolve_user_permissions`, `get_trial_status`, `process_scheduled_releases` | Supabase service-role, Stripe, Resend, VAPID, Telegram as applicable | Service-role grants or function-specific RPC `EXECUTE` | Out of Wave 1 fix scope; not modified to avoid payment/economy/ranking/subscription changes. |

## SQL And Migration Coverage

| Object | Used by | Created in repo | Audit result |
| --- | --- | --- | --- |
| `public.beta_waitlist` | Waitlist form, admin UI, invite functions | `supabase/preview/003_preview_waitlist_fix.sql`, migrations | Present. Public insert only; no public select in preview SQL. |
| `public.beta_invites` | Invite functions, signup redemption | `supabase/preview/004_preview_invite_approval.sql`, migrations | Present. Admin RLS only; no anon select policy. |
| `public.validate_invite_code_universal(_code text)` | `validate-invite-code` | `supabase/preview/005_validate_invite_code_universal.sql`, migrations | Present after fix; returns token shape expected by Edge Function. |
| `public.fan_invite_sessions` | Invite token validation hooks and RPC | Migrations; now preview `005` | Was missing from preview path; fixed. |
| `public.admin_activity_logs` | Approval/admin hooks | `supabase/preview/004_preview_invite_approval.sql`, migrations | Present. Admin select/insert in preview; service-role grants added in `006`. |
| `public.edge_function_logs` | Invite/admin/logging functions | Migrations; now preview `006` | Was missing from preview path; fixed. |
| `public.user_roles` | Auth/admin checks | `supabase/preview/001_preview_schema.sql`, migrations | Present. Preview read policy is own-user only. |

## Findings

### Missing SQL Objects

- `public.edge_function_logs` was required by `validate-invite-code`, `approve-waitlist-entry`, and `send-beta-invites` but was not in the preview SQL run order. Added in `006_service_role_grants_audit_fix.sql`.
- `public.fan_invite_sessions` was required by the invite validation token flow but was not in preview SQL. Added in `005_validate_invite_code_universal.sql`.

### Missing Grants

- `public.validate_invite_code_universal(text)` needed `service_role EXECUTE` for the Edge Function but should not be directly executable by `anon` or `authenticated`. Fixed in `005` and reinforced in `006`.
- Explicit `service_role` grants for waitlist/invite/log/session tables are now included in `006` to avoid Data API exposure/cache drift.

### Missing Policies

- `edge_function_logs` preview admin read policy was missing. Added in `006`.
- `fan_invite_sessions` intentionally has no anon/authenticated policies in preview SQL; invite sessions are service-role only.

### Missing Docs

- No single sync audit existed. Added this document.
- `docs/supabase/BETA_WAITLIST_AUTOMATION_PLAN.md` currently contains merge-conflict markers in the repo; resolve separately to avoid confusing future operators.

### Duplicate Or Unsafe Grants/Policies

- Prior preview `005` granted direct RPC execute to `anon` and `authenticated`. That bypassed the intended Edge Function boundary. Revoked.
- `004_preview_invite_approval.sql` grants authenticated `SELECT/INSERT/UPDATE` on `beta_invites`, but RLS limits it to admin/super_admin. This is acceptable for Data API exposure, but should be monitored because invite codes are sensitive.

### Anon/Public SELECT Risks

- No public `SELECT` policy was found for `beta_waitlist` emails in preview SQL.
- No public `SELECT` policy was found for `beta_invites` codes in preview SQL.
- `fan_invite_sessions` has no public reads in preview SQL. Invite sessions are service-role only and must be validated through a server-side boundary.

## Required Manual SQL Run Order

Run manually in Supabase SQL Editor. Do not run from Codex automation.

1. `supabase/preview/001_preview_schema.sql`
2. `supabase/preview/002_preview_seed.sql`
3. `supabase/preview/003_preview_waitlist_fix.sql`
4. `supabase/preview/004_preview_invite_approval.sql`
5. `supabase/preview/005_validate_invite_code_universal.sql`
6. `supabase/preview/006_service_role_grants_audit_fix.sql`

After running `005` or `006`, confirm PostgREST schema cache reload completed and then call `validate-invite-code` with a safe test invite code through the Edge Function, not through direct frontend RPC.

## Required Function Deploy Commands

Deploy only after the SQL run order above is complete and secrets are configured.

```bash
supabase functions deploy waitlist-confirmation
supabase functions deploy approve-waitlist-entry
supabase functions deploy send-beta-invites
supabase functions deploy validate-invite-code
```

## Remaining Risks

- `validate-invite-code` still logs full original and normalized invite codes in `CODE_NORMALIZED`; mask this in a follow-up Edge Function hardening pass.
- Fan/artist signup pages update `beta_invites.status = redeemed` directly from the frontend after signup. A stricter model would redeem inside a server-side function.
- `fan_invite_sessions` is service-role only in preview SQL; existing frontend token validation code must move behind a server-side boundary before this model is fully compatible.
- The deployed Supabase database and deployed Edge Function versions were not inspected live in this audit.
- Existing untracked local files and an existing `main` branch ahead commit were left untouched.
