-- ============================================================================
-- Wealth Path AI Global
-- Migration: DB-014 — Assessment Audit Log
-- Purpose:
--   Maintain an immutable audit trail for assessment lifecycle events.
--
-- Boundary:
--   This table records historical events only.
--   Existing records must never be updated or deleted by application logic.
-- ============================================================================

create table public.assessment_audit_log (

    -- ------------------------------------------------------------------------
    -- Identity
    -- ------------------------------------------------------------------------

    id uuid primary key default gen_random_uuid(),

    assessment_id uuid not null,

    -- ------------------------------------------------------------------------
    -- Event
    -- ------------------------------------------------------------------------

    event_type text not null,

    event_source text not null default 'system',

    event_description text,

    -- ------------------------------------------------------------------------
    -- Actor
    -- ------------------------------------------------------------------------

    actor_id uuid,

    actor_type text not null default 'system',

    -- ------------------------------------------------------------------------
    -- Context
    -- ------------------------------------------------------------------------

    previous_status text,

    new_status text,

    metadata jsonb,

    ip_address inet,

    user_agent text,

    -- ------------------------------------------------------------------------
    -- Audit Timestamp
    -- ------------------------------------------------------------------------

    occurred_at timestamptz not null default now(),

    created_at timestamptz not null default now()

);

-- ============================================================================
-- Foreign Keys
-- ============================================================================

alter table public.assessment_audit_log
    add constraint assessment_audit_log_assessment_fk
    foreign key (assessment_id)
    references public.assessments(id)
    on delete cascade;

-- ============================================================================
-- Constraints
-- ============================================================================

alter table public.assessment_audit_log
    add constraint assessment_audit_log_event_type_check
    check (btrim(event_type) <> '');

alter table public.assessment_audit_log
    add constraint assessment_audit_log_event_source_check
    check (
        event_source in (
            'system',
            'participant',
            'reviewer',
            'administrator',
            'api'
        )
    );

alter table public.assessment_audit_log
    add constraint assessment_audit_log_actor_type_check
    check (
        actor_type in (
            'system',
            'participant',
            'reviewer',
            'administrator'
        )
    );

alter table public.assessment_audit_log
    add constraint assessment_audit_log_description_check
    check (
        event_description is null
        or btrim(event_description) <> ''
    );

alter table public.assessment_audit_log
    add constraint assessment_audit_log_status_change_check
    check (
        previous_status is null
        or btrim(previous_status) <> ''
    );

alter table public.assessment_audit_log
    add constraint assessment_audit_log_new_status_check
    check (
        new_status is null
        or btrim(new_status) <> ''
    );

-- ============================================================================
-- Indexes
-- ============================================================================

create index assessment_audit_log_assessment_idx
    on public.assessment_audit_log(assessment_id);

create index assessment_audit_log_event_type_idx
    on public.assessment_audit_log(event_type);

create index assessment_audit_log_event_source_idx
    on public.assessment_audit_log(event_source);

create index assessment_audit_log_actor_idx
    on public.assessment_audit_log(actor_id);

create index assessment_audit_log_occurred_at_idx
    on public.assessment_audit_log(occurred_at);

create index assessment_audit_log_assessment_time_idx
    on public.assessment_audit_log(
        assessment_id,
        occurred_at
    );

-- ============================================================================
-- Documentation
-- ============================================================================

comment on table public.assessment_audit_log is
'Immutable audit history for assessment lifecycle events.';

comment on column public.assessment_audit_log.assessment_id is
'Assessment associated with the audit event.';

comment on column public.assessment_audit_log.event_type is
'Type of lifecycle event recorded.';

comment on column public.assessment_audit_log.event_source is
'Origin of the event such as system, participant, reviewer, administrator, or API.';

comment on column public.assessment_audit_log.actor_id is
'Identifier of the user or system responsible for the event.';

comment on column public.assessment_audit_log.actor_type is
'Role of the actor responsible for the event.';

comment on column public.assessment_audit_log.previous_status is
'Assessment status before the event occurred.';

comment on column public.assessment_audit_log.new_status is
'Assessment status after the event occurred.';

comment on column public.assessment_audit_log.metadata is
'Optional structured event metadata.';

comment on column public.assessment_audit_log.occurred_at is
'Timestamp when the event actually occurred.';
