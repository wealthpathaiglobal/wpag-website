-- ============================================================================
-- WEALTH PATH AI GLOBAL (WPAG)
-- Domain: Participant Management
-- Migration: 008_participant_profiles
-- Purpose: Create the participant_profiles table to maintain the current editable
--          participant profile while preserving immutable onboarding records.
-- ============================================================================

create table public.participant_profiles (

    id uuid primary key default gen_random_uuid(),

    participant_id uuid not null
        references public.participants(id)
        on update cascade
        on delete restrict,

    -- ------------------------------------------------------------------------
    -- Identity
    -- ------------------------------------------------------------------------

    first_name text not null,
    middle_name text,
    last_name text not null,
    preferred_name text,

    -- ------------------------------------------------------------------------
    -- Personal Information
    -- ------------------------------------------------------------------------

    date_of_birth date,
    gender text,
    marital_status text,

    -- ------------------------------------------------------------------------
    -- Contact Information
    -- ------------------------------------------------------------------------

    email text,
    phone_country_code text,
    phone_number text,

    -- ------------------------------------------------------------------------
    -- Address
    -- ------------------------------------------------------------------------

    country_code text,
    state text,
    district text,
    city text,
    postal_code text,

    -- ------------------------------------------------------------------------
    -- Education and Employment
    -- ------------------------------------------------------------------------

    education_level text,
    occupation text,
    employment_status text,

    -- ------------------------------------------------------------------------
    -- Household
    -- ------------------------------------------------------------------------

    household_size integer,
    dependents integer,

    -- ------------------------------------------------------------------------
    -- Emergency Contact
    -- ------------------------------------------------------------------------

    emergency_contact_name text,
    emergency_contact_relationship text,
    emergency_contact_phone text,

    -- ------------------------------------------------------------------------
    -- Profile Status
    -- ------------------------------------------------------------------------

    profile_completed boolean not null default false,
    profile_completed_at timestamptz,

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

alter table public.participant_profiles
    add constraint participant_profiles_participant_unique
    unique (participant_id);

alter table public.participant_profiles
    add constraint participant_profiles_gender_check
    check (
        gender is null
        or gender in ('male', 'female', 'other', 'prefer_not_to_say')
    );

alter table public.participant_profiles
    add constraint participant_profiles_household_size_check
    check (
        household_size is null
        or household_size >= 1
    );

alter table public.participant_profiles
    add constraint participant_profiles_dependents_check
    check (
        dependents is null
        or dependents >= 0
    );

alter table public.participant_profiles
    add constraint participant_profiles_dependents_household_check
    check (
        household_size is null
        or dependents is null
        or dependents <= household_size
    );

alter table public.participant_profiles
    add constraint participant_profiles_profile_completion_check
    check (
        (profile_completed = false and profile_completed_at is null)
        or
        (profile_completed = true and profile_completed_at is not null)
    );

-- ============================================================================
-- Indexes
-- ============================================================================

create index participant_profiles_last_name_idx
    on public.participant_profiles(last_name);

create index participant_profiles_city_idx
    on public.participant_profiles(city);

create index participant_profiles_deleted_at_idx
    on public.participant_profiles(deleted_at);

-- ============================================================================
-- Trigger
-- ============================================================================

create trigger set_participant_profiles_updated_at
before update on public.participant_profiles
for each row
execute function public.set_updated_at();

-- ============================================================================
-- Documentation
-- ============================================================================

comment on table public.participant_profiles is
'Current editable participant profile. Financial assessments are stored separately.';

comment on column public.participant_profiles.participant_id is
'Reference to the participant who owns this profile.';

comment on column public.participant_profiles.profile_completed is
'Indicates whether the participant profile has been completed.';

comment on column public.participant_profiles.deleted_at is
'Soft-delete timestamp. Profiles are not physically deleted.';
