-- ============================================================================
-- WEALTH PATH AI GLOBAL (WPAG)
-- Migration: 005_eligibility_reviews
-- Purpose: Record structured eligibility reviews for programme applications.
-- ============================================================================

create table public.eligibility_reviews (
    id uuid primary key default gen_random_uuid(),

    application_id uuid not null
        references public.applications(id)
        on update cascade
        on delete restrict,

    review_number integer not null default 1
        check (review_number > 0),

    review_status text not null default 'pending'
        check (
            review_status in (
                'pending',
                'in_review',
                'completed',
                'cancelled'
            )
        ),

    decision text not null default 'pending'
        check (
            decision in (
                'pending',
                'eligible',
                'conditionally_eligible',
                'ineligible'
            )
        ),

    eligibility_score numeric(5,2)
        check (
            eligibility_score is null
            or eligibility_score between 0 and 100
        ),

    criteria_results jsonb not null default '{}'::jsonb
        check (jsonb_typeof(criteria_results) = 'object'),

    decision_summary text,

    eligibility_conditions text,

    ineligibility_reason text,

    additional_information_required text,

    started_at timestamptz,

    completed_at timestamptz,

    reviewed_by uuid
        references auth.users(id)
        on update cascade
        on delete set null,

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

    constraint eligibility_reviews_application_review_unique
        unique (application_id, review_number),

    constraint eligibility_reviews_started_at_check
        check (
            started_at is null
            or started_at >= created_at
        ),

    constraint eligibility_reviews_completed_at_check
        check (
            completed_at is null
            or started_at is null
            or completed_at >= started_at
        ),

    constraint eligibility_reviews_completed_state_check
        check (
            review_status <> 'completed'
            or (
                decision <> 'pending'
                and completed_at is not null
                and reviewed_by is not null
            )
        ),

    constraint eligibility_reviews_pending_decision_check
        check (
            review_status = 'completed'
            or decision = 'pending'
        ),

    constraint eligibility_reviews_conditional_reason_check
        check (
            decision <> 'conditionally_eligible'
            or eligibility_conditions is not null
        ),

    constraint eligibility_reviews_ineligible_reason_check
        check (
            decision <> 'ineligible'
            or ineligibility_reason is not null
        ),

    constraint eligibility_reviews_deleted_at_check
        check (
            deleted_at is null
            or deleted_at >= created_at
        )
);

-- --------------------------------------------------------------------------
-- Indexes
-- --------------------------------------------------------------------------

create index eligibility_reviews_application_id_idx
    on public.eligibility_reviews(application_id)
    where deleted_at is null;

create index eligibility_reviews_status_idx
    on public.eligibility_reviews(review_status)
    where deleted_at is null;

create index eligibility_reviews_decision_idx
    on public.eligibility_reviews(decision)
    where deleted_at is null;

create index eligibility_reviews_reviewer_idx
    on public.eligibility_reviews(reviewed_by)
    where reviewed_by is not null
      and deleted_at is null;

create index eligibility_reviews_created_at_idx
    on public.eligibility_reviews(created_at desc);

-- Only one pending or active review may exist for an application.
create unique index eligibility_reviews_one_active_review_idx
    on public.eligibility_reviews(application_id)
    where review_status in ('pending', 'in_review')
      and deleted_at is null;

-- --------------------------------------------------------------------------
-- updated_at automation
-- --------------------------------------------------------------------------

create trigger trg_eligibility_reviews_set_updated_at
before update on public.eligibility_reviews
for each row
execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- Row Level Security
-- Policies will be added after administrative and reviewer roles are created.
-- --------------------------------------------------------------------------

alter table public.eligibility_reviews enable row level security;

-- --------------------------------------------------------------------------
-- Documentation
-- --------------------------------------------------------------------------

comment on table public.eligibility_reviews is
'Structured eligibility assessments performed for WPAG programme applications.';

comment on column public.eligibility_reviews.review_number is
'Sequential review attempt number for an application.';

comment on column public.eligibility_reviews.criteria_results is
'Structured eligibility criteria and outcomes stored as a JSON object.';

comment on column public.eligibility_reviews.decision is
'Final eligibility decision recorded when the review is completed.';

comment on column public.eligibility_reviews.deleted_at is
'Soft-deletion timestamp preserving eligibility-review evidence and history.';
