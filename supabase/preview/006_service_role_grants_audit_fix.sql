-- FlyMusic preview Supabase sync audit grant fix.
-- Run after supabase/preview/005_validate_invite_code_universal.sql.
-- Keeps invite validation behind the validate-invite-code Edge Function and
-- gives service-role Edge Functions the explicit grants they need.

begin;

create extension if not exists pgcrypto;

create table if not exists public.edge_function_logs (
  id uuid primary key default gen_random_uuid(),
  correlation_id uuid not null,
  function_name text not null,
  step text not null,
  level text not null default 'info',
  message text,
  details jsonb,
  execution_time_ms integer,
  status_code integer,
  user_id uuid,
  created_at timestamptz default now()
);

alter table public.edge_function_logs enable row level security;

drop policy if exists "preview_edge_function_logs_admin_select" on public.edge_function_logs;

create policy "preview_edge_function_logs_admin_select"
on public.edge_function_logs
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

create index if not exists idx_edge_function_logs_correlation on public.edge_function_logs(correlation_id);
create index if not exists idx_edge_function_logs_function on public.edge_function_logs(function_name);
create index if not exists idx_edge_function_logs_created on public.edge_function_logs(created_at desc);
create index if not exists idx_edge_function_logs_level on public.edge_function_logs(level);

revoke execute on function public.validate_invite_code_universal(text) from public;
revoke execute on function public.validate_invite_code_universal(text) from anon, authenticated;
grant execute on function public.validate_invite_code_universal(text) to service_role;

grant usage on schema public to anon, authenticated, service_role;

grant insert on public.beta_waitlist to anon, authenticated;
grant select, insert, update on public.beta_waitlist to service_role;

grant select, insert, update on public.beta_invites to service_role;
grant select, insert on public.admin_activity_logs to service_role;
grant select, insert on public.edge_function_logs to service_role;
grant select, insert, update on public.fan_invite_sessions to service_role;

notify pgrst, 'reload schema';

commit;
