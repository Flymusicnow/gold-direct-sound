-- FlyMusic preview invite-code validation RPC.
-- Run after supabase/preview/004_preview_invite_approval.sql.
-- Preview-safe: validates through the Edge Function boundary and never returns full invite codes.

begin;

create extension if not exists pgcrypto;

create table if not exists public.fan_invite_sessions (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  code_id uuid,
  email text,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  used_at timestamptz,
  created_at timestamptz default now()
);

alter table public.fan_invite_sessions
  add column if not exists token text,
  add column if not exists code_id uuid,
  add column if not exists email text,
  add column if not exists expires_at timestamptz not null default (now() + interval '24 hours'),
  add column if not exists used_at timestamptz,
  add column if not exists created_at timestamptz default now();

alter table public.fan_invite_sessions enable row level security;

drop policy if exists "preview_invite_sessions_token_select" on public.fan_invite_sessions;
drop policy if exists "preview_invite_sessions_token_update" on public.fan_invite_sessions;

-- The frontend only receives an opaque invite session token; invite codes and waitlist emails stay private.
create policy "preview_invite_sessions_token_select"
on public.fan_invite_sessions
for select
to anon, authenticated
using (token is not null and expires_at > now() and used_at is null and email is null);

create policy "preview_invite_sessions_token_update"
on public.fan_invite_sessions
for update
to anon, authenticated
using (token is not null and expires_at > now() and used_at is null and email is null)
with check (token is not null and email is null);

create index if not exists idx_fan_invite_sessions_token on public.fan_invite_sessions(token);
create index if not exists idx_fan_invite_sessions_expires_at on public.fan_invite_sessions(expires_at);

create or replace function public.validate_invite_code_universal(_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  _normalized_code text;
  _invite record;
  _token text;
  _expires_at timestamptz;
  _badge_name text;
begin
  _normalized_code := upper(regexp_replace(coalesce(_code, ''), '[^A-Za-z0-9]', '', 'g'));

  if _normalized_code = '' then
    return jsonb_build_object('valid', false, 'reason', 'empty_code');
  end if;

  select
    id,
    email,
    role,
    status,
    expires_at,
    used_at,
    redeemed_at
  into _invite
  from public.beta_invites
  where upper(regexp_replace(coalesce(code, ''), '[^A-Za-z0-9]', '', 'g')) = _normalized_code
  order by created_at desc
  limit 1;

  if not found then
    return jsonb_build_object('valid', false, 'reason', 'not_found');
  end if;

  if _invite.status = 'redeemed' or _invite.used_at is not null or _invite.redeemed_at is not null then
    return jsonb_build_object('valid', false, 'reason', 'already_redeemed');
  end if;

  if _invite.expires_at is not null and _invite.expires_at <= now() then
    return jsonb_build_object('valid', false, 'reason', 'expired');
  end if;

  if _invite.status not in ('sent', 'active') then
    return jsonb_build_object('valid', false, 'reason', 'invalid_status');
  end if;

  _token := encode(gen_random_bytes(32), 'hex');
  _expires_at := now() + interval '24 hours';
  _badge_name := case
    when _invite.role = 'artist' then 'Early Artist'
    when _invite.role = 'fan' then 'Early Supporter'
    else 'Beta Tester'
  end;

  insert into public.fan_invite_sessions (token, expires_at)
  values (_token, _expires_at);

  return jsonb_build_object(
    'valid', true,
    'token', _token,
    'expires_at', _expires_at,
    'badge_name', _badge_name,
    'invite_id', _invite.id,
    'role', _invite.role,
    'status', _invite.status
  );
end;
$$;

revoke all on function public.validate_invite_code_universal(text) from public;
revoke execute on function public.validate_invite_code_universal(text) from anon, authenticated;
grant execute on function public.validate_invite_code_universal(text) to service_role;

grant select, update on public.fan_invite_sessions to anon, authenticated;
grant select, insert, update on public.fan_invite_sessions to service_role;

notify pgrst, 'reload schema';

commit;
