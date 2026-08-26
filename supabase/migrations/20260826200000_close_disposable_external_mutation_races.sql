begin;

do $$ declare v_name name; begin
  select c.conname into v_name from pg_catalog.pg_constraint c
  where c.conrelid='public.staging_disposable_participant_reservations'::regclass and c.contype='c'
    and pg_catalog.pg_get_constraintdef(c.oid) like '%activation_state%';
  if v_name is null then raise exception 'activation_state constraint not found'; end if;
  execute format('alter table public.staging_disposable_participant_reservations drop constraint %I',v_name);
end$$;
alter table public.staging_disposable_participant_reservations
  add constraint stg_disp_res_activation_state_chk
    check (activation_state in ('BLOCKED','UNBAN_AUTHORIZED','UNBAN_IN_PROGRESS','ACTIVE','AMBIGUOUS_REBAN_REQUIRED')),
  add column compensation_mutation_started_at timestamptz;

-- This transition is the last database operation before Auth is mutated.  It is
-- deliberately non-expiring: cleanup must retry, never cross an unresolved remote
-- operation.  Operator recovery resolves abandoned/lost-response claims.
create function public.begin_staging_disposable_activation_unban(p_reservation_id uuid,p_fixture_id uuid,p_auth_user_id uuid,p_activation_request_id uuid,p_activation_claim_token uuid,p_actor_user_id uuid)
returns boolean language plpgsql security definer set search_path=public,pg_catalog as $$
declare v public.staging_disposable_participant_reservations%rowtype; v_now timestamptz:=clock_timestamp();
begin
  perform public.assert_disposable_intrinsic_staging_boundary(); perform public.assert_disposable_administrator(p_actor_user_id);
  select r.* into v from public.staging_disposable_participant_reservations r where r.id=p_reservation_id for update;
  if not found then return false; end if;
  if v.activation_state='UNBAN_IN_PROGRESS' and v.activation_request_id=p_activation_request_id and v.activation_claim_token=p_activation_claim_token then return true; end if;
  if v.reservation_status<>'ACTIVE' or v.fixture_id<>p_fixture_id or v.auth_user_id<>p_auth_user_id or v.activation_state<>'UNBAN_AUTHORIZED'
    or v.activation_request_id<>p_activation_request_id or v.activation_claim_token<>p_activation_claim_token or v.activation_claim_expires_at<=v_now
    or not exists(select 1 from public.staging_disposable_participant_fixtures f where f.id=p_fixture_id and f.fixture_status='ACTIVE' and f.auth_user_id=p_auth_user_id)
  then return false; end if;
  update public.staging_disposable_participant_reservations set activation_state='UNBAN_IN_PROGRESS',activation_claim_expires_at=null,updated_by=p_actor_user_id,updated_at=v_now where id=v.id;
  return true;
end$$;

create or replace function public.reconcile_staging_disposable_activation(p_reservation_id uuid,p_fixture_id uuid,p_auth_user_id uuid,p_activation_request_id uuid,p_activation_claim_token uuid,p_auth_is_unbanned boolean,p_actor_user_id uuid)
returns text language plpgsql security definer set search_path=public,pg_catalog as $$
declare v public.staging_disposable_participant_reservations%rowtype; v_now timestamptz:=clock_timestamp(); v_exact boolean;
begin
  perform public.assert_disposable_intrinsic_staging_boundary(); perform public.assert_disposable_administrator(p_actor_user_id);
  select r.* into v from public.staging_disposable_participant_reservations r where r.id=p_reservation_id for update;
  if not found or v.fixture_id<>p_fixture_id or v.auth_user_id<>p_auth_user_id then raise exception using errcode='P1001',message='Disposable activation reconciliation identity conflicts.'; end if;
  v_exact:=v.reservation_status='ACTIVE' and v.activation_state='UNBAN_IN_PROGRESS' and v.activation_request_id=p_activation_request_id and v.activation_claim_token=p_activation_claim_token
    and exists(select 1 from public.staging_disposable_participant_fixtures f where f.id=p_fixture_id and f.fixture_status='ACTIVE' and f.auth_user_id=p_auth_user_id);
  if v_exact and p_auth_is_unbanned then
    update public.staging_disposable_participant_reservations set activation_state='ACTIVE',activation_claim_token=null,activation_claim_expires_at=null,updated_by=p_actor_user_id,updated_at=v_now where id=v.id;
    insert into public.staging_disposable_participant_reservation_events(reservation_id,event_type,actor_user_id,occurred_at,event_details) values(v.id,'ACTIVATION_CONFIRMED',p_actor_user_id,v_now,jsonb_build_object('activation_request_id',p_activation_request_id,'auth_access','UNBANNED','credential_stored',false));
    return 'ACTIVE';
  end if;
  if v_exact then
    update public.staging_disposable_participant_reservations set activation_state='AMBIGUOUS_REBAN_REQUIRED',activation_claim_token=null,failed_at=coalesce(failed_at,v_now),updated_by=p_actor_user_id,updated_at=v_now where id=v.id;
    insert into public.staging_disposable_participant_reservation_events(reservation_id,event_type,actor_user_id,occurred_at,event_details) values(v.id,'ACTIVATION_AMBIGUOUS_REBAN_REQUIRED',p_actor_user_id,v_now,jsonb_build_object('severity','HIGH','activation_request_id',p_activation_request_id,'auth_access','NOT_PROVEN_UNBANNED','reban_required',true,'credential_stored',false));
    return 'AMBIGUOUS_REBAN_REQUIRED';
  end if;
  return 'INVALID';
end$$;

create function public.record_staging_disposable_activation_reban(p_reservation_id uuid,p_fixture_id uuid,p_auth_user_id uuid,p_activation_request_id uuid,p_auth_is_banned boolean,p_actor_user_id uuid)
returns text language plpgsql security definer set search_path=public,pg_catalog as $$
declare v public.staging_disposable_participant_reservations%rowtype; v_now timestamptz:=clock_timestamp();
begin
  perform public.assert_disposable_intrinsic_staging_boundary(); perform public.assert_disposable_administrator(p_actor_user_id);
  select r.* into v from public.staging_disposable_participant_reservations r where r.id=p_reservation_id for update;
  if not found or v.fixture_id<>p_fixture_id or v.auth_user_id<>p_auth_user_id or v.activation_request_id<>p_activation_request_id or v.activation_state<>'AMBIGUOUS_REBAN_REQUIRED' then raise exception using errcode='P1001',message='Disposable activation re-ban recovery identity conflicts.'; end if;
  if p_auth_is_banned then
    update public.staging_disposable_participant_reservations set activation_state='BLOCKED',updated_by=p_actor_user_id,updated_at=v_now where id=v.id;
    insert into public.staging_disposable_participant_reservation_events(reservation_id,event_type,actor_user_id,occurred_at,event_details) values(v.id,'ACTIVATION_INVALIDATED',p_actor_user_id,v_now,jsonb_build_object('corrective_reban_verified',true,'auth_access','BANNED','credential_stored',false));
    return 'BLOCKED';
  end if;
  insert into public.staging_disposable_participant_reservation_events(reservation_id,event_type,actor_user_id,occurred_at,event_details) values(v.id,'ACTIVATION_AMBIGUOUS_REBAN_REQUIRED',p_actor_user_id,v_now,jsonb_build_object('severity','HIGH','corrective_reban_verified',false,'operator_recovery_required',true,'credential_stored',false));
  return 'AMBIGUOUS_REBAN_REQUIRED';
end$$;

create or replace function public.sync_staging_disposable_reservation_cleanup() returns trigger language plpgsql security definer set search_path=public,pg_catalog as $$
declare v_now timestamptz:=clock_timestamp();
begin
  if new.fixture_status='REVOCATION_PENDING' and old.fixture_status='ACTIVE' then
    if exists(select 1 from public.staging_disposable_participant_reservations r where r.fixture_id=new.id and r.activation_state='UNBAN_IN_PROGRESS' for update) then
      raise exception using errcode='P1001',message='Disposable cleanup is blocked by an unresolved activation external operation.';
    end if;
    with activation_invalidated as (
      update public.staging_disposable_participant_reservations r
      set reservation_status='CLEANUP_PENDING',cleanup_started_at=v_now,activation_state='BLOCKED',activation_claim_token=null,activation_claim_expires_at=null,updated_by=r.created_by,updated_at=v_now
      where r.fixture_id=new.id and r.reservation_status='ACTIVE' and r.activation_state<>'BLOCKED'
      returning r.id,r.created_by
    )
    insert into public.staging_disposable_participant_reservation_events(reservation_id,event_type,actor_user_id,occurred_at,event_details)
      select r.id,'ACTIVATION_INVALIDATED',coalesce(new.revoked_by,r.created_by),v_now,jsonb_build_object('cleanup_superseded_activation',true,'external_operation_started',false,'credential_stored',false) from activation_invalidated r;
    update public.staging_disposable_participant_reservations r
      set reservation_status='CLEANUP_PENDING',cleanup_started_at=v_now,activation_claim_token=null,activation_claim_expires_at=null,updated_by=r.created_by,updated_at=v_now
      where r.fixture_id=new.id and r.reservation_status='ACTIVE' and r.activation_state='BLOCKED';
  elsif new.fixture_status='REVOKED' and old.fixture_status='REVOCATION_PENDING' then
    update public.staging_disposable_participant_reservations r set reservation_status='REVOKED',revoked_at=new.revoked_at,activation_state='BLOCKED',activation_claim_token=null,activation_claim_expires_at=null,updated_by=coalesce(new.revoked_by,r.created_by),updated_at=v_now where r.fixture_id=new.id and r.reservation_status='CLEANUP_PENDING';
  end if;
  return new;
end$$;

create unique index staging_disposable_reservation_cleanup_invalidation_once_idx
  on public.staging_disposable_participant_reservation_events(reservation_id)
  where event_type='ACTIVATION_INVALIDATED' and event_details @> '{"cleanup_superseded_activation":true}'::jsonb;

-- Consume the exact authority immediately before the provider mutation.  Once
-- consumed, adoption/bind/register remains fenced until the exact outcome is recorded.
create function public.begin_staging_disposable_auth_compensation(p_reservation_id uuid,p_auth_user_id uuid,p_compensation_request_id uuid,p_compensation_claim_token uuid,p_actor_user_id uuid)
returns text language plpgsql security definer set search_path=public,pg_catalog as $$
declare v public.staging_disposable_participant_reservations%rowtype; v_now timestamptz:=clock_timestamp();
begin
  perform public.assert_disposable_intrinsic_staging_boundary(); perform public.assert_disposable_administrator(p_actor_user_id);
  select r.* into v from public.staging_disposable_participant_reservations r where r.id=p_reservation_id for update;
  if not found then return 'DO_NOT_MUTATE'; end if;
  if v.compensation_mutation_started_at is not null and v.compensation_request_id=p_compensation_request_id and v.compensation_auth_user_id=p_auth_user_id and v.compensation_claim_token=p_compensation_claim_token then return 'MUTATION_AUTHORIZED'; end if;
  if v.compensation_decision<>'MUTATION_AUTHORIZED' or v.compensation_request_id<>p_compensation_request_id or v.compensation_auth_user_id<>p_auth_user_id or v.compensation_claim_token<>p_compensation_claim_token or v.compensation_claim_expires_at<=v_now
    or v.reservation_status not in ('RESERVED','AUTH_BOUND_BLOCKED') or (v.auth_user_id is not null and v.auth_user_id<>p_auth_user_id)
  then return 'DO_NOT_MUTATE'; end if;
  update public.staging_disposable_participant_reservations set compensation_mutation_started_at=v_now,compensation_claim_expires_at=null,updated_by=p_actor_user_id,updated_at=v_now where id=v.id;
  return 'MUTATION_AUTHORIZED';
end$$;

create or replace function public.record_staging_disposable_registration_failure(p_reservation_id uuid,p_auth_user_id uuid,p_auth_deleted boolean,p_block_verified boolean,p_compensation_request_id uuid,p_compensation_claim_token uuid,p_actor_user_id uuid)
returns table(reservation_status text) language plpgsql security definer set search_path=public,pg_catalog as $$
declare v public.staging_disposable_participant_reservations%rowtype; v_status text; v_now timestamptz:=clock_timestamp();
begin
  perform public.assert_disposable_intrinsic_staging_boundary(); perform public.assert_disposable_administrator(p_actor_user_id);
  select r.* into v from public.staging_disposable_participant_reservations r where r.id=p_reservation_id for update;
  if not found or v.reservation_status not in ('RESERVED','AUTH_BOUND_BLOCKED') then raise exception using errcode='P1001',message='Disposable recovery anchor is not eligible.'; end if;
  if v.compensation_decision<>'MUTATION_AUTHORIZED' or v.compensation_request_id<>p_compensation_request_id or v.compensation_auth_user_id<>p_auth_user_id or v.compensation_claim_token<>p_compensation_claim_token or v.compensation_mutation_started_at is null then raise exception using errcode='P1001',message='Disposable compensation mutation was not freshly authorized.'; end if;
  if v.auth_user_id is not null and v.auth_user_id<>p_auth_user_id then raise exception using errcode='P1001',message='Disposable recovery Auth identity conflicts.'; end if;
  if p_auth_deleted and exists(select 1 from auth.users u where u.id=p_auth_user_id and u.deleted_at is null) then raise exception using errcode='P1001',message='Disposable recovery Auth deletion is not verified.'; end if;
  if not p_auth_deleted and not exists(select 1 from auth.users u where u.id=p_auth_user_id and lower(u.email)=v.synthetic_email and u.deleted_at is null and u.raw_app_meta_data->>'hfos_environment'='STAGING' and u.raw_app_meta_data->>'hfos_fixture'='DISPOSABLE_E2E_FIXTURE' and u.raw_app_meta_data->>'hfos_fixture_request_id'=v.request_id::text) then raise exception using errcode='P1001',message='Disposable recovery Auth provenance is invalid.'; end if;
  v_status:=case when p_auth_deleted then 'AUTH_DELETED' when p_block_verified then 'REGISTRATION_FAILED_RECOVERY' else 'BLOCK_STATUS_UNVERIFIED_HIGH_SEVERITY' end;
  update public.staging_disposable_participant_reservations set auth_user_id=p_auth_user_id,auth_bound_at=coalesce(auth_bound_at,v_now),reservation_status=v_status,failed_at=v_now,compensation_claim_token=null,compensation_claim_expires_at=null,compensation_mutation_started_at=null,updated_by=p_actor_user_id,updated_at=v_now where id=v.id;
  insert into public.staging_disposable_participant_reservation_events(reservation_id,event_type,actor_user_id,occurred_at,event_details) values(v.id,v_status,p_actor_user_id,v_now,jsonb_build_object('auth_deleted',p_auth_deleted,'block_verified',p_block_verified,'credential_stored',false));
  return query select v_status;
end$$;

create or replace function public.bind_staging_disposable_reservation_auth(p_reservation_id uuid,p_auth_user_id uuid,p_auth_creation_claim_token uuid,p_actor_user_id uuid) returns void
language plpgsql security definer set search_path=public,pg_catalog as $$
declare v public.staging_disposable_participant_reservations%rowtype; v_now timestamptz:=clock_timestamp();
begin
  perform public.assert_disposable_intrinsic_staging_boundary(); perform public.assert_disposable_administrator(p_actor_user_id);
  select r.* into v from public.staging_disposable_participant_reservations r where r.id=p_reservation_id for update;
  if not found or v.reservation_status not in ('RESERVED','AUTH_CREATION_AMBIGUOUS_HIGH_SEVERITY','AUTH_BOUND_BLOCKED') then raise exception using errcode='P1001',message='Disposable reservation cannot bind Auth.'; end if;
  if v.compensation_claim_expires_at>v_now or v.compensation_mutation_started_at is not null or v.compensation_decision='INCOMPATIBLE_HIGH_SEVERITY_DO_NOT_MUTATE' then raise exception using errcode='P1001',message='Disposable Auth adoption is blocked by unresolved compensation.'; end if;
  if v.reservation_status<>'AUTH_BOUND_BLOCKED' and (v.auth_creation_claim_token is distinct from p_auth_creation_claim_token or v.auth_creation_claim_expires_at<=v_now) then raise exception using errcode='P1001',message='Disposable Auth creation claim is absent or expired.'; end if;
  if v.reservation_status='AUTH_BOUND_BLOCKED' and v.auth_user_id<>p_auth_user_id then raise exception using errcode='P1001',message='Disposable reservation Auth identity conflicts.'; end if;
  if not exists(select 1 from auth.users u where u.id=p_auth_user_id and lower(u.email)=v.synthetic_email and u.deleted_at is null and u.banned_until>v_now and u.raw_app_meta_data->>'hfos_environment'='STAGING' and u.raw_app_meta_data->>'hfos_fixture'='DISPOSABLE_E2E_FIXTURE' and u.raw_app_meta_data->>'hfos_fixture_request_id'=v.request_id::text) then raise exception using errcode='P1001',message='Disposable Auth binding provenance is invalid.'; end if;
  if v.reservation_status in ('RESERVED','AUTH_CREATION_AMBIGUOUS_HIGH_SEVERITY') then
    update public.staging_disposable_participant_reservations set auth_user_id=p_auth_user_id,reservation_status='AUTH_BOUND_BLOCKED',auth_bound_at=v_now,compensation_claim_token=null,compensation_claim_expires_at=null,compensation_decision='SHARED_OR_ADOPTED_DO_NOT_MUTATE',updated_by=p_actor_user_id,updated_at=v_now where id=v.id;
    insert into public.staging_disposable_participant_reservation_events(reservation_id,event_type,actor_user_id,occurred_at,event_details) values(v.id,'AUTH_BOUND_BLOCKED',p_actor_user_id,v_now,jsonb_build_object('credential_stored',false,'auth_access','BLOCKED'));
  end if;
end$$;

-- Registration takes the same reservation lock and compensation fence as bind.
-- An unconsumed expired claim has no mutation authority; a consumed claim is
-- deliberately non-expiring and can be cleared only by exact recovery recording.
create or replace function public.register_staging_disposable_participant(p_reservation_id uuid,p_auth_user_id uuid,p_synthetic_email text,p_actor_user_id uuid)
returns table(fixture_id uuid,auth_user_id uuid,participant_id uuid,participant_code text,synthetic_email text,fixture_status text,created_at timestamptz)
language plpgsql security definer set search_path=public,pg_catalog as $$
declare v_r public.staging_disposable_participant_reservations%rowtype; v_p public.participants%rowtype; v_f public.staging_disposable_participant_fixtures%rowtype; v_now timestamptz:=clock_timestamp();
begin
  perform public.assert_disposable_intrinsic_staging_boundary(); perform public.assert_disposable_administrator(p_actor_user_id);
  select r.* into v_r from public.staging_disposable_participant_reservations as r where r.id=p_reservation_id for update;
  if not found or v_r.reservation_status<>'AUTH_BOUND_BLOCKED' or v_r.auth_user_id<>p_auth_user_id or v_r.synthetic_email<>lower(p_synthetic_email) then raise exception using errcode='P1001',message='Disposable reservation is not registration-eligible.'; end if;
  if v_r.compensation_mutation_started_at is not null then raise exception using errcode='P1001',message='Disposable registration is blocked by a compensation mutation in progress.'; end if;
  if v_r.compensation_claim_expires_at>v_now then raise exception using errcode='P1001',message='Disposable registration is blocked by live compensation authority.'; end if;
  if v_r.compensation_decision='INCOMPATIBLE_HIGH_SEVERITY_DO_NOT_MUTATE' then raise exception using errcode='P1001',message='Disposable registration is blocked by unresolved high-severity compensation.'; end if;
  if not exists(select 1 from auth.users u where u.id=v_r.auth_user_id and lower(u.email)=v_r.synthetic_email and u.deleted_at is null and u.banned_until>v_now and u.raw_app_meta_data->>'hfos_environment'='STAGING' and u.raw_app_meta_data->>'hfos_fixture'='DISPOSABLE_E2E_FIXTURE' and u.raw_app_meta_data->>'hfos_fixture_request_id'=v_r.request_id::text) then raise exception using errcode='P1001',message='Disposable registration Auth provenance is invalid.'; end if;
  insert into public.participants(auth_user_id,lifecycle_status,research_status,created_by,updated_by,created_at,updated_at) values(v_r.auth_user_id,'pending_enrollment','not_enrolled',p_actor_user_id,p_actor_user_id,v_now,v_now) returning * into v_p;
  insert into public.participant_profiles(participant_id,first_name,last_name,preferred_name,email,profile_completed,created_by,updated_by,created_at,updated_at) values(v_p.id,'Disposable','Participant','Synthetic E2E',v_r.synthetic_email,false,p_actor_user_id,p_actor_user_id,v_now,v_now);
  insert into public.staging_disposable_participant_fixtures(request_id,auth_user_id,participant_id,synthetic_email,created_by,created_at) values(v_r.request_id,v_r.auth_user_id,v_p.id,v_r.synthetic_email,p_actor_user_id,v_now) returning * into v_f;
  update public.staging_disposable_participant_reservations as r set reservation_status='ACTIVE',fixture_id=v_f.id,participant_id=v_p.id,activated_at=v_now,auth_creation_claim_token=null,auth_creation_claimed_at=null,auth_creation_claim_expires_at=null,updated_by=p_actor_user_id,updated_at=v_now where r.id=v_r.id and r.reservation_status='AUTH_BOUND_BLOCKED';
  insert into public.staging_disposable_participant_reservation_events(reservation_id,event_type,actor_user_id,occurred_at,event_details) values(v_r.id,'ACTIVATED',p_actor_user_id,v_now,jsonb_build_object('lifecycle_status','pending_enrollment','research_status','not_enrolled','profile_completed',false,'credential_stored',false));
  insert into public.staging_disposable_participant_fixture_events(fixture_id,event_type,actor_user_id,occurred_at,event_details) values(v_f.id,'PROVISIONED',p_actor_user_id,v_now,jsonb_build_object('reservation_id',v_r.id,'credential_stored',false));
  return query select v_f.id,v_f.auth_user_id,v_p.id,v_p.participant_code,v_f.synthetic_email,v_f.fixture_status,v_f.created_at;
exception when sqlstate 'P1001' then raise; when others then raise exception using errcode='P1002',message='Disposable fixture could not be registered.'; end$$;

drop function public.list_staging_disposable_reservation_recovery(uuid);
create function public.list_staging_disposable_reservation_recovery(p_actor_user_id uuid)
returns table(reservation_id uuid,request_id uuid,auth_user_id uuid,synthetic_email text,reservation_status text,activation_state text,created_at timestamptz,failed_at timestamptz)
language plpgsql stable security definer set search_path=public,pg_catalog as $$begin
  perform public.assert_disposable_intrinsic_staging_boundary(); perform public.assert_disposable_administrator(p_actor_user_id);
  return query select r.id,r.request_id,r.auth_user_id,r.synthetic_email,r.reservation_status,r.activation_state,r.created_at,r.failed_at
  from public.staging_disposable_participant_reservations r
  where r.reservation_status in ('AUTH_CREATION_FAILED','AUTH_CREATION_AMBIGUOUS_HIGH_SEVERITY','REGISTRATION_FAILED_RECOVERY','BLOCK_STATUS_UNVERIFIED_HIGH_SEVERITY','AUTH_DELETED') or r.activation_state='AMBIGUOUS_REBAN_REQUIRED'
  order by r.created_at desc;
end$$;

alter function public.begin_staging_disposable_activation_unban(uuid,uuid,uuid,uuid,uuid,uuid) owner to postgres;
alter function public.record_staging_disposable_activation_reban(uuid,uuid,uuid,uuid,boolean,uuid) owner to postgres;
alter function public.begin_staging_disposable_auth_compensation(uuid,uuid,uuid,uuid,uuid) owner to postgres;
alter function public.list_staging_disposable_reservation_recovery(uuid) owner to postgres;
revoke all on function public.begin_staging_disposable_activation_unban(uuid,uuid,uuid,uuid,uuid,uuid),public.record_staging_disposable_activation_reban(uuid,uuid,uuid,uuid,boolean,uuid),public.begin_staging_disposable_auth_compensation(uuid,uuid,uuid,uuid,uuid),public.list_staging_disposable_reservation_recovery(uuid) from public,anon,authenticated,service_role;
grant execute on function public.begin_staging_disposable_activation_unban(uuid,uuid,uuid,uuid,uuid,uuid),public.record_staging_disposable_activation_reban(uuid,uuid,uuid,uuid,boolean,uuid),public.begin_staging_disposable_auth_compensation(uuid,uuid,uuid,uuid,uuid),public.list_staging_disposable_reservation_recovery(uuid) to service_role;

commit;
