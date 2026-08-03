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

-- Audit legacy compatibility without inventing metadata, deleting rows, or
-- reinterpreting the generic file-version ledger as evidence history.
do $$
declare
    v_null_mime bigint;
    v_invalid_size bigint;
    v_invalid_checksum bigint;
    v_unsupported_mime bigint;
    v_duplicate_paths bigint;
    v_generic_versions bigint;
    v_orphan_versions bigint;
begin
    select count(*) into v_null_mime from public.assessment_documents where mime_type is null;
    select count(*) into v_invalid_size from public.assessment_documents where file_size_bytes is null or file_size_bytes not between 1 and 10485760;
    select count(*) into v_invalid_checksum from public.assessment_documents where checksum is null or checksum !~ '^[0-9a-f]{64}$';
    select count(*) into v_unsupported_mime from public.assessment_documents where mime_type is not null and mime_type not in ('application/pdf', 'image/jpeg', 'image/png');
    select count(*) into v_duplicate_paths from (
        select storage_bucket, storage_path from public.assessment_documents
        group by storage_bucket, storage_path having count(*) > 1
    ) duplicates;
    select count(*) into v_generic_versions from public.file_version_history v
    where not exists (select 1 from public.assessment_documents d where d.id = v.file_id);
    v_orphan_versions := v_generic_versions;
    raise notice 'Evidence migration legacy audit: null_mime=%, invalid_size=%, invalid_checksum=%, unsupported_mime=%, duplicate_paths=%, generic_or_orphan_versions=%',
        v_null_mime, v_invalid_size, v_invalid_checksum, v_unsupported_mime,
        v_duplicate_paths, v_orphan_versions;
end;
$$;

alter table public.assessment_documents
    drop constraint assessment_documents_mime_type_check,
    drop constraint assessment_documents_file_size_check,
    drop constraint assessment_documents_checksum_check,
    drop constraint assessment_documents_verification_status_check,
    drop constraint assessment_documents_verification_metadata_check;

alter table public.assessment_documents
    add column evidence_governance_version text,
    add constraint assessment_documents_mime_type_check
        check (mime_type is null or btrim(mime_type) <> ''),
    add constraint assessment_documents_file_size_check
        check (file_size_bytes is null or file_size_bytes >= 0),
    add constraint assessment_documents_checksum_check
        check (checksum is null or btrim(checksum) <> ''),
    add constraint assessment_documents_verification_status_check
        check (verification_status in ('pending', 'in_progress', 'verified', 'rejected', 'expired')),
    add constraint assessment_documents_verification_metadata_check
        check (
            (verification_status in ('pending', 'in_progress') and verified_at is null and verified_by is null)
            or (verification_status in ('verified', 'rejected') and verified_at is not null and verified_by is not null)
            or (verification_status = 'expired' and verified_at is not null)
        ),
    add constraint assessment_documents_governed_evidence_check
        check (
            evidence_governance_version is null
            or (
                evidence_governance_version = 'evidence-v1'
                and mime_type in ('application/pdf', 'image/jpeg', 'image/png')
                and file_size_bytes between 1 and 10485760
                and checksum ~ '^[0-9a-f]{64}$'
                and storage_bucket = 'assessment-evidence'
            )
        );

alter table public.evidence_verification_history
    drop constraint evidence_verification_history_verification_status_check,
    add constraint evidence_verification_history_verification_status_check
        check (verification_status in ('pending', 'in_progress', 'verified', 'rejected', 'expired'));

alter table public.file_version_history
    add column evidence_document_id uuid,
    add constraint file_version_history_evidence_document_fk
        foreign key (evidence_document_id) references public.assessment_documents(id)
        on update restrict on delete restrict,
    add constraint file_version_history_governed_evidence_check
        check (
            evidence_document_id is null
            or (
                file_id = evidence_document_id
                and mime_type in ('application/pdf', 'image/jpeg', 'image/png')
                and file_size_bytes between 1 and 10485760
                and checksum ~ '^[0-9a-f]{64}$'
            )
        );

create unique index file_version_history_evidence_version_unique
    on public.file_version_history(evidence_document_id, version_number)
    where evidence_document_id is not null;
create unique index file_version_history_evidence_path_unique
    on public.file_version_history(storage_path)
    where evidence_document_id is not null;

create table public.evidence_upload_reservations (
    id uuid primary key default gen_random_uuid(),
    participant_id uuid not null references public.participants(id) on update restrict on delete restrict,
    assessment_id uuid not null references public.assessments(id) on update restrict on delete restrict,
    assessment_session_id uuid not null references public.assessment_sessions(id) on update restrict on delete restrict,
    document_id uuid not null,
    version_number integer not null check (version_number = 1),
    storage_bucket text not null check (storage_bucket = 'assessment-evidence'),
    storage_path text not null check (btrim(storage_path) <> ''),
    document_category text not null check (btrim(document_category) <> ''),
    document_type text not null check (btrim(document_type) <> ''),
    document_name text not null check (btrim(document_name) <> ''),
    description text,
    original_filename text not null check (btrim(original_filename) <> ''),
    declared_mime_type text not null check (declared_mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
    expected_file_size_bytes bigint not null check (expected_file_size_bytes between 1 and 10485760),
    expected_sha256 text not null check (expected_sha256 ~ '^[0-9a-f]{64}$'),
    expected_max_size bigint not null default 10485760 check (expected_max_size = 10485760),
    prepared_by uuid not null,
    prepared_at timestamptz not null default transaction_timestamp(),
    expires_at timestamptz not null,
    consumed_at timestamptz,
    cancelled_at timestamptz,
    deleted_at timestamptz,
    check (expires_at > prepared_at),
    check (num_nonnulls(consumed_at, cancelled_at, deleted_at) <= 1),
    unique (document_id, version_number),
    unique (storage_bucket, storage_path)
);

create index evidence_upload_reservations_actor_idx
    on public.evidence_upload_reservations(prepared_by, prepared_at desc);
create index evidence_upload_reservations_expiry_idx
    on public.evidence_upload_reservations(expires_at)
    where consumed_at is null and cancelled_at is null and deleted_at is null;

alter table public.assessment_documents enable row level security;
alter table public.evidence_verification_history enable row level security;
alter table public.file_version_history enable row level security;
alter table public.evidence_upload_reservations enable row level security;

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
    if old.assessment_id is distinct from new.assessment_id
       or old.original_filename is distinct from new.original_filename
       or old.storage_bucket is distinct from new.storage_bucket
       or old.storage_path is distinct from new.storage_path
       or old.mime_type is distinct from new.mime_type
       or old.file_size_bytes is distinct from new.file_size_bytes
       or old.checksum is distinct from new.checksum
       or old.evidence_governance_version is distinct from new.evidence_governance_version
       or old.created_at is distinct from new.created_at
       or old.created_by is distinct from new.created_by then
        raise exception using errcode = 'P1001', message = 'Evidence file identity is immutable.';
    end if;
    return new;
end;
$$;

create trigger assessment_document_file_identity_immutable
before update on public.assessment_documents
for each row execute function public.protect_assessment_document_file_identity();

create function public.protect_evidence_upload_reservation_identity()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
    if old.id is distinct from new.id
       or old.participant_id is distinct from new.participant_id
       or old.assessment_id is distinct from new.assessment_id
       or old.assessment_session_id is distinct from new.assessment_session_id
       or old.document_id is distinct from new.document_id
       or old.version_number is distinct from new.version_number
       or old.storage_bucket is distinct from new.storage_bucket
       or old.storage_path is distinct from new.storage_path
       or old.document_category is distinct from new.document_category
       or old.document_type is distinct from new.document_type
       or old.document_name is distinct from new.document_name
       or old.description is distinct from new.description
       or old.original_filename is distinct from new.original_filename
       or old.declared_mime_type is distinct from new.declared_mime_type
       or old.expected_file_size_bytes is distinct from new.expected_file_size_bytes
       or old.expected_sha256 is distinct from new.expected_sha256
       or old.expected_max_size is distinct from new.expected_max_size
       or old.prepared_by is distinct from new.prepared_by
       or old.prepared_at is distinct from new.prepared_at
       or old.expires_at is distinct from new.expires_at
       or (old.consumed_at is not null and old.consumed_at is distinct from new.consumed_at)
       or (old.cancelled_at is not null and old.cancelled_at is distinct from new.cancelled_at)
       or (old.deleted_at is not null and old.deleted_at is distinct from new.deleted_at) then
        raise exception using errcode = 'P1001', message = 'Evidence upload reservation identity is immutable.';
    end if;
    return new;
end;
$$;

create trigger evidence_upload_reservation_identity_immutable
before update on public.evidence_upload_reservations
for each row execute function public.protect_evidence_upload_reservation_identity();

create function public.require_evidence_upload_context(p_assessment_id uuid, p_actor_user_id uuid)
returns table (participant_id uuid, assessment_session_id uuid)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
    return query
    select p.id, s.id
    from public.participants p
    join public.assessments a on a.participant_id = p.id and a.deleted_at is null
    join public.assessment_sessions s
      on s.id = a.assessment_session_id
     and s.participant_id = p.id
     and s.deleted_at is null
     and s.status in ('draft', 'in_progress', 'submitted')
    where a.id = p_assessment_id
      and p.auth_user_id = p_actor_user_id
      and p.lifecycle_status = 'active'
      and p.deleted_at is null
    for share of p, a, s;

    if not found then
        raise exception using errcode = 'P1001', message = 'Evidence upload is unavailable.';
    end if;
end;
$$;

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
    v_participant_id uuid;
    v_assessment_session_id uuid;
    v_document_id uuid := gen_random_uuid();
    v_object_id uuid := gen_random_uuid();
    v_extension text;
    v_filename text := btrim(p_original_filename);
begin
    select c.participant_id, c.assessment_session_id
    into v_participant_id, v_assessment_session_id
    from public.require_evidence_upload_context(p_assessment_id, p_actor_user_id) c;
    if p_document_category is null or btrim(p_document_category) = '' or length(btrim(p_document_category)) > 100
       or p_document_type is null or btrim(p_document_type) = '' or length(btrim(p_document_type)) > 100
       or p_document_name is null or btrim(p_document_name) = '' or length(btrim(p_document_name)) > 200
       or (p_description is not null and length(btrim(p_description)) > 2000)
       or v_filename is null or v_filename = '' or length(v_filename) > 255
       or v_filename ~ '[\\/[:cntrl:]]'
       or p_mime_type is null or p_mime_type not in ('application/pdf', 'image/jpeg', 'image/png')
       or p_file_size_bytes is null or p_file_size_bytes not between 1 and 10485760
       or p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$' then
        raise exception using errcode = 'P1001', message = 'Evidence upload metadata is invalid.';
    end if;

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
            v_participant_id, p_assessment_id, v_assessment_session_id, v_document_id,
            1, 'assessment-evidence',
            v_participant_id::text || '/' || p_assessment_id::text || '/' || v_document_id::text
                || '/v1/' || v_object_id::text || '.' || v_extension,
            btrim(p_document_category), btrim(p_document_type), btrim(p_document_name),
            nullif(btrim(p_description), ''), v_filename, p_mime_type,
            p_file_size_bytes, p_sha256, 10485760, p_actor_user_id,
            transaction_timestamp() + interval '15 minutes'
        )
        returning *
    )
    select reservation.id, reservation.document_id, reservation.assessment_id,
        reservation.assessment_session_id, reservation.storage_bucket,
        reservation.storage_path, reservation.original_filename,
        reservation.declared_mime_type, reservation.expected_file_size_bytes,
        reservation.expected_sha256, reservation.version_number
    from reservation;
end;
$$;

create function public.finalize_evidence_upload(
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
    created_at timestamptz
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
    v_storage_object storage.objects%rowtype;
    v_storage_size text;
    v_storage_mime text;
begin
    select * into v_reservation
    from public.evidence_upload_reservations r
    where r.id = p_reservation_id
    for update;

    if not found or v_reservation.prepared_by <> p_actor_user_id
       or v_reservation.consumed_at is not null
       or v_reservation.cancelled_at is not null
       or v_reservation.deleted_at is not null
       or v_reservation.expires_at <= transaction_timestamp() then
        raise exception using errcode = 'P1001', message = 'Evidence upload reservation is unavailable.';
    end if;

    select c.participant_id, c.assessment_session_id
    into v_context_participant_id, v_context_session_id
    from public.require_evidence_upload_context(v_reservation.assessment_id, p_actor_user_id) c;

    if v_context_participant_id <> v_reservation.participant_id
       or v_context_session_id <> v_reservation.assessment_session_id
       or p_file_size_bytes is distinct from v_reservation.expected_file_size_bytes
       or p_sha256 is distinct from v_reservation.expected_sha256 then
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

    insert into public.assessment_documents(
        id, assessment_id, document_category, document_type, document_name,
        description, original_filename, storage_bucket, storage_path, mime_type,
        file_size_bytes, checksum, verification_status, evidence_governance_version,
        created_by, updated_by
    ) values (
        v_reservation.document_id, v_reservation.assessment_id,
        v_reservation.document_category, v_reservation.document_type,
        v_reservation.document_name, v_reservation.description,
        v_reservation.original_filename, v_reservation.storage_bucket,
        v_reservation.storage_path, v_reservation.declared_mime_type,
        v_reservation.expected_file_size_bytes, v_reservation.expected_sha256,
        'pending', 'evidence-v1', p_actor_user_id, p_actor_user_id
    ) returning * into v_document;

    insert into public.file_version_history(
        file_id, evidence_document_id, version_number, storage_path, file_name, file_size_bytes,
        mime_type, checksum, change_summary, created_by, metadata
    ) values (
        v_document.id, v_document.id, v_reservation.version_number,
        v_document.storage_path, v_document.original_filename,
        v_document.file_size_bytes, v_document.mime_type, v_document.checksum,
        'Initial evidence submission', p_actor_user_id,
        jsonb_build_object('assessment_id', v_document.assessment_id, 'storage_bucket', v_document.storage_bucket)
    );

    insert into public.evidence_verification_history(
        assessment_document_id, verification_event, verification_status,
        verified_by, verified_at, comments, supporting_metadata
    ) values (
        v_document.id, 'submitted', 'pending', null, null, null,
        jsonb_build_object('version_number', v_reservation.version_number)
    );

    insert into public.activity_timeline(
        entity_type, entity_id, actor_type, actor_id, event_type,
        event_title, event_description, event_timestamp, metadata
    ) values (
        'assessment_document', v_document.id, 'participant', p_actor_user_id,
        'evidence_submitted', 'Evidence submitted',
        'A participant submitted evidence for governed verification.',
        transaction_timestamp(),
        jsonb_build_object('assessment_id', v_document.assessment_id, 'version_number', v_reservation.version_number)
    );

    update public.evidence_upload_reservations
    set consumed_at = transaction_timestamp()
    where id = v_reservation.id;

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
    join public.file_version_history v on v.evidence_document_id = d.id
    where a.participant_id = v_participant_id and d.deleted_at is null
      and v.version_number = (
          select max(v2.version_number) from public.file_version_history v2 where v2.evidence_document_id = d.id
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
    join public.file_version_history v on v.evidence_document_id = d.id
    where d.deleted_at is null
      and (p_participant_id is null or p.id = p_participant_id)
      and (p_assessment_id is null or a.id = p_assessment_id)
      and v.version_number = (
          select max(v2.version_number) from public.file_version_history v2 where v2.evidence_document_id = d.id
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
            from public.file_version_history v where v.evidence_document_id = d.id
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
alter function public.protect_evidence_upload_reservation_identity() owner to postgres;
alter function public.require_evidence_upload_context(uuid,uuid) owner to postgres;
alter function public.is_active_evidence_administrator(uuid) owner to postgres;
alter function public.prepare_evidence_upload(uuid,uuid,text,text,text,text,text,text,bigint,text) owner to postgres;
alter function public.finalize_evidence_upload(uuid,uuid,bigint,text) owner to postgres;
alter function public.list_participant_evidence(uuid) owner to postgres;
alter function public.list_admin_evidence(uuid,uuid,uuid) owner to postgres;
alter function public.get_admin_evidence(uuid,uuid) owner to postgres;

revoke all on table public.assessment_documents from public, anon, authenticated, service_role;
revoke all on table public.evidence_verification_history from public, anon, authenticated, service_role;
revoke all on table public.file_version_history from public, anon, authenticated, service_role;
revoke all on table public.evidence_upload_reservations from public, anon, authenticated, service_role;

revoke all on function public.prevent_evidence_history_mutation() from public, anon, authenticated, service_role;
revoke all on function public.prevent_file_version_history_mutation() from public, anon, authenticated, service_role;
revoke all on function public.protect_assessment_document_file_identity() from public, anon, authenticated, service_role;
revoke all on function public.protect_evidence_upload_reservation_identity() from public, anon, authenticated, service_role;
revoke all on function public.require_evidence_upload_context(uuid,uuid) from public, anon, authenticated, service_role;
revoke all on function public.is_active_evidence_administrator(uuid) from public, anon, authenticated, service_role;
revoke all on function public.prepare_evidence_upload(uuid,uuid,text,text,text,text,text,text,bigint,text) from public, anon, authenticated, service_role;
revoke all on function public.finalize_evidence_upload(uuid,uuid,bigint,text) from public, anon, authenticated, service_role;
revoke all on function public.list_participant_evidence(uuid) from public, anon, authenticated, service_role;
revoke all on function public.list_admin_evidence(uuid,uuid,uuid) from public, anon, authenticated, service_role;
revoke all on function public.get_admin_evidence(uuid,uuid) from public, anon, authenticated, service_role;

grant execute on function public.prepare_evidence_upload(uuid,uuid,text,text,text,text,text,text,bigint,text) to service_role;
grant execute on function public.finalize_evidence_upload(uuid,uuid,bigint,text) to service_role;
grant execute on function public.list_participant_evidence(uuid) to service_role;
grant execute on function public.list_admin_evidence(uuid,uuid,uuid) to service_role;
grant execute on function public.get_admin_evidence(uuid,uuid) to service_role;

comment on function public.prepare_evidence_upload(uuid,uuid,text,text,text,text,text,text,bigint,text) is
    'Persists a short-lived single-use reservation that binds participant, assessment, session, document metadata, integrity values, and the private storage coordinate.';
comment on function public.finalize_evidence_upload(uuid,uuid,bigint,text) is
    'Consumes one persisted upload reservation after verifying the exact private storage object, then atomically persists evidence metadata and append-only histories.';
comment on function public.list_participant_evidence(uuid) is
    'Returns participant-owned evidence metadata without storage coordinates, checksums, reviewer identity, or internal notes.';

commit;
