-- ============================================================================
-- WEALTH PATH AI GLOBAL (WPAG)
-- Domain: Participant Management
-- Migration: 006_consents
-- Purpose: Preserve versioned consent decisions and supporting evidence.
-- ============================================================================

create sequence if not exists public.consent_code_seq
    start with 1
    increment by 1
    minvalue 1
    no maxvalue
    cache 1;

create table public.consents (
    id uuid primary key default gen_random_uuid(),

    consent_code text not null unique
        default (
            'WPAG-CON-' ||
            lpad(nextval('public.consent_code_seq')::text, 6, '0')
        ),

    application_id uuid not null
        references public.applications(id)
        on update cascade
        on delete restrict,

    participant_id uuid
        references public.participants(id)
        on update cascade
        on delete restrict,

    previous_consent_id uuid
        references public.consents(id)
        on update cascade
        on delete restrict,

    consent_type text not null
        check (
            consent_type in (
                'programme_participation',
                'research_participation',
                'data_processing',
                'communication',
                'document_storage',
                'case_study',
                'publication'
            )
        ),

    version_number integer not null default 1
        check (version_number > 0),

    document_version text not null,

    document_title text not null,

    document_hash text,

    status text not null
        check (
            status in (
                'accepted',
                'declined',
                'withdrawn'
            )
        ),

    consent_method text not null
        check (
            consent_method in (
                'website',
                'email',
                'digital_signature',
                'paper_form',
                'recorded_interview',
                'admin_recorded'
            )
        ),

    decision_at timestamptz not null,

    accepted_at timestamptz,

    declined_at timestamptz,

    withdrawn_at timestamptz,

    withdrawal_reason text,

    signer_name text,

    signer_relationship text,

    signature_reference text,

    source_ip inet,

    user_agent text,

    evidence_metadata jsonb not null default '{}'::jsonb
        check (jsonb_typeof(evidence_metadata) = 'object'),

    recorded_by uuid
        references auth.users(id)
        on update cascade
        on delete set null,

    created_at timestamptz not null default now(),

    deleted_at timestamptz,

    constraint consents_code_format_check
        check (consent_code ~ '^WPAG-CON-[0-9]{6,}$'),

    constraint consents_application_version_unique
        unique (
            application_id,
            consent_type,
            version_number
        ),

    constraint consents_previous_record_check
        check (
            previous_consent_id is null
            or previous_consent_id <> id
        ),

    constraint consents_document_version_check
        check (char_length(trim(document_version)) between 1 and 50),

    constraint consents_document_title_check
        check (char_length(trim(document_title)) between 2 and 250),

    constraint consents_status_timestamp_check
        check (
            (
                status = 'accepted'
                and accepted_at is not null
                and declined_at is null
                and withdrawn_at is null
            )
            or
            (
                status = 'declined'
                and declined_at is not null
                and accepted_at is null
                and withdrawn_at is null
            )
            or
            (
                status = 'withdrawn'
                and withdrawn_at is not null
                and withdrawal_reason is not null
                and accepted_at is null
                and declined_at is null
            )
        ),

    constraint consents_decision_time_check
        check (
            decision_at =
            coalesce(accepted_at, declined_at, withdrawn_at)
        ),

    constraint consents_deleted_at_check
        check (
            deleted_at is null
            or deleted_at >= created_at
        )
);

-- --------------------------------------------------------------------------
-- Indexes
-- --------------------------------------------------------------------------

create index consents_application_id_idx
    on public.consents(application_id)
    where deleted_at is null;

create index consents_participant_id_idx
    on public.consents(participant_id)
    where participant_id is not null
      and deleted_at is null;

create index consents_previous_consent_id_idx
    on public.consents(previous_consent_id)
    where previous_consent_id is not null;

create index consents_type_status_idx
    on public.consents(consent_type, status)
    where deleted_at is null;

create index consents_decision_at_idx
    on public.consents(decision_at desc);

-- --------------------------------------------------------------------------
-- Row Level Security
-- Policies will be created in the dedicated RLS migration.
-- Until then, direct client access remains blocked.
-- --------------------------------------------------------------------------

alter table public.consents enable row level security;

-- --------------------------------------------------------------------------
-- Documentation
-- --------------------------------------------------------------------------

comment on table public.consents is
'Immutable, versioned consent decisions connected to WPAG applications and participants.';

comment on column public.consents.previous_consent_id is
'Previous consent record in the consent history. Existing consent records are never overwritten.';

comment on column public.consents.document_hash is
'Optional cryptographic hash identifying the exact consent document presented.';

comment on column public.consents.status is
'Decision represented by this consent-history record: accepted, declined, or withdrawn.';

comment on column public.consents.evidence_metadata is
'Additional structured evidence associated with the consent decision.';

comment on column public.consents.deleted_at is
'Controlled soft-deletion timestamp. Consent-history evidence must not be routinely deleted.';
