-- ============================================================================
-- WEALTH PATH AI GLOBAL (WPAG)
-- Domain: Participant Enrollment and Lifecycle
-- Migration: 028_participant_lifecycle_history
-- Purpose:
-- Create immutable participant lifecycle transition history and preserve the
-- initial lifecycle state of existing participants.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Participant lifecycle history
-- --------------------------------------------------------------------------

create table public.participant_lifecycle_history (
    id uuid primary key default gen_random_uuid(),

    participant_id uuid not null
        references public.participants(id)
        on update cascade
        on delete restrict,

    from_status text,

    to_status text not null,

    transition_reason text,

    changed_by uuid
        references auth.users(id)
        on update cascade
        on delete set null,

    changed_at timestamptz not null default now(),

    metadata jsonb not null default '{}'::jsonb,

    constraint participant_lifecycle_history_from_status_check
        check (
            from_status is null
            or from_status in (
                'pending_enrollment',
                'active',
                'paused',
                'completed',
                'withdrawn',
                'archived'
            )
        ),

    constraint participant_lifecycle_history_to_status_check
        check (
            to_status in (
                'pending_enrollment',
                'active',
                'paused',
                'completed',
                'withdrawn',
                'archived'
            )
        ),

    constraint participant_lifecycle_history_transition_check
        check (
            from_status is null
            or from_status <> to_status
        ),

    constraint participant_lifecycle_history_metadata_check
        check (
            jsonb_typeof(metadata) = 'object'
        )
);

-- --------------------------------------------------------------------------
-- Indexes
-- --------------------------------------------------------------------------

create index participant_lifecycle_history_participant_idx
    on public.participant_lifecycle_history(
        participant_id,
        changed_at desc
    );

create index participant_lifecycle_history_to_status_idx
    on public.participant_lifecycle_history(
        to_status,
        changed_at desc
    );

create index participant_lifecycle_history_changed_by_idx
    on public.participant_lifecycle_history(changed_by)
    where changed_by is not null;

-- --------------------------------------------------------------------------
-- Row Level Security
-- Direct client access remains blocked until explicit policies are introduced.
-- --------------------------------------------------------------------------

alter table public.participant_lifecycle_history
    enable row level security;

-- --------------------------------------------------------------------------
-- Preserve initial lifecycle state for existing participants
-- --------------------------------------------------------------------------

insert into public.participant_lifecycle_history (
    participant_id,
    from_status,
    to_status,
    transition_reason,
    changed_by,
    changed_at,
    metadata
)
select
    p.id,
    null,
    p.lifecycle_status,
    'Initial lifecycle state recorded during lifecycle history migration.',
    p.created_by,
    p.created_at,
    jsonb_build_object(
        'source', 'migration',
        'migration', '028_participant_lifecycle_history'
    )
from public.participants p
where not exists (
    select 1
    from public.participant_lifecycle_history h
    where h.participant_id = p.id
);

-- --------------------------------------------------------------------------
-- Documentation
-- --------------------------------------------------------------------------

comment on table public.participant_lifecycle_history is
'Immutable audit history of participant lifecycle transitions.';

comment on column public.participant_lifecycle_history.participant_id is
'Participant whose lifecycle state changed.';

comment on column public.participant_lifecycle_history.from_status is
'Lifecycle status before the transition. Null represents the initial recorded state.';

comment on column public.participant_lifecycle_history.to_status is
'Lifecycle status after the transition.';

comment on column public.participant_lifecycle_history.transition_reason is
'Institutional reason supplied for the lifecycle transition.';

comment on column public.participant_lifecycle_history.changed_by is
'Authenticated staff or system user responsible for the lifecycle transition.';

comment on column public.participant_lifecycle_history.changed_at is
'Timestamp when the lifecycle transition was recorded.';

comment on column public.participant_lifecycle_history.metadata is
'Structured contextual metadata associated with the lifecycle transition.';
