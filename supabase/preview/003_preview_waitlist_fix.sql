-- FlyMusic preview waitlist signup fix.
-- Run after 001_preview_schema.sql and 002_preview_seed.sql.
-- Safe for manual execution in Supabase SQL Editor. Preview only.
-- Stores waitlist email, requested role, pending status, and timestamps.
-- Public users can submit, but public users cannot read submitted emails.

begin;

create extension if not exists pgcrypto;

create table if not exists public.beta_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_type text not null default 'fan' check (user_type in ('artist', 'fan', 'both')),
  status text not null default 'pending' check (status in ('pending', 'contacted', 'approved', 'invited')),
  created_at timestamptz not null default now(),
  invited_at timestamptz,
  invited_by uuid
);

alter table public.beta_waitlist
  add column if not exists email text,
  add column if not exists user_type text not null default 'fan',
  add column if not exists status text not null default 'pending',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists invited_at timestamptz,
  add column if not exists invited_by uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'beta_waitlist_email_unique'
      and conrelid = 'public.beta_waitlist'::regclass
  ) then
    alter table public.beta_waitlist
      add constraint beta_waitlist_email_unique unique (email);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'beta_waitlist_user_type_check'
      and conrelid = 'public.beta_waitlist'::regclass
  ) then
    alter table public.beta_waitlist
      add constraint beta_waitlist_user_type_check check (user_type in ('artist', 'fan', 'both'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'beta_waitlist_status_check'
      and conrelid = 'public.beta_waitlist'::regclass
  ) then
    alter table public.beta_waitlist
      add constraint beta_waitlist_status_check check (status in ('pending', 'contacted', 'approved', 'invited'));
  end if;
end $$;

alter table public.beta_waitlist enable row level security;

drop policy if exists "preview_waitlist_anon_insert" on public.beta_waitlist;
drop policy if exists "preview_waitlist_public_insert" on public.beta_waitlist;
drop policy if exists "preview_waitlist_admin_select" on public.beta_waitlist;
drop policy if exists "preview_waitlist_admin_update" on public.beta_waitlist;

create policy "preview_waitlist_public_insert"
on public.beta_waitlist
for insert
to anon, authenticated
with check (
  email = lower(btrim(email))
  and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  and user_type in ('artist', 'fan')
  and status = 'pending'
  and invited_at is null
  and invited_by is null
);

create policy "preview_waitlist_admin_select"
on public.beta_waitlist
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'::public.app_role
  )
);

create policy "preview_waitlist_admin_update"
on public.beta_waitlist
for update
to authenticated
using (
  exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'::public.app_role
  )
)
with check (
  exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'::public.app_role
  )
);

create index if not exists idx_beta_waitlist_email on public.beta_waitlist(email);
create index if not exists idx_beta_waitlist_status on public.beta_waitlist(status);

grant usage on schema public to anon;
grant usage on schema public to authenticated;
grant insert on public.beta_waitlist to anon;
grant insert on public.beta_waitlist to authenticated;

notify pgrst, 'reload schema';

commit;
