-- ============================================================================
-- WEALTH PATH AI GLOBAL (WPAG)
-- Domain: Authentication and Participant Onboarding
-- Migration: 022_participant_invitations
-- Purpose:
-- Maintain an auditable invitation lifecycle for approved participants.
--
-- Authentication ownership:
-- - public.participants.auth_user_id is the canonical Auth relationship.
-- - Invitation tokens remain managed by Supabase Auth and are never stored here.
-- ============================================================================

create table public.participant_invitations (
    id uuid primary key default gen_random_uuid(),

    participant_id uuid not null
        references public.participants(id)
        on update cascade
        on delete restrict,

    email extensions.citext not null,

    auth_user_id uuid
        references auth.users(id)
        on update cascade
        on delete set null,

    status text not null default 'pending'
        check (
            status in (
                'pending',
                'sent',
                'accepted',
                'revoked',
                'expired',
                'failed'
            )
        ),

    invited_at timestamptz,
    accepted_at timestamptz,
    revoked_at timestamptz,
    expires_at timestamptz,

    invitation_attempts integer not null default 0
        check (invitation_attempts >= 0),

    last_error text,

    invited_by uuid
        references auth.users(id)
        on update cascade
        on delete set null,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint participant_invitations_email_check
        check (
            email::text ~*
            '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
        ),

    constraint participant_invitations_sent_state_check
        check (
            status not in ('sent', 'accepted')
            or invited_at is not null
        ),

    constraint participant_invitations_accepted_state_check
        check (
            status <> 'accepted'
            or (
                accepted_at is not null
                and auth_user_id is not null
            )
        ),

    constraint participant_invitations_revoked_state_check
        check (
            status <> 'revoked'
            or revoked_at is not null
        ),

    constraint participant_invitations_expiry_check
        check (
            expires_at is null
            or invited_at is null
            or expires_at > invited_at
        ),

    constraint participant_invitations_accepted_time_check
        check (
            accepted_at is null
            or invited_at is null
            or accepted_at >= invited_at
        )
);

-- Only one currently active invitation may exist for a participant.
create unique index participant_invitations_active_participant_idx
    on public.participant_invitations(participant_id)
    where status in ('pending', 'sent');

-- An accepted participant invitation must remain unique.
create unique index participant_invitations_accepted_participant_idx
    on public.participant_invitations(participant_id)
    where status = 'accepted';

create index participant_invitations_email_idx
    on public.participant_invitations(email);

create index participant_invitations_auth_user_id_idx
    on public.participant_invitations(auth_user_id)
    where auth_user_id is not null;

create index participant_invitations_status_idx
    on public.participant_invitations(status);

create index participant_invitations_expires_at_idx
    on public.participant_invitations(expires_at)
    where expires_at is not null
      and status in ('pending', 'sent');

create trigger trg_participant_invitations_set_updated_at
before update on public.participant_invitations
for each row
execute function public.set_updated_at();

alter table public.participant_invitations enable row level security;

comment on table public.participant_invitations is
'Auditable invitation lifecycle for approved WPAG participants. Supabase Auth manages invitation tokens.';

comment on column public.participant_invitations.participant_id is
'Participant receiving the invitation. participants.auth_user_id remains the canonical authentication link.';

comment on column public.participant_invitations.auth_user_id is
'Supabase Auth user created or linked through the invitation process.';

comment on column public.participant_invitations.status is
'Invitation lifecycle state: pending, sent, accepted, revoked, expired, or failed.';

comment on column public.participant_invitations.invitation_attempts is
'Number of invitation delivery attempts made through the administrative workflow.';
