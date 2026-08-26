begin;

alter table public.staging_disposable_participant_reservations
  add column activation_request_id uuid,
  add column activation_claim_token uuid,
  add column activation_claim_expires_at timestamptz,
  add column activation_state text not null default 'BLOCKED'
    check (activation_state in ('BLOCKED','UNBAN_AUTHORIZED','ACTIVE','AMBIGUOUS_REBAN_REQUIRED'));

do $$
declare
  v_event_type_attnum smallint;
  v_constraint_names name[];
begin
  select a.attnum
    into v_event_type_attnum
    from pg_catalog.pg_attribute a
   where a.attrelid = 'public.staging_disposable_participant_reservation_events'::regclass
     and a.attname = 'event_type'
     and not a.attisdropped;

  if v_event_type_attnum is null then
    raise exception 'event_type column is missing from staging disposable reservation events';
  end if;

  select array_agg(c.conname order by c.conname)
    into v_constraint_names
    from pg_catalog.pg_constraint c
   where c.conrelid = 'public.staging_disposable_participant_reservation_events'::regclass
     and c.contype = 'c'
     and c.conkey = array[v_event_type_attnum]::smallint[];

  if coalesce(cardinality(v_constraint_names), 0) <> 1 then
    raise exception 'expected exactly one event_type CHECK constraint, found %',
      coalesce(cardinality(v_constraint_names), 0);
  end if;

  execute format(
    'alter table public.staging_disposable_participant_reservation_events drop constraint %I',
    v_constraint_names[1]
  );
end
$$;

alter table public.staging_disposable_participant_reservation_events
  add constraint stg_disp_res_event_type_chk check (event_type in (
    'RESERVED','AUTH_CREATION_CLAIMED','AUTH_CREATION_CLAIM_RECOVERED','AUTH_CREATION_AMBIGUOUS_HIGH_SEVERITY','AUTH_BOUND_BLOCKED','AUTH_CREATION_FAILED','ACTIVATED',
    'ACTIVATION_AUTHORIZED','ACTIVATION_CONFIRMED','ACTIVATION_INVALIDATED','ACTIVATION_AMBIGUOUS_REBAN_REQUIRED',
    'COMPENSATION_CONFLICT_HIGH_SEVERITY','REGISTRATION_FAILED_RECOVERY','BLOCK_STATUS_UNVERIFIED_HIGH_SEVERITY','AUTH_DELETED','CLEANUP_STARTED','REVOKED'
  ));

create table public.disposable_cleanup_governed_roots (
  root_table regclass not null,
  constraint_name name not null,
  link_column name not null,
  referenced_table regclass not null,
  cleanup_disposition text not null check (cleanup_disposition in ('BLOCKER_ROOT','FIXTURE_CONTROL','INTERNAL_CONTROL','SOFT_DELETE_TARGET','ACTOR_AUDIT_PROVENANCE_EXEMPT','OTHER_REVIEWED_EXEMPT')),
  rationale text not null check (btrim(rationale)<>''),
  primary key(root_table,constraint_name)
);
insert into public.disposable_cleanup_governed_roots(root_table,constraint_name,link_column,referenced_table,cleanup_disposition,rationale) values
('auth.identities','identities_user_id_fkey','user_id','auth.users','INTERNAL_CONTROL','Supabase Auth internal subject control; cleanup never mutates Auth-owned child rows.'),
('auth.mfa_factors','mfa_factors_user_id_fkey','user_id','auth.users','INTERNAL_CONTROL','Supabase Auth internal subject control; cleanup never mutates Auth-owned child rows.'),
('auth.oauth_authorizations','oauth_authorizations_user_id_fkey','user_id','auth.users','INTERNAL_CONTROL','Supabase Auth internal subject control; cleanup never mutates Auth-owned child rows.'),
('auth.oauth_consents','oauth_consents_user_id_fkey','user_id','auth.users','INTERNAL_CONTROL','Supabase Auth internal subject control; cleanup never mutates Auth-owned child rows.'),
('auth.one_time_tokens','one_time_tokens_user_id_fkey','user_id','auth.users','INTERNAL_CONTROL','Supabase Auth internal subject control; cleanup never mutates Auth-owned child rows.'),
('auth.sessions','sessions_user_id_fkey','user_id','auth.users','INTERNAL_CONTROL','Supabase Auth internal subject control; cleanup never mutates Auth-owned child rows.'),
('auth.webauthn_challenges','webauthn_challenges_user_id_fkey','user_id','auth.users','INTERNAL_CONTROL','Supabase Auth internal subject control; cleanup never mutates Auth-owned child rows.'),
('auth.webauthn_credentials','webauthn_credentials_user_id_fkey','user_id','auth.users','INTERNAL_CONTROL','Supabase Auth internal subject control; cleanup never mutates Auth-owned child rows.'),
('public.applications','applications_auth_user_id_fkey','auth_user_id','auth.users','BLOCKER_ROOT','Runtime cleanup admissibility explicitly rejects this subject relation.'),
('public.applications','applications_created_by_fkey','created_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.applications','applications_reviewed_by_fkey','reviewed_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.applications','applications_updated_by_fkey','updated_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.assessment_sessions','assessment_sessions_participant_id_fkey','participant_id','public.participants','BLOCKER_ROOT','Runtime cleanup admissibility explicitly rejects this subject relation.'),
('public.assessments','assessments_participant_id_fkey','participant_id','public.participants','BLOCKER_ROOT','Runtime cleanup admissibility explicitly rejects this subject relation.'),
('public.consents','consents_participant_id_fkey','participant_id','public.participants','BLOCKER_ROOT','Runtime cleanup admissibility explicitly rejects this subject relation.'),
('public.consents','consents_recorded_by_fkey','recorded_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.eligibility_reviews','eligibility_reviews_created_by_fkey','created_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.eligibility_reviews','eligibility_reviews_reviewed_by_fkey','reviewed_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.eligibility_reviews','eligibility_reviews_updated_by_fkey','updated_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.evidence_upload_reservations','evidence_upload_reservations_participant_id_fkey','participant_id','public.participants','BLOCKER_ROOT','Runtime cleanup admissibility explicitly rejects this subject relation.'),
('public.hfos_current_measurement_runs','hfos_current_measurement_runs_participant_id_fkey','participant_id','public.participants','BLOCKER_ROOT','Runtime cleanup admissibility explicitly rejects this subject relation.'),
('public.hfos_intrinsic_environment_configuration','hfos_intrinsic_environment_configuration_installed_by_fkey','installed_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.hfos_measurement_audit_log','hfos_measurement_audit_log_participant_id_fkey','participant_id','public.participants','BLOCKER_ROOT','Runtime cleanup admissibility explicitly rejects this subject relation.'),
('public.hfos_measurement_runs','hfos_measurement_runs_participant_id_fkey','participant_id','public.participants','BLOCKER_ROOT','Runtime cleanup admissibility explicitly rejects this subject relation.'),
('public.participant_invitations','participant_invitations_auth_user_id_fkey','auth_user_id','auth.users','BLOCKER_ROOT','Runtime cleanup admissibility explicitly rejects this subject relation.'),
('public.participant_invitations','participant_invitations_invited_by_fkey','invited_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.participant_invitations','participant_invitations_participant_id_fkey','participant_id','public.participants','BLOCKER_ROOT','Runtime cleanup admissibility explicitly rejects this subject relation.'),
('public.participant_lifecycle_history','participant_lifecycle_history_changed_by_fkey','changed_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.participant_lifecycle_history','participant_lifecycle_history_participant_id_fkey','participant_id','public.participants','BLOCKER_ROOT','Runtime cleanup admissibility explicitly rejects this subject relation.'),
('public.participant_profiles','participant_profiles_auth_user_id_fkey','auth_user_id','auth.users','SOFT_DELETE_TARGET','Exact fixture subject row is soft-deleted during finalization.'),
('public.participant_profiles','participant_profiles_participant_id_fkey','participant_id','public.participants','SOFT_DELETE_TARGET','Exact fixture subject row is soft-deleted during finalization.'),
('public.participant_research_identities','participant_research_identities_created_by_fkey','created_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.participant_research_identities','participant_research_identities_participant_id_fkey','participant_id','public.participants','BLOCKER_ROOT','Runtime cleanup admissibility explicitly rejects this subject relation.'),
('public.participants','participants_auth_user_id_fkey','auth_user_id','auth.users','SOFT_DELETE_TARGET','Exact fixture subject row is soft-deleted during finalization.'),
('public.participants','participants_created_by_fkey','created_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.participants','participants_updated_by_fkey','updated_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.preliminary_reports','preliminary_reports_participant_id_fkey','participant_id','public.participants','BLOCKER_ROOT','Runtime cleanup admissibility explicitly rejects this subject relation.'),
('public.research_audit_integrity_assessments','research_audit_integrity_assessments_assessed_by_fkey','assessed_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_consent_decision_bindings','research_consent_decision_bindings_actor_user_id_fkey','actor_user_id','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_consent_presentation_events','research_consent_presentation_events_presented_by_fkey','presented_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_consent_records','research_consent_records_decision_actor_user_id_fkey','decision_actor_user_id','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_control_audit_events','research_control_audit_events_actor_user_id_fkey','actor_user_id','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_enrollment_status_history','research_enrollment_status_history_actor_user_id_fkey','actor_user_id','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_enrollments','research_enrollments_created_by_fkey','created_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_evaluations','research_evaluations_created_by_fkey','created_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_evidence_items','research_evidence_items_created_by_fkey','created_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_evidence_versions','research_evidence_versions_created_by_fkey','created_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_follow_up_records','research_follow_up_records_created_by_fkey','created_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_follow_up_scope_decision_events','research_follow_up_scope_decision_e_decision_actor_user_id_fkey','decision_actor_user_id','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_fsh_collections','research_fsh_collections_created_by_fkey','created_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_fsh_result_supersession_events','research_fsh_result_supersession_events_actor_user_id_fkey','actor_user_id','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_fsh_results','research_fsh_results_created_by_fkey','created_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_incident_gate_effects','research_incident_gate_effects_actor_user_id_fkey','actor_user_id','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_incident_invalid_transition_attempts','research_incident_invalid_transition_attempt_actor_user_id_fkey','actor_user_id','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_incident_reviews','research_incident_reviews_reviewer_user_id_fkey','reviewer_user_id','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_incident_status_events','research_incident_status_events_actor_user_id_fkey','actor_user_id','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_incidents','research_incidents_reporter_user_id_fkey','reporter_user_id','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_outcomes','research_outcomes_proposed_by_fkey','proposed_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_privacy_bindings','research_privacy_bindings_actor_user_id_fkey','actor_user_id','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_raw_observations','research_raw_observations_recorded_by_fkey','recorded_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_release_gate_assessments','research_release_gate_assessments_assessed_by_fkey','assessed_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_review_adjudications','research_review_adjudications_adjudicator_user_id_fkey','adjudicator_user_id','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_snapshots','research_snapshots_created_by_fkey','created_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_verified_events','research_verified_events_verified_by_fkey','verified_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.research_withdrawal_records','research_withdrawal_records_actor_user_id_fkey','actor_user_id','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.staff_member_roles','staff_member_roles_assigned_by_fkey','assigned_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.staff_member_roles','staff_member_roles_created_by_fkey','created_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.staff_member_roles','staff_member_roles_updated_by_fkey','updated_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.staff_members','staff_members_auth_user_id_fkey','auth_user_id','auth.users','BLOCKER_ROOT','Runtime cleanup admissibility explicitly rejects this subject relation.'),
('public.staff_members','staff_members_created_by_fkey','created_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.staff_members','staff_members_updated_by_fkey','updated_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.staff_roles','staff_roles_created_by_fkey','created_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.staff_roles','staff_roles_updated_by_fkey','updated_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.staging_disposable_auth_orphan_events','staging_disposable_auth_orphan_events_actor_user_id_fkey','actor_user_id','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.staging_disposable_auth_orphans','staging_disposable_auth_orphans_created_by_fkey','created_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.staging_disposable_auth_orphans','staging_disposable_auth_orphans_resolved_by_fkey','resolved_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.staging_disposable_participant_fixture_events','staging_disposable_participant_fixture_event_actor_user_id_fkey','actor_user_id','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.staging_disposable_participant_fixtures','staging_disposable_participant_fixtures_auth_user_id_fkey','auth_user_id','auth.users','FIXTURE_CONTROL','Disposable fixture lifecycle control owned by the cleanup workflow.'),
('public.staging_disposable_participant_fixtures','staging_disposable_participant_fixtures_created_by_fkey','created_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.staging_disposable_participant_fixtures','staging_disposable_participant_fixtures_participant_id_fkey','participant_id','public.participants','FIXTURE_CONTROL','Disposable fixture lifecycle control owned by the cleanup workflow.'),
('public.staging_disposable_participant_fixtures','staging_disposable_participant_fixtures_revoked_by_fkey','revoked_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.staging_disposable_participant_reservation_events','staging_disposable_participant_reservation_e_actor_user_id_fkey','actor_user_id','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.staging_disposable_participant_reservations','staging_disposable_participant_reservations_created_by_fkey','created_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.'),
('public.staging_disposable_participant_reservations','staging_disposable_participant_reservations_participant_id_fkey','participant_id','public.participants','FIXTURE_CONTROL','Disposable fixture lifecycle control owned by the cleanup workflow.'),
('public.staging_disposable_participant_reservations','staging_disposable_participant_reservations_updated_by_fkey','updated_by','auth.users','ACTOR_AUDIT_PROVENANCE_EXEMPT','Table-specific actor, audit, or provenance reference; not the disposable cleanup subject.');
alter table public.disposable_cleanup_governed_roots enable row level security;
alter table public.disposable_cleanup_governed_roots force row level security;
revoke all on public.disposable_cleanup_governed_roots from public,anon,authenticated,service_role;

create function public.authorize_staging_disposable_activation(p_reservation_id uuid,p_fixture_id uuid,p_auth_user_id uuid,p_activation_request_id uuid,p_actor_user_id uuid)
returns table(activation_claim_token uuid,activation_claim_expires_at timestamptz)
language plpgsql security definer set search_path=public,pg_catalog as $$
declare v public.staging_disposable_participant_reservations%rowtype; v_now timestamptz:=clock_timestamp(); v_token uuid:=gen_random_uuid();
begin
  perform public.assert_disposable_intrinsic_staging_boundary(); perform public.assert_disposable_administrator(p_actor_user_id);
  if p_activation_request_id is null then raise exception using errcode='P1001',message='Disposable activation request is invalid.'; end if;
  select r.* into v from public.staging_disposable_participant_reservations r where r.id=p_reservation_id for update;
  if not found or v.reservation_status<>'ACTIVE' or v.fixture_id<>p_fixture_id or v.auth_user_id<>p_auth_user_id or v.activation_state not in ('BLOCKED','UNBAN_AUTHORIZED')
    or not exists(select 1 from public.staging_disposable_participant_fixtures f where f.id=p_fixture_id and f.fixture_status='ACTIVE' and f.auth_user_id=p_auth_user_id)
    or not exists(select 1 from auth.users u where u.id=p_auth_user_id and u.deleted_at is null and u.banned_until>v_now)
  then raise exception using errcode='P1001',message='Disposable activation authority is unavailable.'; end if;
  if v.activation_claim_expires_at>v_now then
    if v.activation_request_id<>p_activation_request_id then raise exception using errcode='P1001',message='Disposable activation authority is already claimed.'; end if;
    return query select v.activation_claim_token,v.activation_claim_expires_at; return;
  end if;
  update public.staging_disposable_participant_reservations r set activation_request_id=p_activation_request_id,activation_claim_token=v_token,activation_claim_expires_at=v_now+interval '30 seconds',activation_state='UNBAN_AUTHORIZED',updated_by=p_actor_user_id,updated_at=v_now where r.id=v.id;
  insert into public.staging_disposable_participant_reservation_events(reservation_id,event_type,actor_user_id,occurred_at,event_details) values(v.id,'ACTIVATION_AUTHORIZED',p_actor_user_id,v_now,jsonb_build_object('activation_request_id',p_activation_request_id,'lease_seconds',30,'credential_stored',false));
  return query select v_token,v_now+interval '30 seconds';
end$$;

create function public.validate_staging_disposable_activation(p_reservation_id uuid,p_fixture_id uuid,p_auth_user_id uuid,p_activation_request_id uuid,p_activation_claim_token uuid,p_actor_user_id uuid)
returns boolean language plpgsql security definer set search_path=public,pg_catalog as $$
declare v_ok boolean; v_now timestamptz:=clock_timestamp();
begin
  perform public.assert_disposable_intrinsic_staging_boundary(); perform public.assert_disposable_administrator(p_actor_user_id);
  select true into v_ok from public.staging_disposable_participant_reservations r join public.staging_disposable_participant_fixtures f on f.id=r.fixture_id
  where r.id=p_reservation_id and r.fixture_id=p_fixture_id and r.auth_user_id=p_auth_user_id and r.reservation_status='ACTIVE' and r.activation_state='UNBAN_AUTHORIZED'
    and r.activation_request_id=p_activation_request_id and r.activation_claim_token=p_activation_claim_token and r.activation_claim_expires_at>v_now and f.fixture_status='ACTIVE' and f.auth_user_id=p_auth_user_id
  for update of r;
  return coalesce(v_ok,false);
end$$;

create function public.reconcile_staging_disposable_activation(p_reservation_id uuid,p_fixture_id uuid,p_auth_user_id uuid,p_activation_request_id uuid,p_activation_claim_token uuid,p_auth_is_unbanned boolean,p_actor_user_id uuid)
returns text language plpgsql security definer set search_path=public,pg_catalog as $$
declare v public.staging_disposable_participant_reservations%rowtype; v_now timestamptz:=clock_timestamp(); v_authorized boolean;
begin
  perform public.assert_disposable_intrinsic_staging_boundary(); perform public.assert_disposable_administrator(p_actor_user_id);
  select r.* into v from public.staging_disposable_participant_reservations r where r.id=p_reservation_id for update;
  if not found or v.fixture_id<>p_fixture_id or v.auth_user_id<>p_auth_user_id then raise exception using errcode='P1001',message='Disposable activation reconciliation identity conflicts.'; end if;
  v_authorized:=v.reservation_status='ACTIVE' and v.activation_state='UNBAN_AUTHORIZED' and v.activation_request_id=p_activation_request_id and v.activation_claim_token=p_activation_claim_token and v.activation_claim_expires_at>v_now
    and exists(select 1 from public.staging_disposable_participant_fixtures f where f.id=p_fixture_id and f.fixture_status='ACTIVE' and f.auth_user_id=p_auth_user_id);
  if p_auth_is_unbanned and v_authorized then
    update public.staging_disposable_participant_reservations r set activation_state='ACTIVE',activation_claim_token=null,activation_claim_expires_at=null,updated_by=p_actor_user_id,updated_at=v_now where r.id=v.id;
    insert into public.staging_disposable_participant_reservation_events(reservation_id,event_type,actor_user_id,occurred_at,event_details) values(v.id,'ACTIVATION_CONFIRMED',p_actor_user_id,v_now,jsonb_build_object('activation_request_id',p_activation_request_id,'auth_access','UNBANNED','credential_stored',false));
    return 'ACTIVE';
  elsif p_auth_is_unbanned then
    update public.staging_disposable_participant_reservations r set activation_state='AMBIGUOUS_REBAN_REQUIRED',activation_claim_token=null,activation_claim_expires_at=null,failed_at=coalesce(r.failed_at,v_now),updated_by=p_actor_user_id,updated_at=v_now where r.id=v.id;
    insert into public.staging_disposable_participant_reservation_events(reservation_id,event_type,actor_user_id,occurred_at,event_details) values(v.id,'ACTIVATION_AMBIGUOUS_REBAN_REQUIRED',p_actor_user_id,v_now,jsonb_build_object('severity','HIGH','activation_request_id',p_activation_request_id,'auth_access','UNBANNED','reban_required',true,'credential_stored',false));
    return 'AMBIGUOUS_REBAN_REQUIRED';
  end if;
  update public.staging_disposable_participant_reservations r set activation_state='BLOCKED',activation_claim_token=null,activation_claim_expires_at=null,updated_by=p_actor_user_id,updated_at=v_now where r.id=v.id and r.reservation_status='ACTIVE';
  return 'BLOCKED';
end$$;

create function public.authorize_staging_disposable_activation_reban(p_reservation_id uuid,p_fixture_id uuid,p_auth_user_id uuid,p_activation_request_id uuid,p_actor_user_id uuid)
returns boolean language plpgsql security definer set search_path=public,pg_catalog as $$
declare v_ok boolean;
begin
  perform public.assert_disposable_intrinsic_staging_boundary(); perform public.assert_disposable_administrator(p_actor_user_id);
  select true into v_ok from public.staging_disposable_participant_reservations r join public.staging_disposable_participant_fixtures f on f.id=r.fixture_id
  where r.id=p_reservation_id and r.fixture_id=p_fixture_id and r.auth_user_id=p_auth_user_id and r.activation_request_id=p_activation_request_id
    and (r.activation_state='AMBIGUOUS_REBAN_REQUIRED' or r.reservation_status in ('CLEANUP_PENDING','REVOKED') or f.fixture_status in ('REVOCATION_PENDING','REVOKED')) for update of r;
  return coalesce(v_ok,false);
end$$;

create or replace function public.sync_staging_disposable_reservation_cleanup() returns trigger language plpgsql security definer set search_path=public,pg_catalog as $$
declare v_now timestamptz:=clock_timestamp();
begin
  if new.fixture_status='REVOCATION_PENDING' and old.fixture_status='ACTIVE' then
    update public.staging_disposable_participant_reservations r set reservation_status='CLEANUP_PENDING',cleanup_started_at=v_now,activation_state='BLOCKED',activation_claim_token=null,activation_claim_expires_at=null,updated_by=r.created_by,updated_at=v_now where r.fixture_id=new.id and r.reservation_status='ACTIVE';
    insert into public.staging_disposable_participant_reservation_events(reservation_id,event_type,actor_user_id,occurred_at,event_details)
      select r.id,'ACTIVATION_INVALIDATED',coalesce(new.revoked_by,r.created_by),v_now,jsonb_build_object('cleanup_superseded_activation',true,'credential_stored',false) from public.staging_disposable_participant_reservations r where r.fixture_id=new.id;
  elsif new.fixture_status='REVOKED' and old.fixture_status='REVOCATION_PENDING' then
    update public.staging_disposable_participant_reservations r set reservation_status='REVOKED',revoked_at=new.revoked_at,activation_state='BLOCKED',activation_claim_token=null,activation_claim_expires_at=null,updated_by=coalesce(new.revoked_by,r.created_by),updated_at=v_now where r.fixture_id=new.id and r.reservation_status='CLEANUP_PENDING';
  end if;
  return new;
end$$;

create or replace function public.authorize_staging_disposable_auth_compensation(p_reservation_id uuid,p_auth_user_id uuid,p_auth_creation_claim_token uuid,p_compensation_request_id uuid,p_actor_user_id uuid)
returns table(compensation_decision text,compensation_claim_token uuid) language plpgsql security definer set search_path=public,pg_catalog as $$
declare v public.staging_disposable_participant_reservations%rowtype; v_decision text; v_token uuid; v_now timestamptz:=clock_timestamp();
begin
  perform public.assert_disposable_intrinsic_staging_boundary(); perform public.assert_disposable_administrator(p_actor_user_id);
  if p_compensation_request_id is null or p_auth_user_id is null then raise exception using errcode='P1001',message='Disposable compensation request is invalid.'; end if;
  select r.* into v from public.staging_disposable_participant_reservations r where r.id=p_reservation_id for update;
  if not found then raise exception using errcode='P1001',message='Disposable compensation reservation is unavailable.'; end if;
  if v.compensation_request_id=p_compensation_request_id and v.compensation_auth_user_id=p_auth_user_id then return query select v.compensation_decision,case when v.compensation_decision='MUTATION_AUTHORIZED' and v.compensation_claim_expires_at>v_now then v.compensation_claim_token else null::uuid end; return; end if;
  if v.compensation_claim_expires_at>v_now then raise exception using errcode='P1001',message='Disposable compensation authority collision or rebinding was refused.'; end if;
  if v.reservation_status in ('RESERVED','AUTH_BOUND_BLOCKED') and (v.auth_user_id is null or v.auth_user_id=p_auth_user_id) and v.auth_creation_claim_token=p_auth_creation_claim_token and v.auth_creation_claim_expires_at>v_now then v_decision:='MUTATION_AUTHORIZED';v_token:=gen_random_uuid();
  elsif v.auth_user_id=p_auth_user_id and v.reservation_status in ('AUTH_BOUND_BLOCKED','ACTIVE','CLEANUP_PENDING','REVOKED') then v_decision:='SHARED_OR_ADOPTED_DO_NOT_MUTATE';v_token:=null;
  else v_decision:='INCOMPATIBLE_HIGH_SEVERITY_DO_NOT_MUTATE';v_token:=null; end if;
  update public.staging_disposable_participant_reservations r set compensation_request_id=p_compensation_request_id,compensation_auth_user_id=p_auth_user_id,compensation_claim_token=v_token,compensation_claim_expires_at=case when v_token is null then null else v_now+interval '2 minutes' end,compensation_decision=v_decision,updated_by=p_actor_user_id,updated_at=v_now where r.id=v.id;
  if v_decision='INCOMPATIBLE_HIGH_SEVERITY_DO_NOT_MUTATE' then insert into public.staging_disposable_participant_reservation_events(reservation_id,event_type,actor_user_id,occurred_at,event_details) values(v.id,'COMPENSATION_CONFLICT_HIGH_SEVERITY',p_actor_user_id,v_now,jsonb_build_object('severity','HIGH','compensation_request_id',p_compensation_request_id,'candidate_auth_user_id',p_auth_user_id,'bound_auth_user_id',v.auth_user_id,'reservation_status',v.reservation_status,'auth_mutation_authorized',false,'credential_stored',false)); end if;
  return query select v_decision,v_token;
end$$;

alter function public.authorize_staging_disposable_activation(uuid,uuid,uuid,uuid,uuid) owner to postgres;
alter function public.validate_staging_disposable_activation(uuid,uuid,uuid,uuid,uuid,uuid) owner to postgres;
alter function public.reconcile_staging_disposable_activation(uuid,uuid,uuid,uuid,uuid,boolean,uuid) owner to postgres;
alter function public.authorize_staging_disposable_activation_reban(uuid,uuid,uuid,uuid,uuid) owner to postgres;
revoke all on function public.authorize_staging_disposable_activation(uuid,uuid,uuid,uuid,uuid),public.validate_staging_disposable_activation(uuid,uuid,uuid,uuid,uuid,uuid),public.reconcile_staging_disposable_activation(uuid,uuid,uuid,uuid,uuid,boolean,uuid),public.authorize_staging_disposable_activation_reban(uuid,uuid,uuid,uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.authorize_staging_disposable_activation(uuid,uuid,uuid,uuid,uuid),public.validate_staging_disposable_activation(uuid,uuid,uuid,uuid,uuid,uuid),public.reconcile_staging_disposable_activation(uuid,uuid,uuid,uuid,uuid,boolean,uuid),public.authorize_staging_disposable_activation_reban(uuid,uuid,uuid,uuid,uuid) to service_role;

commit;
