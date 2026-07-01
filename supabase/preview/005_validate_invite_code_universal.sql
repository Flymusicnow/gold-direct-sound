-- FlyMusic preview invite-code validation RPC.
-- Run after supabase/preview/004_preview_invite_approval.sql.
-- Preview-safe: validates through the Edge Function boundary and never returns full invite codes.

begin;

create or replace function public.validate_invite_code_universal(_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _normalized_code text;
  _invite record;
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

  return jsonb_build_object(
    'valid', true,
    'invite_id', _invite.id,
    'email', _invite.email,
    'role', _invite.role,
    'status', _invite.status,
    'expires_at', _invite.expires_at
  );
end;
$$;

revoke all on function public.validate_invite_code_universal(text) from public;
grant execute on function public.validate_invite_code_universal(text) to anon, authenticated, service_role;

notify pgrst, 'reload schema';

commit;
