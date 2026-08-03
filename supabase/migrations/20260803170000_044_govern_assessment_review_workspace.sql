begin;

create function public.list_assessment_reviews(p_actor_user_id uuid)
returns table (
    participant_id uuid,
    participant_code text,
    participant_name text,
    participant_email text,
    lifecycle_status text,
    assessment_id uuid,
    assessment_session_id uuid,
    assessment_number integer,
    assessment_type text,
    assessment_version text,
    hfos_version text,
    assessment_status text,
    submitted_at timestamptz,
    review_id uuid,
    review_status text,
    review_decision text,
    review_started_at timestamptz,
    review_completed_at timestamptz,
    reviewed_by uuid,
    reviewer_name text,
    review_created_at timestamptz,
    review_updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
begin
    if p_actor_user_id is null then
        raise exception using errcode = 'P1001', message = 'Reviewer identity is required.';
    end if;

    if not exists (
        select 1
        from public.staff_members sm
        join public.staff_member_roles smr on smr.staff_member_id = sm.id
        join public.staff_roles sr on sr.id = smr.staff_role_id
        where sm.auth_user_id = p_actor_user_id
          and sm.status = 'active'
          and sm.deleted_at is null
          and sr.role_code = 'administrator'
          and sr.is_active = true
          and smr.is_active = true
          and (smr.expires_at is null or smr.expires_at > now())
    ) then
        raise exception using errcode = 'P1001', message = 'Actor is not authorized to review assessments.';
    end if;

    return query
    select
        p.id,
        p.participant_code,
        coalesce(
            nullif(btrim(concat_ws(' ', pp.first_name, pp.middle_name, pp.last_name)), ''),
            app.full_name,
            p.participant_code
        ),
        coalesce(pp.email::text, app.email::text),
        p.lifecycle_status,
        a.id,
        s.id,
        s.assessment_number,
        s.assessment_type,
        a.assessment_version,
        a.hfos_version,
        s.status,
        s.submitted_at,
        ar.id,
        ar.review_status,
        ar.review_decision,
        ar.review_started_at,
        ar.review_completed_at,
        ar.reviewed_by,
        reviewer.full_name,
        ar.created_at,
        ar.updated_at
    from public.assessment_sessions s
    join public.assessments a
      on a.assessment_session_id = s.id
     and a.participant_id = s.participant_id
     and a.deleted_at is null
    join public.participants p
      on p.id = s.participant_id
     and p.deleted_at is null
    left join public.participant_profiles pp
      on pp.participant_id = p.id
     and pp.deleted_at is null
    left join public.applications app
      on app.id = p.application_id
     and app.deleted_at is null
    left join lateral (
        select candidate.*
        from public.assessment_reviews candidate
        where candidate.assessment_id = a.id
          and candidate.deleted_at is null
        order by candidate.created_at desc, candidate.id desc
        limit 1
    ) ar on true
    left join public.staff_members reviewer
      on reviewer.auth_user_id = ar.reviewed_by
     and reviewer.deleted_at is null
    where s.status = 'submitted'
      and s.submitted_at is not null
      and s.deleted_at is null
    order by
        case coalesce(ar.review_status, 'pending')
            when 'pending' then 1
            when 'in_review' then 2
            when 'returned' then 3
            else 4
        end,
        s.submitted_at,
        a.id;
end;
$$;

create function public.get_assessment_review(
    p_assessment_id uuid,
    p_actor_user_id uuid
)
returns table (
    participant_id uuid,
    participant_code text,
    participant_name text,
    participant_email text,
    lifecycle_status text,
    assessment_id uuid,
    assessment_session_id uuid,
    assessment_number integer,
    assessment_type text,
    assessment_version text,
    hfos_version text,
    assessment_status text,
    submitted_at timestamptz,
    assessment_created_at timestamptz,
    assessment_updated_at timestamptz,
    module_progress jsonb,
    answers jsonb,
    documents jsonb,
    review_id uuid,
    review_status text,
    review_decision text,
    review_started_at timestamptz,
    review_completed_at timestamptz,
    reviewed_by uuid,
    reviewer_name text,
    review_notes text,
    information_request text,
    review_created_at timestamptz,
    review_updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
    v_session_status text;
begin
    if p_assessment_id is null then
        raise exception using errcode = 'P1001', message = 'Assessment ID is required.';
    end if;
    if p_actor_user_id is null then
        raise exception using errcode = 'P1001', message = 'Reviewer identity is required.';
    end if;

    if not exists (
        select 1
        from public.staff_members sm
        join public.staff_member_roles smr on smr.staff_member_id = sm.id
        join public.staff_roles sr on sr.id = smr.staff_role_id
        where sm.auth_user_id = p_actor_user_id
          and sm.status = 'active'
          and sm.deleted_at is null
          and sr.role_code = 'administrator'
          and sr.is_active = true
          and smr.is_active = true
          and (smr.expires_at is null or smr.expires_at > now())
    ) then
        raise exception using errcode = 'P1001', message = 'Actor is not authorized to review assessments.';
    end if;

    select s.status into v_session_status
    from public.assessments a
    join public.assessment_sessions s on s.id = a.assessment_session_id
    join public.participants p on p.id = a.participant_id
    where a.id = p_assessment_id
      and a.deleted_at is null
      and s.deleted_at is null
      and p.deleted_at is null;

    if not found then
        raise exception using errcode = 'P1001', message = 'Assessment was not found.';
    end if;
    if v_session_status <> 'submitted' then
        raise exception using errcode = 'P1001', message = 'Only submitted assessments can be reviewed.';
    end if;

    return query
    with latest_answers as (
        select distinct on (aa.question_code)
            aa.*
        from public.assessment_answers aa
        where aa.assessment_id = p_assessment_id
          and aa.deleted_at is null
        order by aa.question_code, aa.response_order desc, aa.id desc
    ),
    answer_modules as (
        select
            la.section_code as module_key,
            jsonb_object_agg(
                la.question_code,
                jsonb_build_object(
                    'value_type', la.answer_type,
                    'value', case la.answer_type
                        when 'number' then to_jsonb(la.answer_number)
                        when 'boolean' then to_jsonb(la.answer_boolean)
                        when 'date' then to_jsonb(la.answer_date)
                        when 'json' then la.answer_json
                        else to_jsonb(la.answer_text)
                    end,
                    'is_answered', la.is_answered,
                    'response_order', la.response_order,
                    'updated_at', la.updated_at
                ) order by la.question_code
            ) as module_answers
        from latest_answers la
        group by la.section_code
    ),
    answer_projection as (
        select coalesce(
            jsonb_object_agg(am.module_key, am.module_answers order by am.module_key),
            '{}'::jsonb
        ) as value
        from answer_modules am
    ),
    progress_projection as (
        select coalesce(
            jsonb_object_agg(
                ms.module_key,
                jsonb_build_object(
                    'status', ms.status,
                    'answered_required_count', ms.answered_required_count,
                    'required_count', ms.required_count,
                    'completed_at', ms.completed_at,
                    'updated_at', ms.updated_at
                ) order by ms.module_key
            ),
            '{}'::jsonb
        ) as value
        from public.assessment_module_statuses ms
        where ms.assessment_id = p_assessment_id
    ),
    document_projection as (
        select coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'id', ad.id,
                    'document_category', ad.document_category,
                    'document_type', ad.document_type,
                    'document_name', ad.document_name,
                    'description', ad.description,
                    'original_filename', ad.original_filename,
                    'mime_type', ad.mime_type,
                    'file_size_bytes', ad.file_size_bytes,
                    'verification_status', ad.verification_status,
                    'verified_at', ad.verified_at,
                    'verified_by', ad.verified_by,
                    'verification_notes', ad.verification_notes,
                    'created_at', ad.created_at
                ) order by ad.created_at, ad.id
            ),
            '[]'::jsonb
        ) as value
        from public.assessment_documents ad
        where ad.assessment_id = p_assessment_id
          and ad.deleted_at is null
    )
    select
        p.id,
        p.participant_code,
        coalesce(
            nullif(btrim(concat_ws(' ', pp.first_name, pp.middle_name, pp.last_name)), ''),
            app.full_name,
            p.participant_code
        ),
        coalesce(pp.email::text, app.email::text),
        p.lifecycle_status,
        a.id,
        s.id,
        s.assessment_number,
        s.assessment_type,
        a.assessment_version,
        a.hfos_version,
        s.status,
        s.submitted_at,
        a.created_at,
        a.updated_at,
        progress.value,
        answer_data.value,
        document_data.value,
        ar.id,
        ar.review_status,
        ar.review_decision,
        ar.review_started_at,
        ar.review_completed_at,
        ar.reviewed_by,
        reviewer.full_name,
        ar.review_notes,
        ar.information_request,
        ar.created_at,
        ar.updated_at
    from public.assessments a
    join public.assessment_sessions s
      on s.id = a.assessment_session_id
     and s.participant_id = a.participant_id
     and s.deleted_at is null
    join public.participants p
      on p.id = a.participant_id
     and p.deleted_at is null
    left join public.participant_profiles pp
      on pp.participant_id = p.id
     and pp.deleted_at is null
    left join public.applications app
      on app.id = p.application_id
     and app.deleted_at is null
    left join lateral (
        select candidate.*
        from public.assessment_reviews candidate
        where candidate.assessment_id = a.id
          and candidate.deleted_at is null
        order by candidate.created_at desc, candidate.id desc
        limit 1
    ) ar on true
    left join public.staff_members reviewer
      on reviewer.auth_user_id = ar.reviewed_by
     and reviewer.deleted_at is null
    cross join progress_projection progress
    cross join answer_projection answer_data
    cross join document_projection document_data
    where a.id = p_assessment_id
      and a.deleted_at is null
      and s.status = 'submitted';
end;
$$;

create function public.transition_assessment_review(
    p_assessment_id uuid,
    p_actor_user_id uuid,
    p_command text,
    p_reviewer_notes text,
    p_information_request text
)
returns table (
    assessment_id uuid,
    review_id uuid,
    review_status text,
    review_decision text,
    review_started_at timestamptz,
    review_completed_at timestamptz,
    reviewed_by uuid,
    reviewer_name text,
    review_notes text,
    information_request text,
    review_created_at timestamptz,
    review_updated_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = public, pg_catalog
as $$
declare
    v_assessment public.assessments%rowtype;
    v_session public.assessment_sessions%rowtype;
    v_review public.assessment_reviews%rowtype;
    v_previous_status text;
    v_notes text := nullif(btrim(p_reviewer_notes), '');
    v_request text := nullif(btrim(p_information_request), '');
    v_now timestamptz := transaction_timestamp();
    v_reviewer_name text;
begin
    if p_assessment_id is null then
        raise exception using errcode = 'P1001', message = 'Assessment ID is required.';
    end if;
    if p_actor_user_id is null then
        raise exception using errcode = 'P1001', message = 'Reviewer identity is required.';
    end if;
    if p_command is null or p_command not in (
        'start_review', 'save_notes', 'request_information', 'approve', 'reject'
    ) then
        raise exception using errcode = 'P1001', message = 'Assessment review command is invalid.';
    end if;
    if p_command = 'save_notes' and v_notes is null then
        raise exception using errcode = 'P1001', message = 'Reviewer notes are required.';
    end if;
    if p_command = 'request_information' and v_request is null then
        raise exception using errcode = 'P1001', message = 'Information request is required.';
    end if;
    if p_command = 'reject' and v_notes is null then
        raise exception using errcode = 'P1001', message = 'A rejection rationale is required.';
    end if;

    select sm.full_name into v_reviewer_name
    from public.staff_members sm
    join public.staff_member_roles smr on smr.staff_member_id = sm.id
    join public.staff_roles sr on sr.id = smr.staff_role_id
    where sm.auth_user_id = p_actor_user_id
      and sm.status = 'active'
      and sm.deleted_at is null
      and sr.role_code = 'administrator'
      and sr.is_active = true
      and smr.is_active = true
      and (smr.expires_at is null or smr.expires_at > now())
    limit 1;

    if not found then
        raise exception using errcode = 'P1001', message = 'Actor is not authorized to review assessments.';
    end if;

    select a.* into v_assessment
    from public.assessments a
    join public.participants p
      on p.id = a.participant_id
     and p.deleted_at is null
    where a.id = p_assessment_id
      and a.deleted_at is null
    for update of a;

    if not found then
        raise exception using errcode = 'P1001', message = 'Assessment was not found.';
    end if;

    select s.* into v_session
    from public.assessment_sessions s
    where s.id = v_assessment.assessment_session_id
      and s.participant_id = v_assessment.participant_id
      and s.deleted_at is null
    for update;

    if not found then
        raise exception using errcode = 'P1001', message = 'Assessment was not found.';
    end if;
    if v_session.status <> 'submitted' or v_session.submitted_at is null then
        raise exception using errcode = 'P1001', message = 'Only submitted assessments can be reviewed.';
    end if;

    select ar.* into v_review
    from public.assessment_reviews ar
    where ar.assessment_id = p_assessment_id
      and ar.deleted_at is null
    order by ar.created_at desc, ar.id desc
    limit 1
    for update;

    v_previous_status := case when found then v_review.review_status else null end;

    if p_command = 'start_review' then
        if v_review.id is null then
            insert into public.assessment_reviews (
                assessment_id, review_status, review_started_at, reviewed_by,
                review_notes, created_by, updated_by
            ) values (
                p_assessment_id, 'in_review', v_now, p_actor_user_id,
                v_notes, p_actor_user_id, p_actor_user_id
            ) returning * into v_review;
        elsif v_review.review_status in ('pending', 'returned') then
            update public.assessment_reviews ar
               set review_status = 'in_review',
                   review_decision = null,
                   review_started_at = coalesce(ar.review_started_at, v_now),
                   review_completed_at = null,
                   reviewed_by = p_actor_user_id,
                   review_notes = coalesce(v_notes, ar.review_notes),
                   updated_by = p_actor_user_id
             where ar.id = v_review.id
             returning * into v_review;
        else
            raise exception using errcode = 'P1001', message = 'Assessment review transition is not allowed.';
        end if;
    else
        if v_review.id is null then
            raise exception using errcode = 'P1001', message = 'Assessment review has not been started.';
        end if;
        if v_review.review_status <> 'in_review' then
            raise exception using errcode = 'P1001', message = 'Assessment review transition is not allowed.';
        end if;

        if p_command = 'save_notes' then
            update public.assessment_reviews ar
               set review_notes = v_notes,
                   reviewed_by = p_actor_user_id,
                   updated_by = p_actor_user_id
             where ar.id = v_review.id
             returning * into v_review;
        elsif p_command = 'request_information' then
            update public.assessment_reviews ar
               set review_status = 'returned',
                   review_decision = 'needs_information',
                   review_completed_at = v_now,
                   reviewed_by = p_actor_user_id,
                   review_notes = coalesce(v_notes, ar.review_notes),
                   information_request = v_request,
                   updated_by = p_actor_user_id
             where ar.id = v_review.id
             returning * into v_review;
        elsif p_command = 'approve' then
            update public.assessment_reviews ar
               set review_status = 'completed',
                   review_decision = 'approved',
                   review_completed_at = v_now,
                   reviewed_by = p_actor_user_id,
                   review_notes = coalesce(v_notes, ar.review_notes),
                   information_request = null,
                   updated_by = p_actor_user_id
             where ar.id = v_review.id
             returning * into v_review;
        elsif p_command = 'reject' then
            update public.assessment_reviews ar
               set review_status = 'completed',
                   review_decision = 'rejected',
                   review_completed_at = v_now,
                   reviewed_by = p_actor_user_id,
                   review_notes = v_notes,
                   information_request = null,
                   updated_by = p_actor_user_id
             where ar.id = v_review.id
             returning * into v_review;
        end if;
    end if;

    insert into public.assessment_audit_log (
        assessment_id, event_type, event_source, event_description,
        actor_id, actor_type, previous_status, new_status, metadata
    ) values (
        p_assessment_id,
        case p_command
            when 'start_review' then 'assessment_review_started'
            when 'save_notes' then 'assessment_review_notes_saved'
            when 'request_information' then 'assessment_information_requested'
            when 'approve' then 'assessment_review_approved'
            when 'reject' then 'assessment_review_rejected'
        end,
        'reviewer',
        case p_command
            when 'start_review' then 'Assessment human review started.'
            when 'save_notes' then 'Assessment reviewer notes saved.'
            when 'request_information' then 'Additional participant information requested.'
            when 'approve' then 'Assessment human review approved.'
            when 'reject' then 'Assessment human review rejected.'
        end,
        p_actor_user_id,
        'administrator',
        v_previous_status,
        v_review.review_status,
        jsonb_build_object(
            'review_id', v_review.id,
            'command', p_command,
            'review_decision', v_review.review_decision,
            'has_information_request', v_review.information_request is not null
        )
    );

    return query
    select
        v_review.assessment_id,
        v_review.id,
        v_review.review_status,
        v_review.review_decision,
        v_review.review_started_at,
        v_review.review_completed_at,
        v_review.reviewed_by,
        v_reviewer_name,
        v_review.review_notes,
        v_review.information_request,
        v_review.created_at,
        v_review.updated_at;
exception
    when sqlstate 'P1001' then raise;
    when others then
        raise exception using errcode = 'P1002', message = 'Assessment review operation could not be completed.';
end;
$$;

alter function public.list_assessment_reviews(uuid) owner to postgres;
alter function public.get_assessment_review(uuid, uuid) owner to postgres;
alter function public.transition_assessment_review(uuid, uuid, text, text, text) owner to postgres;

revoke all on function public.list_assessment_reviews(uuid) from public, anon, authenticated;
revoke all on function public.get_assessment_review(uuid, uuid) from public, anon, authenticated;
revoke all on function public.transition_assessment_review(uuid, uuid, text, text, text) from public, anon, authenticated;

grant execute on function public.list_assessment_reviews(uuid) to service_role;
grant execute on function public.get_assessment_review(uuid, uuid) to service_role;
grant execute on function public.transition_assessment_review(uuid, uuid, text, text, text) to service_role;

comment on function public.list_assessment_reviews(uuid) is
'Returns a narrow administrator-authorized queue of submitted assessments and active human-review metadata.';
comment on function public.get_assessment_review(uuid, uuid) is
'Returns one administrator-authorized submitted assessment, six-module durable answers, progress, safe document metadata, and active review state.';
comment on function public.transition_assessment_review(uuid, uuid, text, text, text) is
'Atomically governs administrator human-review start, notes, information requests, approval, rejection, attribution, and audit history.';

commit;
