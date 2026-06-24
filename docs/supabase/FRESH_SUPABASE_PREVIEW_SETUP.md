# Fresh Supabase Preview Setup for FlyMusic

This package is for the new FlyMusic Supabase project only:

- Project ref: `suqddnnfrhrclmrtsqof`
- Project URL: `https://suqddnnfrhrclmrtsqof.supabase.co`
- Purpose: safe manual preview setup for the working FlyMusic deployment

Do **not** run this package against production data. It is intentionally preview-only and excludes real payment, payout, private-user-data, economy, and weighted-voting behavior.

## Repo scan summary

The app uses Supabase from the generated client in `src/integrations/supabase/client.ts` and generated database typings in `src/integrations/supabase/types.ts`.

### Tables observed in code

A static scan found many app tables referenced with `supabase.from(...)`, including core preview tables (`profiles`, `user_roles`, `artist_profiles`, `tracks`, `albums`, `likes`, `follows`, `feature_flags`, `telemetry_events`, `events`, `fan_taste_profile`, `spotlight_campaigns`, `spotlight_entries`, `spotlight_votes`, `artist_posts`) plus broader production/admin/community/economy tables.

This preview package creates only the minimal safe tables needed for basic public preview/discovery/playback/account flows. Admin, billing, payout, private analytics, collab marketplace, and advanced community schemas are intentionally not recreated here.

### RPC calls observed in code

The repo references RPCs such as `increment_play_count`, `update_taste_profile`, `get_app_mode`, `get_trial_status`, `check_feature_access`, `resolve_user_permissions`, `process_scheduled_releases`, `donate_to_goal`, and several admin/analytics/ranking helpers.

This preview package implements only safe no-payment/no-payout stubs or basics:

- `increment_play_count(track_id uuid)`
- `update_taste_profile(...)`
- `get_app_mode()` returns `preview`
- `get_trial_status()` returns a disabled preview JSON payload
- `check_feature_access(feature_key text)` reads `feature_flags`

All real economy, payment, payout, ranking, and weighted-vote behavior remains disabled.

### Storage buckets observed in code

The code references these Supabase Storage buckets:

- `tracks`
- `covers`
- `avatars`
- `artist-banners`
- `artist-spotlight`
- `artist_videos`
- `comment-media`
- `community-banners`
- `entity-icons`
- `issue-screenshots`

This preview package creates only:

- `tracks` for audio previews
- `covers` for track cover images
- `avatars` for profile images

Create additional buckets later only when those preview surfaces are being tested.

### Auth usage observed in code

The app uses Supabase Auth for sessions, current user lookup, sign-out, auth state changes, and protected user-owned writes. The preview schema references `auth.users` for profile ownership and RLS.

### Edge functions observed in repo/code

The repo contains edge functions and/or frontend invokes for auth email, QA, push, beta invites, scheduled processing, subscription/Stripe, config, get-me, and validation flows. This package does not deploy or require edge functions for the basic preview schema.

## Files in this package

Run these files manually in the Supabase SQL Editor, in this exact order:

1. `supabase/preview/001_preview_schema.sql`
2. `supabase/preview/002_preview_seed.sql`
3. `supabase/preview/003_preview_waitlist_fix.sql`

## Exact SQL run order

1. Open Supabase Dashboard for project `suqddnnfrhrclmrtsqof`.
2. Go to **SQL Editor**.
3. Open `supabase/preview/001_preview_schema.sql` locally.
4. Copy the full file into SQL Editor.
5. Run it once.
6. Confirm it completes without errors.
7. Open `supabase/preview/002_preview_seed.sql` locally.
8. Copy the full file into SQL Editor.
9. Run it once.
10. Confirm it completes without errors.
11. Open `supabase/preview/003_preview_waitlist_fix.sql` locally.
12. Copy the full file into SQL Editor.
13. Run it once.
14. Confirm it completes without errors.

## Waitlist signup patch

Run `supabase/preview/003_preview_waitlist_fix.sql` after the schema and seed files when the live preview should accept early access/waitlist submissions.

This patch is needed because the public fan/artist gate forms submit directly to `public.beta_waitlist`, while the first preview schema only created the demo-safe discovery/playback tables. Without this table, its insert policy, and explicit `anon`/`authenticated` grants, the frontend insert fails and users see `Something went wrong. Please try again.`

The patch creates only the preview-safe waitlist surface needed by the form:

- `email`
- `user_type` (`fan` or `artist`)
- `status` (`pending` on public submissions)
- `created_at`
- admin invite tracking timestamps/IDs for later review (`invited_at`, `invited_by`)

The patch includes both RLS policies and explicit grants. It grants schema usage to `anon` and `authenticated`, grants `INSERT` on `public.beta_waitlist` to those roles, and notifies PostgREST to reload its schema cache.

Privacy note: public users can insert a waitlist email, but public users must not be able to read submitted emails. The patch enables RLS and does not add any public `SELECT` policy on `beta_waitlist`.

## Required storage buckets

The schema script creates these public buckets if missing:

| Bucket | Purpose | Preview policy |
| --- | --- | --- |
| `tracks` | Demo track audio | Public read, authenticated owner upload/update/delete |
| `covers` | Cover art | Public read, authenticated owner upload/update/delete |
| `avatars` | Profile avatars | Public read, authenticated owner upload/update/delete |

The seed file inserts demo track rows with public `tracks` bucket URLs. It does not upload binary audio. If playback is needed, manually upload demo-safe audio files to:

- `tracks/preview/preview-lights.mp3`
- `tracks/preview/atlas-demo.mp3`

Do not upload copyrighted or private audio for preview unless you have permission.

## Required Vercel environment variables

For the new preview deployment, Vercel should point at the new Supabase project:

- `VITE_SUPABASE_URL=https://suqddnnfrhrclmrtsqof.supabase.co`
- `VITE_SUPABASE_ANON_KEY=<new project's anon public key>`

Optional edge-function variables are only needed if those functions are deployed and tested. Do not place service-role keys in frontend variables. Do not expose service-role keys in logs, commits, or client bundles.

## Tables included

The preview schema creates these public tables:

- `profiles`
- `user_roles`
- `artist_profiles`
- `albums`
- `tracks`
- `likes`
- `follows`
- `feature_flags`
- `telemetry_events`
- `events`
- `fan_taste_profile`
- `spotlight_campaigns`
- `spotlight_entries`
- `spotlight_votes`
- `artist_posts`
- `beta_waitlist` after running `003_preview_waitlist_fix.sql`

It also creates the `public_profiles` view.

## RLS and preview policies

RLS is enabled on every public table created by `001_preview_schema.sql`.

Policy intent:

- Public can read demo-safe published profile/artist/track/spotlight content.
- Authenticated users can insert/update their own profile.
- Authenticated artists can write their own artist profile, tracks, and posts.
- Authenticated users can create/delete their own likes and follows.
- Telemetry/events can be inserted without exposing private data.
- Spotlight votes are preview-only and fixed to weight `1`.
- Waitlist signups allow anonymous `INSERT` only; submitted emails are not publicly readable.

## Preview-only / disabled areas

The following are explicitly preview-only or disabled:

- Real Stripe payments
- Real supporter payments
- Real payouts
- Real economy logic
- Real ranking algorithms
- Weighted voting
- Private user data imports
- Admin production workflows
- Production community moderation workflows
- Edge-function production workflows

## What is not production-ready

This package is not a full production migration. It intentionally omits many production tables and constraints observed in the codebase, including admin, billing, payout, subscription, private analytics, collaborations, smart links, livestream, video, advanced community, and moderation tables.

Before production, create audited migrations, stricter RLS, full schema coverage, data-retention rules, backup/restore tests, and a security review. Future production setup should use Supabase migrations or CI automation instead of manual SQL copy-paste.

## Rollback instructions

If you need to remove this preview schema from a fresh project, run the following in Supabase SQL Editor. This deletes preview data and tables created by the package.

```sql
begin;

drop view if exists public.public_profiles;

drop table if exists public.artist_posts cascade;
drop table if exists public.spotlight_votes cascade;
drop table if exists public.spotlight_entries cascade;
drop table if exists public.spotlight_campaigns cascade;
drop table if exists public.fan_taste_profile cascade;
drop table if exists public.events cascade;
drop table if exists public.telemetry_events cascade;
drop table if exists public.feature_flags cascade;
drop table if exists public.follows cascade;
drop table if exists public.likes cascade;
drop table if exists public.tracks cascade;
drop table if exists public.albums cascade;
drop table if exists public.artist_profiles cascade;
drop table if exists public.user_roles cascade;
drop table if exists public.profiles cascade;

drop function if exists public.increment_play_count(uuid);
drop function if exists public.update_taste_profile(text, uuid);
drop function if exists public.get_app_mode();
drop function if exists public.get_trial_status();
drop function if exists public.check_feature_access(text);
drop function if exists public.set_updated_at();

delete from storage.objects where bucket_id in ('tracks', 'covers', 'avatars');
delete from storage.buckets where id in ('tracks', 'covers', 'avatars');

commit;
```

If demo auth users from `002_preview_seed.sql` should also be removed, delete these IDs from `auth.users` after confirming they are not used elsewhere:

- `00000000-0000-0000-0000-000000000101`
- `00000000-0000-0000-0000-000000000102`
- `00000000-0000-0000-0000-000000000201`

## Safety checklist

- No secrets are included.
- No service-role key is included.
- No SQL connects to Supabase automatically.
- No production branch or GitHub push is required.
- All included public tables have RLS enabled.
- Economy/payment/ranking behavior is marked preview-only or disabled.
- Seed data uses demo-safe placeholder identities and content.
