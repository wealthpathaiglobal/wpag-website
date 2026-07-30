-- ============================================================================
-- WEALTH PATH AI GLOBAL (WPAG)
-- Domain: Administration and Authorization
-- Migration: 023_staff_members
-- Purpose:
-- Create the institutional staff identity registry used for administrative,
-- review, research, verification, and operational platform access.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Staff code sequence
-- Generates institutional staff codes such as WPAG-STF-000001.
-- --------------------------------------------------------------------------

create sequence if not exists public.staff_code_seq
    start with 1
    increment by 1
    minvalue 1
    no maxvalue
    cache 1;

-- --------------------------------------------------------------------------
-- Staff Members
-- One institutional identity record for every authorized WPAG team member.
--
-- This table represents platform identities, not payroll or HR employment.
-- Roles and permissions are maintained separately.
-- --------------------------------------------------------------------------

create table public.staff_members (
    id uuid primary key default gen_random_uuid(),

    staff_code text not null unique
        default (
            'WPAG-STF-' ||
            lpad(nextval('public.staff_code_seq')::text, 6, '0')
        ),

    auth_user_id uuid not null unique
        references auth.users(id)
        on update cascade
        on delete restrict,

    full_name text not null,

    email extensions.citext not null unique,

    status text not null default 'active'
        check (
            status in (
                'active',
                'inactive',
                'suspended',
                'archived'
            )
        ),

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

    constraint staff_members_code_format_check
        check (
            staff_code ~ '^WPAG-STF-[0-9]{6,}$'
        ),

    constraint staff_members_full_name_check
        check (
            length(trim(full_name)) >= 2
        ),

    constraint staff_members_email_check
        check (
            email::text ~*
            '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
        ),

    constraint staff_members_deleted_at_check
        check (
            deleted_at is null
            or deleted_at >= created_at
        ),

    constraint staff_members_archived_state_check
        check (
            status <> 'archived'
            or deleted_at is not null
        )
);

-- --------------------------------------------------------------------------
-- Indexes
-- --------------------------------------------------------------------------

create index staff_members_auth_user_id_idx
    on public.staff_members(auth_user_id)
    where deleted_at is null;

create index staff_members_email_idx
    on public.staff_members(email)
    where deleted_at is null;

create index staff_members_status_idx
    on public.staff_members(status)
    where deleted_at is null;

create index staff_members_created_at_idx
    on public.staff_members(created_at desc);

-- --------------------------------------------------------------------------
-- updated_at automation
-- --------------------------------------------------------------------------

create trigger trg_staff_members_set_updated_at
before update on public.staff_members
for each row
execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- Row Level Security
-- Policies will be introduced after staff roles and authorization functions
-- are established in subsequent migrations.
-- Until then, direct client access remains blocked by default.
-- --------------------------------------------------------------------------

alter table public.staff_members enable row level security;

-- --------------------------------------------------------------------------
-- Documentation
-- --------------------------------------------------------------------------

comment on table public.staff_members is
'Institutional identity registry for authorized WPAG staff, reviewers, researchers, verifiers, administrators, and operational personnel.';

comment on column public.staff_members.staff_code is
'Institutional staff identifier generated in WPAG-STF-000001 format.';

comment on column public.staff_members.auth_user_id is
'Canonical link between the staff identity and Supabase authentication.';

comment on column public.staff_members.full_name is
'Official display name used within WPAG administrative and audit workflows.';

comment on column public.staff_members.email is
'Institutional or approved email address associated with the staff identity.';

comment on column public.staff_members.status is
'Current institutional access status: active, inactive, suspended, or archived.';

comment on column public.staff_members.deleted_at is
'Soft-deletion timestamp. Archived institutional identities remain preserved for audit history.';