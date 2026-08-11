begin;

create table public.research_consent_presentation_artifacts (
  id uuid primary key default gen_random_uuid(),
  artifact_version text not null unique,
  artifact_sha256 text not null unique check (artifact_sha256 ~ '^[0-9a-f]{64}$'),
  authority_version text not null,
  review_status text not null check (review_status='PENDING_INDEPENDENT_GOVERNANCE_REVIEW'),
  runtime_scope text not null check (runtime_scope='SYNTHETIC_ONLY'),
  direct_consent_only boolean not null check (direct_consent_only),
  representative_consent_supported boolean not null check (not representative_consent_supported),
  family_scope text[] not null check (family_scope=array['FSH']::text[]),
  baseline_scope_available boolean not null check (baseline_scope_available),
  follow_up_scope_separate boolean not null check (follow_up_scope_separate),
  participant_output_scope text not null check (participant_output_scope='FACTUAL_STATUS_ONLY'),
  ai_processing_status text not null check (ai_processing_status='NOT_AUTHORIZED'),
  external_sharing_status text not null check (external_sharing_status='NOT_AUTHORIZED'),
  real_activation_status text not null check (real_activation_status='BLOCKED'),
  created_at timestamptz not null default clock_timestamp()
);

insert into public.research_consent_presentation_artifacts(
  artifact_version,artifact_sha256,authority_version,review_status,runtime_scope,direct_consent_only,
  representative_consent_supported,family_scope,baseline_scope_available,follow_up_scope_separate,
  participant_output_scope,ai_processing_status,external_sharing_status,real_activation_status
) values (
  'HFOS-W4-PARTICIPANT-RESEARCH-CONSENT-v0.1',
  'a8fedbe933d893fd7bbdf31c1b2351a49508cb83c660dac88fda3852ae93f744',
  'HFOS_Research_Consent_and_Withdrawal_Authority_v0.2',
  'PENDING_INDEPENDENT_GOVERNANCE_REVIEW','SYNTHETIC_ONLY',true,false,array['FSH'],true,true,
  'FACTUAL_STATUS_ONLY','NOT_AUTHORIZED','NOT_AUTHORIZED','BLOCKED'
);

alter table public.research_consent_presentation_artifacts enable row level security;
alter table public.research_consent_presentation_artifacts force row level security;
revoke all on public.research_consent_presentation_artifacts from public,anon,authenticated,service_role;
create trigger research_consent_presentation_artifacts_immutable before update or delete on public.research_consent_presentation_artifacts for each row execute function public.prevent_research_control_mutation();

create function public.present_wave4_synthetic_research_consent(p_enrollment_id uuid,p_actor_user_id uuid,p_correlation_id uuid)
returns table(consent_id uuid,consent_status text,consent_gate text)
language plpgsql security definer set search_path=public,pg_catalog as $$
declare e public.research_enrollments%rowtype; a public.research_consent_presentation_artifacts%rowtype;
begin
  if not public.is_active_research_administrator(p_actor_user_id) then raise exception using errcode='P1001',message='Actor is not authorized to present research consent.'; end if;
  select * into e from public.research_enrollments where id=p_enrollment_id;
  select * into a from public.research_consent_presentation_artifacts where artifact_version='HFOS-W4-PARTICIPANT-RESEARCH-CONSENT-v0.1';
  if not found or e.environment not in ('synthetic_development','synthetic_test') or a.runtime_scope<>'SYNTHETIC_ONLY' or a.real_activation_status<>'BLOCKED' then raise exception using errcode='P1001',message='Wave 4 consent presentation is not authorized for this context.'; end if;
  return query select * from public.record_research_consent_transition(
    e.id,p_actor_user_id,'PRESENTED',a.artifact_version,a.artifact_sha256,e.protocol_version,
    jsonb_build_object('FSH','HFOS-FSH-SYNTHETIC-RESEARCH-PLAN-v0.1'),array['FSH']::text[],
    array['BASELINE_RESEARCH','FOLLOW_UP_RESEARCH']::text[],true,'en-v1','PARTICIPANT_RESEARCH_PORTAL_SYNTHETIC',
    jsonb_build_object('artifact_review_status',a.review_status,'direct_consent_only',true,'real_activation','BLOCKED'),
    'WAVE4_SYNTHETIC_CONSENT_PRESENTED',p_correlation_id
  );
end $$;

create function public.decide_wave4_synthetic_research_consent(
  p_enrollment_id uuid,p_actor_user_id uuid,p_decision text,p_direct_consent_attested boolean,
  p_baseline_scope_granted boolean,p_follow_up_scope_granted boolean,p_acknowledgements jsonb,p_correlation_id uuid
)
returns table(consent_id uuid,consent_status text,consent_gate text)
language plpgsql security definer set search_path=public,pg_catalog as $$
declare e public.research_enrollments%rowtype; a public.research_consent_presentation_artifacts%rowtype; participant_auth uuid;
begin
  select * into e from public.research_enrollments where id=p_enrollment_id;
  select p.auth_user_id into participant_auth from public.participants p join public.participant_research_identities r on r.participant_id=p.id where r.id=e.participant_research_identity_id and p.deleted_at is null;
  select * into a from public.research_consent_presentation_artifacts where artifact_version='HFOS-W4-PARTICIPANT-RESEARCH-CONSENT-v0.1';
  if p_actor_user_id is distinct from participant_auth or e.environment not in ('synthetic_development','synthetic_test') or p_decision not in ('GRANTED','DECLINED')
     or not p_direct_consent_attested or a.review_status<>'PENDING_INDEPENDENT_GOVERNANCE_REVIEW' or a.runtime_scope<>'SYNTHETIC_ONLY'
  then raise exception using errcode='P1001',message='Wave 4 direct research-consent decision is not authorized.'; end if;
  if p_decision='GRANTED' and (not p_baseline_scope_granted or jsonb_typeof(p_acknowledgements)<>'object'
    or not (p_acknowledgements ?& array['research_purpose','voluntary_participation','research_only_no_final_state','privacy_data_use','withdrawal_no_automatic_deletion']))
  then raise exception using errcode='P1001',message='Wave 4 research-consent acknowledgements are incomplete.'; end if;
  return query select * from public.record_research_consent_transition(
    e.id,p_actor_user_id,p_decision,a.artifact_version,a.artifact_sha256,e.protocol_version,
    case when p_decision='GRANTED' then jsonb_build_object('FSH','HFOS-FSH-SYNTHETIC-RESEARCH-PLAN-v0.1') else '{}'::jsonb end,
    case when p_decision='GRANTED' then array['FSH']::text[] else '{}'::text[] end,
    case when p_decision='GRANTED' and p_follow_up_scope_granted then array['BASELINE_RESEARCH','FOLLOW_UP_RESEARCH']::text[] when p_decision='GRANTED' then array['BASELINE_RESEARCH']::text[] else '{}'::text[] end,
    p_decision='GRANTED' and p_follow_up_scope_granted,'en-v1','PARTICIPANT_RESEARCH_PORTAL_SYNTHETIC',
    coalesce(p_acknowledgements,'{}'::jsonb)||jsonb_build_object('direct_consent_attested',true,'baseline_scope_granted',p_baseline_scope_granted,'follow_up_scope_granted',p_follow_up_scope_granted,'artifact_review_status',a.review_status),
    case when p_decision='GRANTED' then 'WAVE4_SYNTHETIC_DIRECT_CONSENT_GRANTED' else 'WAVE4_SYNTHETIC_DIRECT_CONSENT_DECLINED' end,p_correlation_id
  );
end $$;

create function public.get_participant_research_journey(p_participant_id uuid,p_actor_user_id uuid)
returns table(
  research_id text,enrollment_id uuid,lifecycle_status text,consent_status text,withdrawal_status text,
  consent_gate text,privacy_gate text,wave1_gate text,baseline_snapshot_status text,evidence_version_count bigint,
  follow_up_records jsonb,consent_artifact_version text,consent_artifact_sha256 text,consent_wording_review_status text,
  consent_action_available boolean,participant_output_scope text,fsh_output_status text,soft_launch_release_gate text
)
language plpgsql stable security definer set search_path=public,pg_catalog as $$
declare s record; a public.research_consent_presentation_artifacts%rowtype; snapshot_status text; evidence_count bigint; followups jsonb;
begin
  select * into s from public.get_research_controls_status(p_participant_id,p_actor_user_id,'FSH');
  if not found then return; end if;
  select * into a from public.research_consent_presentation_artifacts where artifact_version='HFOS-W4-PARTICIPANT-RESEARCH-CONSENT-v0.1';
  select concat_ws(' / ',x.snapshot_status,x.completeness_status,x.currentness_status) into snapshot_status from public.research_snapshots x where x.enrollment_id=s.enrollment_id and x.snapshot_kind='BASELINE' order by x.frozen_at desc,x.id desc limit 1;
  select count(*) into evidence_count from public.research_evidence_versions v join public.research_evidence_items i on i.id=v.evidence_item_id where i.enrollment_id=s.enrollment_id;
  select coalesce(jsonb_agg(jsonb_build_object('sequence_number',f.sequence_number,'family',f.research_family,'status',f.follow_up_status,'created_at',f.created_at) order by f.sequence_number),'[]') into followups from public.research_follow_up_records f where f.enrollment_id=s.enrollment_id;
  return query select s.research_id,s.enrollment_id,s.lifecycle_status,s.consent_status,s.withdrawal_status,s.consent_gate,s.privacy_gate,s.wave1_gate,
    coalesce(snapshot_status,'NOT_AVAILABLE'),evidence_count,followups,a.artifact_version,a.artifact_sha256,a.review_status,
    s.consent_status in ('PRESENTED'),a.participant_output_scope,'SUPPRESSED'::text,'BLOCKED'::text;
end $$;

create function public.get_admin_research_wave4_overview(p_participant_id uuid,p_actor_user_id uuid,p_correlation_id uuid)
returns table(
  enrollment_id uuid,evidence_versions jsonb,snapshots jsonb,follow_ups jsonb,raw_observations jsonb,
  verified_events jsonb,research_outcomes jsonb,audit_events jsonb,actor_permissions jsonb,
  consent_wording_review_status text,release_gate_status text
)
language plpgsql security definer set search_path=public,pg_catalog as $$
declare r public.participant_research_identities%rowtype; e public.research_enrollments%rowtype;
begin
  if not public.is_active_research_administrator(p_actor_user_id) and not public.has_any_role(p_actor_user_id,array['reviewer','evidence_verifier']) then raise exception using errcode='P1001',message='Actor is not authorized to view Wave 4 research governance.'; end if;
  select * into r from public.participant_research_identities where participant_id=p_participant_id;
  if not found then return; end if;
  select * into e from public.research_enrollments where participant_research_identity_id=r.id order by created_at desc,id desc limit 1;
  perform public.record_privileged_research_access(e.id,p_actor_user_id,'INCIDENT_ACCESS','RESEARCH_WAVE4_OVERVIEW',e.id,'INTERNAL_RESEARCH_GOVERNANCE_VIEW',p_correlation_id);
  return query select e.id,
    (select coalesce(jsonb_agg(jsonb_build_object('evidence_version_id',v.id,'source_identity',i.source_identity,'family',i.research_family,'version_number',v.version_number,'version_status',v.version_status,'value_state',v.value_state,'created_at',v.created_at) order by v.created_at,v.id),'[]') from public.research_evidence_versions v join public.research_evidence_items i on i.id=v.evidence_item_id where i.enrollment_id=e.id),
    (select coalesce(jsonb_agg(jsonb_build_object('snapshot_id',s.id,'kind',s.snapshot_kind,'family',s.research_family,'status',s.snapshot_status,'completeness',s.completeness_status,'currentness',s.currentness_status,'manifest_sha256',s.manifest_sha256,'frozen_at',s.frozen_at) order by s.frozen_at,s.id),'[]') from public.research_snapshots s where s.enrollment_id=e.id),
    (select coalesce(jsonb_agg(jsonb_build_object('follow_up_id',f.id,'sequence_number',f.sequence_number,'family',f.research_family,'status',f.follow_up_status,'predecessor_snapshot_id',f.predecessor_snapshot_id,'current_snapshot_id',f.current_snapshot_id,'created_at',f.created_at) order by f.sequence_number),'[]') from public.research_follow_up_records f where f.enrollment_id=e.id),
    (select coalesce(jsonb_agg(jsonb_build_object('observation_id',o.id,'snapshot_id',o.snapshot_id,'family',o.research_family,'source_class',o.source_class,'observation_code',o.observation_code,'observed_at',o.observed_at,'recorded_by',o.recorded_by,'correlation_id',o.correlation_id) order by o.recorded_at,o.id),'[]') from public.research_raw_observations o where o.enrollment_id=e.id),
    (select coalesce(jsonb_agg(jsonb_build_object('event_id',v.id,'raw_observation_id',v.raw_observation_id,'event_class',v.event_class,'status',v.event_status,'source_sufficiency',v.source_sufficiency,'verified_by',v.verified_by,'verified_at',v.verified_at,'correlation_id',v.correlation_id) order by v.verified_at,v.id),'[]') from public.research_verified_events v join public.research_raw_observations o on o.id=v.raw_observation_id where o.enrollment_id=e.id),
    (select coalesce(jsonb_agg(jsonb_build_object('outcome_id',o.id,'family',o.research_family,'outcome_class',o.outcome_class,'status',o.outcome_status,'quality',o.outcome_quality,'use_status',o.outcome_use_status,'proposed_by',o.proposed_by,'created_at',o.created_at,'adjudications',(select coalesce(jsonb_agg(jsonb_build_object('review_status',a.review_status,'adjudicator_user_id',a.adjudicator_user_id,'independence_status',a.independence_status,'conflict_status',a.conflict_status,'decided_at',a.decided_at) order by a.decided_at),'[]') from public.research_review_adjudications a where a.outcome_id=o.id)) order by o.created_at,o.id),'[]') from public.research_outcomes o where o.enrollment_id=e.id),
    (select coalesce(jsonb_agg(jsonb_build_object('event_id',a.id,'event_type',a.event_type,'actor_type',a.actor_type,'reason_code',a.reason_code,'occurred_at',a.occurred_at,'correlation_id',a.correlation_id) order by a.occurred_at,a.id),'[]') from public.research_control_audit_events a where a.enrollment_id=e.id),
    jsonb_build_object('can_present_consent',public.is_active_research_administrator(p_actor_user_id),'can_manage_privacy',public.is_active_research_administrator(p_actor_user_id),'can_create_follow_up',public.is_active_research_administrator(p_actor_user_id),'can_record_observation',public.has_any_role(p_actor_user_id,array['administrator','research_coordinator','reviewer','evidence_verifier']),'can_verify_event',public.has_any_role(p_actor_user_id,array['reviewer','evidence_verifier']),'can_adjudicate_outcome',public.has_any_role(p_actor_user_id,array['reviewer']),'can_manage_incident',public.is_active_research_administrator(p_actor_user_id) or public.has_any_role(p_actor_user_id,array['reviewer'])),'PENDING_INDEPENDENT_GOVERNANCE_REVIEW'::text,'BLOCKED'::text;
end $$;

create function public.attempt_wave4_release_activation(p_target text,p_actor_user_id uuid,p_correlation_id uuid)
returns table(target text,technical_result text,gate_status text)
language plpgsql security definer set search_path=public,pg_catalog as $$
begin
  if not public.is_active_research_administrator(p_actor_user_id) or p_target not in ('REAL_ENROLLMENT','REAL_EVIDENCE_COLLECTION','SOFT_LAUNCH_OPEN','PILOT','PRODUCTION') then raise exception using errcode='P1001',message='Wave 4 activation attempt is invalid.'; end if;
  insert into public.research_control_audit_events(event_type,actor_type,actor_user_id,authority_versions,reason_code,occurred_at,correlation_id,metadata)
  values('RESEARCH_RELEASE_ACTIVATION_REJECTED','ADMIN',p_actor_user_id,jsonb_build_object('readiness','HFOS_Final_Operational_Readiness_Review_v1.0'),'RELEASE_AUTHORITY_NOT_ESTABLISHED',clock_timestamp(),p_correlation_id,jsonb_build_object('target',p_target,'technical_result','ACTIVATION_NOT_AUTHORIZED','gate_status','BLOCKED'));
  return query select p_target,'ACTIVATION_NOT_AUTHORIZED'::text,'BLOCKED'::text;
end $$;

create or replace function public.evaluate_wave3_release_gate(p_environment text,p_actor_user_id uuid,p_correlation_id uuid)
returns table(assessment_id uuid,gate_status text,reason_codes text[]) language plpgsql security definer set search_path=public,pg_catalog as $$
declare aid uuid; reasons text[]:=array['CONSENT_WORDING_PENDING_INDEPENDENT_REVIEW','LEGAL_PRIVACY_DEPENDENCY_UNRESOLVED','DEPLOYMENT_SECURITY_REVIEW_REQUIRED','B1_BLOCKERS_REMAIN','INDEPENDENT_IMPLEMENTATION_REVIEW_REQUIRED','RELEASE_APPROVAL_MISSING']; deps jsonb;
begin
 if not public.is_active_research_administrator(p_actor_user_id) or p_environment not in ('synthetic_development','synthetic_test') then raise exception using errcode='P1001',message='Actor or release environment is not authorized.'; end if;
 deps:=jsonb_build_object('participant_facing_consent_wording','UNRESOLVED','legal_privacy_dependencies','UNRESOLVED','operational_gate_readiness','BLOCKED','security_readiness','UNRESOLVED','synthetic_e2e','IMPLEMENTED_PENDING_INDEPENDENT_VERIFICATION','outstanding_b1','BLOCKED','participant_output_suppression','OPEN','release_approval','BLOCKED','actual_enrollment','NOT_AUTHORIZED','evidence_collection','NOT_AUTHORIZED','pilot','NOT_AUTHORIZED','production','NOT_AUTHORIZED');
 insert into public.research_release_gate_assessments(environment,gate_status,dependency_results,reason_codes,assessed_by,correlation_id) values(p_environment,'BLOCKED',deps,reasons,p_actor_user_id,p_correlation_id) returning id into aid;
 insert into public.research_control_audit_events(event_type,actor_type,actor_user_id,authority_versions,reason_code,occurred_at,correlation_id,metadata) values('RESEARCH_RELEASE_GATE_EVALUATED','ADMIN',p_actor_user_id,jsonb_build_object('readiness','HFOS_Final_Operational_Readiness_Review_v1.0'),'RELEASE_REMAINS_BLOCKED',clock_timestamp(),p_correlation_id,jsonb_build_object('assessment_id',aid,'environment',p_environment,'gate_status','BLOCKED','reason_codes',reasons));
 return query select aid,'BLOCKED'::text,reasons;
end $$;

do $$ declare f regprocedure; begin
  foreach f in array array[
    'public.present_wave4_synthetic_research_consent(uuid,uuid,uuid)'::regprocedure,
    'public.decide_wave4_synthetic_research_consent(uuid,uuid,text,boolean,boolean,boolean,jsonb,uuid)'::regprocedure,
    'public.get_participant_research_journey(uuid,uuid)'::regprocedure,
    'public.get_admin_research_wave4_overview(uuid,uuid,uuid)'::regprocedure,
    'public.attempt_wave4_release_activation(text,uuid,uuid)'::regprocedure
  ] loop execute format('alter function %s owner to postgres',f); execute format('revoke all on function %s from public,anon,authenticated,service_role',f); end loop;
end $$;

grant execute on function public.present_wave4_synthetic_research_consent(uuid,uuid,uuid),public.decide_wave4_synthetic_research_consent(uuid,uuid,text,boolean,boolean,boolean,jsonb,uuid),public.get_participant_research_journey(uuid,uuid),public.get_admin_research_wave4_overview(uuid,uuid,uuid),public.attempt_wave4_release_activation(text,uuid,uuid) to service_role;

comment on table public.research_consent_presentation_artifacts is 'Creation-side direct-consent wording identity. Synthetic verification only; independent review and real release remain blocked.';
comment on function public.get_participant_research_journey(uuid,uuid) is 'Participant-safe factual research status projection. FSH, State, thresholds, predicates, Incidents, hypotheses, and advice are excluded.';

commit;
