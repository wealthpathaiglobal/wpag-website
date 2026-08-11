begin;

-- RLS policy staff_members_select_own already restricts authenticated callers
-- to their own active/inactive institutional identity row. A column grant is
-- still required for PostgREST to evaluate the governed self projection.
-- Keep internal_notes and all mutation privileges unavailable.
revoke select on table public.staff_members from anon, authenticated;

grant select (
  id,
  auth_user_id,
  staff_code,
  full_name,
  email,
  status
) on table public.staff_members to authenticated;

comment on policy staff_members_select_own on public.staff_members is
'Permits authenticated staff to resolve only their own institutional staff record through the explicitly granted non-sensitive self-projection columns.';

commit;
