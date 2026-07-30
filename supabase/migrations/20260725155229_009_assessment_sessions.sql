-- ============================================================================
-- WEALTH PATH AI GLOBAL (WPAG)
-- Domain: HFOS Diagnosis Engine
-- Migration: 009_assessment_sessions
-- Purpose: Create the assessment_sessions table to manage the lifecycle of
--          HFOS assessment workflows while preserving historical assessments.
-- ============================================================================
create table public.assessment_sessions (

    id uuid primary key default gen_random_uuid(),

    participant_id uuid not null
        references public.participants(id)
        on update cascade
        on delete restrict,

    -- ------------------------------------------------------------------------
    -- Assessment Identity
    -- ------------------------------------------------------------------------

    assessment_number integer not null,

    assessment_type text not null,
    
    assessment_version text not null default '1.0',

    -- ------------------------------------------------------------------------
    -- Workflow
    -- ------------------------------------------------------------------------

    status text not null default 'draft',

    current_stage text not null default 'application_review',

    -- ------------------------------------------------------------------------
    -- Timeline
    -- ------------------------------------------------------------------------

    started_at timestamptz,

    submitted_at timestamptz,

    completed_at timestamptz,

    cancelled_at timestamptz,

    -- ------------------------------------------------------------------------
    -- Assignment
    -- ------------------------------------------------------------------------

    assigned_to uuid,

    reviewed_by uuid,

    notes text,

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
-- Constraints
-- ============================================================================

alter table public.assessment_sessions
    add constraint assessment_sessions_participant_assessment_unique
    unique (participant_id, assessment_number);

alter table public.assessment_sessions
    add constraint assessment_sessions_type_check
    check (
        assessment_type in (
            'initial',
            'follow_up',
            'reassessment',
            'pilot',
            'research'
        )
    );

alter table public.assessment_sessions
    add constraint assessment_sessions_status_check
    check (
        status in (
            'draft',
            'in_progress',
            'submitted',
            'completed',
            'cancelled',
            'archived'
        )
    );

alter table public.assessment_sessions
    add constraint assessment_sessions_stage_check
    check (
        current_stage in (
            'application_review',
            'profile_review',
            'financial_data_collection',
            'assessment_processing',
            'report_generation',
            'treatment_planning',
            'completed'
        )
    );

alter table public.assessment_sessions
    add constraint assessment_sessions_number_check
    check (assessment_number >= 1);
-- ============================================================================
-- Indexes
-- ============================================================================

create index assessment_sessions_participant_idx
    on public.assessment_sessions(participant_id);

create index assessment_sessions_status_idx
    on public.assessment_sessions(status);

create index assessment_sessions_stage_idx
    on public.assessment_sessions(current_stage);

create index assessment_sessions_deleted_at_idx
    on public.assessment_sessions(deleted_at);

create index assessment_sessions_started_at_idx
    on public.assessment_sessions(started_at);
-- ============================================================================
-- Trigger
-- ============================================================================

create trigger set_assessment_sessions_updated_at
before update on public.assessment_sessions
for each row
execute function public.set_updated_at();
-- ============================================================================
-- Documentation
-- ============================================================================

comment on table public.assessment_sessions is
'Tracks the lifecycle of every HFOS assessment session for a participant.';

comment on column public.assessment_sessions.participant_id is
'Participant associated with this assessment session.';

comment on column public.assessment_sessions.assessment_number is
'Sequential assessment number for a participant.';

comment on column public.assessment_sessions.status is
'Current workflow status of the assessment session.';

comment on column public.assessment_sessions.current_stage is
'Current processing stage within the HFOS workflow.';

comment on column public.assessment_sessions.deleted_at is
'Soft-delete timestamp.';
