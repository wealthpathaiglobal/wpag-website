-- ============================================================================
-- WEALTH PATH AI GLOBAL (WPAG)
-- Domain: HFOS Diagnosis Engine
-- Migration: 010_assessments
-- Purpose: Create the assessments table to preserve immutable point-in-time
--          financial assessment snapshots.
-- ============================================================================

create table public.assessments (

    id uuid primary key default gen_random_uuid(),

    participant_id uuid not null
        references public.participants(id)
        on update cascade
        on delete restrict,

    assessment_session_id uuid not null
        references public.assessment_sessions(id)
        on update cascade
        on delete restrict,

    -- ------------------------------------------------------------------------
    -- Assessment Identity
    -- ------------------------------------------------------------------------

    assessment_number integer not null,

    assessment_version text not null default '1.0',

    hfos_version text not null default '1.0',    -- ------------------------------------------------------------------------
    -- Assessment Context
    -- ------------------------------------------------------------------------

    assessment_date date not null,

    currency_code text not null,

    country_code text not null,

    region_code text,

    household_size integer not null,

    dependents integer not null default 0,

    earning_members integer not null default 1,    -- ------------------------------------------------------------------------
    -- Income Snapshot
    -- ------------------------------------------------------------------------

    salary_income numeric(18,2) not null default 0.00,

    business_income numeric(18,2) not null default 0.00,

    rental_income numeric(18,2) not null default 0.00,

    investment_income numeric(18,2) not null default 0.00,

    pension_income numeric(18,2) not null default 0.00,

    government_income numeric(18,2) not null default 0.00,

    other_income numeric(18,2) not null default 0.00,

    total_income numeric(18,2) not null default 0.00,    -- ------------------------------------------------------------------------
    -- Expense Snapshot
    -- ------------------------------------------------------------------------

    housing_expense numeric(18,2) not null default 0.00,

    food_expense numeric(18,2) not null default 0.00,

    utilities_expense numeric(18,2) not null default 0.00,

    transport_expense numeric(18,2) not null default 0.00,

    healthcare_expense numeric(18,2) not null default 0.00,

    education_expense numeric(18,2) not null default 0.00,

    insurance_expense numeric(18,2) not null default 0.00,

    debt_payment_expense numeric(18,2) not null default 0.00,

    lifestyle_expense numeric(18,2) not null default 0.00,

    other_expense numeric(18,2) not null default 0.00,

    total_expense numeric(18,2) not null default 0.00,    -- ------------------------------------------------------------------------
    -- Asset Snapshot
    -- ------------------------------------------------------------------------

    cash_assets numeric(18,2) not null default 0.00,

    bank_assets numeric(18,2) not null default 0.00,

    investment_assets numeric(18,2) not null default 0.00,

    retirement_assets numeric(18,2) not null default 0.00,

    real_estate_assets numeric(18,2) not null default 0.00,

    vehicle_assets numeric(18,2) not null default 0.00,

    business_assets numeric(18,2) not null default 0.00,

    other_assets numeric(18,2) not null default 0.00,

    total_assets numeric(18,2) not null default 0.00,    -- ------------------------------------------------------------------------
    -- Liability Snapshot
    -- ------------------------------------------------------------------------

    home_loan numeric(18,2) not null default 0.00,

    personal_loan numeric(18,2) not null default 0.00,

    vehicle_loan numeric(18,2) not null default 0.00,

    education_loan numeric(18,2) not null default 0.00,

    credit_card_debt numeric(18,2) not null default 0.00,

    informal_debt numeric(18,2) not null default 0.00,

    business_debt numeric(18,2) not null default 0.00,

    other_liabilities numeric(18,2) not null default 0.00,

    total_liabilities numeric(18,2) not null default 0.00,

    -- ------------------------------------------------------------------------
    -- Audit
    -- ------------------------------------------------------------------------

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    deleted_at timestamptz,

    created_by uuid,

    updated_by uuid

);-- ============================================================================
-- Constraints
-- ============================================================================

alter table public.assessments
    add constraint assessments_session_unique
    unique (assessment_session_id);

alter table public.assessments
    add constraint assessments_participant_number_unique
    unique (participant_id, assessment_number);

alter table public.assessments
    add constraint assessments_number_check
    check (assessment_number >= 1);

alter table public.assessments
    add constraint assessments_version_check
    check (btrim(assessment_version) <> '');

alter table public.assessments
    add constraint assessments_hfos_version_check
    check (btrim(hfos_version) <> '');

alter table public.assessments
    add constraint assessments_currency_code_check
    check (currency_code ~ '^[A-Z]{3}$');

alter table public.assessments
    add constraint assessments_country_code_check
    check (country_code ~ '^[A-Z]{2}$');

alter table public.assessments
    add constraint assessments_household_size_check
    check (household_size >= 1);

alter table public.assessments
    add constraint assessments_dependents_check
    check (
        dependents >= 0
        and dependents <= household_size
    );

alter table public.assessments
    add constraint assessments_earning_members_check
    check (
        earning_members >= 0
        and earning_members <= household_size
    );alter table public.assessments
    add constraint assessments_income_values_check
    check (
        salary_income >= 0
        and business_income >= 0
        and rental_income >= 0
        and investment_income >= 0
        and pension_income >= 0
        and government_income >= 0
        and other_income >= 0
        and total_income >= 0
    );

alter table public.assessments
    add constraint assessments_expense_values_check
    check (
        housing_expense >= 0
        and food_expense >= 0
        and utilities_expense >= 0
        and transport_expense >= 0
        and healthcare_expense >= 0
        and education_expense >= 0
        and insurance_expense >= 0
        and debt_payment_expense >= 0
        and lifestyle_expense >= 0
        and other_expense >= 0
        and total_expense >= 0
    );

alter table public.assessments
    add constraint assessments_asset_values_check
    check (
        cash_assets >= 0
        and bank_assets >= 0
        and investment_assets >= 0
        and retirement_assets >= 0
        and real_estate_assets >= 0
        and vehicle_assets >= 0
        and business_assets >= 0
        and other_assets >= 0
        and total_assets >= 0
    );

alter table public.assessments
    add constraint assessments_liability_values_check
    check (
        home_loan >= 0
        and personal_loan >= 0
        and vehicle_loan >= 0
        and education_loan >= 0
        and credit_card_debt >= 0
        and informal_debt >= 0
        and business_debt >= 0
        and other_liabilities >= 0
        and total_liabilities >= 0
    );

alter table public.assessments
    add constraint assessments_total_income_check
    check (
        total_income =
            salary_income
            + business_income
            + rental_income
            + investment_income
            + pension_income
            + government_income
            + other_income
    );

alter table public.assessments
    add constraint assessments_total_expense_check
    check (
        total_expense =
            housing_expense
            + food_expense
            + utilities_expense
            + transport_expense
            + healthcare_expense
            + education_expense
            + insurance_expense
            + debt_payment_expense
            + lifestyle_expense
            + other_expense
    );

alter table public.assessments
    add constraint assessments_total_assets_check
    check (
        total_assets =
            cash_assets
            + bank_assets
            + investment_assets
            + retirement_assets
            + real_estate_assets
            + vehicle_assets
            + business_assets
            + other_assets
    );

alter table public.assessments
    add constraint assessments_total_liabilities_check
    check (
        total_liabilities =
            home_loan
            + personal_loan
            + vehicle_loan
            + education_loan
            + credit_card_debt
            + informal_debt
            + business_debt
            + other_liabilities
    );-- ============================================================================
-- Indexes
-- ============================================================================

create index assessments_participant_idx
    on public.assessments(participant_id);

create index assessments_session_idx
    on public.assessments(assessment_session_id);

create index assessments_assessment_date_idx
    on public.assessments(assessment_date);

create index assessments_deleted_at_idx
    on public.assessments(deleted_at);

create index assessments_participant_date_idx
    on public.assessments(participant_id, assessment_date desc);

-- ============================================================================
-- Trigger
-- ============================================================================

create trigger set_assessments_updated_at
before update on public.assessments
for each row
execute function public.set_updated_at();

-- ============================================================================
-- Documentation
-- ============================================================================

comment on table public.assessments is
'Stores immutable point-in-time financial assessment snapshots captured through HFOS assessment sessions.';

comment on column public.assessments.participant_id is
'Participant whose financial position is represented by this assessment.';

comment on column public.assessments.assessment_session_id is
'Assessment workflow session that produced this financial snapshot.';

comment on column public.assessments.assessment_number is
'Sequential assessment number assigned to the participant.';

comment on column public.assessments.assessment_version is
'Version of the assessment data structure used to capture the snapshot.';

comment on column public.assessments.hfos_version is
'Version of the HFOS framework applicable to the assessment.';

comment on column public.assessments.assessment_date is
'Effective date of the point-in-time financial snapshot.';

comment on column public.assessments.currency_code is
'Three-letter uppercase currency code used for financial values.';

comment on column public.assessments.country_code is
'Two-letter uppercase country code associated with the assessment.';

comment on column public.assessments.total_income is
'Validated total of all income components recorded in the assessment.';

comment on column public.assessments.total_expense is
'Validated total of all expense components recorded in the assessment.';

comment on column public.assessments.total_assets is
'Validated total of all asset components recorded in the assessment.';

comment on column public.assessments.total_liabilities is
'Validated total of all liability components recorded in the assessment.';

comment on column public.assessments.deleted_at is
'Soft-delete timestamp.';
