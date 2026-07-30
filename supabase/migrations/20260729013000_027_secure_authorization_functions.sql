-- ============================================================================
-- WEALTH PATH AI GLOBAL (WPAG)
-- Domain: Administration and Authorization
-- Migration: 027_secure_authorization_functions
-- Purpose:
-- Execute centralized RBAC checks through a controlled SECURITY DEFINER
-- boundary so authorization helpers can evaluate protected staff tables.
-- ============================================================================

create or replace function public.is_staff(
    p_auth_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1
        from public.staff_members sm
        where sm.auth_user_id = p_auth_user_id
          and sm.status = 'active'
    );
$$;


create or replace function public.has_role(
    p_auth_user_id uuid,
    p_role_code text
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1
        from public.staff_members sm
        join public.staff_member_roles smr
          on smr.staff_member_id = sm.id
        join public.staff_roles sr
          on sr.id = smr.staff_role_id
        where sm.auth_user_id = p_auth_user_id
          and sm.status = 'active'
          and sr.role_code = p_role_code
          and sr.is_active = true
          and smr.is_active = true
          and (
              smr.expires_at is null
              or smr.expires_at > now()
          )
    );
$$;


create or replace function public.has_any_role(
    p_auth_user_id uuid,
    p_role_codes text[]
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1
        from public.staff_members sm
        join public.staff_member_roles smr
          on smr.staff_member_id = sm.id
        join public.staff_roles sr
          on sr.id = smr.staff_role_id
        where sm.auth_user_id = p_auth_user_id
          and sm.status = 'active'
          and sr.role_code = any(p_role_codes)
          and sr.is_active = true
          and smr.is_active = true
          and (
              smr.expires_at is null
              or smr.expires_at > now()
          )
    );
$$;


create or replace function public.is_founder(
    p_auth_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select public.has_role(
        p_auth_user_id,
        'founder'
    );
$$;


revoke all on function public.is_staff(uuid) from public;
revoke all on function public.has_role(uuid, text) from public;
revoke all on function public.has_any_role(uuid, text[]) from public;
revoke all on function public.is_founder(uuid) from public;

grant execute on function public.is_staff(uuid) to authenticated;
grant execute on function public.has_role(uuid, text) to authenticated;
grant execute on function public.has_any_role(uuid, text[]) to authenticated;
grant execute on function public.is_founder(uuid) to authenticated;


comment on function public.is_staff(uuid)
is 'Returns true when the auth user is an active WPAG staff member. Executes through a controlled SECURITY DEFINER boundary.';

comment on function public.has_role(uuid, text)
is 'Returns true when an active staff member has an active institutional role. Executes through a controlled SECURITY DEFINER boundary.';

comment on function public.has_any_role(uuid, text[])
is 'Returns true when an active staff member has any supplied institutional role. Executes through a controlled SECURITY DEFINER boundary.';

comment on function public.is_founder(uuid)
is 'Returns true when the auth user has the active Founder role.';