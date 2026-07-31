begin;

create or replace function public.create_participant_invitation_attempt(
    p_participant_id uuid,
    p_actor_user_id uuid
)
returns table (
    id uuid,
    participant_id uuid,
    email text,
    status text,
    expires_at timestamptz,
    invitation_attempts integer
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
    v_participant public.participants%rowtype;
    v_email text;
    v_attempts integer;
    v_invitation public.participant_invitations%rowtype;
begin
    if p_participant_id is null then
        raise exception using errcode = 'P1001', message = 'Participant ID is required.';
    end if;
    if p_actor_user_id is null then
        raise exception using errcode = 'P1001', message = 'Actor identity is required.';
    end if;

    if not exists (
        select 1
        from public.staff_members sm
        join public.staff_member_roles smr on smr.staff_member_id = sm.id
        join public.staff_roles sr on sr.id = smr.staff_role_id
        where sm.auth_user_id = p_actor_user_id
          and sm.status = 'active'
          and sm.deleted_at is null
          and sr.role_code = 'administrator'
          and sr.is_active = true
          and smr.is_active = true
          and (smr.expires_at is null or smr.expires_at > now())
    ) then
        raise exception using errcode = 'P1001', message = 'Actor is not authorized to issue participant invitations.';
    end if;

    select p.* into v_participant
    from public.participants p
    where p.id = p_participant_id
    for update;

    if not found then
        raise exception using errcode = 'P1001', message = 'Participant not found.';
    end if;
    if v_participant.deleted_at is not null then
        raise exception using errcode = 'P1001', message = 'Participant is unavailable for invitation.';
    end if;
    if v_participant.lifecycle_status not in ('pending_enrollment', 'active', 'paused') then
        raise exception using errcode = 'P1001', message = 'Invitations are unavailable for the participant lifecycle status.';
    end if;
    if v_participant.auth_user_id is not null then
        raise exception using errcode = 'P1001', message = 'Participant already has an authenticated account.';
    end if;

    select lower(btrim(a.email::text)) into v_email
    from public.applications a
    where a.id = v_participant.application_id
      and a.deleted_at is null;

    if v_email is null or v_email = '' or v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
        raise exception using errcode = 'P1001', message = 'Participant email is unavailable.';
    end if;

    perform 1
    from public.participant_invitations i
    where i.participant_id = p_participant_id
    for update;

    if exists (
        select 1 from public.participant_invitations i
        where i.participant_id = p_participant_id
          and i.status in ('pending', 'sent', 'accepted')
    ) then
        raise exception using errcode = 'P1001', message = 'An active invitation already exists.';
    end if;

    select coalesce(max(i.invitation_attempts), 0) + 1 into v_attempts
    from public.participant_invitations i
    where i.participant_id = p_participant_id;

    insert into public.participant_invitations (
        participant_id, email, status, expires_at,
        invitation_attempts, last_error, invited_by
    ) values (
        p_participant_id, v_email, 'pending',
        transaction_timestamp() + interval '7 days',
        v_attempts, null, p_actor_user_id
    ) returning * into strict v_invitation;

    return query select v_invitation.id, v_invitation.participant_id,
        v_invitation.email::text, v_invitation.status,
        v_invitation.expires_at, v_invitation.invitation_attempts;
exception
    when sqlstate 'P1001' then raise;
    when others then
        raise exception using errcode = 'P1002', message = 'Participant invitation operation could not be completed.';
end;
$$;

create or replace function public.finalize_participant_invitation_sent(
    p_invitation_id uuid,
    p_actor_user_id uuid,
    p_auth_user_id uuid
)
returns table (
    id uuid,
    participant_id uuid,
    status text,
    invited_at timestamptz,
    expires_at timestamptz,
    auth_user_id uuid,
    created_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
    v_invitation public.participant_invitations%rowtype;
    v_participant public.participants%rowtype;
begin
    if p_invitation_id is null or p_auth_user_id is null then
        raise exception using errcode = 'P1001', message = 'Participant invitation state conflict.';
    end if;
    if p_actor_user_id is null then
        raise exception using errcode = 'P1001', message = 'Actor identity is required.';
    end if;
    if not exists (
        select 1 from public.staff_members sm
        join public.staff_member_roles smr on smr.staff_member_id = sm.id
        join public.staff_roles sr on sr.id = smr.staff_role_id
        where sm.auth_user_id = p_actor_user_id and sm.status = 'active'
          and sm.deleted_at is null and sr.role_code = 'administrator'
          and sr.is_active = true and smr.is_active = true
          and (smr.expires_at is null or smr.expires_at > now())
    ) then
        raise exception using errcode = 'P1001', message = 'Actor is not authorized to issue participant invitations.';
    end if;

    select i.* into v_invitation from public.participant_invitations i
    where i.id = p_invitation_id for update;
    if not found then
        raise exception using errcode = 'P1001', message = 'Participant invitation not found.';
    end if;

    select p.* into v_participant from public.participants p
    where p.id = v_invitation.participant_id for update;
    if not found or v_participant.deleted_at is not null then
        raise exception using errcode = 'P1001', message = 'Participant is unavailable for invitation.';
    end if;
    if v_participant.auth_user_id is not null then
        raise exception using errcode = 'P1001', message = 'Participant already has an authenticated account.';
    end if;
    if v_invitation.invited_by is distinct from p_actor_user_id then
        raise exception using errcode = 'P1001', message = 'Participant invitation state conflict.';
    end if;

    if v_invitation.status = 'sent'
       and v_invitation.auth_user_id = p_auth_user_id then
        return query select v_invitation.id, v_invitation.participant_id,
            v_invitation.status, v_invitation.invited_at, v_invitation.expires_at,
            v_invitation.auth_user_id, v_invitation.created_at;
        return;
    end if;
    if v_invitation.status <> 'pending' then
        raise exception using errcode = 'P1001', message = 'Participant invitation state conflict.';
    end if;

    update public.participant_invitations i
    set auth_user_id = p_auth_user_id, status = 'sent',
        invited_at = transaction_timestamp(), last_error = null
    where i.id = p_invitation_id
    returning * into strict v_invitation;

    return query select v_invitation.id, v_invitation.participant_id,
        v_invitation.status, v_invitation.invited_at, v_invitation.expires_at,
        v_invitation.auth_user_id, v_invitation.created_at;
exception
    when sqlstate 'P1001' then raise;
    when others then
        raise exception using errcode = 'P1002', message = 'Participant invitation operation could not be completed.';
end;
$$;

create or replace function public.mark_participant_invitation_failed(
    p_invitation_id uuid,
    p_actor_user_id uuid,
    p_failure_category text
)
returns table (
    id uuid,
    participant_id uuid,
    status text,
    expires_at timestamptz,
    created_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
    v_invitation public.participant_invitations%rowtype;
begin
    if p_invitation_id is null or p_failure_category is null then
        raise exception using errcode = 'P1001', message = 'Participant invitation state conflict.';
    end if;
    if p_actor_user_id is null then
        raise exception using errcode = 'P1001', message = 'Actor identity is required.';
    end if;
    if p_failure_category not in ('provider_delivery_failed', 'provider_user_missing', 'sent_finalization_failed') then
        raise exception using errcode = 'P1001', message = 'Participant invitation cannot be retried.';
    end if;
    if not exists (
        select 1 from public.staff_members sm
        join public.staff_member_roles smr on smr.staff_member_id = sm.id
        join public.staff_roles sr on sr.id = smr.staff_role_id
        where sm.auth_user_id = p_actor_user_id and sm.status = 'active'
          and sm.deleted_at is null and sr.role_code = 'administrator'
          and sr.is_active = true and smr.is_active = true
          and (smr.expires_at is null or smr.expires_at > now())
    ) then
        raise exception using errcode = 'P1001', message = 'Actor is not authorized to issue participant invitations.';
    end if;

    select i.* into v_invitation from public.participant_invitations i
    where i.id = p_invitation_id for update;
    if not found then
        raise exception using errcode = 'P1001', message = 'Participant invitation not found.';
    end if;
    perform 1 from public.participants p
    where p.id = v_invitation.participant_id for update;
    if v_invitation.invited_by is distinct from p_actor_user_id then
        raise exception using errcode = 'P1001', message = 'Participant invitation state conflict.';
    end if;
    if v_invitation.status = 'failed' and v_invitation.last_error = p_failure_category then
        return query select v_invitation.id, v_invitation.participant_id,
            v_invitation.status, v_invitation.expires_at, v_invitation.created_at;
        return;
    end if;
    if v_invitation.status <> 'pending' then
        raise exception using errcode = 'P1001', message = 'Participant invitation state conflict.';
    end if;

    update public.participant_invitations i
    set status = 'failed', last_error = p_failure_category
    where i.id = p_invitation_id
    returning * into strict v_invitation;

    return query select v_invitation.id, v_invitation.participant_id,
        v_invitation.status, v_invitation.expires_at, v_invitation.created_at;
exception
    when sqlstate 'P1001' then raise;
    when others then
        raise exception using errcode = 'P1002', message = 'Participant invitation operation could not be completed.';
end;
$$;

alter function public.create_participant_invitation_attempt(uuid, uuid) owner to postgres;
alter function public.finalize_participant_invitation_sent(uuid, uuid, uuid) owner to postgres;
alter function public.mark_participant_invitation_failed(uuid, uuid, text) owner to postgres;

revoke all on function public.create_participant_invitation_attempt(uuid, uuid) from public, anon, authenticated;
revoke all on function public.finalize_participant_invitation_sent(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.mark_participant_invitation_failed(uuid, uuid, text) from public, anon, authenticated;

grant execute on function public.create_participant_invitation_attempt(uuid, uuid) to service_role;
grant execute on function public.finalize_participant_invitation_sent(uuid, uuid, uuid) to service_role;
grant execute on function public.mark_participant_invitation_failed(uuid, uuid, text) to service_role;

comment on function public.create_participant_invitation_attempt(uuid, uuid) is
'Creates one governed, administrator-authorized participant invitation attempt without granting direct table writes.';
comment on function public.finalize_participant_invitation_sent(uuid, uuid, uuid) is
'Finalizes a governed pending invitation after successful external Auth delivery.';
comment on function public.mark_participant_invitation_failed(uuid, uuid, text) is
'Records an allowlisted invitation-delivery failure without storing provider diagnostics.';

commit;
