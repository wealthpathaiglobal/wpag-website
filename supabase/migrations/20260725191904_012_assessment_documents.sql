-- ============================================================================
-- Wealth Path AI Global
-- Migration: DB-012 — Assessment Documents
-- Purpose:
--   Store metadata for supporting documents and evidence associated with an
--   assessment. Actual files are stored separately in Supabase Storage.
-- ============================================================================

create table public.assessment_documents (

    -- ------------------------------------------------------------------------
    -- Identity
    -- ------------------------------------------------------------------------

    id uuid primary key default gen_random_uuid(),

    assessment_id uuid not null,

    -- ------------------------------------------------------------------------
    -- Document Classification
    -- ------------------------------------------------------------------------

    document_category text not null,

    document_type text not null,

    document_name text not null,

    description text,

    -- ------------------------------------------------------------------------
    -- Storage Metadata
    -- ------------------------------------------------------------------------

    original_filename text not null,

    storage_bucket text not null,

    storage_path text not null,

    mime_type text,

    file_size_bytes bigint,

    checksum text,

    -- ------------------------------------------------------------------------
    -- Verification
    -- ------------------------------------------------------------------------

    verification_status text not null default 'pending',

    verified_at timestamptz,

    verified_by uuid,

    verification_notes text,

    -- ------------------------------------------------------------------------
    -- Audit
    -- ------------------------------------------------------------------------

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    deleted_at timestamptz,

    created_by uuid,

    updated_by uuid

);

-- ============================================================================
-- Foreign Keys
-- ============================================================================

alter table public.assessment_documents
    add constraint assessment_documents_assessment_fk
    foreign key (assessment_id)
    references public.assessments(id)
    on delete cascade;

-- ============================================================================
-- Constraints
-- ============================================================================

alter table public.assessment_documents
    add constraint assessment_documents_storage_object_unique
    unique (
        storage_bucket,
        storage_path
    );

alter table public.assessment_documents
    add constraint assessment_documents_category_check
    check (btrim(document_category) <> '');

alter table public.assessment_documents
    add constraint assessment_documents_type_check
    check (btrim(document_type) <> '');

alter table public.assessment_documents
    add constraint assessment_documents_name_check
    check (btrim(document_name) <> '');

alter table public.assessment_documents
    add constraint assessment_documents_original_filename_check
    check (btrim(original_filename) <> '');

alter table public.assessment_documents
    add constraint assessment_documents_storage_bucket_check
    check (btrim(storage_bucket) <> '');

alter table public.assessment_documents
    add constraint assessment_documents_storage_path_check
    check (btrim(storage_path) <> '');

alter table public.assessment_documents
    add constraint assessment_documents_mime_type_check
    check (
        mime_type is null
        or btrim(mime_type) <> ''
    );

alter table public.assessment_documents
    add constraint assessment_documents_file_size_check
    check (
        file_size_bytes is null
        or file_size_bytes >= 0
    );

alter table public.assessment_documents
    add constraint assessment_documents_checksum_check
    check (
        checksum is null
        or btrim(checksum) <> ''
    );

alter table public.assessment_documents
    add constraint assessment_documents_verification_status_check
    check (
        verification_status in (
            'pending',
            'verified',
            'rejected'
        )
    );

alter table public.assessment_documents
    add constraint assessment_documents_verification_metadata_check
    check (
        (
            verification_status = 'pending'
            and verified_at is null
            and verified_by is null
        )
        or
        (
            verification_status in ('verified', 'rejected')
            and verified_at is not null
            and verified_by is not null
        )
    );

-- ============================================================================
-- Indexes
-- ============================================================================

create index assessment_documents_assessment_idx
    on public.assessment_documents(assessment_id);

create index assessment_documents_category_idx
    on public.assessment_documents(document_category);

create index assessment_documents_type_idx
    on public.assessment_documents(document_type);

create index assessment_documents_verification_status_idx
    on public.assessment_documents(verification_status);

create index assessment_documents_deleted_at_idx
    on public.assessment_documents(deleted_at);

create index assessment_documents_assessment_active_idx
    on public.assessment_documents(
        assessment_id,
        document_category
    )
    where deleted_at is null;

-- ============================================================================
-- Trigger
-- ============================================================================

create trigger set_assessment_documents_updated_at
before update on public.assessment_documents
for each row
execute function public.set_updated_at();

-- ============================================================================
-- Documentation
-- ============================================================================

comment on table public.assessment_documents is
    'Stores metadata for supporting evidence files associated with assessments. Actual files are maintained in Supabase Storage.';

comment on column public.assessment_documents.id is
    'Primary identifier for the assessment document record.';

comment on column public.assessment_documents.assessment_id is
    'Assessment to which the supporting document belongs.';

comment on column public.assessment_documents.document_category is
    'High-level evidence category, such as income, expense, asset, liability, identity, or other supporting evidence.';

comment on column public.assessment_documents.document_type is
    'Specific document type, such as bank statement, salary slip, loan statement, tax return, or identity document.';

comment on column public.assessment_documents.document_name is
    'Human-readable name assigned to the document.';

comment on column public.assessment_documents.description is
    'Optional additional context describing the document or its relevance.';

comment on column public.assessment_documents.original_filename is
    'Original filename supplied when the document was uploaded.';

comment on column public.assessment_documents.storage_bucket is
    'Supabase Storage bucket containing the document file.';

comment on column public.assessment_documents.storage_path is
    'Unique object path of the document inside the storage bucket.';

comment on column public.assessment_documents.mime_type is
    'MIME content type reported for the uploaded file.';

comment on column public.assessment_documents.file_size_bytes is
    'Uploaded file size measured in bytes.';

comment on column public.assessment_documents.checksum is
    'Optional checksum used to support file-integrity and duplicate-file validation.';

comment on column public.assessment_documents.verification_status is
    'Evidence verification state: pending, verified, or rejected.';

comment on column public.assessment_documents.verified_at is
    'Timestamp when the document verification decision was recorded.';

comment on column public.assessment_documents.verified_by is
    'Identifier of the authorised reviewer who recorded the verification decision.';

comment on column public.assessment_documents.verification_notes is
    'Reviewer notes explaining the verification or rejection decision.';

comment on column public.assessment_documents.deleted_at is
    'Soft-deletion timestamp. Null indicates an active document record.';
