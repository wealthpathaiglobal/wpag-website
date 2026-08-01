begin;

create or replace function public.get_current_participant_profile()
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
stable
security definer
set search_path = public, pg_catalog
as $$
declare
    v_auth_user_id uuid := auth.uid();
begin
    if v_auth_user_id is null then
        raise exception using errcode = 'P1001', message = 'Authentication is required.';
    end if;

    return query
    select pp.first_name, pp.middle_name, pp.last_name, pp.preferred_name,
           pp.date_of_birth, pp.gender, pp.marital_status, pp.email,
           pp.phone_country_code, pp.phone_number, pp.country_code, pp.state,
           pp.district, pp.city, pp.postal_code, pp.education_level,
           pp.occupation, pp.employment_status, pp.household_size,
           pp.dependents, pp.emergency_contact_name,
           pp.emergency_contact_relationship, pp.emergency_contact_phone,
           pp.profile_completed, pp.profile_completed_at, pp.updated_at
      from public.participants p
      join public.participant_profiles pp on pp.participant_id = p.id
     where p.auth_user_id = v_auth_user_id
       and p.deleted_at is null
       and pp.deleted_at is null;
end;
$$;

create or replace function public.save_current_participant_profile(
    p_first_name text, p_middle_name text, p_last_name text, p_preferred_name text,
    p_date_of_birth date, p_gender text, p_marital_status text,
    p_phone_country_code text, p_phone_number text, p_country_code text,
    p_state text, p_district text, p_city text, p_postal_code text,
    p_education_level text, p_occupation text, p_employment_status text,
    p_household_size integer, p_dependents integer,
    p_emergency_contact_name text, p_emergency_contact_relationship text,
    p_emergency_contact_phone text
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
    v_lifecycle_status text;
    v_first_name text := nullif(btrim(coalesce(p_first_name, '')), '');
    v_middle_name text := nullif(btrim(coalesce(p_middle_name, '')), '');
    v_last_name text := nullif(btrim(coalesce(p_last_name, '')), '');
    v_preferred_name text := nullif(btrim(coalesce(p_preferred_name, '')), '');
    v_gender text := nullif(btrim(coalesce(p_gender, '')), '');
    v_marital_status text := nullif(btrim(coalesce(p_marital_status, '')), '');
    v_phone_country_code text := nullif(btrim(coalesce(p_phone_country_code, '')), '');
    v_phone_number text := nullif(btrim(coalesce(p_phone_number, '')), '');
    v_country_code text := upper(nullif(btrim(coalesce(p_country_code, '')), ''));
    v_state text := nullif(btrim(coalesce(p_state, '')), '');
    v_district text := nullif(btrim(coalesce(p_district, '')), '');
    v_city text := nullif(btrim(coalesce(p_city, '')), '');
    v_postal_code text := nullif(btrim(coalesce(p_postal_code, '')), '');
    v_education_level text := nullif(btrim(coalesce(p_education_level, '')), '');
    v_occupation text := nullif(btrim(coalesce(p_occupation, '')), '');
    v_employment_status text := nullif(btrim(coalesce(p_employment_status, '')), '');
    v_emergency_contact_name text := nullif(btrim(coalesce(p_emergency_contact_name, '')), '');
    v_emergency_contact_relationship text := nullif(btrim(coalesce(p_emergency_contact_relationship, '')), '');
    v_emergency_contact_phone text := nullif(btrim(coalesce(p_emergency_contact_phone, '')), '');
    v_complete boolean;
begin
    if v_auth_user_id is null then
        raise exception using errcode = 'P1001', message = 'Authentication is required.';
    end if;

    select p.id, p.lifecycle_status into v_participant_id, v_lifecycle_status
      from public.participants p
     where p.auth_user_id = v_auth_user_id and p.deleted_at is null
     for update;

    if v_participant_id is null then
        raise exception using errcode = 'P1002', message = 'Participant profile is unavailable.';
    end if;
    if v_lifecycle_status not in ('pending_enrollment', 'active') then
        raise exception using errcode = 'P1003', message = 'Participant profile changes are not allowed.';
    end if;
    if v_first_name is null or v_last_name is null then
        raise exception using errcode = 'P1004', message = 'Profile data is invalid.';
    end if;
    if p_date_of_birth is not null and p_date_of_birth > current_date then
        raise exception using errcode = 'P1004', message = 'Profile data is invalid.';
    end if;
    if v_gender is not null and v_gender not in ('male','female','other','prefer_not_to_say') then
        raise exception using errcode = 'P1004', message = 'Profile data is invalid.';
    end if;
    if v_marital_status is not null and v_marital_status not in ('single','married','divorced','widowed','separated','other','prefer_not_to_say') then
        raise exception using errcode = 'P1004', message = 'Profile data is invalid.';
    end if;
    if v_employment_status is not null and v_employment_status not in ('employed','self_employed','business_owner','student','homemaker','retired','unemployed','other') then
        raise exception using errcode = 'P1004', message = 'Profile data is invalid.';
    end if;
    if v_phone_country_code is not null and v_phone_country_code !~ '^\+[1-9][0-9]{0,3}$' then
        raise exception using errcode = 'P1004', message = 'Profile data is invalid.';
    end if;
    if v_phone_number is not null and v_phone_number !~ '^[0-9][0-9 -]{5,19}$' then
        raise exception using errcode = 'P1004', message = 'Profile data is invalid.';
    end if;
    if v_country_code is not null and v_country_code !~ '^[A-Z]{2}$' then
        raise exception using errcode = 'P1004', message = 'Profile data is invalid.';
    end if;
    if v_postal_code is not null and v_postal_code !~ '^[A-Za-z0-9][A-Za-z0-9 -]{1,19}$' then
        raise exception using errcode = 'P1004', message = 'Profile data is invalid.';
    end if;
    if p_household_size is not null and (p_household_size < 1 or p_household_size > 100) then
        raise exception using errcode = 'P1004', message = 'Profile data is invalid.';
    end if;
    if p_dependents is not null and (p_dependents < 0 or p_dependents > 100 or (p_household_size is not null and p_dependents > p_household_size)) then
        raise exception using errcode = 'P1004', message = 'Profile data is invalid.';
    end if;
    if v_emergency_contact_phone is not null and v_emergency_contact_phone !~ '^\+[1-9][0-9 -]{6,23}$' then
        raise exception using errcode = 'P1004', message = 'Profile data is invalid.';
    end if;

    v_complete := v_first_name is not null and v_last_name is not null
      and p_date_of_birth is not null and v_gender is not null and v_marital_status is not null
      and v_phone_country_code is not null and v_phone_number is not null
      and v_country_code is not null and v_state is not null and v_city is not null
      and v_postal_code is not null and v_employment_status is not null
      and p_household_size is not null and p_dependents is not null
      and v_emergency_contact_name is not null
      and v_emergency_contact_relationship is not null
      and v_emergency_contact_phone is not null;

    return query
    update public.participant_profiles pp
       set first_name=v_first_name, middle_name=v_middle_name, last_name=v_last_name,
           preferred_name=v_preferred_name, date_of_birth=p_date_of_birth,
           gender=v_gender, marital_status=v_marital_status,
           phone_country_code=v_phone_country_code, phone_number=v_phone_number,
           country_code=v_country_code, state=v_state, district=v_district,
           city=v_city, postal_code=v_postal_code, education_level=v_education_level,
           occupation=v_occupation, employment_status=v_employment_status,
           household_size=p_household_size, dependents=p_dependents,
           emergency_contact_name=v_emergency_contact_name,
           emergency_contact_relationship=v_emergency_contact_relationship,
           emergency_contact_phone=v_emergency_contact_phone,
           profile_completed=case when pp.profile_completed and not v_complete then false else pp.profile_completed end,
           profile_completed_at=case when pp.profile_completed and not v_complete then null else pp.profile_completed_at end,
           updated_by=v_auth_user_id
     where pp.participant_id=v_participant_id and pp.deleted_at is null
     returning pp.first_name, pp.middle_name, pp.last_name, pp.preferred_name,
       pp.date_of_birth, pp.gender, pp.marital_status, pp.email,
       pp.phone_country_code, pp.phone_number, pp.country_code, pp.state,
       pp.district, pp.city, pp.postal_code, pp.education_level,
       pp.occupation, pp.employment_status, pp.household_size, pp.dependents,
       pp.emergency_contact_name, pp.emergency_contact_relationship,
       pp.emergency_contact_phone, pp.profile_completed, pp.profile_completed_at,
       pp.updated_at;

    if not found then
        raise exception using errcode = 'P1002', message = 'Participant profile is unavailable.';
    end if;
end;
$$;

create or replace function public.complete_current_participant_profile()
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
    v_lifecycle_status text;
begin
    if v_auth_user_id is null then
        raise exception using errcode = 'P1001', message = 'Authentication is required.';
    end if;
    select p.id, p.lifecycle_status into v_participant_id, v_lifecycle_status
      from public.participants p
     where p.auth_user_id=v_auth_user_id and p.deleted_at is null
     for update;
    if v_participant_id is null then
        raise exception using errcode = 'P1002', message = 'Participant profile is unavailable.';
    end if;
    if v_lifecycle_status not in ('pending_enrollment','active') then
        raise exception using errcode = 'P1003', message = 'Participant profile changes are not allowed.';
    end if;

    return query
    update public.participant_profiles pp
       set profile_completed=true,
           profile_completed_at=coalesce(pp.profile_completed_at, transaction_timestamp()),
           updated_by=v_auth_user_id
     where pp.participant_id=v_participant_id and pp.deleted_at is null
       and nullif(btrim(pp.first_name),'') is not null
       and nullif(btrim(pp.last_name),'') is not null
       and pp.date_of_birth is not null
       and nullif(btrim(pp.gender),'') is not null
       and nullif(btrim(pp.marital_status),'') is not null
       and nullif(btrim(pp.phone_country_code),'') is not null
       and nullif(btrim(pp.phone_number),'') is not null
       and nullif(btrim(pp.country_code),'') is not null
       and nullif(btrim(pp.state),'') is not null
       and nullif(btrim(pp.city),'') is not null
       and nullif(btrim(pp.postal_code),'') is not null
       and nullif(btrim(pp.employment_status),'') is not null
       and pp.household_size is not null and pp.dependents is not null
       and nullif(btrim(pp.emergency_contact_name),'') is not null
       and nullif(btrim(pp.emergency_contact_relationship),'') is not null
       and nullif(btrim(pp.emergency_contact_phone),'') is not null
     returning pp.first_name, pp.middle_name, pp.last_name, pp.preferred_name,
       pp.date_of_birth, pp.gender, pp.marital_status, pp.email,
       pp.phone_country_code, pp.phone_number, pp.country_code, pp.state,
       pp.district, pp.city, pp.postal_code, pp.education_level,
       pp.occupation, pp.employment_status, pp.household_size, pp.dependents,
       pp.emergency_contact_name, pp.emergency_contact_relationship,
       pp.emergency_contact_phone, pp.profile_completed, pp.profile_completed_at,
       pp.updated_at;
    if not found then
        if not exists (select 1 from public.participant_profiles pp where pp.participant_id=v_participant_id and pp.deleted_at is null) then
            raise exception using errcode = 'P1002', message = 'Participant profile is unavailable.';
        end if;
        raise exception using errcode = 'P1005', message = 'Participant profile is incomplete.';
    end if;
end;
$$;

alter function public.get_current_participant_profile() owner to postgres;
alter function public.save_current_participant_profile(text,text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer,text,text,text) owner to postgres;
alter function public.complete_current_participant_profile() owner to postgres;

revoke all on function public.get_current_participant_profile() from public, anon, service_role;
revoke all on function public.save_current_participant_profile(text,text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer,text,text,text) from public, anon, service_role;
revoke all on function public.complete_current_participant_profile() from public, anon, service_role;
grant execute on function public.get_current_participant_profile() to authenticated;
grant execute on function public.save_current_participant_profile(text,text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer,text,text,text) to authenticated;
grant execute on function public.complete_current_participant_profile() to authenticated;

comment on function public.get_current_participant_profile() is 'Returns the authenticated participant owner''s narrow durable profile projection.';
comment on function public.save_current_participant_profile(text,text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer,text,text,text) is 'Saves only approved self-service profile fields. A completed profile becomes incomplete when a required field is removed.';
comment on function public.complete_current_participant_profile() is 'Completes the authenticated participant profile only when the documented required identity, contact, address, employment, household, and emergency-contact fields are present.';

commit;
