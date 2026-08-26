begin;

create function public.write_current_participant_profile(
    p_first_name text, p_middle_name text, p_last_name text, p_preferred_name text,
    p_date_of_birth date, p_gender text, p_marital_status text,
    p_phone_country_code text, p_phone_number text, p_country_code text,
    p_state text, p_district text, p_city text, p_postal_code text,
    p_education_level text, p_occupation text, p_employment_status text,
    p_household_size integer, p_dependents integer,
    p_emergency_contact_name text, p_emergency_contact_relationship text,
    p_emergency_contact_phone text, p_expected_updated_at timestamptz,
    p_complete boolean
)
returns table (
    first_name text, middle_name text, last_name text, preferred_name text,
    date_of_birth date, gender text, marital_status text, email text,
    phone_country_code text, phone_number text, country_code text, state text,
    district text, city text, postal_code text, education_level text,
    occupation text, employment_status text, household_size integer,
    dependents integer, emergency_contact_name text,
    emergency_contact_relationship text, emergency_contact_phone text,
    profile_completed boolean, profile_completed_at timestamptz,
    updated_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = public, pg_catalog
as $$
declare
    v_auth_user_id uuid := auth.uid();
    v_participant_id uuid;
    v_actual_updated_at timestamptz;
begin
    if v_auth_user_id is null then
        raise exception using errcode = 'P1001', message = 'Authentication is required.';
    end if;
    if p_expected_updated_at is null or p_complete is null then
        raise exception using errcode = 'P1004', message = 'Profile data is invalid.';
    end if;

    select p.id into v_participant_id
      from public.participants p
     where p.auth_user_id = v_auth_user_id and p.deleted_at is null
     for update;
    if v_participant_id is null then
        raise exception using errcode = 'P1002', message = 'Participant profile is unavailable.';
    end if;

    select pp.updated_at into v_actual_updated_at
      from public.participant_profiles pp
     where pp.participant_id = v_participant_id and pp.deleted_at is null
     for update;
    if v_actual_updated_at is null then
        raise exception using errcode = 'P1002', message = 'Participant profile is unavailable.';
    end if;
    if v_actual_updated_at is distinct from p_expected_updated_at then
        raise exception using errcode = 'P1006', message = 'Participant profile version conflict.';
    end if;

    if p_complete then
        perform * from public.save_current_participant_profile(
          p_first_name,p_middle_name,p_last_name,p_preferred_name,p_date_of_birth,
          p_gender,p_marital_status,p_phone_country_code,p_phone_number,
          p_country_code,p_state,p_district,p_city,p_postal_code,p_education_level,
          p_occupation,p_employment_status,p_household_size,p_dependents,
          p_emergency_contact_name,p_emergency_contact_relationship,p_emergency_contact_phone);
        return query select * from public.complete_current_participant_profile();
    else
        return query select * from public.save_current_participant_profile(
          p_first_name,p_middle_name,p_last_name,p_preferred_name,p_date_of_birth,
          p_gender,p_marital_status,p_phone_country_code,p_phone_number,
          p_country_code,p_state,p_district,p_city,p_postal_code,p_education_level,
          p_occupation,p_employment_status,p_household_size,p_dependents,
          p_emergency_contact_name,p_emergency_contact_relationship,p_emergency_contact_phone);
    end if;
end;
$$;

alter function public.write_current_participant_profile(text,text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer,text,text,text,timestamptz,boolean) owner to postgres;
revoke all on function public.write_current_participant_profile(text,text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer,text,text,text,timestamptz,boolean) from public, anon, service_role;
grant execute on function public.write_current_participant_profile(text,text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer,text,text,text,timestamptz,boolean) to authenticated;
comment on function public.write_current_participant_profile(text,text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer,text,text,text,timestamptz,boolean) is 'Versioned participant-owned profile write. Validates and persists the submitted snapshot and, when requested, completes that same snapshot atomically.';

commit;
