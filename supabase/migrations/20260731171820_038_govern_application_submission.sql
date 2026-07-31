begin;

create or replace function public.submit_participant_application(
    p_full_name text,
    p_email text,
    p_phone_country_code text,
    p_phone_number text,
    p_country_code text,
    p_state_or_region text,
    p_city text,
    p_age_group text,
    p_employment_status text,
    p_application_reason text,
    p_financial_challenges text,
    p_expectations text,
    p_referral_source text,
    p_source_ip inet,
    p_user_agent text,
    p_auth_user_id uuid
)
returns table (
    application_id uuid,
    application_code text,
    application_status text,
    submitted_at timestamptz,
    application_created_at timestamptz,
    eligibility_review_id uuid,
    review_number integer,
    review_status text,
    decision text,
    review_created_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
    v_full_name text;
    v_email text;
    v_phone_country_code text;
    v_phone_number text;
    v_country_code text;
    v_state_or_region text;
    v_city text;
    v_age_group text;
    v_employment_status text;
    v_application_reason text;
    v_financial_challenges text;
    v_expectations text;
    v_referral_source text;
    v_user_agent text;
    v_now timestamptz := transaction_timestamp();
    v_application public.applications%rowtype;
    v_review public.eligibility_reviews%rowtype;
begin
    v_full_name := regexp_replace(btrim(coalesce(p_full_name, '')), '[[:space:]]+', ' ', 'g');
    v_email := lower(btrim(coalesce(p_email, '')));
    v_phone_country_code := btrim(coalesce(p_phone_country_code, ''));
    v_phone_number := btrim(coalesce(p_phone_number, ''));
    v_country_code := upper(btrim(coalesce(p_country_code, '')));
    v_state_or_region := nullif(regexp_replace(btrim(coalesce(p_state_or_region, '')), '[[:space:]]+', ' ', 'g'), '');
    v_city := nullif(regexp_replace(btrim(coalesce(p_city, '')), '[[:space:]]+', ' ', 'g'), '');
    v_age_group := nullif(btrim(coalesce(p_age_group, '')), '');
    v_employment_status := nullif(btrim(coalesce(p_employment_status, '')), '');
    v_application_reason := regexp_replace(btrim(coalesce(p_application_reason, '')), '[[:space:]]+', ' ', 'g');
    v_financial_challenges := nullif(regexp_replace(btrim(coalesce(p_financial_challenges, '')), '[[:space:]]+', ' ', 'g'), '');
    v_expectations := nullif(regexp_replace(btrim(coalesce(p_expectations, '')), '[[:space:]]+', ' ', 'g'), '');
    v_referral_source := nullif(regexp_replace(btrim(coalesce(p_referral_source, '')), '[[:space:]]+', ' ', 'g'), '');
    v_user_agent := nullif(left(btrim(coalesce(p_user_agent, '')), 1000), '');

    if char_length(v_full_name) not between 2 and 150
       or char_length(v_email) > 254
       or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
       or v_phone_country_code !~ '^\+[1-9][0-9]{0,3}$'
       or v_phone_number !~ '^[0-9]{6,15}$'
       or v_country_code !~ '^[A-Z]{2}$'
       or char_length(v_application_reason) not between 10 and 2000
       or (v_state_or_region is not null and char_length(v_state_or_region) > 100)
       or (v_city is not null and char_length(v_city) > 100)
       or (v_age_group is not null and v_age_group not in ('18_24', '25_34', '35_44', '45_54', '55_64', '65_plus'))
       or (v_employment_status is not null and v_employment_status not in ('employed', 'self_employed', 'business_owner', 'student', 'homemaker', 'retired', 'unemployed', 'other'))
       or (v_financial_challenges is not null and char_length(v_financial_challenges) > 3000)
       or (v_expectations is not null and char_length(v_expectations) > 3000)
       or (v_referral_source is not null and char_length(v_referral_source) > 150)
    then
        raise exception using
            errcode = 'P1001',
            message = 'Application data is invalid.';
    end if;

    perform pg_advisory_xact_lock(hashtextextended(v_email, 927031));

    if exists (
        select 1
          from public.applications a
         where lower(a.email::text) = v_email
           and a.deleted_at is null
           and a.status in (
               'submitted',
               'under_review',
               'additional_information_required',
               'eligible'
           )
    ) then
        raise exception using
            errcode = 'P1001',
            message = 'An active application already exists.';
    end if;

    insert into public.applications (
        auth_user_id,
        full_name,
        email,
        phone_country_code,
        phone_number,
        country_code,
        state_or_region,
        city,
        age_group,
        employment_status,
        application_reason,
        financial_challenges,
        expectations,
        referral_source,
        status,
        submitted_at,
        source_ip,
        user_agent,
        created_at,
        updated_at,
        created_by,
        updated_by
    )
    values (
        p_auth_user_id,
        v_full_name,
        v_email,
        v_phone_country_code,
        v_phone_number,
        v_country_code,
        v_state_or_region,
        v_city,
        v_age_group,
        v_employment_status,
        v_application_reason,
        v_financial_challenges,
        v_expectations,
        v_referral_source,
        'submitted',
        v_now,
        p_source_ip,
        v_user_agent,
        v_now,
        v_now,
        p_auth_user_id,
        p_auth_user_id
    )
    returning * into strict v_application;

    insert into public.eligibility_reviews (
        application_id,
        review_number,
        review_status,
        decision,
        created_at,
        updated_at,
        created_by,
        updated_by
    )
    values (
        v_application.id,
        1,
        'pending',
        'pending',
        v_now,
        v_now,
        p_auth_user_id,
        p_auth_user_id
    )
    returning * into strict v_review;

    return query
    select
        v_application.id,
        v_application.application_code,
        v_application.status,
        v_application.submitted_at,
        v_application.created_at,
        v_review.id,
        v_review.review_number,
        v_review.review_status,
        v_review.decision,
        v_review.created_at;
exception
    when sqlstate 'P1001' then
        raise;
    when others then
        raise exception using
            errcode = 'P1002',
            message = 'Participant application submission could not be completed.';
end;
$$;

alter function public.submit_participant_application(
    text, text, text, text, text, text, text, text,
    text, text, text, text, text, inet, text, uuid
)
owner to postgres;

revoke all on function public.submit_participant_application(
    text, text, text, text, text, text, text, text,
    text, text, text, text, text, inet, text, uuid
)
from public, anon, authenticated;

grant execute on function public.submit_participant_application(
    text, text, text, text, text, text, text, text,
    text, text, text, text, text, inet, text, uuid
)
to service_role;

comment on function public.submit_participant_application(
    text, text, text, text, text, text, text, text,
    text, text, text, text, text, inet, text, uuid
) is
'Governed service boundary that atomically creates a submitted participant application and its initial pending eligibility review.';

commit;
