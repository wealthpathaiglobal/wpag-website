begin;

-- Sprint 11B extends the governed evidence foundation with participant-safe
-- reads, immutable resubmission versions, and ownership-scoped download lookup.

alter table public.evidence_upload_reservations
    drop constraint evidence_upload_reservations_version_number_check,
    drop constraint evidence_upload_reservations_document_id_version_number_key,
    add constraint evidence_upload_reservations_version_number_check
        check (version_number > 0);

create unique index evidence_upload_reservations_active_document_version_unique
    on public.evidence_upload_reservations(document_id, version_number)
    where consumed_at is null and cancelled_at is null and deleted_at is null;

drop function public.list_participant_evidence(uuid);

create function public.get_participant_evidence_context(p_actor_user_id uuid)
returns table (
    assessment_id uuid,
    assessment_number integer,
    assessment_session_id uuid,
    session_status text
)
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
begin
    return query
    select a.id, a.assessment_number, s.id, s.status
    from public.participants p
    join public.assessments a on a.participant_id = p.id and a.deleted_at is null
    join public.assessment_sessions s
      on s.id = a.assessment_session_id
     and s.participant_id = p.id
     and s.deleted_at is null
     and s.status in ('draft', 'in_progress', 'submitted')
    where p.auth_user_id = p_actor_user_id
      and p.lifecycle_status = 'active'
      and p.deleted_at is null
    order by a.assessment_number desc, a.created_at desc, a.id desc
    limit 1;
end;
$$;

create function public.list_participant_evidence(p_actor_user_id uuid)
returns table (
    document_id uuid,
    assessment_id uuid,
    assessment_number integer,
    document_category text,
    document_type text,
    document_name text,
    description text,
    original_filename text,
    mime_type text,
    file_size_bytes bigint,
    verification_status text,
    verification_notes text,
    current_version integer,
    submitted_at timestamptz,
    updated_at timestamptz,
    can_resubmit boolean
)
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare v_participant_id uuid;
begin
    select p.id into v_participant_id
    from public.participants p
    where p.auth_user_id = p_actor_user_id
      and p.deleted_at is null;
    if not found then
        raise exception using errcode = 'P1001', message = 'Participant evidence access is unavailable.';
    end if;

    return query
    select d.id, d.assessment_id, a.assessment_number,
        d.document_category, d.document_type, d.document_name, d.description,
        v.file_name, v.mime_type, v.file_size_bytes, d.verification_status,
        d.verification_notes, v.version_number, v.created_at, d.updated_at,
        (
            d.verification_status = 'rejected'
            or coalesce(h.verification_event = 'information_requested', false)
        )
    from public.assessment_documents d
    join public.assessments a
      on a.id = d.assessment_id
     and a.participant_id = v_participant_id
     and a.deleted_at is null
    join lateral (
        select fv.file_name, fv.mime_type, fv.file_size_bytes,
            fv.version_number, fv.created_at
        from public.file_version_history fv
        where fv.evidence_document_id = d.id
        order by fv.version_number desc
        limit 1
    ) v on true
    left join lateral (
        select eh.verification_event
        from public.evidence_verification_history eh
        where eh.assessment_document_id = d.id
        order by eh.created_at desc, eh.id desc
        limit 1
    ) h on true
    where d.deleted_at is null
      and d.evidence_governance_version = 'evidence-v1'
    order by v.created_at desc, d.id;
end;
$$;

create function public.get_participant_evidence(
    p_document_id uuid,
    p_actor_user_id uuid
)
returns table (
    document_id uuid,
    assessment_id uuid,
    assessment_number integer,
    document_category text,
    document_type text,
    document_name text,
    description text,
    original_filename text,
    mime_type text,
    file_size_bytes bigint,
    verification_status text,
    verification_notes text,
    current_version integer,
    submitted_at timestamptz,
    updated_at timestamptz,
    can_download boolean,
    can_resubmit boolean,
    versions jsonb,
    verification_history jsonb
)
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
begin
    return query
    select d.id, d.assessment_id, a.assessment_number,
        d.document_category, d.document_type, d.document_name, d.description,
        current_version.file_name, current_version.mime_type,
        current_version.file_size_bytes, d.verification_status,
        d.verification_notes, current_version.version_number,
        current_version.created_at, d.updated_at, true,
        (
            d.verification_status = 'rejected'
            or coalesce(latest_event.verification_event = 'information_requested', false)
        ),
        coalesce((
            select jsonb_agg(jsonb_build_object(
                'version_number', fv.version_number,
                'original_filename', fv.file_name,
                'mime_type', fv.mime_type,
                'file_size_bytes', fv.file_size_bytes,
                'submitted_at', fv.created_at
            ) order by fv.version_number desc)
            from public.file_version_history fv
            where fv.evidence_document_id = d.id
        ), '[]'::jsonb),
        coalesce((
            select jsonb_agg(jsonb_build_object(
                'verification_event', eh.verification_event,
                'verification_status', eh.verification_status,
                'participant_notes', eh.comments,
                'event_at', eh.created_at
            ) order by eh.created_at desc, eh.id desc)
            from public.evidence_verification_history eh
            where eh.assessment_document_id = d.id
        ), '[]'::jsonb)
    from public.assessment_documents d
    join public.assessments a on a.id = d.assessment_id and a.deleted_at is null
    join public.participants p
      on p.id = a.participant_id
     and p.auth_user_id = p_actor_user_id
     and p.deleted_at is null
    join lateral (
        select fv.file_name, fv.mime_type, fv.file_size_bytes,
            fv.version_number, fv.created_at
        from public.file_version_history fv
        where fv.evidence_document_id = d.id
        order by fv.version_number desc
        limit 1
    ) current_version on true
    left join lateral (
        select eh.verification_event
        from public.evidence_verification_history eh
        where eh.assessment_document_id = d.id
        order by eh.created_at desc, eh.id desc
        limit 1
    ) latest_event on true
    where d.id = p_document_id
      and d.deleted_at is null
      and d.evidence_governance_version = 'evidence-v1';
end;
$$;

create function public.prepare_evidence_resubmission(
    p_document_id uuid,
    p_actor_user_id uuid,
    p_original_filename text,
    p_mime_type text,
    p_file_size_bytes bigint,
    p_sha256 text
)
returns table (
    reservation_id uuid,
    document_id uuid,
    assessment_id uuid,
    assessment_session_id uuid,
    storage_bucket text,
    storage_path text,
    original_filename text,
    mime_type text,
    file_size_bytes bigint,
    sha256 text,
    version_number integer
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
    v_document public.assessment_documents%rowtype;
    v_participant_id uuid;
    v_session_id uuid;
    v_version integer;
    v_object_id uuid := gen_random_uuid();
    v_extension text;
    v_filename text := btrim(p_original_filename);
    v_latest_event text;
begin
    select d.* into v_document
    from public.assessment_documents d
    join public.assessments a on a.id = d.assessment_id and a.deleted_at is null
    join public.participants p
      on p.id = a.participant_id
     and p.auth_user_id = p_actor_user_id
     and p.lifecycle_status = 'active'
     and p.deleted_at is null
    where d.id = p_document_id
      and d.deleted_at is null
      and d.evidence_governance_version = 'evidence-v1'
    for update of d;
    if not found then
        raise exception using errcode = 'P1001', message = 'Evidence resubmission is unavailable.';
    end if;

    select c.participant_id, c.assessment_session_id
    into v_participant_id, v_session_id
    from public.require_evidence_upload_context(v_document.assessment_id, p_actor_user_id) c;

    select eh.verification_event into v_latest_event
    from public.evidence_verification_history eh
    where eh.assessment_document_id = v_document.id
    order by eh.created_at desc, eh.id desc
    limit 1;
    if v_document.verification_status <> 'rejected'
       and v_latest_event is distinct from 'information_requested' then
        raise exception using errcode = 'P1001', message = 'Evidence is not available for resubmission.';
    end if;

    if v_filename is null or v_filename = '' or length(v_filename) > 255
       or v_filename ~ '[\\/[:cntrl:]]'
       or p_mime_type is null or p_mime_type not in ('application/pdf', 'image/jpeg', 'image/png')
       or p_file_size_bytes is null or p_file_size_bytes not between 1 and 10485760
       or p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$' then
        raise exception using errcode = 'P1001', message = 'Evidence upload metadata is invalid.';
    end if;

    select coalesce(max(fv.version_number), 0) + 1 into v_version
    from public.file_version_history fv
    where fv.evidence_document_id = v_document.id;

    update public.evidence_upload_reservations r
    set cancelled_at = transaction_timestamp()
    where r.document_id = v_document.id
      and r.version_number = v_version
      and r.consumed_at is null
      and r.cancelled_at is null
      and r.deleted_at is null
      and r.expires_at <= transaction_timestamp();
    v_extension := case p_mime_type
        when 'application/pdf' then 'pdf'
        when 'image/jpeg' then 'jpg'
        when 'image/png' then 'png'
    end;

    return query
    with reservation as (
        insert into public.evidence_upload_reservations(
            participant_id, assessment_id, assessment_session_id, document_id,
            version_number, storage_bucket, storage_path, document_category,
            document_type, document_name, description, original_filename,
            declared_mime_type, expected_file_size_bytes, expected_sha256,
            expected_max_size, prepared_by, expires_at
        ) values (
            v_participant_id, v_document.assessment_id, v_session_id, v_document.id,
            v_version, 'assessment-evidence',
            v_participant_id::text || '/' || v_document.assessment_id::text || '/'
                || v_document.id::text || '/v' || v_version::text || '/'
                || v_object_id::text || '.' || v_extension,
            v_document.document_category, v_document.document_type,
            v_document.document_name, v_document.description, v_filename,
            p_mime_type, p_file_size_bytes, p_sha256, 10485760,
            p_actor_user_id, transaction_timestamp() + interval '15 minutes'
        ) returning *
    )
    select r.id, r.document_id, r.assessment_id, r.assessment_session_id,
        r.storage_bucket, r.storage_path, r.original_filename,
        r.declared_mime_type, r.expected_file_size_bytes,
        r.expected_sha256, r.version_number
    from reservation r;
exception
    when unique_violation then
        raise exception using errcode = 'P1001', message = 'Evidence resubmission reservation already exists.';
end;
$$;

create function public.finalize_evidence_resubmission(
    p_reservation_id uuid,
    p_actor_user_id uuid,
    p_file_size_bytes bigint,
    p_sha256 text
)
returns table (
    document_id uuid,
    assessment_id uuid,
    document_category text,
    document_type text,
    document_name text,
    description text,
    original_filename text,
    mime_type text,
    file_size_bytes bigint,
    verification_status text,
    version_number integer,
    created_at timestamptz,
    updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
    v_reservation public.evidence_upload_reservations%rowtype;
    v_document public.assessment_documents%rowtype;
    v_context_participant_id uuid;
    v_context_session_id uuid;
    v_latest_event text;
    v_storage_object storage.objects%rowtype;
    v_storage_size text;
    v_storage_mime text;
    v_version_created_at timestamptz;
begin
    select * into v_reservation
    from public.evidence_upload_reservations r
    where r.id = p_reservation_id
    for update;
    if not found or v_reservation.prepared_by <> p_actor_user_id
       or v_reservation.version_number <= 1
       or v_reservation.consumed_at is not null
       or v_reservation.cancelled_at is not null
       or v_reservation.deleted_at is not null
       or v_reservation.expires_at <= transaction_timestamp() then
        raise exception using errcode = 'P1001', message = 'Evidence upload reservation is unavailable.';
    end if;

    select d.* into v_document
    from public.assessment_documents d
    where d.id = v_reservation.document_id
      and d.assessment_id = v_reservation.assessment_id
      and d.deleted_at is null
      and d.evidence_governance_version = 'evidence-v1'
    for update;
    if not found then
        raise exception using errcode = 'P1001', message = 'Evidence resubmission is unavailable.';
    end if;

    select c.participant_id, c.assessment_session_id
    into v_context_participant_id, v_context_session_id
    from public.require_evidence_upload_context(v_document.assessment_id, p_actor_user_id) c;
    if v_context_participant_id <> v_reservation.participant_id
       or v_context_session_id <> v_reservation.assessment_session_id
       or p_file_size_bytes is distinct from v_reservation.expected_file_size_bytes
       or p_sha256 is distinct from v_reservation.expected_sha256 then
        raise exception using errcode = 'P1001', message = 'Evidence upload reservation does not match.';
    end if;

    select eh.verification_event into v_latest_event
    from public.evidence_verification_history eh
    where eh.assessment_document_id = v_document.id
    order by eh.created_at desc, eh.id desc
    limit 1;
    if v_document.verification_status <> 'rejected'
       and v_latest_event is distinct from 'information_requested' then
        raise exception using errcode = 'P1001', message = 'Evidence is not available for resubmission.';
    end if;

    if v_reservation.version_number <> (
        select coalesce(max(fv.version_number), 0) + 1
        from public.file_version_history fv
        where fv.evidence_document_id = v_document.id
    ) then
        raise exception using errcode = 'P1001', message = 'Evidence upload reservation does not match.';
    end if;

    select o.* into v_storage_object
    from storage.objects o
    where o.bucket_id = v_reservation.storage_bucket
      and o.name = v_reservation.storage_path
    for share;
    if not found then
        raise exception using errcode = 'P1001', message = 'Evidence storage object is unavailable.';
    end if;
    v_storage_size := coalesce(v_storage_object.metadata ->> 'size', v_storage_object.metadata ->> 'contentLength');
    v_storage_mime := lower(coalesce(v_storage_object.metadata ->> 'mimetype', v_storage_object.metadata ->> 'contentType'));
    if v_storage_size is not null
       and (v_storage_size !~ '^[0-9]+$' or v_storage_size::bigint <> v_reservation.expected_file_size_bytes) then
        raise exception using errcode = 'P1001', message = 'Evidence storage object metadata does not match.';
    end if;
    if v_storage_mime is not null and v_storage_mime <> v_reservation.declared_mime_type then
        raise exception using errcode = 'P1001', message = 'Evidence storage object metadata does not match.';
    end if;

    insert into public.file_version_history(
        file_id, evidence_document_id, version_number, storage_path, file_name,
        file_size_bytes, mime_type, checksum, change_summary, created_by, metadata
    ) values (
        v_document.id, v_document.id, v_reservation.version_number,
        v_reservation.storage_path, v_reservation.original_filename,
        v_reservation.expected_file_size_bytes, v_reservation.declared_mime_type,
        v_reservation.expected_sha256, 'Participant evidence resubmission',
        p_actor_user_id,
        jsonb_build_object('assessment_id', v_document.assessment_id, 'storage_bucket', v_reservation.storage_bucket)
    ) returning public.file_version_history.created_at into v_version_created_at;

    insert into public.evidence_verification_history(
        assessment_document_id, verification_event, verification_status,
        comments, supporting_metadata
    ) values (
        v_document.id, 'resubmitted', 'pending', null,
        jsonb_build_object('version_number', v_reservation.version_number)
    );

    update public.assessment_documents
    set verification_status = 'pending', verified_at = null, verified_by = null,
        updated_at = transaction_timestamp(), updated_by = p_actor_user_id
    where id = v_document.id
    returning * into v_document;

    insert into public.activity_timeline(
        entity_type, entity_id, actor_type, actor_id, event_type,
        event_title, event_description, event_timestamp, metadata
    ) values (
        'assessment_document', v_document.id, 'participant', p_actor_user_id,
        'evidence_resubmitted', 'Evidence resubmitted',
        'A participant submitted a new immutable evidence version.',
        transaction_timestamp(),
        jsonb_build_object('assessment_id', v_document.assessment_id, 'version_number', v_reservation.version_number)
    );

    update public.evidence_upload_reservations
    set consumed_at = transaction_timestamp()
    where id = v_reservation.id;

    return query select v_document.id, v_document.assessment_id,
        v_document.document_category, v_document.document_type,
        v_document.document_name, v_document.description,
        v_reservation.original_filename, v_reservation.declared_mime_type,
        v_reservation.expected_file_size_bytes, v_document.verification_status,
        v_reservation.version_number, v_version_created_at, v_document.updated_at;
exception
    when sqlstate 'P1001' then raise;
    when unique_violation then
        raise exception using errcode = 'P1001', message = 'Evidence upload was already finalized.';
    when others then
        raise exception using errcode = 'P1002', message = 'Evidence upload finalization failed.';
end;
$$;

create function public.get_participant_evidence_download(
    p_document_id uuid,
    p_actor_user_id uuid,
    p_version_number integer default null
)
returns table (
    document_id uuid,
    version_number integer,
    storage_bucket text,
    storage_path text,
    original_filename text,
    mime_type text,
    file_size_bytes bigint,
    sha256 text
)
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
begin
    if p_version_number is not null and p_version_number <= 0 then
        raise exception using errcode = 'P1001', message = 'Evidence download is unavailable.';
    end if;
    return query
    select d.id, fv.version_number, d.storage_bucket, fv.storage_path,
        fv.file_name, fv.mime_type, fv.file_size_bytes, fv.checksum
    from public.assessment_documents d
    join public.assessments a on a.id = d.assessment_id and a.deleted_at is null
    join public.participants p
      on p.id = a.participant_id
     and p.auth_user_id = p_actor_user_id
     and p.deleted_at is null
    join public.file_version_history fv on fv.evidence_document_id = d.id
    where d.id = p_document_id
      and d.deleted_at is null
      and d.evidence_governance_version = 'evidence-v1'
      and fv.version_number = coalesce(p_version_number, (
          select max(latest.version_number)
          from public.file_version_history latest
          where latest.evidence_document_id = d.id
      ));
    if not found then
        raise exception using errcode = 'P1001', message = 'Evidence download is unavailable.';
    end if;
end;
$$;

alter function public.get_participant_evidence_context(uuid) owner to postgres;
alter function public.list_participant_evidence(uuid) owner to postgres;
alter function public.get_participant_evidence(uuid,uuid) owner to postgres;
alter function public.prepare_evidence_resubmission(uuid,uuid,text,text,bigint,text) owner to postgres;
alter function public.finalize_evidence_resubmission(uuid,uuid,bigint,text) owner to postgres;
alter function public.get_participant_evidence_download(uuid,uuid,integer) owner to postgres;

revoke all on function public.get_participant_evidence_context(uuid) from public, anon, authenticated, service_role;
revoke all on function public.list_participant_evidence(uuid) from public, anon, authenticated, service_role;
revoke all on function public.get_participant_evidence(uuid,uuid) from public, anon, authenticated, service_role;
revoke all on function public.prepare_evidence_resubmission(uuid,uuid,text,text,bigint,text) from public, anon, authenticated, service_role;
revoke all on function public.finalize_evidence_resubmission(uuid,uuid,bigint,text) from public, anon, authenticated, service_role;
revoke all on function public.get_participant_evidence_download(uuid,uuid,integer) from public, anon, authenticated, service_role;

grant execute on function public.get_participant_evidence_context(uuid) to service_role;
grant execute on function public.list_participant_evidence(uuid) to service_role;
grant execute on function public.get_participant_evidence(uuid,uuid) to service_role;
grant execute on function public.prepare_evidence_resubmission(uuid,uuid,text,text,bigint,text) to service_role;
grant execute on function public.finalize_evidence_resubmission(uuid,uuid,bigint,text) to service_role;
grant execute on function public.get_participant_evidence_download(uuid,uuid,integer) to service_role;

comment on function public.get_participant_evidence(uuid,uuid) is
    'Returns participant-owned evidence detail with safe version and participant-visible verification history only.';
comment on function public.get_participant_evidence_download(uuid,uuid,integer) is
    'Resolves one participant-owned immutable evidence object for trusted server download and integrity verification.';

commit;
