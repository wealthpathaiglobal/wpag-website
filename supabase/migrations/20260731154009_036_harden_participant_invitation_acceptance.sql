begin;

create or replace function public.accept_participant_invitation(
    p_invitation_id uuid,
    p_auth_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
    v_invitation public.participant_invitations%rowtype;
    v_participant public.participants%rowtype;
    v_updated_rows bigint;
begin
    if p_invitation_id is null then
        raise exception using
            errcode = 'P1001',
            message = 'Invitation ID is required.';
    end if;

    if p_auth_user_id is null then
        raise exception using
            errcode = 'P1001',
            message = 'Authenticated user ID is required.';
    end if;

    select invitation.*
      into v_invitation
      from public.participant_invitations as invitation
     where invitation.id = p_invitation_id
     for update;

    if not found then
        raise exception using
            errcode = 'P1001',
            message = 'Participant invitation not found.';
    end if;

    select participant.*
      into v_participant
      from public.participants as participant
     where participant.id = v_invitation.participant_id
     for update;

    if not found or v_participant.deleted_at is not null then
        raise exception using
            errcode = 'P1001',
            message = 'Participant is unavailable for invitation acceptance.';
    end if;

    if v_invitation.status = 'accepted' then
        if v_invitation.auth_user_id is not distinct from p_auth_user_id
           and v_participant.auth_user_id is not distinct from p_auth_user_id then
            return;
        end if;

        raise exception using
            errcode = 'P1001',
            message = 'Participant invitation acceptance state is inconsistent.';
    end if;

    if v_invitation.status = 'expired'
       or (
           v_invitation.expires_at is not null
           and v_invitation.expires_at <= transaction_timestamp()
       ) then
        raise exception using
            errcode = 'P1001',
            message = 'Participant invitation has expired.';
    end if;

    if v_invitation.status <> 'sent' then
        raise exception using
            errcode = 'P1001',
            message = 'Participant invitation is not active.';
    end if;

    if v_invitation.auth_user_id is distinct from p_auth_user_id then
        raise exception using
            errcode = 'P1001',
            message = 'Authenticated user does not match the invitation.';
    end if;

    if v_participant.auth_user_id is not null
       and v_participant.auth_user_id is distinct from p_auth_user_id then
        raise exception using
            errcode = 'P1001',
            message = 'Participant is already linked to another authenticated user.';
    end if;

    if exists (
        select 1
          from public.participants as linked_participant
         where linked_participant.auth_user_id = p_auth_user_id
           and linked_participant.id <> v_participant.id
           and linked_participant.deleted_at is null
    ) then
        raise exception using
            errcode = 'P1001',
            message = 'Participant is already linked to another authenticated user.';
    end if;

    update public.participants as participant
       set auth_user_id = p_auth_user_id,
           updated_by = p_auth_user_id
     where participant.id = v_participant.id;

    get diagnostics v_updated_rows = row_count;

    if v_updated_rows <> 1 then
        raise exception using
            errcode = 'P1002',
            message = 'Participant invitation acceptance could not be completed.';
    end if;

    update public.participant_invitations as invitation
       set auth_user_id = p_auth_user_id,
           status = 'accepted',
           accepted_at = transaction_timestamp(),
           last_error = null
     where invitation.id = v_invitation.id;

    get diagnostics v_updated_rows = row_count;

    if v_updated_rows <> 1 then
        raise exception using
            errcode = 'P1002',
            message = 'Participant invitation acceptance could not be completed.';
    end if;
exception
    when sqlstate 'P1001' then
        raise;
    when sqlstate 'P1002' then
        raise;
    when others then
        raise exception using
            errcode = 'P1002',
            message = 'Participant invitation acceptance could not be completed.';
end;
$$;

alter function public.accept_participant_invitation(uuid, uuid)
owner to postgres;

revoke all on function public.accept_participant_invitation(uuid, uuid)
from public;

revoke all on function public.accept_participant_invitation(uuid, uuid)
from anon;

revoke all on function public.accept_participant_invitation(uuid, uuid)
from authenticated;

grant execute on function public.accept_participant_invitation(uuid, uuid)
to service_role;

comment on function public.accept_participant_invitation(uuid, uuid) is
'Atomically accepts a participant invitation, links the invited Auth user to the locked active participant, records self-service attribution, and preserves same-user idempotency. Service-role execution only.';

commit;
