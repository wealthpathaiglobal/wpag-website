-- ============================================================================
-- WEALTH PATH AI GLOBAL (WPAG)
-- Migration: 003_participants
-- Purpose: Create the central participant master table.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Participant code sequence
-- Generates institutional participant codes such as WPAG-000001.
-- --------------------------------------------------------------------------

create sequence if not exists public.participant_code_seq
    start with 1
    increment by 1
    minvalue 1
    no maxvalue
    cache 1;

-- --------------------------------------------------------------------------
-- Participants
-- One master record for every formally enrolled WPAG participant.
-- --------------------------------------------------------------------------

create table public.participants (
    id uuid primary key default gen_random_uuid(),

    participant_code text not null unique
        default (
            'WPAG-' ||
            lpad(nextval('public.participant_code_seq')::text, 6, '0')
        ),

    auth_user_id uuid unique
        references auth.users(id)
        on update cascade
        on delete set null,

    application_id uuid unique,

    lifecycle_status text not null default 'pending_enrollment'
        check (
            lifecycle_status in (
                'pending_enrollment',
                'active',
                'paused',
                'completed',
                'withdrawn',
                'archived'
            )
        ),

    research_status text not null default 'not_enrolled'
        check (
            research_status in (
                'not_enrolled',
                'enrolled',
                'completed',
                'withdrawn',
                'excluded'
            )
        ),

    enrollment_date date,

    completion_date date,

    withdrawal_date date,

    withdrawal_reason text,

    internal_notes text,

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

    constraint participants_code_format_check
        check (participant_code ~ '^WPAG-[0-9]{6,}$'),

    constraint participants_completion_date_check
        check (
            completion_date is null
            or enrollment_date is null
            or completion_date >= enrollment_date
        ),

    constraint participants_withdrawal_date_check
        check (
            withdrawal_date is null
            or enrollment_date is null
            or withdrawal_date >= enrollment_date
        ),

    constraint participants_deleted_at_check
        check (
            deleted_at is null
            or deleted_at >= created_at
        )
);

-- --------------------------------------------------------------------------
-- Indexes
-- --------------------------------------------------------------------------

create index participants_auth_user_id_idx
    on public.participants(auth_user_id)
    where auth_user_id is not null;

create index participants_lifecycle_status_idx
    on public.participants(lifecycle_status)
    where deleted_at is null;

create index participants_research_status_idx
    on public.participants(research_status)
    where deleted_at is null;

create index participants_enrollment_date_idx
    on public.participants(enrollment_date)
    where enrollment_date is not null
      and deleted_at is null;

create index participants_created_at_idx
    on public.participants(created_at);

-- --------------------------------------------------------------------------
-- updated_at automation
-- --------------------------------------------------------------------------

create trigger trg_participants_set_updated_at
before update on public.participants
for each row
execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- Row Level Security
-- Policies will be added after participant and administrative roles are locked.
-- Until then, direct client access remains blocked by default.
-- --------------------------------------------------------------------------

alter table public.participants enable row level security;

-- --------------------------------------------------------------------------
-- Documentation
-- --------------------------------------------------------------------------

comment on table public.participants is
'Central master record for formally enrolled WPAG participants.';

comment on column public.participants.participant_code is
'Institutional participant identifier generated in WPAG-000001 format.';

comment on column public.participants.auth_user_id is
'Optional link between the participant record and Supabase authentication.';

comment on column public.participants.lifecycle_status is
'Operational lifecycle status of the participant within the WPAG platform.';

comment on column public.participants.research_status is
'Participant status within the WPAG research and evidence programme.';

comment on column public.participants.deleted_at is
'Soft-deletion timestamp. Participant evidence must not be physically deleted through normal application workflows.';
