-- ============================================================================
-- WEALTH PATH AI GLOBAL (WPAG)
-- Domain: HFOS Diagnosis Engine
-- Migration: 011_assessment_answers
-- Purpose: Store raw, question-level responses captured for each assessment
--          without storing HFOS scores, diagnosis, treatment, or recommendations.
-- ============================================================================

create table public.assessment_answers (

    id uuid primary key default gen_random_uuid(),

    assessment_id uuid not null
        references public.assessments(id)
        on update cascade
        on delete restrict,

    -- ------------------------------------------------------------------------
    -- Question Identity
    -- ------------------------------------------------------------------------

    question_code text not null,

    question_version text not null default '1.0',

    section_code text not null,

    response_order integer not null,

    -- ------------------------------------------------------------------------
    -- Answer Values
    -- ------------------------------------------------------------------------

    answer_type text not null,

    answer_text text,

    answer_number numeric(18,2),

    answer_boolean boolean,

    answer_date date,

    answer_json jsonb,

    answer_unit text,

    answer_currency text,

    is_answered boolean not null default true,

    -- ------------------------------------------------------------------------
    -- Answer Metadata
    -- ------------------------------------------------------------------------

    source text not null default 'participant',

    confidence_level text,

    remarks text,

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

alter table public.assessment_answers
    add constraint assessment_answers_unique_response
    unique (
        assessment_id,
        question_code,
        response_order
    );

alter table public.assessment_answers
    add constraint assessment_answers_question_code_check
    check (btrim(question_code) <> '');

alter table public.assessment_answers
    add constraint assessment_answers_question_version_check
    check (btrim(question_version) <> '');

alter table public.assessment_answers
    add constraint assessment_answers_section_code_check
    check (btrim(section_code) <> '');

alter table public.assessment_answers
    add constraint assessment_answers_response_order_check
    check (response_order >= 1);

alter table public.assessment_answers
    add constraint assessment_answers_type_check
    check (
        answer_type in (
            'text',
            'number',
            'boolean',
            'date',
            'currency',
            'choice',
            'multiple_choice',
            'json'
        )
    );

alter table public.assessment_answers
    add constraint assessment_answers_source_check
    check (
        source in (
            'participant',
            'reviewer',
            'system',
            'import'
        )
    );
  
-- ============================================================================
-- Indexes
-- ============================================================================

create index assessment_answers_question_idx
    on public.assessment_answers(question_code);

create index assessment_answers_section_idx
    on public.assessment_answers(section_code);

create index assessment_answers_deleted_at_idx
    on public.assessment_answers(deleted_at);

-- ============================================================================
-- Trigger
-- ============================================================================

create trigger set_assessment_answers_updated_at
before update on public.assessment_answers
for each row
execute function public.set_updated_at();

-- ============================================================================
-- Documentation
-- ============================================================================

comment on table public.assessment_answers is
'Stores immutable raw participant responses for each assessment question.';

comment on column public.assessment_answers.assessment_id is
'Assessment to which this answer belongs.';

comment on column public.assessment_answers.question_code is
'Unique code identifying the assessment question.';

comment on column public.assessment_answers.question_version is
'Version of the assessment question presented to the participant.';

comment on column public.assessment_answers.section_code is
'Assessment section containing the question.';

comment on column public.assessment_answers.answer_type is
'Data type of the recorded answer.';

comment on column public.assessment_answers.is_answered is
'Indicates whether the participant provided an answer.';

comment on column public.assessment_answers.source is
'Origin of the recorded answer.';

comment on column public.assessment_answers.deleted_at is
'Soft-delete timestamp.';
