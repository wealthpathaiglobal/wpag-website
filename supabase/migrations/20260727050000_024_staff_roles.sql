-- ============================================================================
-- WEALTH PATH AI GLOBAL (WPAG)
-- Domain: Administration and Authorization
-- Migration: 024_staff_roles
-- Purpose:
-- Define the institutional role catalogue used to classify authorized WPAG
-- staff identities across administrative, review, research, verification,
-- support, and governance workflows.
-- ============================================================================

create table public.staff_roles (
    id uuid primary key default gen_random_uuid(),

    role_code text not null unique,

    role_name text not null unique,

    description text,

    is_system_role boolean not null default true,

    is_active boolean not null default true,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    created_by uuid
        references auth.users(id)
        on update cascade
        on delete set null,

    updated_by uuid
        references auth.users(id)
        on update cascade
        on delete set null,

    constraint staff_roles_code_format_check
        check (
            role_code ~ '^[a-z][a-z0-9_]*$'
        ),

    constraint staff_roles_name_check
        check (
            length(trim(role_name)) >= 2
        )
);

create index staff_roles_active_idx
    on public.staff_roles(is_active);

create index staff_roles_system_role_idx
    on public.staff_roles(is_system_role);

create index staff_roles_created_at_idx
    on public.staff_roles(created_at desc);

create trigger trg_staff_roles_set_updated_at
before update on public.staff_roles
for each row
execute function public.set_updated_at();

alter table public.staff_roles enable row level security;

insert into public.staff_roles (
    role_code,
    role_name,
    description,
    is_system_role,
    is_active
)
values
    (
        'founder',
        'Founder',
        'Highest institutional governance authority with full platform oversight.',
        true,
        true
    ),
    (
        'administrator',
        'Administrator',
        'Manages participant onboarding, invitations, staff operations, and administrative workflows.',
        true,
        true
    ),
    (
        'reviewer',
        'Reviewer',
        'Performs eligibility, assessment, and structured case reviews.',
        true,
        true
    ),
    (
        'evidence_verifier',
        'Evidence Verifier',
        'Validates submitted evidence, documents, and verification outcomes.',
        true,
        true
    ),
    (
        'research_coordinator',
        'Research Coordinator',
        'Coordinates participant research workflows, evidence collection, and follow-up operations.',
        true,
        true
    ),
    (
        'support',
        'Support',
        'Provides participant and operational support without administrative governance authority.',
        true,
        true
    );

comment on table public.staff_roles is
'Institutional role catalogue for WPAG staff authorization and governance.';

comment on column public.staff_roles.role_code is
'Stable machine-readable role identifier used in authorization logic.';

comment on column public.staff_roles.role_name is
'Human-readable institutional role name.';

comment on column public.staff_roles.is_system_role is
'Indicates that the role is part of the core WPAG authorization model and should not be casually deleted or renamed.';

comment on column public.staff_roles.is_active is
'Indicates whether the role may currently be assigned to staff members.';
