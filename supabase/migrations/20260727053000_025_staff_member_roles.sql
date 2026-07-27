-- ============================================================================
-- WEALTH PATH AI GLOBAL (WPAG)
-- Domain: Administration and Authorization
-- Migration: 025_staff_member_roles
-- Purpose:
-- Assign one or more institutional roles to each staff member.
-- ============================================================================

create table public.staff_member_roles (

    id uuid primary key default gen_random_uuid(),

    staff_member_id uuid not null
        references public.staff_members(id)
        on update cascade
        on delete cascade,

    staff_role_id uuid not null
        references public.staff_roles(id)
        on update cascade
        on delete restrict,

    assigned_at timestamptz not null default now(),

    assigned_by uuid
        references auth.users(id)
        on update cascade
        on delete set null,

    expires_at timestamptz,

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

    constraint staff_member_roles_unique_assignment
        unique (staff_member_id, staff_role_id),

    constraint staff_member_roles_expiry_check
        check (
            expires_at is null
            or expires_at > assigned_at
        )
);

create index staff_member_roles_staff_idx
    on public.staff_member_roles(staff_member_id);

create index staff_member_roles_role_idx
    on public.staff_member_roles(staff_role_id);

create index staff_member_roles_active_idx
    on public.staff_member_roles(is_active);

create trigger trg_staff_member_roles_set_updated_at
before update on public.staff_member_roles
for each row
execute function public.set_updated_at();

alter table public.staff_member_roles enable row level security;

comment on table public.staff_member_roles is
'Maps staff members to one or more institutional roles.';

comment on column public.staff_member_roles.assigned_by is
'Auth user that assigned the role.';

comment on column public.staff_member_roles.expires_at is
'Optional expiration timestamp for temporary role assignments.';