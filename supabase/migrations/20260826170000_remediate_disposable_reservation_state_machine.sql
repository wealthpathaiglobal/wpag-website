begin;

create table public.staging_disposable_participant_reservations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  synthetic_email text not null unique,
  fixture_type text not null default 'DISPOSABLE_E2E_FIXTURE' check (fixture_type = 'DISPOSABLE_E2E_FIXTURE'),
  reservation_status text not null default 'RESERVED' check (reservation_status in (
    'RESERVED','AUTH_CREATION_AMBIGUOUS_HIGH_SEVERITY','AUTH_BOUND_BLOCKED','ACTIVE','AUTH_CREATION_FAILED','REGISTRATION_FAILED_RECOVERY',
    'BLOCK_STATUS_UNVERIFIED_HIGH_SEVERITY','AUTH_DELETED','CLEANUP_PENDING','REVOKED'
  )),
  auth_user_id uuid unique,
  auth_creation_claim_token uuid,
  auth_creation_claimed_at timestamptz,
  auth_creation_claim_expires_at timestamptz,
  compensation_request_id uuid,
  compensation_auth_user_id uuid,
  compensation_claim_token uuid,
  compensation_claim_expires_at timestamptz,
  compensation_decision text check (compensation_decision in ('MUTATION_AUTHORIZED','SHARED_OR_ADOPTED_DO_NOT_MUTATE','INCOMPATIBLE_HIGH_SEVERITY_DO_NOT_MUTATE')),
  fixture_id uuid unique references public.staging_disposable_participant_fixtures(id) on update restrict on delete restrict,
  participant_id uuid unique references public.participants(id) on update restrict on delete restrict,
  created_by uuid not null references auth.users(id) on update restrict on delete restrict,
  created_at timestamptz not null default clock_timestamp(),
  auth_bound_at timestamptz,
  activated_at timestamptz,
  failed_at timestamptz,
  cleanup_started_at timestamptz,
  revoked_at timestamptz,
  updated_by uuid not null references auth.users(id) on update restrict on delete restrict,
  updated_at timestamptz not null default clock_timestamp(),
  check (synthetic_email = 'hfos-disposable-e2e-' || request_id::text || '@synthetic.invalid'),
  check ((reservation_status = 'RESERVED' and auth_user_id is null and fixture_id is null and participant_id is null)
    or (reservation_status = 'AUTH_CREATION_AMBIGUOUS_HIGH_SEVERITY' and auth_user_id is null and fixture_id is null and participant_id is null and failed_at is not null)
    or (reservation_status = 'AUTH_CREATION_FAILED' and auth_user_id is null and fixture_id is null and participant_id is null and failed_at is not null)
    or (reservation_status in ('AUTH_BOUND_BLOCKED','REGISTRATION_FAILED_RECOVERY','BLOCK_STATUS_UNVERIFIED_HIGH_SEVERITY') and auth_user_id is not null and fixture_id is null and participant_id is null)
    or (reservation_status = 'AUTH_DELETED' and auth_user_id is not null and fixture_id is null and participant_id is null and failed_at is not null)
    or (reservation_status in ('ACTIVE','CLEANUP_PENDING','REVOKED') and auth_user_id is not null and fixture_id is not null and participant_id is not null))
);

create table public.staging_disposable_participant_reservation_events (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.staging_disposable_participant_reservations(id) on update restrict on delete restrict,
  event_type text not null check (event_type in ('RESERVED','AUTH_CREATION_CLAIMED','AUTH_CREATION_CLAIM_RECOVERED','AUTH_CREATION_AMBIGUOUS_HIGH_SEVERITY','AUTH_BOUND_BLOCKED','AUTH_CREATION_FAILED','ACTIVATED','COMPENSATION_CONFLICT_HIGH_SEVERITY','REGISTRATION_FAILED_RECOVERY','BLOCK_STATUS_UNVERIFIED_HIGH_SEVERITY','AUTH_DELETED','CLEANUP_STARTED','REVOKED')),
  actor_user_id uuid not null references auth.users(id) on update restrict on delete restrict,
  occurred_at timestamptz not null default clock_timestamp(),
  event_details jsonb not null default '{}' check (jsonb_typeof(event_details) = 'object')
);

alter table public.staging_disposable_participant_reservations enable row level security;
alter table public.staging_disposable_participant_reservations force row level security;
alter table public.staging_disposable_participant_reservation_events enable row level security;
alter table public.staging_disposable_participant_reservation_events force row level security;
create trigger staging_disposable_reservation_events_immutable before update or delete on public.staging_disposable_participant_reservation_events for each row execute function public.prevent_disposable_control_mutation();

create function public.reserve_staging_disposable_participant(p_request_id uuid,p_synthetic_email text,p_actor_user_id uuid)
returns table(reservation_id uuid,request_id uuid,auth_user_id uuid,fixture_id uuid,participant_id uuid,participant_code text,synthetic_email text,reservation_status text,created_at timestamptz,auth_creation_authority boolean,auth_creation_claim_token uuid,auth_creation_claim_expires_at timestamptz)
language plpgsql security definer set search_path=public,pg_catalog as $$
declare v public.staging_disposable_participant_reservations%rowtype; v_now timestamptz:=clock_timestamp(); v_claim uuid; v_authority boolean:=false; v_recovered boolean:=false;
begin
  perform public.assert_disposable_intrinsic_staging_boundary(); perform public.assert_disposable_administrator(p_actor_user_id);
  if p_request_id is null or lower(p_synthetic_email) <> 'hfos-disposable-e2e-'||p_request_id::text||'@synthetic.invalid' then raise exception using errcode='P1001',message='Disposable reservation identity is invalid.'; end if;
  insert into public.staging_disposable_participant_reservations(request_id,synthetic_email,created_by,created_at,updated_by,updated_at)
  values(p_request_id,lower(p_synthetic_email),p_actor_user_id,v_now,p_actor_user_id,v_now)
  on conflict on constraint staging_disposable_participant_reservations_request_id_key do nothing;
  select r.* into v from public.staging_disposable_participant_reservations as r where r.request_id=p_request_id for update;
  if v.synthetic_email<>lower(p_synthetic_email) or v.fixture_type<>'DISPOSABLE_E2E_FIXTURE' then raise exception using errcode='P1001',message='Disposable reservation provenance conflicts.'; end if;
  if not exists(select 1 from public.staging_disposable_participant_reservation_events e where e.reservation_id=v.id and e.event_type='RESERVED') then
    insert into public.staging_disposable_participant_reservation_events(reservation_id,event_type,actor_user_id,occurred_at,event_details) values(v.id,'RESERVED',p_actor_user_id,v_now,jsonb_build_object('credential_stored',false,'intended_environment','STAGING','fixture_type',v.fixture_type));
  end if;
  if v.reservation_status='RESERVED' and (v.auth_creation_claim_token is null or v.auth_creation_claim_expires_at<=v_now) then
    v_claim:=gen_random_uuid(); v_recovered:=v.auth_creation_claim_token is not null;
    update public.staging_disposable_participant_reservations r set auth_creation_claim_token=v_claim,auth_creation_claimed_at=v_now,auth_creation_claim_expires_at=v_now+interval '2 minutes',updated_by=p_actor_user_id,updated_at=v_now where r.id=v.id;
    insert into public.staging_disposable_participant_reservation_events(reservation_id,event_type,actor_user_id,occurred_at,event_details) values(v.id,case when v_recovered then 'AUTH_CREATION_CLAIM_RECOVERED' else 'AUTH_CREATION_CLAIMED' end,p_actor_user_id,v_now,jsonb_build_object('credential_stored',false,'lease_seconds',120));
    v.auth_creation_claim_token:=v_claim; v.auth_creation_claim_expires_at:=v_now+interval '2 minutes'; v_authority:=true;
  end if;
  return query select v.id,v.request_id,v.auth_user_id,v.fixture_id,v.participant_id,p.participant_code,v.synthetic_email,v.reservation_status,v.created_at,v_authority,v.auth_creation_claim_token,v.auth_creation_claim_expires_at from (select 1) x left join public.participants p on p.id=v.participant_id;
end$$;

create function public.renew_staging_disposable_auth_creation_claim(p_reservation_id uuid,p_auth_creation_claim_token uuid,p_actor_user_id uuid) returns timestamptz
language plpgsql security definer set search_path=public,pg_catalog as $$declare v_expiry timestamptz; v_now timestamptz:=clock_timestamp(); begin
  perform public.assert_disposable_intrinsic_staging_boundary(); perform public.assert_disposable_administrator(p_actor_user_id);
  update public.staging_disposable_participant_reservations r set auth_creation_claim_expires_at=v_now+interval '2 minutes',updated_by=p_actor_user_id,updated_at=v_now where r.id=p_reservation_id and r.reservation_status='RESERVED' and r.auth_creation_claim_token=p_auth_creation_claim_token and r.auth_creation_claim_expires_at>v_now returning r.auth_creation_claim_expires_at into v_expiry;
  if not found then raise exception using errcode='P1001',message='Disposable Auth creation claim cannot be renewed.'; end if;
  return v_expiry;
end$$;

create function public.bind_staging_disposable_reservation_auth(p_reservation_id uuid,p_auth_user_id uuid,p_auth_creation_claim_token uuid,p_actor_user_id uuid) returns void
language plpgsql security definer set search_path=public,pg_catalog as $$
declare v public.staging_disposable_participant_reservations%rowtype; v_now timestamptz:=clock_timestamp();
begin
  perform public.assert_disposable_intrinsic_staging_boundary(); perform public.assert_disposable_administrator(p_actor_user_id);
  select r.* into v from public.staging_disposable_participant_reservations as r where r.id=p_reservation_id for update;
  if not found or v.reservation_status not in ('RESERVED','AUTH_CREATION_AMBIGUOUS_HIGH_SEVERITY','AUTH_BOUND_BLOCKED') then raise exception using errcode='P1001',message='Disposable reservation cannot bind Auth.'; end if;
  if v.reservation_status<>'AUTH_BOUND_BLOCKED' and (v.auth_creation_claim_token is distinct from p_auth_creation_claim_token or v.auth_creation_claim_expires_at<=v_now) then raise exception using errcode='P1001',message='Disposable Auth creation claim is absent or expired.'; end if;
  if v.reservation_status='AUTH_BOUND_BLOCKED' and v.auth_user_id<>p_auth_user_id then raise exception using errcode='P1001',message='Disposable reservation Auth identity conflicts.'; end if;
  if not exists(select 1 from auth.users u where u.id=p_auth_user_id and lower(u.email)=v.synthetic_email and u.deleted_at is null and u.banned_until>v_now and u.raw_app_meta_data->>'hfos_environment'='STAGING' and u.raw_app_meta_data->>'hfos_fixture'='DISPOSABLE_E2E_FIXTURE' and u.raw_app_meta_data->>'hfos_fixture_request_id'=v.request_id::text) then raise exception using errcode='P1001',message='Disposable Auth binding provenance is invalid.'; end if;
  if v.reservation_status in ('RESERVED','AUTH_CREATION_AMBIGUOUS_HIGH_SEVERITY') then
    update public.staging_disposable_participant_reservations as r set auth_user_id=p_auth_user_id,reservation_status='AUTH_BOUND_BLOCKED',auth_bound_at=v_now,updated_by=p_actor_user_id,updated_at=v_now where r.id=v.id;
    insert into public.staging_disposable_participant_reservation_events(reservation_id,event_type,actor_user_id,occurred_at,event_details) values(v.id,'AUTH_BOUND_BLOCKED',p_actor_user_id,v_now,jsonb_build_object('credential_stored',false,'auth_access','BLOCKED'));
  end if;
end$$;

create function public.mark_staging_disposable_auth_creation_failed(p_reservation_id uuid,p_auth_creation_claim_token uuid,p_actor_user_id uuid) returns void
language plpgsql security definer set search_path=public,pg_catalog as $$declare v_now timestamptz:=clock_timestamp(); begin
  perform public.assert_disposable_intrinsic_staging_boundary(); perform public.assert_disposable_administrator(p_actor_user_id);
  update public.staging_disposable_participant_reservations as r set reservation_status='AUTH_CREATION_FAILED',failed_at=v_now,auth_creation_claim_token=null,auth_creation_claimed_at=null,auth_creation_claim_expires_at=null,updated_by=p_actor_user_id,updated_at=v_now where r.id=p_reservation_id and r.reservation_status='RESERVED' and r.auth_creation_claim_token=p_auth_creation_claim_token and r.auth_creation_claim_expires_at>v_now;
  if not found then raise exception using errcode='P1001',message='Disposable reservation cannot record Auth creation failure.'; end if;
  insert into public.staging_disposable_participant_reservation_events(reservation_id,event_type,actor_user_id,occurred_at,event_details) values(p_reservation_id,'AUTH_CREATION_FAILED',p_actor_user_id,v_now,jsonb_build_object('credential_stored',false));
end$$;

create function public.mark_staging_disposable_auth_creation_ambiguous(p_reservation_id uuid,p_auth_creation_claim_token uuid,p_actor_user_id uuid) returns void
language plpgsql security definer set search_path=public,pg_catalog as $$declare v_now timestamptz:=clock_timestamp(); begin
  perform public.assert_disposable_intrinsic_staging_boundary(); perform public.assert_disposable_administrator(p_actor_user_id);
  update public.staging_disposable_participant_reservations r set reservation_status='AUTH_CREATION_AMBIGUOUS_HIGH_SEVERITY',failed_at=v_now,updated_by=p_actor_user_id,updated_at=v_now where r.id=p_reservation_id and r.reservation_status in ('RESERVED','AUTH_CREATION_AMBIGUOUS_HIGH_SEVERITY') and r.auth_creation_claim_token=p_auth_creation_claim_token;
  if not found then raise exception using errcode='P1001',message='Disposable reservation cannot record ambiguous Auth creation.'; end if;
  if not exists(select 1 from public.staging_disposable_participant_reservation_events e where e.reservation_id=p_reservation_id and e.event_type='AUTH_CREATION_AMBIGUOUS_HIGH_SEVERITY') then insert into public.staging_disposable_participant_reservation_events(reservation_id,event_type,actor_user_id,occurred_at,event_details) values(p_reservation_id,'AUTH_CREATION_AMBIGUOUS_HIGH_SEVERITY',p_actor_user_id,v_now,jsonb_build_object('severity','HIGH','remote_commit_possible',true,'credential_stored',false)); end if;
end$$;

create function public.authorize_staging_disposable_auth_compensation(p_reservation_id uuid,p_auth_user_id uuid,p_auth_creation_claim_token uuid,p_compensation_request_id uuid,p_actor_user_id uuid)
returns table(compensation_decision text,compensation_claim_token uuid) language plpgsql security definer set search_path=public,pg_catalog as $$
declare v public.staging_disposable_participant_reservations%rowtype; v_decision text; v_token uuid; v_now timestamptz:=clock_timestamp();
begin
  perform public.assert_disposable_intrinsic_staging_boundary(); perform public.assert_disposable_administrator(p_actor_user_id);
  if p_compensation_request_id is null or p_auth_user_id is null then raise exception using errcode='P1001',message='Disposable compensation request is invalid.'; end if;
  select r.* into v from public.staging_disposable_participant_reservations r where r.id=p_reservation_id for update;
  if not found then raise exception using errcode='P1001',message='Disposable compensation reservation is unavailable.'; end if;
  if v.compensation_request_id=p_compensation_request_id and v.compensation_auth_user_id=p_auth_user_id then
    return query select v.compensation_decision,case when v.compensation_decision='MUTATION_AUTHORIZED' and v.compensation_claim_expires_at>v_now then v.compensation_claim_token else null::uuid end; return;
  end if;
  if v.reservation_status in ('RESERVED','AUTH_BOUND_BLOCKED') and (v.auth_user_id is null or v.auth_user_id=p_auth_user_id) and v.auth_creation_claim_token=p_auth_creation_claim_token and v.auth_creation_claim_expires_at>v_now then
    v_decision:='MUTATION_AUTHORIZED'; v_token:=gen_random_uuid();
  elsif v.auth_user_id=p_auth_user_id and v.reservation_status in ('AUTH_BOUND_BLOCKED','ACTIVE','CLEANUP_PENDING','REVOKED') then
    v_decision:='SHARED_OR_ADOPTED_DO_NOT_MUTATE'; v_token:=null;
  else
    v_decision:='INCOMPATIBLE_HIGH_SEVERITY_DO_NOT_MUTATE'; v_token:=null;
  end if;
  update public.staging_disposable_participant_reservations r set compensation_request_id=p_compensation_request_id,compensation_auth_user_id=p_auth_user_id,compensation_claim_token=v_token,compensation_claim_expires_at=case when v_token is null then null else v_now+interval '2 minutes' end,compensation_decision=v_decision,updated_by=p_actor_user_id,updated_at=v_now where r.id=v.id;
  if v_decision='INCOMPATIBLE_HIGH_SEVERITY_DO_NOT_MUTATE' then
    insert into public.staging_disposable_participant_reservation_events(reservation_id,event_type,actor_user_id,occurred_at,event_details)
    values(v.id,'COMPENSATION_CONFLICT_HIGH_SEVERITY',p_actor_user_id,v_now,jsonb_build_object('severity','HIGH','compensation_request_id',p_compensation_request_id,'candidate_auth_user_id',p_auth_user_id,'bound_auth_user_id',v.auth_user_id,'reservation_status',v.reservation_status,'auth_mutation_authorized',false,'credential_stored',false));
  end if;
  return query select v_decision,v_token;
end$$;

create function public.record_staging_disposable_registration_failure(p_reservation_id uuid,p_auth_user_id uuid,p_auth_deleted boolean,p_block_verified boolean,p_compensation_request_id uuid,p_compensation_claim_token uuid,p_actor_user_id uuid)
returns table(reservation_status text) language plpgsql security definer set search_path=public,pg_catalog as $$
declare v public.staging_disposable_participant_reservations%rowtype; v_status text; v_now timestamptz:=clock_timestamp();
begin
  perform public.assert_disposable_intrinsic_staging_boundary(); perform public.assert_disposable_administrator(p_actor_user_id);
  select r.* into v from public.staging_disposable_participant_reservations as r where r.id=p_reservation_id for update;
  if not found or v.reservation_status not in ('RESERVED','AUTH_BOUND_BLOCKED') then raise exception using errcode='P1001',message='Disposable recovery anchor is not eligible.'; end if;
  if v.compensation_decision<>'MUTATION_AUTHORIZED' or v.compensation_request_id<>p_compensation_request_id or v.compensation_auth_user_id<>p_auth_user_id or v.compensation_claim_token<>p_compensation_claim_token or v.compensation_claim_expires_at<=v_now then raise exception using errcode='P1001',message='Disposable compensation authority is absent or expired.'; end if;
  if v.auth_user_id is not null and v.auth_user_id<>p_auth_user_id then raise exception using errcode='P1001',message='Disposable recovery Auth identity conflicts.'; end if;
  if p_auth_deleted and exists(select 1 from auth.users as u where u.id=p_auth_user_id and u.deleted_at is null) then raise exception using errcode='P1001',message='Disposable recovery Auth deletion is not verified.'; end if;
  if not p_auth_deleted and not exists(select 1 from auth.users u where u.id=p_auth_user_id and lower(u.email)=v.synthetic_email and u.deleted_at is null and u.raw_app_meta_data->>'hfos_environment'='STAGING' and u.raw_app_meta_data->>'hfos_fixture'='DISPOSABLE_E2E_FIXTURE' and u.raw_app_meta_data->>'hfos_fixture_request_id'=v.request_id::text) then raise exception using errcode='P1001',message='Disposable recovery Auth provenance is invalid.'; end if;
  v_status:=case when p_auth_deleted then 'AUTH_DELETED' when p_block_verified then 'REGISTRATION_FAILED_RECOVERY' else 'BLOCK_STATUS_UNVERIFIED_HIGH_SEVERITY' end;
  update public.staging_disposable_participant_reservations as r set auth_user_id=p_auth_user_id,auth_bound_at=coalesce(r.auth_bound_at,v_now),reservation_status=v_status,failed_at=v_now,compensation_claim_token=null,compensation_claim_expires_at=null,updated_by=p_actor_user_id,updated_at=v_now where r.id=v.id;
  insert into public.staging_disposable_participant_reservation_events(reservation_id,event_type,actor_user_id,occurred_at,event_details) values(v.id,v_status,p_actor_user_id,v_now,jsonb_build_object('auth_deleted',p_auth_deleted,'block_verified',p_block_verified,'credential_stored',false));
  return query select v_status;
end$$;

-- PostgreSQL identifies this function by name plus argument types, not argument names.
-- The core migration used p_request_id for the first uuid. Drop it transactionally before
-- recreating it with reservation-first semantics, so there is no callable legacy window.
drop function public.register_staging_disposable_participant(uuid,uuid,text,uuid);
drop function public.record_staging_disposable_auth_orphan(uuid,uuid,text,uuid);
drop function public.list_staging_disposable_auth_orphans(uuid);
drop function public.mark_staging_disposable_orphan_auth_deleted(uuid,uuid,uuid);
drop function public.finalize_staging_disposable_auth_orphan(uuid,uuid,uuid);
create function public.register_staging_disposable_participant(p_reservation_id uuid,p_auth_user_id uuid,p_synthetic_email text,p_actor_user_id uuid)
returns table(fixture_id uuid,auth_user_id uuid,participant_id uuid,participant_code text,synthetic_email text,fixture_status text,created_at timestamptz)
language plpgsql security definer set search_path=public,pg_catalog as $$
declare v_r public.staging_disposable_participant_reservations%rowtype; v_p public.participants%rowtype; v_f public.staging_disposable_participant_fixtures%rowtype; v_now timestamptz:=clock_timestamp();
begin
  perform public.assert_disposable_intrinsic_staging_boundary(); perform public.assert_disposable_administrator(p_actor_user_id);
  select r.* into v_r from public.staging_disposable_participant_reservations as r where r.id=p_reservation_id for update;
  if not found or v_r.reservation_status<>'AUTH_BOUND_BLOCKED' or v_r.auth_user_id<>p_auth_user_id or v_r.synthetic_email<>lower(p_synthetic_email) then raise exception using errcode='P1001',message='Disposable reservation is not registration-eligible.'; end if;
  if not exists(select 1 from auth.users u where u.id=v_r.auth_user_id and lower(u.email)=v_r.synthetic_email and u.deleted_at is null and u.banned_until>v_now and u.raw_app_meta_data->>'hfos_environment'='STAGING' and u.raw_app_meta_data->>'hfos_fixture'='DISPOSABLE_E2E_FIXTURE' and u.raw_app_meta_data->>'hfos_fixture_request_id'=v_r.request_id::text) then raise exception using errcode='P1001',message='Disposable registration Auth provenance is invalid.'; end if;
  insert into public.participants(auth_user_id,lifecycle_status,research_status,created_by,updated_by,created_at,updated_at) values(v_r.auth_user_id,'pending_enrollment','not_enrolled',p_actor_user_id,p_actor_user_id,v_now,v_now) returning * into v_p;
  insert into public.participant_profiles(participant_id,first_name,last_name,preferred_name,email,profile_completed,created_by,updated_by,created_at,updated_at) values(v_p.id,'Disposable','Participant','Synthetic E2E',v_r.synthetic_email,false,p_actor_user_id,p_actor_user_id,v_now,v_now);
  insert into public.staging_disposable_participant_fixtures(request_id,auth_user_id,participant_id,synthetic_email,created_by,created_at) values(v_r.request_id,v_r.auth_user_id,v_p.id,v_r.synthetic_email,p_actor_user_id,v_now) returning * into v_f;
  update public.staging_disposable_participant_reservations as r set reservation_status='ACTIVE',fixture_id=v_f.id,participant_id=v_p.id,activated_at=v_now,auth_creation_claim_token=null,auth_creation_claimed_at=null,auth_creation_claim_expires_at=null,updated_by=p_actor_user_id,updated_at=v_now where r.id=v_r.id and r.reservation_status='AUTH_BOUND_BLOCKED';
  insert into public.staging_disposable_participant_reservation_events(reservation_id,event_type,actor_user_id,occurred_at,event_details) values(v_r.id,'ACTIVATED',p_actor_user_id,v_now,jsonb_build_object('lifecycle_status','pending_enrollment','research_status','not_enrolled','profile_completed',false,'credential_stored',false));
  insert into public.staging_disposable_participant_fixture_events(fixture_id,event_type,actor_user_id,occurred_at,event_details) values(v_f.id,'PROVISIONED',p_actor_user_id,v_now,jsonb_build_object('reservation_id',v_r.id,'credential_stored',false));
  return query select v_f.id,v_f.auth_user_id,v_p.id,v_p.participant_code,v_f.synthetic_email,v_f.fixture_status,v_f.created_at;
exception when sqlstate 'P1001' then raise; when others then raise exception using errcode='P1002',message='Disposable fixture could not be registered.'; end$$;

-- Couple cleanup state to the reservation. Existing cleanup functions remain responsible for governed-record checks and participant/profile soft deletion.
create function public.sync_staging_disposable_reservation_cleanup() returns trigger language plpgsql security definer set search_path=public,pg_catalog as $$
declare v_now timestamptz:=clock_timestamp();
begin
  if new.fixture_status='REVOCATION_PENDING' and old.fixture_status='ACTIVE' then
    update public.staging_disposable_participant_reservations as r set reservation_status='CLEANUP_PENDING',cleanup_started_at=v_now,updated_by=r.created_by,updated_at=v_now where r.fixture_id=new.id and r.reservation_status='ACTIVE';
  elsif new.fixture_status='REVOKED' and old.fixture_status='REVOCATION_PENDING' then
    update public.staging_disposable_participant_reservations as r set reservation_status='REVOKED',revoked_at=new.revoked_at,updated_by=coalesce(new.revoked_by,r.created_by),updated_at=v_now where r.fixture_id=new.id and r.reservation_status='CLEANUP_PENDING';
  end if;
  return new;
end$$;
create trigger sync_staging_disposable_reservation_cleanup after update of fixture_status on public.staging_disposable_participant_fixtures for each row execute function public.sync_staging_disposable_reservation_cleanup();

-- Finalization proves the Auth identity and its current ban inside the same database
-- transaction that soft-deletes the portal records and writes the audit assertion.
create or replace function public.finalize_staging_disposable_cleanup(p_fixture_id uuid,p_actor_user_id uuid)
returns table(fixture_id uuid,fixture_status text,revoked_at timestamptz)
language plpgsql security definer set search_path=public,pg_catalog as $$
declare v public.staging_disposable_participant_fixtures%rowtype; v_now timestamptz:=clock_timestamp();
begin
  perform public.assert_disposable_intrinsic_staging_boundary(); perform public.assert_disposable_administrator(p_actor_user_id);
  select * into v from public.staging_disposable_participant_fixtures f where f.id=p_fixture_id for update;
  if not found or v.fixture_type<>'DISPOSABLE_E2E_FIXTURE' or v.fixture_status<>'REVOCATION_PENDING' then raise exception using errcode='P1001',message='Disposable fixture cleanup is not pending.'; end if;
  perform * from public.assert_disposable_cleanup_admissible(p_fixture_id,p_actor_user_id);
  if not exists(select 1 from auth.users u where u.id=v.auth_user_id and lower(u.email)=v.synthetic_email and u.deleted_at is null and u.banned_until>v_now and u.raw_app_meta_data->>'hfos_environment'='STAGING' and u.raw_app_meta_data->>'hfos_fixture'='DISPOSABLE_E2E_FIXTURE' and u.raw_app_meta_data->>'hfos_fixture_request_id'=v.request_id::text) then raise exception using errcode='P1001',message='Disposable cleanup Auth ban and provenance are not verified.'; end if;
  update public.participant_profiles set deleted_at=v_now,updated_at=v_now,updated_by=p_actor_user_id where participant_id=v.participant_id and deleted_at is null;
  update public.participants set deleted_at=v_now,updated_at=v_now,updated_by=p_actor_user_id where id=v.participant_id and deleted_at is null;
  update public.staging_disposable_participant_fixtures f set fixture_status='REVOKED',revoked_by=p_actor_user_id,revoked_at=v_now where f.id=v.id and f.fixture_status='REVOCATION_PENDING';
  if not found then raise exception using errcode='P1001',message='Disposable fixture cleanup is not pending.'; end if;
  insert into public.staging_disposable_participant_fixture_events(fixture_id,event_type,actor_user_id,occurred_at,event_details) values(v.id,'REVOKED',p_actor_user_id,v_now,jsonb_build_object('auth_access','BANNED','auth_ban_verified_in_database',true,'participant_record','SOFT_DELETED','profile_record','SOFT_DELETED'));
  return query select v.id,'REVOKED'::text,v_now;
end$$;

create function public.list_staging_disposable_reservation_recovery(p_actor_user_id uuid)
returns table(reservation_id uuid,request_id uuid,auth_user_id uuid,synthetic_email text,reservation_status text,created_at timestamptz,failed_at timestamptz)
language plpgsql stable security definer set search_path=public,pg_catalog as $$begin
  perform public.assert_disposable_intrinsic_staging_boundary(); perform public.assert_disposable_administrator(p_actor_user_id);
  return query select r.id,r.request_id,r.auth_user_id,r.synthetic_email,r.reservation_status,r.created_at,r.failed_at
  from public.staging_disposable_participant_reservations r
  where r.reservation_status in ('AUTH_CREATION_FAILED','AUTH_CREATION_AMBIGUOUS_HIGH_SEVERITY','REGISTRATION_FAILED_RECOVERY','BLOCK_STATUS_UNVERIFIED_HIGH_SEVERITY','AUTH_DELETED')
  order by r.created_at desc;
end$$;

create function public.mark_staging_disposable_reservation_auth_deleted(p_reservation_id uuid,p_auth_user_id uuid,p_actor_user_id uuid)
returns void language plpgsql security definer set search_path=public,pg_catalog as $$
declare v public.staging_disposable_participant_reservations%rowtype; v_now timestamptz:=clock_timestamp();
begin
  perform public.assert_disposable_intrinsic_staging_boundary(); perform public.assert_disposable_administrator(p_actor_user_id);
  select r.* into v from public.staging_disposable_participant_reservations as r where r.id=p_reservation_id for update;
  if not found or v.auth_user_id<>p_auth_user_id or v.reservation_status not in ('REGISTRATION_FAILED_RECOVERY','BLOCK_STATUS_UNVERIFIED_HIGH_SEVERITY','AUTH_DELETED') then raise exception using errcode='P1001',message='Disposable reservation recovery identity is invalid.'; end if;
  if exists(select 1 from auth.users as u where u.id=p_auth_user_id and u.deleted_at is null) then raise exception using errcode='P1001',message='Disposable reservation Auth deletion is not verified.'; end if;
  if v.reservation_status<>'AUTH_DELETED' then
    update public.staging_disposable_participant_reservations as r set reservation_status='AUTH_DELETED',failed_at=coalesce(r.failed_at,v_now),updated_by=p_actor_user_id,updated_at=v_now where r.id=v.id;
    insert into public.staging_disposable_participant_reservation_events(reservation_id,event_type,actor_user_id,occurred_at,event_details) values(v.id,'AUTH_DELETED',p_actor_user_id,v_now,jsonb_build_object('credential_stored',false,'auth_deleted',true));
  end if;
end$$;

alter function public.reserve_staging_disposable_participant(uuid,text,uuid) owner to postgres;
alter function public.renew_staging_disposable_auth_creation_claim(uuid,uuid,uuid) owner to postgres;
alter function public.bind_staging_disposable_reservation_auth(uuid,uuid,uuid,uuid) owner to postgres;
alter function public.mark_staging_disposable_auth_creation_failed(uuid,uuid,uuid) owner to postgres;
alter function public.mark_staging_disposable_auth_creation_ambiguous(uuid,uuid,uuid) owner to postgres;
alter function public.authorize_staging_disposable_auth_compensation(uuid,uuid,uuid,uuid,uuid) owner to postgres;
alter function public.record_staging_disposable_registration_failure(uuid,uuid,boolean,boolean,uuid,uuid,uuid) owner to postgres;
alter function public.register_staging_disposable_participant(uuid,uuid,text,uuid) owner to postgres;
alter function public.sync_staging_disposable_reservation_cleanup() owner to postgres;
alter function public.list_staging_disposable_reservation_recovery(uuid) owner to postgres;
alter function public.mark_staging_disposable_reservation_auth_deleted(uuid,uuid,uuid) owner to postgres;
revoke all on public.staging_disposable_participant_reservations,public.staging_disposable_participant_reservation_events from public,anon,authenticated,service_role;
revoke all on function public.reserve_staging_disposable_participant(uuid,text,uuid),public.renew_staging_disposable_auth_creation_claim(uuid,uuid,uuid),public.bind_staging_disposable_reservation_auth(uuid,uuid,uuid,uuid),public.mark_staging_disposable_auth_creation_failed(uuid,uuid,uuid),public.mark_staging_disposable_auth_creation_ambiguous(uuid,uuid,uuid),public.authorize_staging_disposable_auth_compensation(uuid,uuid,uuid,uuid,uuid),public.record_staging_disposable_registration_failure(uuid,uuid,boolean,boolean,uuid,uuid,uuid),public.register_staging_disposable_participant(uuid,uuid,text,uuid),public.sync_staging_disposable_reservation_cleanup(),public.list_staging_disposable_reservation_recovery(uuid),public.mark_staging_disposable_reservation_auth_deleted(uuid,uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.reserve_staging_disposable_participant(uuid,text,uuid),public.renew_staging_disposable_auth_creation_claim(uuid,uuid,uuid),public.bind_staging_disposable_reservation_auth(uuid,uuid,uuid,uuid),public.mark_staging_disposable_auth_creation_failed(uuid,uuid,uuid),public.mark_staging_disposable_auth_creation_ambiguous(uuid,uuid,uuid),public.authorize_staging_disposable_auth_compensation(uuid,uuid,uuid,uuid,uuid),public.record_staging_disposable_registration_failure(uuid,uuid,boolean,boolean,uuid,uuid,uuid),public.register_staging_disposable_participant(uuid,uuid,text,uuid),public.list_staging_disposable_reservation_recovery(uuid),public.mark_staging_disposable_reservation_auth_deleted(uuid,uuid,uuid) to service_role;
comment on table public.staging_disposable_participant_reservations is 'Pre-Auth durable recovery anchor. Contains no credential; every provisioning state transition is fail-closed and database-coordinated.';
commit;
