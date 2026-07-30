-- ============================================================================
-- Wealth Path AI Global
-- Migration: DB-013 — Assessment Reviews
-- Purpose:
--   Store human review, quality validation, and evidence-review decisions for
--   completed or submitted assessments.
--
-- Boundary:
--   This table does not store HFOS scoring, diagnosis, treatment, or outcome
--   recommendations. It records assessment-review workflow only.
-- ============================================================================

create table public.assessment_reviews (

    -- ------------------------------------------------------------------------
    -- Identity
    -- ------------------------------------------------------------------------

    id uuid primary key default gen_random_uuid(),

    assessment_id uuid not null,

    -- ------------------------------------------------------------------------
    -- Review Workflow
    -- ------------------------------------------------------------------------

    review_status text not null default 'pending',

    review_decision text,

    review_started_at timestamptz,

    review_completed_at timestamptz,

    reviewed_by uuid,

    -- ------------------------------------------------------------------------
    -- Review Content
    -- ------------------------------------------------------------------------

    review_notes text,

    information_request text,

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

alter table public.assessment_reviews
    add constraint assessment_reviews_assessment_fk
    foreign key (assessment_id)
    references public.assessments(id)
    on delete cascade;

-- ============================================================================
-- Constraints
-- ============================================================================

alter table public.assessment_reviews
    add constraint assessment_reviews_status_check
    check (
        review_status in (
            'pending',
            'in_review',
            'completed',
            'returned'
        )
    );

alter table public.assessment_reviews
    add constraint assessment_reviews_decision_check
    check (
        review_decision is null
        or review_decision in (
            'approved',
            'rejected',
            'needs_information'
        )
    );

alter table public.assessment_reviews
    add constraint assessment_reviews_started_at_check
    check (
        review_status = 'pending'
        or review_started_at is not null
    );

alter table public.assessment_reviews
    add constraint assessment_reviews_completion_time_check
    check (
        review_completed_at is null
        or (
            review_started_at is not null
            and review_completed_at >= review_started_at
        )
    );

alter table public.assessment_reviews
    add constraint assessment_reviews_completed_metadata_check
    check (
        review_status <> 'completed'
        or (
            review_decision in (
                'approved',
                'rejected'
            )
            and review_started_at is not null
            and review_completed_at is not null
            and reviewed_by is not null
        )
    );

alter table public.assessment_reviews
    add constraint assessment_reviews_returned_metadata_check
    check (
        review_status <> 'returned'
        or (
            review_decision = 'needs_information'
            and review_started_at is not null
            and review_completed_at is not null
            and reviewed_by is not null
            and information_request is not null
            and btrim(information_request) <> ''
        )
    );

alter table public.assessment_reviews
    add constraint assessment_reviews_pending_metadata_check
    check (
        review_status <> 'pending'
        or (
            review_decision is null
            and review_started_at is null
            and review_completed_at is null
            and reviewed_by is null
        )
    );

alter table public.assessment_reviews
    add constraint assessment_reviews_in_review_metadata_check
    check (
        review_status <> 'in_review'
        or (
            review_decision is null
            and review_started_at is not null
            and review_completed_at is null
            and reviewed_by is not null
        )
    );

alter table public.assessment_reviews
    add constraint assessment_reviews_notes_check
    check (
        review_notes is null
        or btrim(review_notes) <> ''
    );

alter table public.assessment_reviews
    add constraint assessment_reviews_information_request_check
    check (
        information_request is null
        or btrim(information_request) <> ''
    );

-- ============================================================================
-- Indexes
-- ============================================================================

create unique index assessment_reviews_one_active_review_idx
    on public.assessment_reviews(assessment_id)
    where deleted_at is null;

create index assessment_reviews_assessment_idx
    on public.assessment_reviews(assessment_id);

create index assessment_reviews_status_idx
    on public.assessment_reviews(review_status);

create index assessment_reviews_decision_idx
    on public.assessment_reviews(review_decision);

create index assessment_reviews_reviewer_idx
    on public.assessment_reviews(reviewed_by);

create index assessment_reviews_deleted_at_idx
    on public.assessment_reviews(deleted_at);

create index assessment_reviews_active_workflow_idx
    on public.assessment_reviews(
        review_status,
        created_at
    )
    where deleted_at is null;

-- ============================================================================
-- Trigger
-- ============================================================================

create trigger set_assessment_reviews_updated_at
before update on public.assessment_reviews
for each row
execute function public.set_updated_at();

-- ============================================================================
-- Documentation
-- ============================================================================

comment on table public.assessment_reviews is
    'Stores human review workflow, quality validation, and evidence-review decisions for assessments.';

comment on column public.assessment_reviews.id is
    'Primary identifier for the assessment review record.';

comment on column public.assessment_reviews.assessment_id is
    'Assessment being reviewed. Only one non-deleted active review is permitted per assessment.';

comment on column public.assessment_reviews.review_status is
    'Current review workflow state: pending, in_review, completed, or returned.';

comment on column public.assessment_reviews.review_decision is
    'Review outcome: approved, rejected, or needs_information. Null while the review has no decision.';

comment on column public.assessment_reviews.review_started_at is
    'Timestamp when active human review began.';

comment on column public.assessment_reviews.review_completed_at is
    'Timestamp when the current review decision was completed or returned.';

comment on column public.assessment_reviews.reviewed_by is
    'Identifier of the authorised reviewer responsible for the review decision.';

comment on column public.assessment_reviews.review_notes is
    'Optional reviewer observations, validation notes, or decision rationale.';

comment on column public.assessment_reviews.information_request is
    'Information or evidence requested when an assessment is returned for clarification.';

comment on column public.assessment_reviews.created_at is
    'Timestamp when the review record was created.';

comment on column public.assessment_reviews.updated_at is
    'Timestamp when the review record was last updated.';

comment on column public.assessment_reviews.deleted_at is
    'Soft-deletion timestamp. Null indicates an active review record.';

comment on column public.assessment_reviews.created_by is
    'Identifier of the actor or system that created the review record.';

comment on column public.assessment_reviews.updated_by is
    'Identifier of the actor or system that last updated the review record.';
