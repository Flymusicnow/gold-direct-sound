# Beta Waitlist Automation Plan

This document prepares a safe MVP implementation package for FlyMusic beta waitlist automation. It is intentionally documentation-only: no Supabase connection, no SQL execution, no new Edge Functions, and no app-code changes are included in this phase.

## Current state

- The live site (`flymusic.se`) already collects fan and artist waitlist submissions into `public.beta_waitlist`.
- The current waitlist form inserts directly from the frontend using the public Supabase client and writes:
  - `email`
  - `user_type` (`fan` or `artist`)
  - `status = pending`
- Duplicate email inserts are treated as a successful “already on the list” experience.
- Fan and artist gate pages embed the same waitlist form with role-specific defaults:
  - Fan gate hides the role toggle and submits fan signups.
  - Artist gate hides the role toggle and submits artist signups.
- Invite-code unlock already calls the `validate-invite-code` Edge Function and stores the returned invite token before navigating to the role-specific signup path.
- Admin waitlist UI already exists and can:
  - list `beta_waitlist` rows,
  - filter by status,
  - mark rows as `contacted`,
  - send single or bulk invites through `send-beta-invites`.
- `send-beta-invites` already uses a server-side Supabase service-role client, verifies the caller is an admin or super admin, creates `beta_invites`, sends invite email through Resend, updates `beta_waitlist` to `invited`, and writes Edge Function summary logs.
- `validate-invite-code` already uses a server-side Supabase service-role client and validates codes through `validate_invite_code_universal`.
- Resend is already present in the Edge Function layer through `RESEND_API_KEY` usage.
- Existing database/migration artifacts show `beta_invites`, `beta_waitlist.invited_at`, `beta_waitlist.invited_by`, admin-only beta invite policies, and a preview waitlist RLS shape, but the live database must be verified manually before any implementation phase.

## Recommended architecture

Use Supabase Edge Functions as the only automation boundary for email sending, invite creation, approval transitions, and audit logging.

### MVP flow

1. Public user submits the waitlist form.
2. The app keeps inserting into `public.beta_waitlist` using the current RLS-protected anon/authenticated insert path for the first MVP phase, or later moves submission into a public Edge Function if idempotent confirmation email sending must be guaranteed.
3. A new `waitlist-confirmation` Edge Function sends:
   - a user confirmation email: “You are on the FlyMusic beta waitlist.”
   - an admin notification email: “New fan/artist joined the waitlist.”
4. Admin reviews rows in the existing admin waitlist UI.
5. Admin approves a row through a new admin-only `approve-waitlist-entry` Edge Function.
6. That Edge Function verifies admin/super_admin role server-side, updates row state, creates or attaches an invite code, sends the invite email, and records audit events.
7. User enters or follows the invite code and the existing `validate-invite-code` function continues to validate access.

### Why Edge Functions

- Email provider secrets stay server-side in Supabase Edge Function secrets, never in frontend code.
- Service-role access stays server-side only.
- Admin authorization can be checked server-side before status transitions or invite creation.
- Audit logging can be centralized and made append-only.
- Frontend remains a thin caller with the user session token; no payment, payout, ranking, voting weight, or admin permission logic needs to change.

## Email provider recommendation

Use Resend for the MVP because it is already integrated in `send-beta-invites` and the required secret name `RESEND_API_KEY` is already expected by existing Edge Function code.

Recommended MVP additions:

- Reuse the same Resend HTTP API pattern already used by `send-beta-invites`.
- Centralize email HTML/text generation in shared Edge Function helper modules in a later refactor.
- Keep the sender on a verified FlyMusic domain mailbox.
- Add plain-text alternatives before production hardening.
- Do not expose Resend keys in Vercel/frontend environment variables.

## Tables needed

### Existing or expected tables

#### `public.beta_waitlist`

Required columns for MVP:

- `id uuid primary key`
- `email text not null unique`
- `user_type text not null check in ('fan', 'artist', optionally 'both')`
- `status text not null default 'pending'`
- `created_at timestamptz not null default now()`
- `invited_at timestamptz null`
- `invited_by uuid null`

Recommended additional columns for a cleaner approval flow:

- `approved_at timestamptz null`
- `approved_by uuid null references auth.users(id)`
- `confirmation_email_sent_at timestamptz null`
- `admin_notified_at timestamptz null`
- `last_email_error text null`
- `invite_id uuid null references public.beta_invites(id)` if a single canonical invite should be attached to the row.

#### `public.beta_invites`

Required columns for MVP invite-code flow:

- `id uuid primary key`
- `email text not null`
- `role text not null check in ('fan', 'artist')`
- `code text unique not null`
- `status text not null` such as `created`, `sent`, `redeemed`, `revoked`, `failed`, `replaced`
- `created_at timestamptz not null default now()`
- `sent_at timestamptz null`
- `redeemed_at timestamptz null`
- `created_by uuid null`
- `last_error text null`
- `waitlist_id uuid null references public.beta_waitlist(id)`
- `replaced_by uuid null references public.beta_invites(id)` if rotating invite codes
- `replaced_at timestamptz null` if rotating invite codes

#### `public.admin_activity_logs` or dedicated `public.waitlist_audit_log`

For a minimal MVP, reuse `admin_activity_logs` if live policies already support admin inserts and reads.

For a safer waitlist-specific audit trail, create `public.waitlist_audit_log` later with:

- `id uuid primary key default gen_random_uuid()`
- `waitlist_id uuid null references public.beta_waitlist(id)`
- `invite_id uuid null references public.beta_invites(id)`
- `actor_id uuid null references auth.users(id)`
- `actor_role text null`
- `action text not null`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`
- `correlation_id uuid null`

Recommended actions:

- `waitlist.submitted`
- `waitlist.confirmation_email_sent`
- `waitlist.admin_notification_sent`
- `waitlist.approved`
- `invite.created`
- `invite.email_sent`
- `invite.email_failed`
- `invite.redeemed`
- `invite.revoked`
- `invite.replaced`

## RLS and grant requirements

Do not weaken RLS. Keep public users unable to read waitlist emails.

### `public.beta_waitlist`

Required policies/grants:

- `anon` and `authenticated` may `INSERT` only rows where:
  - email is normalized/lowercased,
  - `user_type` is allowed,
  - `status = 'pending'`,
  - admin-only fields such as `invited_at`, `invited_by`, `approved_at`, `approved_by`, `invite_id` are null.
- Admins/super_admins may `SELECT` rows.
- Admins/super_admins may update only allowed workflow fields.
- Public users must not have `SELECT`, `UPDATE`, or `DELETE` access.

### `public.beta_invites`

Required policies/grants:

- Admins/super_admins may `SELECT`, `INSERT`, and `UPDATE`.
- Public users must not directly read invite rows by code.
- Invite-code validation must happen through `validate-invite-code` or a SQL RPC invoked server-side.

### Audit log

Required policies/grants:

- Admins/super_admins may `SELECT` audit logs.
- Edge Functions using service role may insert audit logs.
- If frontend admin hooks continue to insert `admin_activity_logs`, keep inserts limited to authenticated admins and validate policies carefully.
- Audit rows should not be user-editable after insert.

### Edge Function authorization

- Public confirmation function may be callable from the waitlist form but must validate payloads and avoid revealing whether arbitrary emails exist beyond the current duplicate-safe UX.
- Admin approval/invite function must require a valid user JWT and independently verify admin/super_admin role with a service-role Supabase client.
- Do not trust frontend role state alone.

## Edge Functions needed

### 1. `waitlist-confirmation`

Purpose:

- Send confirmation email to the waitlist user.
- Send notification email to admins.
- Record email send status and audit events.

Recommended input:

```json
{
  "email": "user@example.com",
  "user_type": "fan",
  "waitlist_id": "optional-uuid-if-known"
}
```

Security:

- Callable without service-role exposure to the frontend.
- Validate email and role server-side.
- Prefer looking up the newly inserted row by normalized email using service role.
- Rate-limit by email and IP if available.
- Return generic success for duplicate or already-confirmed states.
- Never return secrets or internal email-provider responses to the client.

### 2. `approve-waitlist-entry`

Purpose:

- Admin-only approval and invite orchestration.
- Approve the waitlist row.
- Create or attach an invite code.
- Send invite email.
- Update status and audit trail.

Recommended input:

```json
{
  "waitlist_id": "uuid",
  "role": "auto"
}
```

Security:

- Require Authorization bearer JWT.
- Verify user via `supabase.auth.getUser(token)`.
- Verify admin/super_admin role server-side using `user_roles`.
- Validate the target row exists and is eligible (`pending`, `contacted`, or `approved`, depending on idempotency design).
- Use one transaction-like sequence with clear failure states:
  1. audit `waitlist.approval_started`,
  2. update `approved_at`/`approved_by`,
  3. create or reuse invite,
  4. send email,
  5. update `status = invited`, `invited_at`, `invited_by`, `invite_id`,
  6. audit success or failure.

### 3. Existing `send-beta-invites`

Recommended MVP decision:

- Keep as a bulk-send path if already deployed and working.
- For the safer approval flow, either:
  - wrap it with `approve-waitlist-entry`, or
  - refactor shared invite creation/email code so both functions use the same implementation.

Needed hardening before using broadly:

- Confirm live `beta_invites` schema includes any fields the function references, including code-rotation fields such as `replaced_by` and `replaced_at`.
- Avoid logging full emails if privacy requirements tighten; current logs should be reviewed for PII minimization.
- Consider not returning full invite codes in admin API responses unless the admin UI strictly needs them.

### 4. Existing `validate-invite-code`

Recommended MVP decision:

- Keep current validation boundary.
- Ensure it never logs full codes, tokens, or secrets.
- Review current normalized-code logging because full normalized invite code logging should be removed before production hardening.

## Secrets needed and where they should live

Store these only as Supabase Edge Function secrets for the live Supabase project, not in frontend code and not in Vercel public/client variables:

- `RESEND_API_KEY` — server-side email provider key.
- `SUPABASE_URL` — Supabase project URL for Edge Functions.
- `SUPABASE_SERVICE_ROLE_KEY` — server-side only, available to Edge Functions; never use or expose in frontend.
- `WAITLIST_ADMIN_EMAIL` — destination for admin notification email, or a comma-separated allowlisted admin notification list.
- `EMAIL_FROM` — verified sender identity, for example `FlyMusic <info@flymusic.se>`.
- `APP_BASE_URL` — canonical public URL, for example `https://flymusic.se`.

Optional later:

- `RESEND_AUDIENCE_ID` if marketing-list sync is introduced later.
- `EMAIL_REPLY_TO` if replies should route to a support/admin inbox.

## Email templates needed

### User confirmation email

Subject:

- `You are on the FlyMusic beta waitlist.`

Required body copy:

- `You are on the FlyMusic beta waitlist.`

Recommended supporting copy:

- Thank the user for joining.
- Mention that FlyMusic onboards fans and artists in waves.
- Do not include invite codes in this email.
- Include support/contact footer and basic unsubscribe/contact wording if needed.

### Admin notification email

Subject:

- `New fan joined the FlyMusic waitlist` or `New artist joined the FlyMusic waitlist`

Required body copy:

- `New fan/artist joined the waitlist.`

Recommended fields:

- Normalized email.
- Requested role.
- Signup timestamp.
- Link to `/admin/waitlist`.

### Invite email

Subject examples:

- Fan: `Your FlyMusic Beta Invite`
- Artist: `Your FlyMusic Artist Beta Invite`

Required content:

- Invite code.
- Direct invite link to the existing invite-code flow.
- Role-specific CTA.
- Short security note that the code is personal.

### Failure notification email (optional MVP+)

Notify admins when an invite email fails after approval so the admin can retry or contact the user manually.

## Admin approval flow

Recommended MVP UX:

1. Admin opens `/admin/waitlist`.
2. Admin selects one pending/contacted row.
3. Admin clicks `Approve & Send Invite`.
4. Frontend calls `approve-waitlist-entry` with the row ID and selected role or `auto`.
5. Edge Function verifies admin/super_admin.
6. Edge Function updates the row to approved and records `approved_at`/`approved_by`.
7. Edge Function creates or reuses an invite code.
8. Edge Function sends the invite email.
9. Edge Function updates row to `invited`, sets `invited_at`/`invited_by`, attaches `invite_id` if available, and records audit logs.
10. Admin UI refreshes the row and shows sent/failed result.

Idempotency rules:

- If the row is already `invited` with an active invite, return success with `already_invited: true` and do not send duplicate email unless admin explicitly chooses resend/rotate.
- If an invite exists in `created` or `sent`, reuse it unless code rotation is explicitly requested.
- If email sending fails, keep the waitlist row in `approved` or `invite_failed`, not `invited`.

## Invite-code flow

Recommended MVP behavior:

- Invite codes are generated server-side only.
- Codes should be unique, human-readable, and not guessable enough for the small private beta use case.
- Codes should be stored in `beta_invites` with status.
- Existing `validate-invite-code` validates the code and returns the token/role data required by the frontend.
- On redemption, update `beta_invites.status = redeemed` and `redeemed_at` in the validation/RPC path if that is not already handled.
- Do not expose service-role key or direct invite table reads in frontend code.

## Audit log flow

Minimum events to log:

1. Waitlist row inserted or first confirmation email requested.
2. Confirmation email sent or failed.
3. Admin notification sent or failed.
4. Admin approval requested.
5. Waitlist row approved.
6. Invite code created or reused.
7. Invite email sent or failed.
8. Waitlist row marked invited.
9. Invite code redeemed.

Recommended audit metadata:

- `correlation_id`
- `waitlist_id`
- `invite_id`
- `actor_id` for admin actions
- `action`
- `role`
- `email_domain` instead of full email where possible
- `provider_message_id` if Resend returns one
- sanitized error category/message

Do not log:

- API keys
- service-role keys
- bearer tokens
- invite tokens
- full invite codes unless strictly required for admin operations
- passwords, cookies, or session data

## Data protection rules

- Never place service-role keys in frontend code or Vercel client-exposed variables.
- Never send email directly from the browser with provider keys.
- Never weaken RLS to make waitlist rows publicly readable.
- Keep public waitlist insert policy narrow and status-limited.
- Normalize emails to lowercase before insert and before server-side lookup.
- Avoid returning whether an email exists unless the UX already treats duplicate waitlist signups as success.
- Avoid logging full invite codes and tokens.
- Minimize PII in Edge Function logs.
- Keep admin-only operations behind both frontend route protection and server-side role verification.
- Do not change payment, payout, economy, ranking, voting weight, or admin permission logic while implementing this feature.

## Implementation phases

### Phase 0 — Verification only

- Confirm live schema manually in Supabase dashboard without running automated SQL from Codex.
- Confirm `RESEND_API_KEY`, sender domain, and admin notification email are configured as Supabase Edge Function secrets.
- Confirm the existing `send-beta-invites` deployment version matches repository code before relying on it.

### Phase 1 — Confirmation email automation

- Add `waitlist-confirmation` Edge Function.
- Add confirmation/admin notification templates.
- Update frontend waitlist submit flow to invoke it after successful insert.
- Keep duplicate signup behavior generic and successful.
- Add audit logging for sent/failed confirmation and admin notification.

### Phase 2 — Admin approval function

- Add `approve-waitlist-entry` Edge Function.
- Add optional schema migration for `approved_at`, `approved_by`, `invite_id`, and audit log table if missing.
- Wire existing admin waitlist button to the new function.
- Preserve existing bulk invite flow until the new path is validated.

### Phase 3 — Invite hardening

- Refactor shared invite-code generation and email templates for reuse.
- Review `send-beta-invites` and `validate-invite-code` logs for PII/code minimization.
- Add resend/rotate explicit admin action if needed.
- Add retry handling for email failures.

### Phase 4 — Operational readiness

- Add dashboard monitoring for failed waitlist emails and failed invite emails.
- Add rate limiting or abuse protection to public confirmation flow.
- Add documented manual rollback steps.
- Add tests for Edge Function validation, authorization, and idempotency.

## Exact Codex prompts for each phase

### Prompt for Phase 0

```text
Verify FlyMusic beta waitlist automation prerequisites without connecting to Supabase from Codex.
Do not run SQL. Do not print secrets. Do not request secrets.
Inspect repository code only and update docs/supabase/BETA_WAITLIST_AUTOMATION_PLAN.md if repository assumptions are stale.
Confirm which Edge Functions, admin pages, RLS migrations, and email provider integrations already exist.
Run npm run build.
Return files changed, findings, risks, and the next safest implementation step.
```

### Prompt for Phase 1

```text
Implement Phase 1 of FlyMusic Beta Waitlist Automation.
Do not connect to Supabase. Do not run SQL. Do not print secrets. Do not use service-role key in frontend. Do not weaken RLS.
Add a Supabase Edge Function named waitlist-confirmation that sends the user confirmation email and admin notification email through Resend using Supabase Edge Function secrets only.
Add safe templates and sanitized logging/audit inserts.
Update WaitlistForm.tsx to invoke the function only after successful beta_waitlist insert while preserving duplicate-as-success behavior.
Do not change payment, payout, economy, ranking, voting weight, or admin permission logic.
Run npm run build.
Commit changes and prepare PR.
```

### Prompt for Phase 2

```text
Implement Phase 2 of FlyMusic Beta Waitlist Automation.
Do not connect to Supabase. Do not run SQL. Do not print secrets. Do not weaken RLS.
Add a Supabase Edge Function named approve-waitlist-entry for admin-only approval and invite sending.
The function must verify the caller's JWT server-side, check admin or super_admin role through user_roles, approve an eligible beta_waitlist row, create or reuse a beta_invites invite code, send the invite email through Resend, update invited status only after email success, and insert audit logs.
Add a migration file only if needed for approved_at, approved_by, invite_id, or waitlist_audit_log; do not execute it.
Wire AdminWaitlist.tsx to call the new function for single-row approval while preserving existing list/filter behavior.
Do not change payment, payout, economy, ranking, voting weight, or admin permission logic.
Run npm run build.
Commit changes and prepare PR.
```

### Prompt for Phase 3

```text
Implement Phase 3 hardening for FlyMusic Beta Waitlist Automation.
Do not connect to Supabase. Do not run SQL. Do not print secrets.
Refactor shared invite email/code helpers across send-beta-invites and approve-waitlist-entry if both exist.
Remove or mask any full invite code, token, bearer, or sensitive PII logging from validate-invite-code and invite functions.
Add explicit resend/rotate semantics only if the admin UI exposes a deliberate action.
Add tests or documented manual verification steps for invite idempotency.
Run npm run build.
Commit changes and prepare PR.
```

### Prompt for Phase 4

```text
Implement Phase 4 operational readiness for FlyMusic Beta Waitlist Automation.
Do not connect to Supabase. Do not run SQL. Do not print secrets.
Add documentation for monitoring, rollback, rate limiting, manual retry, and support workflows.
Add admin-facing failure states for confirmation/invite email failures if prior phases added the required data columns.
Do not change payment, payout, economy, ranking, voting weight, or admin permission logic.
Run npm run build.
Commit changes and prepare PR.
```

## Risks

- The repository contains schema and function references that may not exactly match the live Supabase project; live schema must be verified manually before deployment.
- Existing `send-beta-invites` references code-rotation fields (`replaced_by`, `replaced_at`) that must exist in live `beta_invites` before rotation is relied on.
- `validate-invite-code` currently logs normalized invite code details; this should be masked before production hardening.
- Direct frontend insertion followed by an email function call can create a partial-success state where the row is saved but confirmation email fails; Phase 1 should log and surface this safely.
- Admin notification email can leak waitlist PII if sent to the wrong recipient; `WAITLIST_ADMIN_EMAIL` must be tightly controlled.
- Returning full invite codes to the admin UI/API may be convenient but should be reviewed against least-disclosure principles.

## Next safest implementation step

Start with Phase 0 manual verification, then implement Phase 1 only: add `waitlist-confirmation` as an Edge Function and invoke it after successful waitlist insert. This delivers user/admin email notifications without changing approval, invite redemption, payments, payouts, economy, ranking, voting, admin permission logic, or RLS.
