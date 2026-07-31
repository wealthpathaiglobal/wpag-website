begin;

create or replace function public.list_pending_application_reviews()
returns table (
    application_id uuid,
    application_code text,
    full_name text,
    email text,
    phone_country_code text,
    phone_number text,
    country_code text,
    state_or_region text,
    city text,
    application_status text,
    submitted_at timestamptz,
    application_created_at timestamptz,
    eligibility_review_id uuid,
    review_number integer,
    review_status text,
    decision text,
    review_created_at timestamptz,
    started_at timestamptz,
    completed_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
    return query
    select
        a.id,
        a.application_code,
        a.full_name,
        a.email::text,
        a.phone_country_code,
        a.phone_number,
        a.country_code,
        a.state_or_region,
        a.city,
        a.status,
        a.submitted_at,
        a.created_at,
        er.id,
        er.review_number,
        er.review_status,
        er.decision,
        er.created_at,
        er.started_at,
        er.completed_at
    from public.applications a
    join lateral (
        select candidate.*
        from public.eligibility_reviews candidate
        where candidate.application_id = a.id
          and candidate.deleted_at is null
          and candidate.review_status in ('pending', 'in_review')
        order by candidate.review_number desc, candidate.id desc
        limit 1
    ) er on true
    where a.deleted_at is null
    order by er.created_at, a.id;
end;
$$;

create or replace function public.get_application_review(
    p_application_id uuid
)
returns table (
    application_id uuid,
    application_code text,
    auth_user_id uuid,
    full_name text,
    email text,
    phone_country_code text,
    phone_number text,
    country_code text,
    state_or_region text,
    city text,
    age_group text,
    employment_status text,
    application_reason text,
    financial_challenges text,
    expectations text,
    referral_source text,
    application_status text,
    submitted_at timestamptz,
    application_created_at timestamptz,
    application_updated_at timestamptz,
    eligibility_review_id uuid,
    review_number integer,
    review_status text,
    decision text,
    criteria_results jsonb,
    eligibility_score numeric,
    decision_summary text,
    eligibility_conditions text,
    additional_information_required text,
    ineligibility_reason text,
    reviewed_by uuid,
    started_at timestamptz,
    completed_at timestamptz,
    review_created_at timestamptz,
    review_updated_at timestamptz,
    participant_id uuid,
    participant_code text,
    participant_lifecycle_status text
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
    v_application public.applications%rowtype;
begin
    if p_application_id is null then
        raise exception using errcode = 'P1001', message = 'Application ID is required.';
    end if;

    select a.* into v_application
    from public.applications a
    where a.id = p_application_id;

    if not found then
        raise exception using errcode = 'P1001', message = 'Application was not found.';
    end if;

    if v_application.deleted_at is not null then
        raise exception using errcode = 'P1001', message = 'Application is unavailable.';
    end if;

    return query
    select
        a.id, a.application_code, a.auth_user_id, a.full_name, a.email::text,
        a.phone_country_code, a.phone_number, a.country_code, a.state_or_region,
        a.city, a.age_group, a.employment_status, a.application_reason,
        a.financial_challenges, a.expectations, a.referral_source, a.status,
        a.submitted_at, a.created_at, a.updated_at,
        er.id, er.review_number, er.review_status, er.decision,
        er.criteria_results, er.eligibility_score, er.decision_summary,
        er.eligibility_conditions, er.additional_information_required,
        er.ineligibility_reason, er.reviewed_by, er.started_at, er.completed_at,
        er.created_at, er.updated_at,
        p.id, p.participant_code, p.lifecycle_status
    from public.applications a
    join lateral (
        select candidate.*
        from public.eligibility_reviews candidate
        where candidate.application_id = a.id
          and candidate.deleted_at is null
        order by candidate.review_number desc, candidate.id desc
        limit 1
    ) er on true
    left join public.participants p
      on p.application_id = a.id and p.deleted_at is null
    where a.id = p_application_id;

    if not found then
        raise exception using errcode = 'P1001', message = 'Application review was not found.';
    end if;
end;
$$;

create or replace function public.transition_application_eligibility_review(
    p_application_id uuid,
    p_actor_user_id uuid,
    p_decision text,
    p_reviewer_notes text,
    p_reason text
)
returns table (
    application_id uuid,
    application_code text,
    application_status text,
    review_id uuid,
    review_status text,
    decision text,
    reviewed_at timestamptz,
    completed_at timestamptz,
    participant_id uuid,
    participant_code text,
    participant_lifecycle_status text,
    converted boolean
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
    v_application public.applications%rowtype;
    v_review public.eligibility_reviews%rowtype;
    v_participant record;
    v_notes text := nullif(btrim(p_reviewer_notes), '');
    v_reason text := nullif(btrim(p_reason), '');
    v_now timestamptz := transaction_timestamp();
begin
    if p_application_id is null then
        raise exception using errcode = 'P1001', message = 'Application ID is required.';
    end if;
    if p_actor_user_id is null then
        raise exception using errcode = 'P1001', message = 'Actor identity is required.';
    end if;
    if p_decision is null or p_decision not in ('approve', 'reject', 'request_more_information') then
        raise exception using errcode = 'P1001', message = 'Eligibility decision is invalid.';
    end if;
    if p_decision = 'reject' and v_reason is null then
        raise exception using errcode = 'P1001', message = 'A rejection reason is required.';
    end if;
    if p_decision = 'request_more_information' and v_reason is null then
        raise exception using errcode = 'P1001', message = 'Additional information requirements are required.';
    end if;

    if not exists (
        select 1
        from public.staff_members sm
        join public.staff_member_roles smr on smr.staff_member_id = sm.id
        join public.staff_roles sr on sr.id = smr.staff_role_id
        where sm.auth_user_id = p_actor_user_id
          and sm.status = 'active' and sm.deleted_at is null
          and sr.role_code = 'administrator' and sr.is_active = true
          and smr.is_active = true
          and (smr.expires_at is null or smr.expires_at > now())
    ) then
        raise exception using errcode = 'P1001', message = 'Actor is not authorized to review applications.';
    end if;

    select a.* into v_application
    from public.applications a
    where a.id = p_application_id
    for update;

    if not found then
        raise exception using errcode = 'P1001', message = 'Application was not found.';
    end if;
    if v_application.deleted_at is not null then
        raise exception using errcode = 'P1001', message = 'Application is unavailable.';
    end if;

    select p.id, p.participant_code, p.lifecycle_status
      into v_participant
      from public.participants p
     where p.application_id = p_application_id and p.deleted_at is null;

    if p_decision = 'approve' and v_application.status = 'converted' and found then
        select er.* into v_review
        from public.eligibility_reviews er
        where er.application_id = p_application_id and er.deleted_at is null
        order by er.review_number desc, er.id desc limit 1;
        return query select v_application.id, v_application.application_code,
            v_application.status, v_review.id, v_review.review_status,
            v_review.decision, v_application.reviewed_at, v_review.completed_at,
            v_participant.id, v_participant.participant_code,
            v_participant.lifecycle_status, true;
        return;
    end if;

    select er.* into v_review
    from public.eligibility_reviews er
    where er.application_id = p_application_id and er.deleted_at is null
    order by er.review_number desc, er.id desc
    limit 1 for update;

    if not found then
        raise exception using errcode = 'P1001', message = 'Application review was not found.';
    end if;
    if v_review.review_status = 'completed' then
        raise exception using errcode = 'P1001', message = 'Application review has already been completed.';
    end if;
    if not (
        (v_application.status = 'submitted' and v_review.review_status = 'pending')
        or (v_application.status = 'additional_information_required' and v_review.review_status = 'in_review')
    ) then
        raise exception using errcode = 'P1001', message = 'Application review transition is not allowed.';
    end if;

    if p_decision = 'request_more_information'
       and v_application.status = 'additional_information_required'
       and v_review.additional_information_required is not distinct from v_reason
       and v_review.decision_summary is not distinct from v_notes then
        return query select v_application.id, v_application.application_code,
            v_application.status, v_review.id, v_review.review_status,
            v_review.decision, v_application.reviewed_at, v_review.completed_at,
            null::uuid, null::text, null::text, false;
        return;
    elsif p_decision = 'request_more_information'
       and v_application.status = 'additional_information_required' then
        raise exception using errcode = 'P1001', message = 'Application review transition is not allowed.';
    end if;

    update public.eligibility_reviews er
       set review_status = case when p_decision = 'request_more_information' then 'in_review' else 'completed' end,
           decision = case p_decision when 'approve' then 'eligible' when 'reject' then 'ineligible' else 'pending' end,
           decision_summary = v_notes,
           eligibility_conditions = null,
           additional_information_required = case when p_decision = 'request_more_information' then v_reason else null end,
           ineligibility_reason = case when p_decision = 'reject' then v_reason else null end,
           reviewed_by = p_actor_user_id,
           updated_by = p_actor_user_id,
           started_at = coalesce(er.started_at, v_now),
           completed_at = case when p_decision = 'request_more_information' then null else v_now end
     where er.id = v_review.id
     returning er.* into v_review;

    update public.applications a
       set status = case p_decision when 'approve' then 'eligible' when 'reject' then 'ineligible' else 'additional_information_required' end,
           reviewed_at = case when p_decision = 'request_more_information' then null else v_now end,
           reviewed_by = p_actor_user_id,
           updated_by = p_actor_user_id
     where a.id = p_application_id
     returning a.* into v_application;

    if p_decision = 'approve' then
        begin
            select converted_participant.* into strict v_participant
            from public.create_participant_from_approved_application(
                p_application_id, p_actor_user_id
            ) converted_participant;
        exception when others then
            raise exception using errcode = 'P1001', message = 'Participant conversion could not be completed.';
        end;
        v_application.status := 'converted';
    end if;

    return query select v_application.id, v_application.application_code,
        v_application.status, v_review.id, v_review.review_status,
        v_review.decision, v_application.reviewed_at, v_review.completed_at,
        case when p_decision = 'approve' then v_participant.id else null::uuid end,
        case when p_decision = 'approve' then v_participant.participant_code else null::text end,
        case when p_decision = 'approve' then v_participant.lifecycle_status else null::text end,
        p_decision = 'approve';
exception
    when sqlstate 'P1001' then raise;
    when others then
        raise exception using errcode = 'P1002', message = 'Application review operation could not be completed.';
end;
$$;

alter function public.list_pending_application_reviews() owner to postgres;
alter function public.get_application_review(uuid) owner to postgres;
alter function public.transition_application_eligibility_review(uuid, uuid, text, text, text) owner to postgres;

revoke all on function public.list_pending_application_reviews() from public, anon, authenticated;
revoke all on function public.get_application_review(uuid) from public, anon, authenticated;
revoke all on function public.transition_application_eligibility_review(uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.list_pending_application_reviews() to service_role;
grant execute on function public.get_application_review(uuid) to service_role;
grant execute on function public.transition_application_eligibility_review(uuid, uuid, text, text, text) to service_role;

comment on function public.list_pending_application_reviews() is
'Returns the narrow active application-review queue projection to trusted service operations.';
comment on function public.get_application_review(uuid) is
'Returns the narrow application-review detail projection to trusted service operations.';
comment on function public.transition_application_eligibility_review(uuid, uuid, text, text, text) is
'Atomically governs eligibility decisions and approved participant conversion for an active administrator.';

commit;
