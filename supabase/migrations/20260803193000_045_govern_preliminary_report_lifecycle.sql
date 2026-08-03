begin;

create sequence public.preliminary_report_number_seq
    start with 1
    increment by 1
    minvalue 1
    no maxvalue
    cache 1;

create function public.is_valid_preliminary_report_content(
    p_content jsonb,
    p_require_complete boolean
)
returns boolean
language plpgsql
immutable
set search_path = public, pg_catalog
as $$
declare
    v_text_key text;
    v_array_key text;
begin
    if p_content is null or jsonb_typeof(p_content) <> 'object' then
        return false;
    end if;

    if (select count(*) from jsonb_object_keys(p_content)) <> 14 then
        return false;
    end if;

    if exists (
        select 1
        from jsonb_object_keys(p_content) key
        where key not in (
            'reportTitle', 'reportPurpose', 'participantContext',
            'assessmentContext', 'informationBasis', 'humanReviewSummary',
            'reportedFinancialConditions', 'reportedStrengths',
            'reportedPressures', 'evidenceStatus', 'limitations',
            'preliminaryObservations', 'nextSteps', 'participantNotice'
        )
    ) then
        return false;
    end if;

    if btrim(p_content ->> 'reportTitle') = '' then
        return false;
    end if;

    foreach v_text_key in array array[
        'reportTitle', 'reportPurpose', 'participantContext',
        'assessmentContext', 'informationBasis', 'humanReviewSummary',
        'evidenceStatus', 'limitations', 'preliminaryObservations',
        'participantNotice'
    ] loop
        if jsonb_typeof(p_content -> v_text_key) <> 'string' then
            return false;
        end if;
        if length(p_content ->> v_text_key) > (case when v_text_key = 'reportTitle' then 200 else 5000 end)
           or (p_content ->> v_text_key) ~* '</?[a-z][^>]*>' then
            return false;
        end if;
        if p_require_complete and btrim(p_content ->> v_text_key) = '' then
            return false;
        end if;
    end loop;

    foreach v_array_key in array array[
        'reportedFinancialConditions', 'reportedStrengths',
        'reportedPressures', 'nextSteps'
    ] loop
        if jsonb_typeof(p_content -> v_array_key) <> 'array' then
            return false;
        end if;
        if jsonb_array_length(p_content -> v_array_key) > 50 then
            return false;
        end if;
        if exists (
            select 1
            from jsonb_array_elements(p_content -> v_array_key) item
            where jsonb_typeof(item) <> 'string'
               or length(item #>> '{}') > 1000
               or (item #>> '{}') ~* '</?[a-z][^>]*>'
               or (p_require_complete and btrim(item #>> '{}') = '')
        ) then
            return false;
        end if;
        if p_require_complete and jsonb_array_length(p_content -> v_array_key) = 0 then
            return false;
        end if;
    end loop;

    return true;
end;
$$;

create table public.preliminary_reports (
    id uuid primary key default gen_random_uuid(),
    participant_id uuid not null references public.participants(id) on update cascade on delete restrict,
    assessment_id uuid not null references public.assessments(id) on update cascade on delete restrict,
    assessment_review_id uuid not null references public.assessment_reviews(id) on update cascade on delete restrict,
    report_type text not null default 'preliminary_research_report',
    report_number text not null unique default (
        'WPAG-PRR-' || lpad(nextval('public.preliminary_report_number_seq')::text, 6, '0')
    ),
    status text not null default 'draft',
    current_version integer not null default 1,
    title text not null default 'Preliminary Research Report',
    prepared_by uuid not null,
    prepared_at timestamptz not null default now(),
    submitted_for_review_by uuid,
    submitted_for_review_at timestamptz,
    reviewed_by uuid,
    reviewed_at timestamptz,
    approved_by uuid,
    approved_at timestamptz,
    released_by uuid,
    released_at timestamptz,
    returned_by uuid,
    returned_at timestamptz,
    review_notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz,
    constraint preliminary_reports_type_check check (report_type = 'preliminary_research_report'),
    constraint preliminary_reports_status_check check (
        status in ('draft', 'under_review', 'returned', 'approved', 'released', 'superseded')
    ),
    constraint preliminary_reports_version_check check (current_version > 0),
    constraint preliminary_reports_title_check check (btrim(title) <> ''),
    constraint preliminary_reports_review_notes_check check (
        review_notes is null or btrim(review_notes) <> ''
    ),
    constraint preliminary_reports_submission_metadata_check check (
        status not in ('under_review', 'approved', 'released')
        or (submitted_for_review_by is not null and submitted_for_review_at is not null)
    ),
    constraint preliminary_reports_return_metadata_check check (
        status <> 'returned'
        or (
            returned_by is not null and returned_at is not null
            and reviewed_by is not null and reviewed_at is not null
            and review_notes is not null and btrim(review_notes) <> ''
        )
    ),
    constraint preliminary_reports_approval_metadata_check check (
        status not in ('approved', 'released')
        or (
            reviewed_by is not null and reviewed_at is not null
            and approved_by is not null and approved_at is not null
        )
    ),
    constraint preliminary_reports_release_metadata_check check (
        status <> 'released'
        or (released_by is not null and released_at is not null)
    ),
    constraint preliminary_reports_deleted_at_check check (
        deleted_at is null or deleted_at >= created_at
    )
);

create unique index preliminary_reports_one_active_per_assessment_idx
    on public.preliminary_reports(assessment_id)
    where deleted_at is null and status <> 'superseded';
create index preliminary_reports_participant_idx on public.preliminary_reports(participant_id);
create index preliminary_reports_status_idx on public.preliminary_reports(status) where deleted_at is null;
create index preliminary_reports_review_idx on public.preliminary_reports(assessment_review_id);
create trigger set_preliminary_reports_updated_at
before update on public.preliminary_reports
for each row execute function public.set_updated_at();
alter table public.preliminary_reports enable row level security;

create table public.preliminary_report_versions (
    id uuid primary key default gen_random_uuid(),
    report_id uuid not null references public.preliminary_reports(id) on update cascade on delete restrict,
    version_number integer not null,
    content jsonb not null,
    change_summary text,
    content_hash text not null,
    created_by uuid not null,
    created_at timestamptz not null default now(),
    constraint preliminary_report_versions_number_check check (version_number > 0),
    constraint preliminary_report_versions_report_version_unique unique(report_id, version_number),
    constraint preliminary_report_versions_content_check check (
        public.is_valid_preliminary_report_content(content, false)
    ),
    constraint preliminary_report_versions_change_summary_check check (
        (version_number = 1 and (change_summary is null or btrim(change_summary) <> ''))
        or (version_number > 1 and change_summary is not null and btrim(change_summary) <> '')
    ),
    constraint preliminary_report_versions_hash_check check (
        content_hash ~ '^[0-9a-f]{64}$'
    )
);

create index preliminary_report_versions_report_idx
    on public.preliminary_report_versions(report_id, version_number desc);
create index preliminary_report_versions_created_at_idx
    on public.preliminary_report_versions(created_at desc);
alter table public.preliminary_report_versions enable row level security;

create function public.prevent_preliminary_report_version_mutation()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
    raise exception using errcode = 'P1001', message = 'Preliminary report versions are immutable.';
end;
$$;

create trigger preliminary_report_versions_immutable
before update or delete on public.preliminary_report_versions
for each row execute function public.prevent_preliminary_report_version_mutation();

create function public.prevent_released_preliminary_report_mutation()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
    if old.status = 'released' and new is distinct from old then
        raise exception using errcode = 'P1001', message = 'Released preliminary reports are immutable.';
    end if;
    return new;
end;
$$;

create trigger preliminary_reports_released_immutable
before update on public.preliminary_reports
for each row execute function public.prevent_released_preliminary_report_mutation();

create function public.list_preliminary_reports(p_actor_user_id uuid)
returns table (
    participant_id uuid,
    participant_code text,
    participant_name text,
    participant_email text,
    lifecycle_status text,
    assessment_id uuid,
    assessment_number integer,
    assessment_type text,
    assessment_submitted_at timestamptz,
    assessment_review_id uuid,
    assessment_review_decision text,
    assessment_review_completed_at timestamptz,
    report_id uuid,
    report_number text,
    report_title text,
    report_status text,
    current_version integer,
    prepared_by uuid,
    prepared_at timestamptz,
    reviewed_by uuid,
    reviewed_at timestamptz,
    approved_by uuid,
    approved_at timestamptz,
    released_by uuid,
    released_at timestamptz,
    updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
begin
    if p_actor_user_id is null or not exists (
        select 1
        from public.staff_members sm
        join public.staff_member_roles smr on smr.staff_member_id = sm.id
        join public.staff_roles sr on sr.id = smr.staff_role_id
        where sm.auth_user_id = p_actor_user_id
          and sm.status = 'active' and sm.deleted_at is null
          and sr.role_code = 'administrator' and sr.is_active
          and smr.is_active and (smr.expires_at is null or smr.expires_at > now())
    ) then
        raise exception using errcode = 'P1001', message = 'Actor is not authorized to manage preliminary reports.';
    end if;

    return query
    select
        p.id, p.participant_code,
        coalesce(nullif(btrim(concat_ws(' ', pp.first_name, pp.middle_name, pp.last_name)), ''), app.full_name, p.participant_code),
        coalesce(pp.email::text, app.email::text), p.lifecycle_status,
        a.id, s.assessment_number, s.assessment_type, s.submitted_at,
        ar.id, ar.review_decision, ar.review_completed_at,
        pr.id, pr.report_number, pr.title, pr.status, pr.current_version,
        pr.prepared_by, pr.prepared_at, pr.reviewed_by, pr.reviewed_at,
        pr.approved_by, pr.approved_at, pr.released_by, pr.released_at, pr.updated_at
    from public.assessment_reviews ar
    join public.assessments a on a.id = ar.assessment_id and a.deleted_at is null
    join public.assessment_sessions s
      on s.id = a.assessment_session_id and s.participant_id = a.participant_id
     and s.status = 'submitted' and s.submitted_at is not null and s.deleted_at is null
    join public.participants p on p.id = a.participant_id and p.deleted_at is null
    left join public.participant_profiles pp on pp.participant_id = p.id and pp.deleted_at is null
    left join public.applications app on app.id = p.application_id and app.deleted_at is null
    left join public.preliminary_reports pr
      on pr.assessment_id = a.id and pr.deleted_at is null and pr.status <> 'superseded'
    where ar.deleted_at is null
      and ar.review_status = 'completed'
      and ar.review_decision = 'approved'
    order by coalesce(pr.updated_at, ar.review_completed_at) desc, a.id;
end;
$$;

create function public.get_preliminary_report(
    p_report_id uuid,
    p_actor_user_id uuid
)
returns table (
    participant_id uuid,
    participant_code text,
    participant_name text,
    participant_email text,
    lifecycle_status text,
    assessment_id uuid,
    assessment_number integer,
    assessment_type text,
    assessment_version text,
    hfos_version text,
    assessment_submitted_at timestamptz,
    assessment_review_id uuid,
    assessment_review_decision text,
    assessment_review_completed_at timestamptz,
    assessment_reviewer_name text,
    report_id uuid,
    report_number text,
    report_type text,
    report_title text,
    report_status text,
    current_version integer,
    current_content jsonb,
    current_content_hash text,
    version_history jsonb,
    documents jsonb,
    audit_history jsonb,
    prepared_by uuid,
    preparer_name text,
    prepared_at timestamptz,
    submitted_for_review_by uuid,
    submitted_for_review_at timestamptz,
    reviewed_by uuid,
    reviewer_name text,
    reviewed_at timestamptz,
    approved_by uuid,
    approver_name text,
    approved_at timestamptz,
    released_by uuid,
    releaser_name text,
    released_at timestamptz,
    returned_by uuid,
    returned_at timestamptz,
    review_notes text,
    report_created_at timestamptz,
    report_updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
begin
    if p_report_id is null then
        raise exception using errcode = 'P1001', message = 'Preliminary report ID is required.';
    end if;
    if p_actor_user_id is null or not exists (
        select 1
        from public.staff_members sm
        join public.staff_member_roles smr on smr.staff_member_id = sm.id
        join public.staff_roles sr on sr.id = smr.staff_role_id
        where sm.auth_user_id = p_actor_user_id
          and sm.status = 'active' and sm.deleted_at is null
          and sr.role_code = 'administrator' and sr.is_active
          and smr.is_active and (smr.expires_at is null or smr.expires_at > now())
    ) then
        raise exception using errcode = 'P1001', message = 'Actor is not authorized to manage preliminary reports.';
    end if;

    if not exists (
        select 1
        from public.preliminary_reports candidate
        join public.participants p on p.id = candidate.participant_id and p.deleted_at is null
        join public.assessments a on a.id = candidate.assessment_id and a.deleted_at is null
        where candidate.id = p_report_id and candidate.deleted_at is null
    ) then
        raise exception using errcode = 'P1001', message = 'Preliminary report was not found.';
    end if;

    return query
    select
        p.id, p.participant_code,
        coalesce(nullif(btrim(concat_ws(' ', pp.first_name, pp.middle_name, pp.last_name)), ''), app.full_name, p.participant_code),
        coalesce(pp.email::text, app.email::text), p.lifecycle_status,
        a.id, s.assessment_number, s.assessment_type, a.assessment_version, a.hfos_version, s.submitted_at,
        ar.id, ar.review_decision, ar.review_completed_at, assessment_reviewer.full_name,
        pr.id, pr.report_number, pr.report_type, pr.title, pr.status, pr.current_version,
        current_version.content, current_version.content_hash,
        coalesce(versions.value, '[]'::jsonb),
        coalesce(document_data.value, '[]'::jsonb),
        coalesce(audit_data.value, '[]'::jsonb),
        pr.prepared_by, preparer.full_name, pr.prepared_at,
        pr.submitted_for_review_by, pr.submitted_for_review_at,
        pr.reviewed_by, reviewer.full_name, pr.reviewed_at,
        pr.approved_by, approver.full_name, pr.approved_at,
        pr.released_by, releaser.full_name, pr.released_at,
        pr.returned_by, pr.returned_at, pr.review_notes,
        pr.created_at, pr.updated_at
    from public.preliminary_reports pr
    join public.participants p on p.id = pr.participant_id and p.deleted_at is null
    join public.assessments a on a.id = pr.assessment_id and a.deleted_at is null
    join public.assessment_sessions s on s.id = a.assessment_session_id and s.deleted_at is null
    join public.assessment_reviews ar on ar.id = pr.assessment_review_id and ar.deleted_at is null
    join public.preliminary_report_versions current_version
      on current_version.report_id = pr.id and current_version.version_number = pr.current_version
    left join public.participant_profiles pp on pp.participant_id = p.id and pp.deleted_at is null
    left join public.applications app on app.id = p.application_id and app.deleted_at is null
    left join public.staff_members assessment_reviewer on assessment_reviewer.auth_user_id = ar.reviewed_by and assessment_reviewer.deleted_at is null
    left join public.staff_members preparer on preparer.auth_user_id = pr.prepared_by and preparer.deleted_at is null
    left join public.staff_members reviewer on reviewer.auth_user_id = pr.reviewed_by and reviewer.deleted_at is null
    left join public.staff_members approver on approver.auth_user_id = pr.approved_by and approver.deleted_at is null
    left join public.staff_members releaser on releaser.auth_user_id = pr.released_by and releaser.deleted_at is null
    left join lateral (
        select jsonb_agg(jsonb_build_object(
            'version_number', v.version_number,
            'change_summary', v.change_summary,
            'content_hash', v.content_hash,
            'created_by', v.created_by,
            'creator_name', creator.full_name,
            'created_at', v.created_at
        ) order by v.version_number desc) value
        from public.preliminary_report_versions v
        left join public.staff_members creator on creator.auth_user_id = v.created_by and creator.deleted_at is null
        where v.report_id = pr.id
    ) versions on true
    left join lateral (
        select jsonb_agg(jsonb_build_object(
            'id', d.id, 'document_category', d.document_category,
            'document_type', d.document_type, 'document_name', d.document_name,
            'description', d.description, 'original_filename', d.original_filename,
            'mime_type', d.mime_type, 'file_size_bytes', d.file_size_bytes,
            'verification_status', d.verification_status,
            'verified_at', d.verified_at, 'verification_notes', d.verification_notes,
            'created_at', d.created_at
        ) order by d.created_at, d.id) value
        from public.assessment_documents d
        where d.assessment_id = a.id and d.deleted_at is null
    ) document_data on true
    left join lateral (
        select jsonb_agg(jsonb_build_object(
            'event_type', event.event_type,
            'event_title', event.event_title,
            'event_description', event.event_description,
            'actor_name', actor.full_name,
            'event_timestamp', event.event_timestamp,
            'metadata', event.metadata
        ) order by event.event_timestamp, event.id) value
        from public.activity_timeline event
        left join public.staff_members actor on actor.auth_user_id = event.actor_id and actor.deleted_at is null
        where event.entity_type = 'preliminary_report' and event.entity_id = pr.id
    ) audit_data on true
    where pr.id = p_report_id and pr.deleted_at is null;
end;
$$;

create function public.transition_preliminary_report(
    p_report_id uuid,
    p_assessment_id uuid,
    p_actor_user_id uuid,
    p_command text,
    p_content jsonb,
    p_change_summary text,
    p_review_notes text
)
returns table (
    report_id uuid,
    assessment_id uuid,
    report_number text,
    report_status text,
    current_version integer,
    report_title text,
    current_content jsonb,
    prepared_at timestamptz,
    submitted_for_review_at timestamptz,
    reviewed_at timestamptz,
    approved_at timestamptz,
    released_at timestamptz,
    returned_at timestamptz,
    updated_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = public, pg_catalog
as $$
declare
    v_report public.preliminary_reports%rowtype;
    v_assessment public.assessments%rowtype;
    v_review public.assessment_reviews%rowtype;
    v_participant public.participants%rowtype;
    v_content jsonb;
    v_change_summary text := nullif(regexp_replace(btrim(p_change_summary), '[[:space:]]+', ' ', 'g'), '');
    v_review_notes text := nullif(regexp_replace(btrim(p_review_notes), '[[:space:]]+', ' ', 'g'), '');
    v_previous_status text;
    v_event_type text;
    v_event_title text;
    v_now timestamptz := transaction_timestamp();
begin
    if p_actor_user_id is null or not exists (
        select 1
        from public.staff_members sm
        join public.staff_member_roles smr on smr.staff_member_id = sm.id
        join public.staff_roles sr on sr.id = smr.staff_role_id
        where sm.auth_user_id = p_actor_user_id
          and sm.status = 'active' and sm.deleted_at is null
          and sr.role_code = 'administrator' and sr.is_active
          and smr.is_active and (smr.expires_at is null or smr.expires_at > now())
    ) then
        raise exception using errcode = 'P1001', message = 'Actor is not authorized to manage preliminary reports.';
    end if;

    if p_command is null or p_command not in (
        'create_draft', 'save_draft', 'submit_for_review',
        'return_to_draft', 'approve', 'release'
    ) then
        raise exception using errcode = 'P1001', message = 'Preliminary report command is invalid.';
    end if;

    if p_command = 'create_draft' then
        if p_assessment_id is null then
            raise exception using errcode = 'P1001', message = 'Assessment ID is required.';
        end if;
        if not public.is_valid_preliminary_report_content(p_content, false) then
            raise exception using errcode = 'P1001', message = 'Preliminary report content is invalid.';
        end if;

        select a.* into v_assessment
        from public.assessments a
        join public.assessment_sessions s
          on s.id = a.assessment_session_id and s.participant_id = a.participant_id
         and s.status = 'submitted' and s.submitted_at is not null and s.deleted_at is null
        join public.participants p on p.id = a.participant_id and p.deleted_at is null
        where a.id = p_assessment_id and a.deleted_at is null
        for update of a;
        if not found then
            raise exception using errcode = 'P1001', message = 'Eligible assessment was not found.';
        end if;

        select ar.* into v_review
        from public.assessment_reviews ar
        where ar.assessment_id = v_assessment.id and ar.deleted_at is null
        order by ar.created_at desc, ar.id desc
        limit 1
        for update;
        if not found or v_review.review_status <> 'completed' or v_review.review_decision <> 'approved' then
            raise exception using errcode = 'P1001', message = 'Assessment review is not eligible for a preliminary report.';
        end if;

        if exists (
            select 1 from public.preliminary_reports existing
            where existing.assessment_id = v_assessment.id
              and existing.deleted_at is null and existing.status <> 'superseded'
        ) then
            raise exception using errcode = 'P1001', message = 'An active preliminary report already exists for this assessment.';
        end if;

        insert into public.preliminary_reports(
            participant_id, assessment_id, assessment_review_id,
            status, current_version, title, prepared_by, prepared_at
        ) values (
            v_assessment.participant_id, v_assessment.id, v_review.id,
            'draft', 1, btrim(p_content ->> 'reportTitle'), p_actor_user_id, v_now
        ) returning * into v_report;

        insert into public.preliminary_report_versions(
            report_id, version_number, content, change_summary,
            content_hash, created_by, created_at
        ) values (
            v_report.id, 1, p_content, 'Initial preliminary report draft.',
            encode(extensions.digest(p_content::text, 'sha256'), 'hex'),
            p_actor_user_id, v_now
        );

        insert into public.activity_timeline(
            entity_type, entity_id, actor_type, actor_id, event_type,
            event_title, event_description, event_timestamp, metadata
        ) values
        ('preliminary_report', v_report.id, 'admin', p_actor_user_id,
         'report_created', 'Preliminary report created',
         'A governed preliminary research report draft was created.', v_now,
         jsonb_build_object('assessment_id', v_assessment.id, 'version_number', 1)),
        ('preliminary_report', v_report.id, 'admin', p_actor_user_id,
         'report_version_saved', 'Preliminary report version saved',
         'Version 1 of the preliminary report was preserved.', v_now,
         jsonb_build_object('version_number', 1));
    else
        if p_report_id is null then
            raise exception using errcode = 'P1001', message = 'Preliminary report ID is required.';
        end if;

        select pr.* into v_report
        from public.preliminary_reports pr
        join public.participants p on p.id = pr.participant_id and p.deleted_at is null
        join public.assessments a on a.id = pr.assessment_id and a.deleted_at is null
        where pr.id = p_report_id and pr.deleted_at is null
        for update of pr;
        if not found then
            raise exception using errcode = 'P1001', message = 'Preliminary report was not found.';
        end if;
        v_previous_status := v_report.status;

        if p_command = 'save_draft' then
            if v_report.status not in ('draft', 'returned') then
                raise exception using errcode = 'P1001', message = 'Preliminary report transition is not allowed.';
            end if;
            if not public.is_valid_preliminary_report_content(p_content, false) then
                raise exception using errcode = 'P1001', message = 'Preliminary report content is invalid.';
            end if;
            if v_change_summary is null then
                raise exception using errcode = 'P1001', message = 'Change summary is required.';
            end if;

            insert into public.preliminary_report_versions(
                report_id, version_number, content, change_summary,
                content_hash, created_by, created_at
            ) values (
                v_report.id, v_report.current_version + 1, p_content,
                v_change_summary, encode(extensions.digest(p_content::text, 'sha256'), 'hex'),
                p_actor_user_id, v_now
            );
            update public.preliminary_reports pr
               set status = 'draft', current_version = pr.current_version + 1,
                   title = btrim(p_content ->> 'reportTitle')
             where pr.id = v_report.id
             returning * into v_report;
            v_event_type := 'report_version_saved';
            v_event_title := 'Preliminary report version saved';
        elsif p_command = 'submit_for_review' then
            if v_report.status <> 'draft' then
                raise exception using errcode = 'P1001', message = 'Preliminary report transition is not allowed.';
            end if;
            select version.content into v_content
            from public.preliminary_report_versions version
            where version.report_id = v_report.id and version.version_number = v_report.current_version;
            if not public.is_valid_preliminary_report_content(v_content, true) then
                raise exception using errcode = 'P1001', message = 'Mandatory preliminary report sections are incomplete.';
            end if;
            update public.preliminary_reports pr
               set status = 'under_review', submitted_for_review_by = p_actor_user_id,
                   submitted_for_review_at = v_now, reviewed_by = null,
                   reviewed_at = null, approved_by = null, approved_at = null
             where pr.id = v_report.id
             returning * into v_report;
            v_event_type := 'report_submitted_for_review';
            v_event_title := 'Preliminary report submitted for review';
        elsif p_command = 'return_to_draft' then
            if v_report.status <> 'under_review' then
                raise exception using errcode = 'P1001', message = 'Preliminary report transition is not allowed.';
            end if;
            if v_review_notes is null then
                raise exception using errcode = 'P1001', message = 'Report review notes are required.';
            end if;
            update public.preliminary_reports pr
               set status = 'returned', reviewed_by = p_actor_user_id,
                   reviewed_at = v_now, returned_by = p_actor_user_id,
                   returned_at = v_now, review_notes = v_review_notes
             where pr.id = v_report.id
             returning * into v_report;
            v_event_type := 'report_returned';
            v_event_title := 'Preliminary report returned to draft';
        elsif p_command = 'approve' then
            if v_report.status <> 'under_review' then
                raise exception using errcode = 'P1001', message = 'Preliminary report transition is not allowed.';
            end if;
            select version.content into v_content
            from public.preliminary_report_versions version
            where version.report_id = v_report.id and version.version_number = v_report.current_version;
            if not public.is_valid_preliminary_report_content(v_content, true) then
                raise exception using errcode = 'P1001', message = 'Mandatory preliminary report sections are incomplete.';
            end if;
            update public.preliminary_reports pr
               set status = 'approved', reviewed_by = p_actor_user_id,
                   reviewed_at = v_now, approved_by = p_actor_user_id,
                   approved_at = v_now
             where pr.id = v_report.id
             returning * into v_report;
            v_event_type := 'report_approved';
            v_event_title := 'Preliminary report approved';
        elsif p_command = 'release' then
            if v_report.status <> 'approved' then
                raise exception using errcode = 'P1001', message = 'Preliminary report transition is not allowed.';
            end if;
            if v_report.approved_by is null or v_report.approved_at is null then
                raise exception using errcode = 'P1001', message = 'Preliminary report approval metadata is incomplete.';
            end if;
            select version.content into v_content
            from public.preliminary_report_versions version
            where version.report_id = v_report.id and version.version_number = v_report.current_version;
            if v_content is null or not public.is_valid_preliminary_report_content(v_content, true) then
                raise exception using errcode = 'P1001', message = 'Mandatory preliminary report sections are incomplete.';
            end if;
            select p.* into v_participant
            from public.participants p
            where p.id = v_report.participant_id and p.deleted_at is null
            for update;
            if not found or v_participant.lifecycle_status not in ('active', 'paused', 'completed') then
                raise exception using errcode = 'P1001', message = 'Participant is not eligible to receive the preliminary report.';
            end if;
            update public.preliminary_reports pr
               set status = 'released', released_by = p_actor_user_id, released_at = v_now
             where pr.id = v_report.id
             returning * into v_report;
            v_event_type := 'report_released';
            v_event_title := 'Preliminary report released';
        end if;

        insert into public.activity_timeline(
            entity_type, entity_id, actor_type, actor_id, event_type,
            event_title, event_description, event_timestamp, metadata
        ) values (
            'preliminary_report', v_report.id, 'admin', p_actor_user_id,
            v_event_type, v_event_title,
            case p_command
                when 'save_draft' then 'A new immutable preliminary report version was saved.'
                when 'submit_for_review' then 'The preliminary report was submitted for internal review.'
                when 'return_to_draft' then 'The preliminary report was returned with documented review notes.'
                when 'approve' then 'The preliminary report was approved without changing report content.'
                when 'release' then 'The approved preliminary report was released to the participant.'
            end,
            v_now,
            jsonb_strip_nulls(jsonb_build_object(
                'previous_status', v_previous_status,
                'current_status', v_report.status,
                'version_number', v_report.current_version,
                'has_review_notes', v_review_notes is not null,
                'change_summary', v_change_summary
            ))
        );
    end if;

    select version.content into v_content
    from public.preliminary_report_versions version
    where version.report_id = v_report.id and version.version_number = v_report.current_version;

    return query select
        v_report.id, v_report.assessment_id, v_report.report_number,
        v_report.status, v_report.current_version, v_report.title,
        v_content, v_report.prepared_at, v_report.submitted_for_review_at,
        v_report.reviewed_at, v_report.approved_at, v_report.released_at,
        v_report.returned_at, v_report.updated_at;
exception
    when sqlstate 'P1001' then raise;
    when unique_violation then
        raise exception using errcode = 'P1001', message = 'An active preliminary report already exists for this assessment.';
    when others then
        raise exception using errcode = 'P1002', message = 'Preliminary report operation could not be completed.';
end;
$$;

create function public.list_current_participant_preliminary_reports()
returns table (
    report_id uuid,
    report_number text,
    report_title text,
    report_type text,
    report_status text,
    current_version integer,
    assessment_id uuid,
    assessment_number integer,
    assessment_type text,
    assessment_submitted_at timestamptz,
    released_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
    v_auth_user_id uuid := auth.uid();
    v_participant_id uuid;
begin
    if v_auth_user_id is null then
        raise exception using errcode = 'P1001', message = 'Participant authentication is required.';
    end if;
    select p.id into v_participant_id
    from public.participants p
    where p.auth_user_id = v_auth_user_id and p.deleted_at is null;
    if not found then
        raise exception using errcode = 'P1001', message = 'Participant report access is unavailable.';
    end if;

    return query
    select pr.id, pr.report_number, pr.title, pr.report_type, pr.status,
           pr.current_version, a.id, s.assessment_number, s.assessment_type,
           s.submitted_at, pr.released_at
    from public.preliminary_reports pr
    join public.assessments a on a.id = pr.assessment_id and a.deleted_at is null
    join public.assessment_sessions s on s.id = a.assessment_session_id and s.deleted_at is null
    where pr.participant_id = v_participant_id
      and pr.status = 'released' and pr.released_at is not null and pr.deleted_at is null
    order by pr.released_at desc, pr.id;
end;
$$;

create function public.get_current_participant_preliminary_report(p_report_id uuid)
returns table (
    report_id uuid,
    report_number text,
    report_title text,
    report_type text,
    report_status text,
    current_version integer,
    assessment_number integer,
    assessment_type text,
    assessment_submitted_at timestamptz,
    released_at timestamptz,
    content jsonb
)
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
    v_auth_user_id uuid := auth.uid();
    v_participant_id uuid;
begin
    if v_auth_user_id is null then
        raise exception using errcode = 'P1001', message = 'Participant authentication is required.';
    end if;
    if p_report_id is null then
        raise exception using errcode = 'P1001', message = 'Preliminary report ID is required.';
    end if;
    select p.id into v_participant_id
    from public.participants p
    where p.auth_user_id = v_auth_user_id and p.deleted_at is null;
    if not found then
        raise exception using errcode = 'P1001', message = 'Participant report access is unavailable.';
    end if;

    return query
    select pr.id, pr.report_number, pr.title, pr.report_type, pr.status,
           pr.current_version, s.assessment_number, s.assessment_type,
           s.submitted_at, pr.released_at, version.content
    from public.preliminary_reports pr
    join public.assessments a on a.id = pr.assessment_id and a.deleted_at is null
    join public.assessment_sessions s on s.id = a.assessment_session_id and s.deleted_at is null
    join public.preliminary_report_versions version
      on version.report_id = pr.id and version.version_number = pr.current_version
    where pr.id = p_report_id and pr.participant_id = v_participant_id
      and pr.status = 'released' and pr.released_at is not null and pr.deleted_at is null;

    if not found then
        raise exception using errcode = 'P1001', message = 'Released preliminary report was not found.';
    end if;
end;
$$;

alter sequence public.preliminary_report_number_seq owner to postgres;
alter function public.is_valid_preliminary_report_content(jsonb, boolean) owner to postgres;
alter function public.prevent_preliminary_report_version_mutation() owner to postgres;
alter function public.prevent_released_preliminary_report_mutation() owner to postgres;
alter function public.list_preliminary_reports(uuid) owner to postgres;
alter function public.get_preliminary_report(uuid, uuid) owner to postgres;
alter function public.transition_preliminary_report(uuid, uuid, uuid, text, jsonb, text, text) owner to postgres;
alter function public.list_current_participant_preliminary_reports() owner to postgres;
alter function public.get_current_participant_preliminary_report(uuid) owner to postgres;

revoke all on sequence public.preliminary_report_number_seq from public, anon, authenticated, service_role;
revoke all on table public.preliminary_reports from public, anon, authenticated, service_role;
revoke all on table public.preliminary_report_versions from public, anon, authenticated, service_role;
revoke all on function public.is_valid_preliminary_report_content(jsonb, boolean) from public, anon, authenticated, service_role;
revoke all on function public.prevent_preliminary_report_version_mutation() from public, anon, authenticated, service_role;
revoke all on function public.prevent_released_preliminary_report_mutation() from public, anon, authenticated, service_role;
revoke all on function public.list_preliminary_reports(uuid) from public, anon, authenticated, service_role;
revoke all on function public.get_preliminary_report(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.transition_preliminary_report(uuid, uuid, uuid, text, jsonb, text, text) from public, anon, authenticated, service_role;
revoke all on function public.list_current_participant_preliminary_reports() from public, anon, authenticated, service_role;
revoke all on function public.get_current_participant_preliminary_report(uuid) from public, anon, authenticated, service_role;

grant execute on function public.list_preliminary_reports(uuid) to service_role;
grant execute on function public.get_preliminary_report(uuid, uuid) to service_role;
grant execute on function public.transition_preliminary_report(uuid, uuid, uuid, text, jsonb, text, text) to service_role;
grant execute on function public.list_current_participant_preliminary_reports() to authenticated;
grant execute on function public.get_current_participant_preliminary_report(uuid) to authenticated;

comment on table public.preliminary_reports is
'Governed lifecycle record for manually authored preliminary research reports. It stores no formula, score, diagnosis, treatment, recommendation, Pilot, or Production authority.';
comment on table public.preliminary_report_versions is
'Immutable structured content versions for governed preliminary research reports.';
comment on function public.transition_preliminary_report(uuid, uuid, uuid, text, jsonb, text, text) is
'Atomically governs preliminary report creation, immutable draft versions, internal review, approval, and participant release.';

commit;
