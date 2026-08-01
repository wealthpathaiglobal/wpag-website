begin;

create or replace function public.get_current_participant()
returns table (
    participant_id uuid,
    participant_code text,
    lifecycle_status text,
    research_status text,
    enrollment_date date,
    profile_completed boolean
)
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
    v_auth_user_id uuid := auth.uid();
begin
    if v_auth_user_id is null then
        raise exception using
            errcode = 'P1001',
            message = 'Authentication is required.';
    end if;

    return query
    select
        p.id,
        p.participant_code,
        p.lifecycle_status,
        p.research_status,
        p.enrollment_date,
        coalesce(pp.profile_completed, false)
    from public.participants p
    left join public.participant_profiles pp
      on pp.participant_id = p.id
     and pp.deleted_at is null
    where p.auth_user_id = v_auth_user_id
      and p.deleted_at is null;
end;
$$;

alter function public.get_current_participant() owner to postgres;
revoke all on function public.get_current_participant() from public;
revoke all on function public.get_current_participant() from anon;
revoke all on function public.get_current_participant() from service_role;
grant execute on function public.get_current_participant() to authenticated;

comment on function public.get_current_participant() is
'Resolves only the participant linked to the authenticated database identity through a narrow governed projection.';

commit;
