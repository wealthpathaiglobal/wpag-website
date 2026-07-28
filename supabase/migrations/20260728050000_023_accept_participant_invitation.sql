-- ============================================================================
-- WEALTH PATH AI GLOBAL (WPAG)
-- Domain: Authentication and Participant Onboarding
-- Migration: 023_accept_participant_invitation
-- Purpose:
-- Atomically accept a participant invitation and connect the participant
-- record to the authenticated Supabase Auth user.
-- ============================================================================

create or replace function public.accept_participant_invitation(
    p_invitation_id uuid,
    p_auth_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_invitation public.participant_invitations%rowtype;
begin
    if p_invitation_id is null then
        raise exception 'Invitation ID is required.';
    end if;

    if p_auth_user_id is null then
        raise exception 'Authenticated user ID is required.';
    end if;

    select *
    into v_invitation
    from public.participant_invitations
    where id = p_invitation_id
    for update;

    if not found then
        raise exception 'Participant invitation not found.';
    end if;

    if v_invitation.status = 'accepted' then
        if v_invitation.auth_user_id = p_auth_user_id then
            return;
        end if;

        raise exception 'Participant invitation has already been accepted.';
    end if;

    if v_invitation.status <> 'sent' then
        raise exception 'Participant invitation is not active.';
    end if;

    if v_invitation.auth_user_id is distinct from p_auth_user_id then
        raise exception 'Authenticated user does not match the invitation.';
    end if;

    if v_invitation.expires_at is not null
       and v_invitation.expires_at <= now() then
        update public.participant_invitations
        set
            status = 'expired',
            last_error = 'Invitation expired before acceptance.'
        where id = v_invitation.id;

        raise exception 'Participant invitation has expired.';
    end if;

    if exists (
        select 1
        from public.participants
        where auth_user_id = p_auth_user_id
          and id <> v_invitation.participant_id
    ) then
        raise exception 'Authenticated user is already linked to another participant.';
    end if;

    update public.participants
    set auth_user_id = p_auth_user_id
    where id = v_invitation.participant_id
      and deleted_at is null
      and (
          auth_user_id is null
          or auth_user_id = p_auth_user_id
      );

    if not found then
        raise exception 'Participant could not be linked to the authenticated user.';
    end if;

    update public.participant_invitations
    set
        auth_user_id = p_auth_user_id,
        status = 'accepted',
        accepted_at = now(),
        last_error = null
    where id = v_invitation.id;
end;
$$;

revoke all on function public.accept_participant_invitation(uuid, uuid)
from public;

revoke all on function public.accept_participant_invitation(uuid, uuid)
from anon;

revoke all on function public.accept_participant_invitation(uuid, uuid)
from authenticated;

grant execute on function public.accept_participant_invitation(uuid, uuid)
to service_role;

comment on function public.accept_participant_invitation(uuid, uuid) is
'Atomically links an invited Supabase Auth user to a participant and marks the matching invitation as accepted. Service-role execution only.';