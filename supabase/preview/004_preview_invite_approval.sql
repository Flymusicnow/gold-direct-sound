-- FlyMusic preview beta waitlist invite approval support.
-- Run after supabase/preview/003_preview_waitlist_fix.sql.
-- Preview-safe: no public invite-code reads; admin reads/updates only through RLS; Edge Functions use service role server-side.

begin;

create extension if not exists pgcrypto;

alter table public.beta_waitlist
  add column if not exists invited_at timestamptz,
  add column if not exists invited_by uuid,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid,
  add column if not exists invite_id uuid;

create table if not exists public.beta_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null,
  code text not null,
  status text not null default 'created',
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  expires_at timestamptz,
  used_at timestamptz,
  redeemed_at timestamptz,
  created_by uuid,
  last_error text,
  waitlist_id uuid references public.beta_waitlist(id) on delete set null,
  replaced_by uuid references public.beta_invites(id) on delete set null,
  replaced_at timestamptz
);

alter table public.beta_invites
  add column if not exists email text,
  add column if not exists role text,
  add column if not exists code text,
  add column if not exists status text not null default 'created',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists sent_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists used_at timestamptz,
  add column if not exists redeemed_at timestamptz,
  add column if not exists created_by uuid,
  add column if not exists last_error text,
  add column if not exists waitlist_id uuid references public.beta_waitlist(id) on delete set null,
  add column if not exists replaced_by uuid references public.beta_invites(id) on delete set null,
  add column if not exists replaced_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'beta_invites_code_unique'
      and conrelid = 'public.beta_invites'::regclass
  ) then
    alter table public.beta_invites add constraint beta_invites_code_unique unique (code);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'beta_invites_role_check'
      and conrelid = 'public.beta_invites'::regclass
  ) then
    alter table public.beta_invites add constraint beta_invites_role_check check (role in ('fan', 'artist'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'beta_invites_status_check'
      and conrelid = 'public.beta_invites'::regclass
  ) then
    alter table public.beta_invites add constraint beta_invites_status_check check (status in ('created', 'sent', 'redeemed', 'revoked', 'failed', 'replaced'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'beta_waitlist_invite_id_fkey'
      and conrelid = 'public.beta_waitlist'::regclass
  ) then
    alter table public.beta_waitlist
      add constraint beta_waitlist_invite_id_fkey foreign key (invite_id) references public.beta_invites(id) on delete set null;
  end if;
end $$;

alter table public.beta_invites enable row level security;

-- Keep invite codes private: no anon SELECT policy is created.
drop policy if exists "preview_beta_invites_admin_select" on public.beta_invites;
drop policy if exists "preview_beta_invites_admin_insert" on public.beta_invites;
drop policy if exists "preview_beta_invites_admin_update" on public.beta_invites;

create policy "preview_beta_invites_admin_select"
on public.beta_invites
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role::text in ('admin', 'super_admin')
  )
);

create policy "preview_beta_invites_admin_insert"
on public.beta_invites
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role::text in ('admin', 'super_admin')
  )
);

create policy "preview_beta_invites_admin_update"
on public.beta_invites
for update
to authenticated
using (
  exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role::text in ('admin', 'super_admin')
  )
)
with check (
  exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role::text in ('admin', 'super_admin')
  )
);

-- Upgrade preview waitlist admin policies to include super_admin without changing public insert behavior.
drop policy if exists "preview_waitlist_admin_select" on public.beta_waitlist;
drop policy if exists "preview_waitlist_admin_update" on public.beta_waitlist;

create policy "preview_waitlist_admin_select"
on public.beta_waitlist
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role::text in ('admin', 'super_admin')
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
      and role::text in ('admin', 'super_admin')
  )
)
with check (
  exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role::text in ('admin', 'super_admin')
  )
);

create index if not exists idx_beta_invites_email on public.beta_invites(email);
create index if not exists idx_beta_invites_code on public.beta_invites(code);
create index if not exists idx_beta_invites_status on public.beta_invites(status);
create index if not exists idx_beta_invites_waitlist_id on public.beta_invites(waitlist_id);
create index if not exists idx_beta_waitlist_invite_id on public.beta_waitlist(invite_id);

create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid,
  action text not null,
  target_type text,
  target_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

alter table public.admin_activity_logs enable row level security;

drop policy if exists "preview_admin_activity_logs_admin_select" on public.admin_activity_logs;
drop policy if exists "preview_admin_activity_logs_admin_insert" on public.admin_activity_logs;

create policy "preview_admin_activity_logs_admin_select"
on public.admin_activity_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role::text in ('admin', 'super_admin')
  )
);

create policy "preview_admin_activity_logs_admin_insert"
on public.admin_activity_logs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role::text in ('admin', 'super_admin')
  )
);

create index if not exists idx_admin_activity_logs_created_at on public.admin_activity_logs(created_at desc);
create index if not exists idx_admin_activity_logs_target_type on public.admin_activity_logs(target_type);

grant usage on schema public to authenticated;
grant select, insert, update on public.beta_invites to authenticated;
grant select, update on public.beta_waitlist to authenticated;
grant select, insert on public.admin_activity_logs to authenticated;

notify pgrst, 'reload schema';

commit;
