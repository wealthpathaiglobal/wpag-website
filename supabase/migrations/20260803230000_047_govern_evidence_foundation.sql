begin;

-- Sprint 11A governs the existing evidence tables. It does not create a
-- parallel evidence model or grant browser access to storage objects.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'assessment-evidence',
    'assessment-evidence',
    false,
    10485760,
    array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png'];

-- Use verified as the canonical successful verification state.
update public.evidence_verification_history
set verification_status = 'verified'
where verification_status = 'approved';

alter table public.assessment_documents
    drop constraint assessment_documents_mime_type_check,
    drop constraint assessment_documents_file_size_check,
    drop constraint assessment_documents_checksum_check,
    drop constraint assessment_documents_verification_status_check;

alter table public.assessment_documents
    alter column mime_type set not null,
    alter column file_size_bytes set not null,
    alter column checksum set not null,
    add constraint assessment_documents_mime_type_check
        check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
    add constraint assessment_documents_file_size_check
        check (file_size_bytes between 1 and 10485760),
    add constraint assessment_documents_checksum_check
        check (checksum ~ '^[0-9a-f]{64}$'),
    add constraint assessment_documents_verification_status_check
        check (verification_status in ('pending', 'in_progress', 'verified', 'rejected', 'expired'));

alter table public.evidence_verification_history
    drop constraint evidence_verification_history_verification_status_check,
    add constraint evidence_verification_history_verification_status_check
        check (verification_status in ('pending', 'in_progress', 'verified', 'rejected', 'expired'));

alter table public.file_version_history
    alter column checksum set not null,
    add constraint file_version_history_document_fk
        foreign key (file_id) references public.assessment_documents(id)
        on update restrict on delete restrict,
    add constraint file_version_history_storage_path_unique unique (storage_path),
    add constraint file_version_history_mime_type_check
        check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
    add constraint file_version_history_size_limit_check
        check (file_size_bytes between 1 and 10485760),
    add constraint file_version_history_checksum_sha256_check
        check (checksum ~ '^[0-9a-f]{64}$');

alter table public.assessment_documents enable row level security;
alter table public.evidence_verification_history enable row level security;
alter table public.file_version_history enable row level security;

create function public.prevent_evidence_history_mutation()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
    raise exception using errcode = 'P1001', message = 'Evidence verification history is append-only.';
end;
$$;

create trigger evidence_verification_history_append_only
before update or delete on public.evidence_verification_history
for each row execute function public.prevent_evidence_history_mutation();

create function public.prevent_file_version_history_mutation()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
    raise exception using errcode = 'P1001', message = 'Evidence file version history is append-only.';
end;
$$;

create trigger file_version_history_append_only
before update or delete on public.file_version_history
for each row execute function public.prevent_file_version_history_mutation();

create function public.protect_assessment_document_file_identity()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
    if old.assessment_id <> new.assessment_id
       or old.original_filename <> new.original_filename
       or old.storage_bucket <> new.storage_bucket
       or old.storage_path <> new.storage_path
       or old.mime_type <> new.mime_type
       or old.file_size_bytes <> new.file_size_bytes
       or old.checksum <> new.checksum
       or old.created_at <> new.created_at
       or old.created_by is distinct from new.created_by then
        raise exception using errcode = 'P1001', message = 'Evidence file identity is immutable.';
    end if;
    return new;
end;
$$;

create trigger assessment_document_file_identity_immutable
before update on public.assessment_documents
for each row execute function public.protect_assessment_document_file_identity();

create function public.is_active_evidence_administrator(p_actor_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
    select p_actor_user_id is not null and exists (
        select 1
        from public.staff_members sm
        join public.staff_member_roles smr on smr.staff_member_id = sm.id
        join public.staff_roles sr on sr.id = smr.staff_role_id
        where sm.auth_user_id = p_actor_user_id
          and sm.status = 'active'
          and sm.deleted_at is null
          and sr.role_code = 'administrator'
          and sr.is_active
          and smr.is_active
          and (smr.expires_at is null or smr.expires_at > now())
    );
$$;

create function public.prepare_evidence_upload(
    p_assessment_id uuid,
    p_actor_user_id uuid,
    p_document_category text,
    p_document_type text,
    p_document_name text,
    p_description text,
    p_original_filename text,
    p_mime_type text,
    p_file_size_bytes bigint,
    p_sha256 text
)
returns table (
    document_id uuid,
    assessment_id uuid,
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
    v_participant_id uuid;
    v_document_id uuid := gen_random_uuid();
    v_object_id uuid := gen_random_uuid();
    v_extension text;
    v_filename text := btrim(p_original_filename);
begin
    select p.id into v_participant_id
    from public.participants p
    join public.assessments a on a.participant_id = p.id
    where a.id = p_assessment_id
      and a.deleted_at is null
      and p.auth_user_id = p_actor_user_id
      and p.deleted_at is null;

    if not found then
        raise exception using errcode = 'P1001', message = 'Evidence upload is unavailable.';
    end if;
    if p_document_category is null or btrim(p_document_category) = '' or length(btrim(p_document_category)) > 100
       or p_document_type is null or btrim(p_document_type) = '' or length(btrim(p_document_type)) > 100
       or p_document_name is null or btrim(p_document_name) = '' or length(btrim(p_document_name)) > 200
       or (p_description is not null and length(btrim(p_description)) > 2000)
       or v_filename = '' or length(v_filename) > 255
       or v_filename ~ '[\\/[:cntrl:]]'
       or p_mime_type not in ('application/pdf', 'image/jpeg', 'image/png')
       or p_file_size_bytes not between 1 and 10485760
       or p_sha256 !~ '^[0-9a-f]{64}$' then
        raise exception using errcode = 'P1001', message = 'Evidence upload metadata is invalid.';
    end if;

    v_extension := case p_mime_type
        when 'application/pdf' then 'pdf'
        when 'image/jpeg' then 'jpg'
        when 'image/png' then 'png'
    end;

    return query select
        v_document_id,
        p_assessment_id,
        'assessment-evidence'::text,
        v_participant_id::text || '/' || p_assessment_id::text || '/' || v_document_id::text
            || '/v1/' || v_object_id::text || '.' || v_extension,
        v_filename,
        p_mime_type,
        p_file_size_bytes,
        p_sha256,
        1;
end;
$$;

create function public.finalize_evidence_upload(
    p_document_id uuid,
    p_assessment_id uuid,
    p_actor_user_id uuid,
    p_document_category text,
    p_document_type text,
    p_document_name text,
    p_description text,
    p_original_filename text,
    p_storage_bucket text,
    p_storage_path text,
    p_mime_type text,
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
    created_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
    v_participant_id uuid;
    v_document public.assessment_documents%rowtype;
    v_expected_extension text;
begin
    select p.id into v_participant_id
    from public.participants p
    join public.assessments a on a.participant_id = p.id
    where a.id = p_assessment_id
      and a.deleted_at is null
      and p.auth_user_id = p_actor_user_id
      and p.deleted_at is null
    for update of a;

    if not found then
        raise exception using errcode = 'P1001', message = 'Evidence upload is unavailable.';
    end if;
    if p_document_id is null
       or p_document_category is null or btrim(p_document_category) = '' or length(btrim(p_document_category)) > 100
       or p_document_type is null or btrim(p_document_type) = '' or length(btrim(p_document_type)) > 100
       or p_document_name is null or btrim(p_document_name) = '' or length(btrim(p_document_name)) > 200
       or (p_description is not null and length(btrim(p_description)) > 2000)
       or p_original_filename is null or btrim(p_original_filename) = '' or length(btrim(p_original_filename)) > 255
       or btrim(p_original_filename) ~ '[\\/[:cntrl:]]'
       or p_storage_bucket <> 'assessment-evidence'
       or p_mime_type not in ('application/pdf', 'image/jpeg', 'image/png')
       or p_file_size_bytes not between 1 and 10485760
       or p_sha256 !~ '^[0-9a-f]{64}$' then
        raise exception using errcode = 'P1001', message = 'Evidence upload metadata is invalid.';
    end if;

    v_expected_extension := case p_mime_type
        when 'application/pdf' then 'pdf'
        when 'image/jpeg' then 'jpg'
        when 'image/png' then 'png'
    end;
    if p_storage_path !~ (
        '^' || v_participant_id::text || '/' || p_assessment_id::text || '/'
        || p_document_id::text || '/v1/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.]'
        || v_expected_extension || '$'
    ) then
        raise exception using errcode = 'P1001', message = 'Evidence storage path is invalid.';
    end if;

    insert into public.assessment_documents(
        id, assessment_id, document_category, document_type, document_name,
        description, original_filename, storage_bucket, storage_path, mime_type,
        file_size_bytes, checksum, verification_status, created_by, updated_by
    ) values (
        p_document_id, p_assessment_id, btrim(p_document_category), btrim(p_document_type),
        btrim(p_document_name), nullif(btrim(p_description), ''), btrim(p_original_filename),
        p_storage_bucket, p_storage_path, p_mime_type, p_file_size_bytes,
        p_sha256, 'pending', p_actor_user_id, p_actor_user_id
    ) returning * into v_document;

    insert into public.file_version_history(
        file_id, version_number, storage_path, file_name, file_size_bytes,
        mime_type, checksum, change_summary, created_by, metadata
    ) values (
        v_document.id, 1, v_document.storage_path, v_document.original_filename,
        v_document.file_size_bytes, v_document.mime_type, v_document.checksum,
        'Initial evidence submission', p_actor_user_id,
        jsonb_build_object('assessment_id', p_assessment_id, 'storage_bucket', p_storage_bucket)
    );

    insert into public.evidence_verification_history(
        assessment_document_id, verification_event, verification_status,
        verified_by, verified_at, comments, supporting_metadata
    ) values (
        v_document.id, 'submitted', 'pending', null, null, null,
        jsonb_build_object('version_number', 1)
    );

    insert into public.activity_timeline(
        entity_type, entity_id, actor_type, actor_id, event_type,
        event_title, event_description, event_timestamp, metadata
    ) values (
        'assessment_document', v_document.id, 'participant', p_actor_user_id,
        'evidence_submitted', 'Evidence submitted',
        'A participant submitted evidence for governed verification.',
        transaction_timestamp(),
        jsonb_build_object('assessment_id', p_assessment_id, 'version_number', 1)
    );

    return query select
        v_document.id, v_document.assessment_id, v_document.document_category,
        v_document.document_type, v_document.document_name, v_document.description,
        v_document.original_filename, v_document.mime_type, v_document.file_size_bytes,
        v_document.verification_status, v_document.created_at;
exception
    when sqlstate 'P1001' then raise;
    when unique_violation then
        raise exception using errcode = 'P1001', message = 'Evidence upload was already finalized.';
    when others then
        raise exception using errcode = 'P1002', message = 'Evidence upload finalization failed.';
end;
$$;

create function public.list_participant_evidence(p_actor_user_id uuid)
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
    verified_at timestamptz,
    verification_notes text,
    version_number integer,
    created_at timestamptz
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
    where p.auth_user_id = p_actor_user_id and p.deleted_at is null;
    if not found then
        raise exception using errcode = 'P1001', message = 'Participant evidence access is unavailable.';
    end if;
    return query
    select d.id, d.assessment_id, d.document_category, d.document_type,
        d.document_name, d.description, d.original_filename, d.mime_type,
        d.file_size_bytes, d.verification_status, d.verified_at,
        d.verification_notes, v.version_number, d.created_at
    from public.assessment_documents d
    join public.assessments a on a.id = d.assessment_id and a.deleted_at is null
    join public.file_version_history v on v.file_id = d.id
    where a.participant_id = v_participant_id and d.deleted_at is null
      and v.version_number = (
          select max(v2.version_number) from public.file_version_history v2 where v2.file_id = d.id
      )
    order by d.created_at desc, d.id;
end;
$$;

create function public.list_admin_evidence(
    p_actor_user_id uuid,
    p_participant_id uuid default null,
    p_assessment_id uuid default null
)
returns table (
    document_id uuid,
    participant_id uuid,
    participant_code text,
    assessment_id uuid,
    assessment_number integer,
    document_category text,
    document_type text,
    document_name text,
    original_filename text,
    mime_type text,
    file_size_bytes bigint,
    verification_status text,
    verified_at timestamptz,
    version_number integer,
    created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
begin
    if not public.is_active_evidence_administrator(p_actor_user_id) then
        raise exception using errcode = 'P1001', message = 'Actor is not authorized to access evidence.';
    end if;
    return query
    select d.id, p.id, p.participant_code, a.id, a.assessment_number,
        d.document_category, d.document_type, d.document_name,
        d.original_filename, d.mime_type, d.file_size_bytes,
        d.verification_status, d.verified_at, v.version_number, d.created_at
    from public.assessment_documents d
    join public.assessments a on a.id = d.assessment_id and a.deleted_at is null
    join public.participants p on p.id = a.participant_id and p.deleted_at is null
    join public.file_version_history v on v.file_id = d.id
    where d.deleted_at is null
      and (p_participant_id is null or p.id = p_participant_id)
      and (p_assessment_id is null or a.id = p_assessment_id)
      and v.version_number = (
          select max(v2.version_number) from public.file_version_history v2 where v2.file_id = d.id
      )
    order by d.created_at desc, d.id;
end;
$$;

create function public.get_admin_evidence(p_document_id uuid, p_actor_user_id uuid)
returns table (
    document_id uuid,
    participant_id uuid,
    participant_code text,
    assessment_id uuid,
    assessment_number integer,
    document_category text,
    document_type text,
    document_name text,
    description text,
    original_filename text,
    storage_bucket text,
    storage_path text,
    mime_type text,
    file_size_bytes bigint,
    sha256 text,
    verification_status text,
    verified_at timestamptz,
    verified_by uuid,
    verification_notes text,
    versions jsonb,
    verification_history jsonb,
    created_at timestamptz,
    updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
begin
    if not public.is_active_evidence_administrator(p_actor_user_id) then
        raise exception using errcode = 'P1001', message = 'Actor is not authorized to access evidence.';
    end if;
    return query
    select d.id, p.id, p.participant_code, a.id, a.assessment_number,
        d.document_category, d.document_type, d.document_name, d.description,
        d.original_filename, d.storage_bucket, d.storage_path, d.mime_type,
        d.file_size_bytes, d.checksum, d.verification_status, d.verified_at,
        d.verified_by, d.verification_notes,
        coalesce((
            select jsonb_agg(jsonb_build_object(
                'version_number', v.version_number,
                'file_name', v.file_name,
                'file_size_bytes', v.file_size_bytes,
                'mime_type', v.mime_type,
                'checksum', v.checksum,
                'change_summary', v.change_summary,
                'created_by', v.created_by,
                'created_at', v.created_at
            ) order by v.version_number)
            from public.file_version_history v where v.file_id = d.id
        ), '[]'::jsonb),
        coalesce((
            select jsonb_agg(jsonb_build_object(
                'verification_event', h.verification_event,
                'verification_status', h.verification_status,
                'verification_result', h.verification_result,
                'verified_by', h.verified_by,
                'verified_at', h.verified_at,
                'comments', h.comments,
                'internal_notes', h.internal_notes,
                'created_at', h.created_at
            ) order by h.created_at, h.id)
            from public.evidence_verification_history h where h.assessment_document_id = d.id
        ), '[]'::jsonb),
        d.created_at, d.updated_at
    from public.assessment_documents d
    join public.assessments a on a.id = d.assessment_id and a.deleted_at is null
    join public.participants p on p.id = a.participant_id and p.deleted_at is null
    where d.id = p_document_id and d.deleted_at is null;
end;
$$;

alter function public.prevent_evidence_history_mutation() owner to postgres;
alter function public.prevent_file_version_history_mutation() owner to postgres;
alter function public.protect_assessment_document_file_identity() owner to postgres;
alter function public.is_active_evidence_administrator(uuid) owner to postgres;
alter function public.prepare_evidence_upload(uuid,uuid,text,text,text,text,text,text,bigint,text) owner to postgres;
alter function public.finalize_evidence_upload(uuid,uuid,uuid,text,text,text,text,text,text,text,text,bigint,text) owner to postgres;
alter function public.list_participant_evidence(uuid) owner to postgres;
alter function public.list_admin_evidence(uuid,uuid,uuid) owner to postgres;
alter function public.get_admin_evidence(uuid,uuid) owner to postgres;

revoke all on table public.assessment_documents from public, anon, authenticated, service_role;
revoke all on table public.evidence_verification_history from public, anon, authenticated, service_role;
revoke all on table public.file_version_history from public, anon, authenticated, service_role;

revoke all on function public.prevent_evidence_history_mutation() from public, anon, authenticated, service_role;
revoke all on function public.prevent_file_version_history_mutation() from public, anon, authenticated, service_role;
revoke all on function public.protect_assessment_document_file_identity() from public, anon, authenticated, service_role;
revoke all on function public.is_active_evidence_administrator(uuid) from public, anon, authenticated, service_role;
revoke all on function public.prepare_evidence_upload(uuid,uuid,text,text,text,text,text,text,bigint,text) from public, anon, authenticated, service_role;
revoke all on function public.finalize_evidence_upload(uuid,uuid,uuid,text,text,text,text,text,text,text,text,bigint,text) from public, anon, authenticated, service_role;
revoke all on function public.list_participant_evidence(uuid) from public, anon, authenticated, service_role;
revoke all on function public.list_admin_evidence(uuid,uuid,uuid) from public, anon, authenticated, service_role;
revoke all on function public.get_admin_evidence(uuid,uuid) from public, anon, authenticated, service_role;

grant execute on function public.prepare_evidence_upload(uuid,uuid,text,text,text,text,text,text,bigint,text) to service_role;
grant execute on function public.finalize_evidence_upload(uuid,uuid,uuid,text,text,text,text,text,text,text,text,bigint,text) to service_role;
grant execute on function public.list_participant_evidence(uuid) to service_role;
grant execute on function public.list_admin_evidence(uuid,uuid,uuid) to service_role;
grant execute on function public.get_admin_evidence(uuid,uuid) to service_role;

comment on function public.prepare_evidence_upload(uuid,uuid,text,text,text,text,text,text,bigint,text) is
    'Validates participant ownership and reserves a deterministic immutable private storage coordinate without writing evidence metadata.';
comment on function public.finalize_evidence_upload(uuid,uuid,uuid,text,text,text,text,text,text,text,text,bigint,text) is
    'Atomically persists governed evidence metadata, initial file version, verification history, and audit activity after private storage upload.';
comment on function public.list_participant_evidence(uuid) is
    'Returns participant-owned evidence metadata without storage coordinates, checksums, reviewer identity, or internal notes.';

commit;
