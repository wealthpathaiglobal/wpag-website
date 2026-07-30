begin;

create or replace function public.create_participant_from_approved_application(
    p_application_id uuid,
    p_actor_user_id uuid
)
returns table (
    id uuid,
    participant_code text,
    application_id uuid,
    lifecycle_status text,
    research_status text
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
    v_application public.applications%rowtype;
    v_participant public.participants%rowtype;
    v_normalized_name text;
    v_first_name text;
    v_last_name text;
    v_profile_id uuid;
    v_profile_count bigint;
    v_updated_rows bigint;
begin
    if p_application_id is null then
        raise exception using
            errcode = 'P1001',
            message = 'Application ID is required.';
    end if;

    if p_actor_user_id is null then
        raise exception using
            errcode = 'P1001',
            message = 'Actor identity is required.';
    end if;

    if not exists (
        select 1
        from public.staff_members sm
        join public.staff_member_roles smr
          on smr.staff_member_id = sm.id
        join public.staff_roles sr
          on sr.id = smr.staff_role_id
        where sm.auth_user_id = p_actor_user_id
          and sm.status = 'active'
          and sm.deleted_at is null
          and sr.role_code = 'administrator'
          and sr.is_active = true
          and smr.is_active = true
          and (
              smr.expires_at is null
              or smr.expires_at > now()
          )
    ) then
        raise exception using
            errcode = 'P1001',
            message = 'Actor is not authorized to convert applications.';
    end if;

    select a.*
      into v_application
      from public.applications a
     where a.id = p_application_id
     for update;

    if not found then
        raise exception using
            errcode = 'P1001',
            message = 'Application not found.';
    end if;

    if v_application.deleted_at is not null then
        raise exception using
            errcode = 'P1001',
            message = 'Deleted applications cannot be converted.';
    end if;

    select p.*
      into v_participant
      from public.participants p
     where p.application_id = v_application.id;

    if found then
        if v_participant.deleted_at is not null then
            raise exception using
                errcode = 'P1001',
                message = 'Application is already linked to a deleted participant.';
        end if;

        select count(*)
          into v_profile_count
          from public.participant_profiles pp
         where pp.participant_id = v_participant.id;

        if v_participant.auth_user_id
               is distinct from v_application.auth_user_id
           or v_profile_count <> 1 then
            raise exception using
                errcode = 'P1001',
                message = 'Existing participant conversion is incomplete.';
        end if;

        if v_application.status = 'converted' then
            return query
            select
                v_participant.id,
                v_participant.participant_code,
                v_participant.application_id,
                v_participant.lifecycle_status,
                v_participant.research_status;
            return;
        end if;

        if v_application.status <> 'eligible' then
            raise exception using
                errcode = 'P1001',
                message = 'Application is not eligible for participant conversion.';
        end if;

        update public.applications a
           set status = 'converted',
               converted_at = transaction_timestamp(),
               updated_by = p_actor_user_id
         where a.id = p_application_id
           and a.status = 'eligible'
           and a.deleted_at is null;

        get diagnostics v_updated_rows = row_count;

        if v_updated_rows <> 1 then
            raise exception using
                errcode = 'P1002',
                message = 'Participant conversion could not be completed.';
        end if;

        return query
        select
            v_participant.id,
            v_participant.participant_code,
            v_participant.application_id,
            v_participant.lifecycle_status,
            v_participant.research_status;
        return;
    end if;

    if v_application.status <> 'eligible' then
        if v_application.status = 'converted' then
            raise exception using
                errcode = 'P1002',
                message = 'Participant conversion could not be completed.';
        end if;

        raise exception using
            errcode = 'P1001',
            message = 'Application is not eligible for participant conversion.';
    end if;

    if v_application.auth_user_id is not null
       and exists (
           select 1
           from public.participants p
           where p.auth_user_id = v_application.auth_user_id
             and p.application_id is distinct from v_application.id
       ) then
        raise exception using
            errcode = 'P1001',
            message = 'Application account is already linked to another participant.';
    end if;

    v_normalized_name := regexp_replace(
        btrim(v_application.full_name),
        '[[:space:]]+',
        ' ',
        'g'
    );
    v_first_name := split_part(v_normalized_name, ' ', 1);
    v_last_name := case
        when position(' ' in v_normalized_name) = 0 then ''
        else substring(
            v_normalized_name
            from position(' ' in v_normalized_name) + 1
        )
    end;

    insert into public.participants (
        application_id,
        auth_user_id,
        created_by,
        updated_by
    )
    values (
        v_application.id,
        v_application.auth_user_id,
        p_actor_user_id,
        p_actor_user_id
    )
    returning * into strict v_participant;

    insert into public.participant_profiles as inserted_profile (
        participant_id,
        auth_user_id,
        first_name,
        middle_name,
        last_name,
        preferred_name,
        email,
        phone_country_code,
        phone_number,
        country_code,
        state,
        city,
        employment_status,
        profile_completed,
        created_by,
        updated_by
    )
    values (
        v_participant.id,
        v_application.auth_user_id,
        v_first_name,
        null,
        v_last_name,
        null,
        v_application.email,
        v_application.phone_country_code,
        v_application.phone_number,
        v_application.country_code,
        v_application.state_or_region,
        v_application.city,
        v_application.employment_status,
        false,
        p_actor_user_id,
        p_actor_user_id
    )
    returning inserted_profile.id into strict v_profile_id;

    update public.applications a
       set status = 'converted',
           converted_at = transaction_timestamp(),
           updated_by = p_actor_user_id
     where a.id = p_application_id
       and a.status = 'eligible'
       and a.deleted_at is null;

    get diagnostics v_updated_rows = row_count;

    if v_updated_rows <> 1 then
        raise exception using
            errcode = 'P1002',
            message = 'Participant conversion could not be completed.';
    end if;

    return query
    select
        v_participant.id,
        v_participant.participant_code,
        v_participant.application_id,
        v_participant.lifecycle_status,
        v_participant.research_status;
exception
    when sqlstate 'P1001' then
        raise;
    when sqlstate 'P1002' then
        raise;
    when others then
        raise exception using
            errcode = 'P1002',
            message = 'Participant conversion could not be completed.';
end;
$$;

alter function public.create_participant_from_approved_application(uuid, uuid)
owner to postgres;

revoke all on function public.create_participant_from_approved_application(uuid, uuid)
from public;

revoke all on function public.create_participant_from_approved_application(uuid, uuid)
from anon;

revoke all on function public.create_participant_from_approved_application(uuid, uuid)
from authenticated;

grant execute on function public.create_participant_from_approved_application(uuid, uuid)
to service_role;

comment on function public.create_participant_from_approved_application(uuid, uuid) is
'Atomically converts an eligible application into a participant and initial profile. Execution is restricted to the service role and requires an active administrator actor.';

commit;
