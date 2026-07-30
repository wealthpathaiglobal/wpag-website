-- ============================================================================
-- WEALTH PATH AI GLOBAL (WPAG)
-- Domain: Administration and Authorization
-- Migration: 031_govern_staff_self_resolution
-- Purpose:
-- Bring authenticated staff self-resolution under repository governance and
-- remove anonymous access to institutional authorization functions.
-- ============================================================================

begin;

alter table public.staff_members enable row level security;

drop policy if exists staff_members_select_own
on public.staff_members;

create policy staff_members_select_own
on public.staff_members
for select
to authenticated
using (auth.uid() = auth_user_id);

comment on policy staff_members_select_own
on public.staff_members
is 'Permits authenticated staff to resolve only their own institutional staff record.';

revoke execute on function public.is_staff(uuid)
from anon;

revoke execute on function public.has_role(uuid, text)
from anon;

revoke execute on function public.has_any_role(uuid, text[])
from anon;

revoke execute on function public.is_founder(uuid)
from anon;

grant execute on function public.is_staff(uuid)
to authenticated, service_role;

grant execute on function public.has_role(uuid, text)
to authenticated, service_role;

grant execute on function public.has_any_role(uuid, text[])
to authenticated, service_role;

grant execute on function public.is_founder(uuid)
to authenticated, service_role;

commit;
