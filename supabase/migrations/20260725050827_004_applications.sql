-- ============================================================================
-- WEALTH PATH AI GLOBAL (WPAG)
-- Migration: 004_applications
-- Purpose: Store participant programme applications submitted through WPAG.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Application code sequence
-- Generates application references such as WPAG-APP-000001.
-- --------------------------------------------------------------------------

create sequence if not exists public.application_code_seq
    start with 1
    increment by 1
    minvalue 1
    no maxvalue
    cache 1;

-- --------------------------------------------------------------------------
-- Applications
-- Created before formal participant enrolment.
-- An approved application may later be linked to a participant record.
-- --------------------------------------------------------------------------

create table public.applications (
    id uuid primary key default gen_random_uuid(),

    application_code text not null unique
        default (
            'WPAG-APP-' ||
            lpad(nextval('public.application_code_seq')::text, 6, '0')
        ),

    auth_user_id uuid
        references auth.users(id)
        on update cascade
        on delete set null,

    full_name text not null,

    email extensions.citext not null,

    phone_country_code text not null default '+91',

    phone_number text not null,

    country_code text not null default 'IN',

    state_or_region text,

    city text,

    age_group text
        check (
            age_group is null
            or age_group in (
                '18_24',
                '25_34',
                '35_44',
                '45_54',
                '55_64',
                '65_plus'
            )
        ),

    employment_status text
        check (
            employment_status is null
            or employment_status in (
                'employed',
                'self_employed',
                'business_owner',
                'student',
                'homemaker',
                'retired',
                'unemployed',
                'other'
            )
        ),

    application_reason text not null,

    financial_challenges text,

    expectations text,

    referral_source text,

    status text not null default 'submitted'
        check (
            status in (
                'draft',
                'submitted',
                'under_review',
                'additional_information_required',
                'eligible',
                'ineligible',
                'withdrawn',
                'converted',
                'archived'
            )
        ),

    submitted_at timestamptz,

    reviewed_at timestamptz,

    reviewed_by uuid
        references auth.users(id)
        on update cascade
        on delete set null,

    converted_at timestamptz,

    internal_notes text,

    source_ip inet,

    user_agent text,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    deleted_at timestamptz,

    created_by uuid
        references auth.users(id)
        on update cascade
        on delete set null,

    updated_by uuid
        references auth.users(id)
        on update cascade
        on delete set null,

    constraint applications_code_format_check
        check (application_code ~ '^WPAG-APP-[0-9]{6,}$'),

    constraint applications_full_name_check
        check (char_length(trim(full_name)) between 2 and 150),

    constraint applications_email_check
        check (
            email::text ~*
            '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
        ),

    constraint applications_phone_country_code_check
        check (phone_country_code ~ '^\+[1-9][0-9]{0,3}$'),

    constraint applications_phone_number_check
        check (phone_number ~ '^[0-9]{6,15}$'),

    constraint applications_country_code_check
        check (country_code ~ '^[A-Z]{2}$'),

    constraint applications_submitted_at_check
        check (
            status = 'draft'
            or submitted_at is not null
        ),

    constraint applications_reviewed_at_check
        check (
            reviewed_at is null
            or submitted_at is null
            or reviewed_at >= submitted_at
        ),

    constraint applications_converted_at_check
        check (
            converted_at is null
            or reviewed_at is null
            or converted_at >= reviewed_at
        ),

    constraint applications_deleted_at_check
        check (
            deleted_at is null
            or deleted_at >= created_at
        )
);

-- --------------------------------------------------------------------------
-- Indexes
-- --------------------------------------------------------------------------

create index applications_auth_user_id_idx
    on public.applications(auth_user_id)
    where auth_user_id is not null;

create index applications_email_idx
    on public.applications(email)
    where deleted_at is null;

create index applications_phone_idx
    on public.applications(phone_country_code, phone_number)
    where deleted_at is null;

create index applications_status_idx
    on public.applications(status)
    where deleted_at is null;

create index applications_submitted_at_idx
    on public.applications(submitted_at desc)
    where submitted_at is not null
      and deleted_at is null;

create index applications_created_at_idx
    on public.applications(created_at desc);

-- --------------------------------------------------------------------------
-- updated_at automation
-- --------------------------------------------------------------------------

create trigger trg_applications_set_updated_at
before update on public.applications
for each row
execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- Row Level Security
-- Policies will be added after public submission and administrative roles
-- are implemented. Until then, direct client access is blocked by default.
-- --------------------------------------------------------------------------

alter table public.applications enable row level security;

-- --------------------------------------------------------------------------
-- Documentation
-- --------------------------------------------------------------------------

comment on table public.applications is
'Applications submitted by individuals seeking participation in the WPAG programme.';

comment on column public.applications.application_code is
'Institutional application reference generated in WPAG-APP-000001 format.';

comment on column public.applications.status is
'Current operational status of the application review workflow.';

comment on column public.applications.source_ip is
'Submission IP address retained only where authorised by WPAG privacy and evidence-governance requirements.';

comment on column public.applications.deleted_at is
'Soft-deletion timestamp. Application evidence is preserved rather than physically deleted through normal workflows.';
