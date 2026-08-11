begin;

-- Sprint 26 / Wave 3. Synthetic-only incident, unified audit, governed FSH,
-- State-suppression, and release-gate foundation. This migration cannot open
-- actual enrollment, real evidence collection, soft launch, Pilot, Production,
-- participant output, or final System State authority.

create table public.research_incident_transition_rules (
  rule_id text primary key check (rule_id ~ '^INC-TR-v0[.]2-[0-9]{3}$'),
  current_status text not null check (current_status in ('REPORTED','TRIAGE_REQUIRED','CONTAINMENT_REQUIRED','CONTAINED','REVIEW_REQUIRED','REMEDIATION_REQUIRED','RESOLVED','CLOSED','UNRESOLVED')),
  requested_status text not null check (requested_status in ('REPORTED','TRIAGE_REQUIRED','CONTAINMENT_REQUIRED','CONTAINED','REVIEW_REQUIRED','REMEDIATION_REQUIRED','RESOLVED','CLOSED','UNRESOLVED')),
  decision text not null check (decision in ('ALLOWED','PROHIBITED_INVALID')),
  reason_code text not null,
  required_preconditions text[] not null default '{}'::text[],
  authority_version text not null default 'HFOS_Research_Incident_and_Error_Handling_Authority_v0.2',
  unique(current_status,requested_status)
);

with statuses(status,ordinal) as (values
 ('REPORTED',1),('TRIAGE_REQUIRED',2),('CONTAINMENT_REQUIRED',3),('CONTAINED',4),('REVIEW_REQUIRED',5),('REMEDIATION_REQUIRED',6),('RESOLVED',7),('CLOSED',8),('UNRESOLVED',9)
), pairs as (
 select c.status current_status,r.status requested_status,((c.ordinal-1)*9+r.ordinal) n from statuses c cross join statuses r
)
insert into public.research_incident_transition_rules(rule_id,current_status,requested_status,decision,reason_code)
select 'INC-TR-v0.2-'||lpad(n::text,3,'0'),current_status,requested_status,'PROHIBITED_INVALID','INC-RSN-15' from pairs;

update public.research_incident_transition_rules r set decision='ALLOWED',reason_code=v.reason_code,required_preconditions=v.preconditions
from (values
 ('REPORTED','TRIAGE_REQUIRED','INC-RSN-01','{}'::text[]),
 ('REPORTED','CONTAINMENT_REQUIRED','INC-RSN-02','{}'::text[]),
 ('REPORTED','UNRESOLVED','INC-RSN-03','{}'::text[]),
 ('TRIAGE_REQUIRED','CONTAINMENT_REQUIRED','INC-RSN-05',array['INC-PRE-01']),
 ('TRIAGE_REQUIRED','REVIEW_REQUIRED','INC-RSN-07',array['INC-PRE-01','INC-PRE-02']),
 ('TRIAGE_REQUIRED','UNRESOLVED','INC-RSN-03','{}'::text[]),
 ('CONTAINMENT_REQUIRED','CONTAINED','INC-RSN-06',array['INC-PRE-03']),
 ('CONTAINMENT_REQUIRED','UNRESOLVED','INC-RSN-03','{}'::text[]),
 ('CONTAINED','CONTAINMENT_REQUIRED','INC-RSN-05','{}'::text[]),
 ('CONTAINED','REVIEW_REQUIRED','INC-RSN-07',array['INC-PRE-03']),
 ('CONTAINED','UNRESOLVED','INC-RSN-03','{}'::text[]),
 ('REVIEW_REQUIRED','CONTAINMENT_REQUIRED','INC-RSN-05','{}'::text[]),
 ('REVIEW_REQUIRED','REMEDIATION_REQUIRED','INC-RSN-08',array['INC-PRE-04','INC-PRE-05']),
 ('REVIEW_REQUIRED','RESOLVED','INC-RSN-11',array['INC-PRE-04','INC-PRE-05','INC-PRE-06','INC-PRE-07','INC-PRE-08','INC-PRE-09','INC-PRE-10']),
 ('REVIEW_REQUIRED','UNRESOLVED','INC-RSN-03','{}'::text[]),
 ('REMEDIATION_REQUIRED','CONTAINMENT_REQUIRED','INC-RSN-05','{}'::text[]),
 ('REMEDIATION_REQUIRED','REVIEW_REQUIRED','INC-RSN-10',array['INC-PRE-06']),
 ('REMEDIATION_REQUIRED','UNRESOLVED','INC-RSN-03','{}'::text[]),
 ('RESOLVED','CONTAINMENT_REQUIRED','INC-RSN-05','{}'::text[]),
 ('RESOLVED','REVIEW_REQUIRED','INC-RSN-07','{}'::text[]),
 ('RESOLVED','CLOSED','INC-RSN-12',array['INC-PRE-08','INC-PRE-09','INC-PRE-10','INC-PRE-11']),
 ('RESOLVED','UNRESOLVED','INC-RSN-03','{}'::text[]),
 ('UNRESOLVED','TRIAGE_REQUIRED','INC-RSN-03','{}'::text[]),
 ('UNRESOLVED','CONTAINMENT_REQUIRED','INC-RSN-02','{}'::text[]),
 ('UNRESOLVED','REVIEW_REQUIRED','INC-RSN-07','{}'::text[])
) v(current_status,requested_status,reason_code,preconditions)
where r.current_status=v.current_status and r.requested_status=v.requested_status;

create table public.research_incidents (
  id uuid primary key default gen_random_uuid(),
  predecessor_incident_id uuid unique references public.research_incidents(id) on update cascade on delete restrict,
  participant_research_identity_id uuid references public.participant_research_identities(id) on update cascade on delete restrict,
  enrollment_id uuid references public.research_enrollments(id) on update cascade on delete restrict,
  incident_family text not null check (incident_family in ('INC-FAM-01','INC-FAM-02','INC-FAM-03','INC-FAM-04','INC-FAM-05','INC-FAM-06','INC-FAM-07','INC-FAM-08','INC-FAM-09','INC-FAM-10','INC-FAM-11','INC-FAM-12','INC-FAM-13','INC-FAM-14')),
  incident_type text not null,
  discovery_time timestamptz not null,
  occurrence_time timestamptz,
  occurrence_time_state text not null check (occurrence_time_state in ('KNOWN','UNKNOWN')),
  affected_scope text not null,
  affected_object_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(affected_object_refs)='array'),
  affected_gates text[] not null,
  priority_status_class text not null check (priority_status_class in ('PROTECTIVE_HOLD_REQUIRED','EXPEDITED_REVIEW_REQUIRED','STANDARD_REVIEW','PRIORITY_UNRESOLVED')),
  material_protected_effect boolean not null,
  reporter_user_id uuid not null references auth.users(id) on update cascade on delete restrict,
  authority_version text not null default 'HFOS_Research_Incident_and_Error_Handling_Authority_v0.2',
  created_at timestamptz not null default clock_timestamp(),
  correlation_id uuid not null,
  check (btrim(incident_type)<>'' and btrim(affected_scope)<>'' and cardinality(affected_gates)>0),
  check ((occurrence_time_state='KNOWN' and occurrence_time is not null) or (occurrence_time_state='UNKNOWN' and occurrence_time is null)),
  check (predecessor_incident_id is null or predecessor_incident_id<>id)
);
create unique index research_incident_root_dedup on public.research_incidents(correlation_id,affected_scope,incident_family) where predecessor_incident_id is null;

create table public.research_incident_status_events (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.research_incidents(id) on update cascade on delete restrict,
  predecessor_status_event_id uuid unique references public.research_incident_status_events(id) on update cascade on delete restrict,
  status text not null check (status in ('REPORTED','TRIAGE_REQUIRED','CONTAINMENT_REQUIRED','CONTAINED','REVIEW_REQUIRED','REMEDIATION_REQUIRED','RESOLVED','CLOSED','UNRESOLVED')),
  transition_rule_id text references public.research_incident_transition_rules(rule_id) on update cascade on delete restrict,
  reason_code text not null,
  satisfied_preconditions text[] not null default '{}'::text[],
  actor_user_id uuid not null references auth.users(id) on update cascade on delete restrict,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default clock_timestamp(),
  correlation_id uuid not null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  check (predecessor_status_event_id is null or predecessor_status_event_id<>id),
  check (occurred_at<=recorded_at)
);
create index research_incident_status_current_idx on public.research_incident_status_events(incident_id,recorded_at desc,id desc);

create table public.research_incident_gate_effects (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.research_incidents(id) on update cascade on delete restrict,
  predecessor_gate_effect_id uuid unique references public.research_incident_gate_effects(id) on update cascade on delete restrict,
  gate_name text not null check (gate_name in ('RESEARCH_COLLECTION','EVIDENCE_USE','LIFECYCLE_ACTION','FOLLOW_UP','EXPORT_REIDENTIFICATION','FSH_EXECUTION','PARTICIPANT_OUTPUT','RELEASE_GATE')),
  gate_posture text not null check (gate_posture in ('OPEN','BLOCKED','UNRESOLVED')),
  reason_code text not null,
  restoration_authority jsonb not null default '{}'::jsonb check (jsonb_typeof(restoration_authority)='object'),
  actor_user_id uuid not null references auth.users(id) on update cascade on delete restrict,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default clock_timestamp(),
  correlation_id uuid not null,
  check (occurred_at<=recorded_at),
  check ((gate_posture='OPEN' and restoration_authority ?& array['authority','evidence','independent_reviewer']) or (gate_posture<>'OPEN' and restoration_authority='{}'::jsonb))
);
create unique index research_incident_gate_root_unique on public.research_incident_gate_effects(incident_id,gate_name) where predecessor_gate_effect_id is null;
create index research_incident_gate_current_idx on public.research_incident_gate_effects(incident_id,gate_name,recorded_at desc,id desc);

create table public.research_incident_invalid_transition_attempts (
  id uuid primary key default gen_random_uuid(), incident_id uuid not null references public.research_incidents(id) on update cascade on delete restrict,
  current_status text not null, requested_status text not null, transition_rule_id text not null references public.research_incident_transition_rules(rule_id) on update cascade on delete restrict,
  technical_result text not null check (technical_result='INCIDENT_TRANSITION_INVALID'), reason_code text not null check (reason_code='INC-RSN-15'),
  actor_user_id uuid not null references auth.users(id) on update cascade on delete restrict, occurred_at timestamptz not null, recorded_at timestamptz not null default clock_timestamp(), correlation_id uuid not null,
  failed_preconditions text[] not null default '{}'::text[]
);

create table public.research_incident_reviews (
  id uuid primary key default gen_random_uuid(), incident_id uuid not null references public.research_incidents(id) on update cascade on delete restrict,
  status_event_id uuid not null references public.research_incident_status_events(id) on update cascade on delete restrict,
  review_kind text not null check (review_kind in ('TRIAGE','CONTAINMENT','INDEPENDENT_REVIEW','REMEDIATION','RESOLUTION','CLOSURE')),
  protected_effects jsonb not null default '{}'::jsonb check (jsonb_typeof(protected_effects)='object'),
  reviewer_user_id uuid not null references auth.users(id) on update cascade on delete restrict,
  authority_version text not null, reviewed_at timestamptz not null default clock_timestamp(), correlation_id uuid not null,
  unique(status_event_id,review_kind)
);

create table public.research_audit_integrity_assessments (
  id uuid primary key default gen_random_uuid(), enrollment_id uuid references public.research_enrollments(id) on update cascade on delete restrict,
  incident_id uuid references public.research_incidents(id) on update cascade on delete restrict,
  assessment_scope text not null, integrity_status text not null check (integrity_status in ('COMPLETE','AUDIT_INTEGRITY_UNRESOLVED')),
  required_event_types text[] not null, present_event_types text[] not null, missing_event_types text[] not null,
  assessed_by uuid not null references auth.users(id) on update cascade on delete restrict, assessed_at timestamptz not null default clock_timestamp(), correlation_id uuid not null,
  check (btrim(assessment_scope)<>'')
);

create table public.research_fsh_collections (
  id uuid primary key default gen_random_uuid(), participant_research_identity_id uuid not null references public.participant_research_identities(id) on update cascade on delete restrict,
  enrollment_id uuid not null references public.research_enrollments(id) on update cascade on delete restrict, evaluation_id uuid not null references public.research_evaluations(id) on update cascade on delete restrict,
  snapshot_id uuid not null references public.research_snapshots(id) on update cascade on delete restrict, collection_family text not null check (collection_family in ('LOAD','FLOW')),
  operand_identity text not null check (operand_identity in ('FSH-OP-LOAD-CURRENT-AMOUNT-v0.1','FSH-OP-FLOW-CURRENT-AMOUNT-v0.1')),
  collection_status text not null check (collection_status='COMPLETE_ELIGIBLE'), currency text not null check (currency ~ '^[A-Z]{3}$'), unit text not null,
  period_start date not null, period_end date not null, member_count integer not null check (member_count>0), total_amount numeric(24,4) not null,
  authority_versions jsonb not null check (jsonb_typeof(authority_versions)='object' and authority_versions<>'{}'::jsonb), created_by uuid not null references auth.users(id) on update cascade on delete restrict,
  created_at timestamptz not null default clock_timestamp(), correlation_id uuid not null, unique(snapshot_id,collection_family), check (period_end>=period_start),
  check ((collection_family='LOAD')=(operand_identity='FSH-OP-LOAD-CURRENT-AMOUNT-v0.1'))
);

create table public.research_fsh_collection_members (
  id uuid primary key default gen_random_uuid(), collection_id uuid not null references public.research_fsh_collections(id) on update cascade on delete restrict,
  evidence_version_id uuid not null references public.research_evidence_versions(id) on update cascade on delete restrict,
  canonical_membership_identity text not null, ordinal integer not null check (ordinal>0), amount numeric(24,4) not null, value_state text not null check (value_state in ('PRESENT','CONFIRMED_ZERO')),
  shared_fact_disposition text not null check (shared_fact_disposition in ('SINGLE_CONTRIBUTION','CANONICAL_OWNER')),
  unique(collection_id,evidence_version_id), unique(collection_id,canonical_membership_identity), unique(collection_id,ordinal),
  check ((value_state='CONFIRMED_ZERO' and amount=0) or value_state='PRESENT')
);

create table public.research_fsh_results (
  id uuid primary key default gen_random_uuid(), predecessor_result_id uuid unique references public.research_fsh_results(id) on update cascade on delete restrict,
  participant_research_identity_id uuid not null references public.participant_research_identities(id) on update cascade on delete restrict,
  enrollment_id uuid not null references public.research_enrollments(id) on update cascade on delete restrict, evaluation_id uuid not null references public.research_evaluations(id) on update cascade on delete restrict,
  snapshot_id uuid not null unique references public.research_snapshots(id) on update cascade on delete restrict, load_collection_id uuid not null unique references public.research_fsh_collections(id) on update cascade on delete restrict,
  flow_collection_id uuid not null unique references public.research_fsh_collections(id) on update cascade on delete restrict,
  load_total numeric(24,4) not null, flow_total numeric(24,4) not null, load_component numeric(24,4) not null, flow_component numeric(24,4) not null, fsh_value numeric(24,4) not null,
  currency text not null check (currency ~ '^[A-Z]{3}$'), unit text not null, period_start date not null, period_end date not null,
  cap_qualification_metadata jsonb not null check (jsonb_typeof(cap_qualification_metadata)='object'),
  formula_authority_version text not null check (formula_authority_version='HFOS_FSH_Cross_Family_F_AGG_Authority_v0.1'), mechanics_authority_version text not null check (mechanics_authority_version='HFOS_Deterministic_FSH_Mechanics_Rulebook_v0.6'),
  source_authority_versions jsonb not null check (jsonb_typeof(source_authority_versions)='object' and source_authority_versions<>'{}'::jsonb),
  calculation_timestamp timestamptz not null default clock_timestamp(), result_sha256 text not null unique check (result_sha256 ~ '^[0-9a-f]{64}$'),
  system_state_status text not null default 'NOT_AUTHORIZED' check (system_state_status='NOT_AUTHORIZED'), participant_release_status text not null default 'BLOCKED' check (participant_release_status='BLOCKED'),
  created_by uuid not null references auth.users(id) on update cascade on delete restrict, correlation_id uuid not null,
  check (load_component=load_total and flow_component=flow_total and fsh_value=flow_total-load_total), check (period_end>=period_start), check (predecessor_result_id is null or predecessor_result_id<>id)
);

create table public.research_fsh_result_supersession_events (
  id uuid primary key default gen_random_uuid(), predecessor_result_id uuid not null unique references public.research_fsh_results(id) on update cascade on delete restrict,
  successor_result_id uuid not null unique references public.research_fsh_results(id) on update cascade on delete restrict, disposition text not null check (disposition='SUPERSEDED'),
  occurred_at timestamptz not null default clock_timestamp(), actor_user_id uuid not null references auth.users(id) on update cascade on delete restrict, correlation_id uuid not null,
  check (predecessor_result_id<>successor_result_id)
);

create view public.research_fsh_result_status with (security_invoker=true) as
select r.*,case when s.id is null then 'CURRENT' else 'SUPERSEDED' end as current_status
from public.research_fsh_results r left join public.research_fsh_result_supersession_events s on s.predecessor_result_id=r.id;

create table public.research_release_gate_assessments (
  id uuid primary key default gen_random_uuid(), environment text not null check (environment in ('synthetic_development','synthetic_test')),
  gate_status text not null check (gate_status in ('BLOCKED','UNRESOLVED')), dependency_results jsonb not null check (jsonb_typeof(dependency_results)='object'),
  reason_codes text[] not null, authority_version text not null default 'HFOS_Final_Operational_Readiness_Review_v1.0', assessed_by uuid not null references auth.users(id) on update cascade on delete restrict,
  assessed_at timestamptz not null default clock_timestamp(), correlation_id uuid not null
);

create function public.prevent_research_wave3_mutation() returns trigger language plpgsql set search_path=public,pg_catalog as $$
begin raise exception using errcode='P1001',message='Research Wave 3 records are append-only.'; end $$;

create function public.enforce_wave3_outcome_actor_independence() returns trigger language plpgsql security definer set search_path=public,pg_catalog as $$
declare o public.research_outcomes%rowtype; identity_creator uuid;
begin
 select * into o from public.research_outcomes where id=new.outcome_id;
 select r.created_by into identity_creator from public.research_enrollments e join public.participant_research_identities r on r.id=e.participant_research_identity_id where e.id=o.enrollment_id;
 if new.adjudicator_user_id in (o.proposed_by,identity_creator)
   or exists(select 1 from public.research_outcome_event_members m join public.research_verified_events v on v.id=m.verified_event_id join public.research_raw_observations ro on ro.id=v.raw_observation_id join public.research_evidence_versions ev on ev.id=v.evidence_version_id where m.outcome_id=o.id and new.adjudicator_user_id in (v.verified_by,ro.recorded_by,ev.created_by))
   or exists(select 1 from public.research_outcome_event_members m join public.research_verified_events v on v.id=m.verified_event_id join public.research_evidence_versions ev on ev.id=v.evidence_version_id join public.evidence_verification_history h on h.assessment_document_id=ev.assessment_document_id where m.outcome_id=o.id and h.verified_by=new.adjudicator_user_id)
 then raise exception using errcode='P1001',message='Outcome adjudicator independence is invalid.'; end if;
 return new;
end $$;

create trigger research_outcome_advanced_independence before insert on public.research_review_adjudications for each row execute function public.enforce_wave3_outcome_actor_independence();

do $$ declare t text; begin
 foreach t in array array['research_incident_transition_rules','research_incidents','research_incident_status_events','research_incident_gate_effects','research_incident_invalid_transition_attempts','research_incident_reviews','research_audit_integrity_assessments','research_fsh_collections','research_fsh_collection_members','research_fsh_results','research_fsh_result_supersession_events','research_release_gate_assessments'] loop
  execute format('alter table public.%I enable row level security',t); execute format('alter table public.%I force row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated,service_role',t);
  execute format('create trigger %I before update or delete on public.%I for each row execute function public.prevent_research_wave3_mutation()',t||'_immutable',t);
 end loop;
end $$;
revoke all on public.research_fsh_result_status from public,anon,authenticated,service_role;

create function public.current_research_incident_status(p_incident_id uuid) returns text language sql stable security definer set search_path=public,pg_catalog as $$
 select status from public.research_incident_status_events where incident_id=p_incident_id order by recorded_at desc,id desc limit 1
$$;

create function public.current_research_incident_gate(p_incident_id uuid,p_gate_name text) returns text language sql stable security definer set search_path=public,pg_catalog as $$
 select gate_posture from public.research_incident_gate_effects where incident_id=p_incident_id and gate_name=p_gate_name order by recorded_at desc,id desc limit 1
$$;

create function public.report_research_incident(p_enrollment_id uuid,p_actor_user_id uuid,p_incident_family text,p_incident_type text,p_occurrence_time timestamptz,p_occurrence_time_state text,p_affected_scope text,p_affected_object_refs jsonb,p_affected_gates text[],p_priority_status_class text,p_material_protected_effect boolean,p_correlation_id uuid)
returns uuid language plpgsql security definer set search_path=public,pg_catalog as $$
declare e public.research_enrollments%rowtype; iid uuid; sid uuid; g text; posture text:=case when p_material_protected_effect then 'BLOCKED' else 'UNRESOLVED' end;
begin
 if not public.is_active_research_administrator(p_actor_user_id) then raise exception using errcode='P1001',message='Actor is not authorized to report research incidents.'; end if;
 select * into e from public.research_enrollments where id=p_enrollment_id;
 if not found or e.environment not in ('synthetic_development','synthetic_test') then raise exception using errcode='P1001',message='Incident context is invalid.'; end if;
 insert into public.research_incidents(participant_research_identity_id,enrollment_id,incident_family,incident_type,discovery_time,occurrence_time,occurrence_time_state,affected_scope,affected_object_refs,affected_gates,priority_status_class,material_protected_effect,reporter_user_id,correlation_id)
 values(e.participant_research_identity_id,e.id,p_incident_family,btrim(p_incident_type),clock_timestamp(),p_occurrence_time,p_occurrence_time_state,btrim(p_affected_scope),coalesce(p_affected_object_refs,'[]'),p_affected_gates,p_priority_status_class,p_material_protected_effect,p_actor_user_id,p_correlation_id) returning id into iid;
 insert into public.research_incident_status_events(incident_id,status,reason_code,actor_user_id,occurred_at,correlation_id,metadata) values(iid,'REPORTED','INC-RSN-01',p_actor_user_id,clock_timestamp(),p_correlation_id,'{"source":"MANUAL_GOVERNED_REPORT"}') returning id into sid;
 foreach g in array p_affected_gates loop insert into public.research_incident_gate_effects(incident_id,gate_name,gate_posture,reason_code,actor_user_id,occurred_at,correlation_id) values(iid,g,posture,'PROTECTIVE_HOLD_REQUIRED',p_actor_user_id,clock_timestamp(),p_correlation_id); end loop;
 insert into public.research_control_audit_events(participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,authority_versions,reason_code,occurred_at,correlation_id,metadata)
 values(e.participant_research_identity_id,e.id,'RESEARCH_INCIDENT_REPORTED','ADMIN',p_actor_user_id,jsonb_build_object('incident','HFOS_Research_Incident_and_Error_Handling_Authority_v0.2'),'INC-RSN-01',clock_timestamp(),p_correlation_id,jsonb_build_object('incident_id',iid,'status_event_id',sid));
 return iid;
exception when unique_violation then raise exception using errcode='P1001',message='Incident correlation, scope, and family are already represented.'; end $$;

create function public.transition_research_incident(p_incident_id uuid,p_actor_user_id uuid,p_requested_status text,p_satisfied_preconditions text[],p_review_payload jsonb,p_correlation_id uuid)
returns table(status_event_id uuid,current_status text,transition_applied boolean,technical_result text)
language plpgsql security definer set search_path=public,pg_catalog as $$
declare i public.research_incidents%rowtype; prior public.research_incident_status_events%rowtype; rule public.research_incident_transition_rules%rowtype; nid uuid; failed text[]; kind text;
begin
 if not public.is_active_research_administrator(p_actor_user_id) and not public.has_any_role(p_actor_user_id,array['reviewer']) then raise exception using errcode='P1001',message='Actor is not authorized to govern research incidents.'; end if;
 select * into i from public.research_incidents where id=p_incident_id; select * into prior from public.research_incident_status_events where incident_id=i.id order by recorded_at desc,id desc limit 1 for update;
 select * into rule from public.research_incident_transition_rules where research_incident_transition_rules.current_status=prior.status and requested_status=p_requested_status;
 failed:=array(select x from unnest(rule.required_preconditions)x where not x=any(coalesce(p_satisfied_preconditions,'{}')));
 if rule.decision<>'ALLOWED' or cardinality(failed)>0 then
  insert into public.research_incident_invalid_transition_attempts(incident_id,current_status,requested_status,transition_rule_id,technical_result,reason_code,actor_user_id,occurred_at,correlation_id,failed_preconditions)
  values(i.id,prior.status,p_requested_status,rule.rule_id,'INCIDENT_TRANSITION_INVALID','INC-RSN-15',p_actor_user_id,clock_timestamp(),p_correlation_id,coalesce(failed,'{}')) returning id into nid;
  insert into public.research_control_audit_events(participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,authority_versions,reason_code,occurred_at,correlation_id,metadata)
  values(i.participant_research_identity_id,i.enrollment_id,'INCIDENT_TRANSITION_INVALID','ADMIN',p_actor_user_id,jsonb_build_object('incident',i.authority_version),'INC-RSN-15',clock_timestamp(),p_correlation_id,jsonb_build_object('incident_id',i.id,'invalid_attempt_id',nid,'current_status',prior.status,'requested_status',p_requested_status));
  return query select prior.id,prior.status,false,'INCIDENT_TRANSITION_INVALID'::text; return;
 end if;
 if p_requested_status in ('RESOLVED','CLOSED') and p_actor_user_id=i.reporter_user_id then raise exception using errcode='P1001',message='Incident reviewer independence is invalid.'; end if;
 if p_requested_status='RESOLVED' and exists(select 1 from public.research_incident_status_events x where x.incident_id=i.id and x.status in ('CONTAINMENT_REQUIRED','CONTAINED') and x.actor_user_id=p_actor_user_id) then raise exception using errcode='P1001',message='Incident reviewer independence is invalid.'; end if;
 if p_requested_status='CLOSED' and exists(select 1 from public.research_incident_status_events x where x.incident_id=i.id and x.status='RESOLVED' and x.actor_user_id=p_actor_user_id) then raise exception using errcode='P1001',message='Incident closure independence is invalid.'; end if;
 insert into public.research_incident_status_events(incident_id,predecessor_status_event_id,status,transition_rule_id,reason_code,satisfied_preconditions,actor_user_id,occurred_at,correlation_id,metadata)
 values(i.id,prior.id,p_requested_status,rule.rule_id,rule.reason_code,coalesce(p_satisfied_preconditions,'{}'),p_actor_user_id,clock_timestamp(),p_correlation_id,coalesce(p_review_payload,'{}')) returning id into nid;
 kind:=case p_requested_status when 'TRIAGE_REQUIRED' then 'TRIAGE' when 'CONTAINMENT_REQUIRED' then 'CONTAINMENT' when 'CONTAINED' then 'CONTAINMENT' when 'REVIEW_REQUIRED' then 'INDEPENDENT_REVIEW' when 'REMEDIATION_REQUIRED' then 'REMEDIATION' when 'RESOLVED' then 'RESOLUTION' when 'CLOSED' then 'CLOSURE' else null end;
 if kind is not null then insert into public.research_incident_reviews(incident_id,status_event_id,review_kind,protected_effects,reviewer_user_id,authority_version,correlation_id) values(i.id,nid,kind,coalesce(p_review_payload,'{}'),p_actor_user_id,i.authority_version,p_correlation_id); end if;
 insert into public.research_control_audit_events(participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,authority_versions,reason_code,occurred_at,correlation_id,metadata)
 values(i.participant_research_identity_id,i.enrollment_id,'RESEARCH_INCIDENT_TRANSITIONED','ADMIN',p_actor_user_id,jsonb_build_object('incident',i.authority_version),rule.reason_code,clock_timestamp(),p_correlation_id,jsonb_build_object('incident_id',i.id,'status_event_id',nid,'from',prior.status,'to',p_requested_status,'rule_id',rule.rule_id));
 return query select nid,p_requested_status,true,null::text;
end $$;

create function public.restore_research_incident_gate(p_incident_id uuid,p_gate_name text,p_actor_user_id uuid,p_restoration_authority jsonb,p_reason_code text,p_correlation_id uuid)
returns uuid language plpgsql security definer set search_path=public,pg_catalog as $$
declare i public.research_incidents%rowtype; prior public.research_incident_gate_effects%rowtype; status text; nid uuid; independent_reviewer uuid;
begin
 if not public.is_active_research_administrator(p_actor_user_id) and not public.has_any_role(p_actor_user_id,array['reviewer']) then raise exception using errcode='P1001',message='Actor is not authorized to restore Incident gates.'; end if;
 select * into i from public.research_incidents where id=p_incident_id; status:=public.current_research_incident_status(i.id);
 select * into prior from public.research_incident_gate_effects where incident_id=i.id and gate_name=p_gate_name order by recorded_at desc,id desc limit 1 for update;
 begin independent_reviewer:=(p_restoration_authority->>'independent_reviewer')::uuid; exception when invalid_text_representation then independent_reviewer:=null; end;
 if status not in ('RESOLVED','CLOSED') or prior.gate_posture='OPEN' or p_actor_user_id=i.reporter_user_id
   or not coalesce(p_restoration_authority ?& array['authority','evidence','independent_reviewer'],false)
   or independent_reviewer is null or independent_reviewer in (p_actor_user_id,i.reporter_user_id)
   or not (public.is_active_research_administrator(independent_reviewer) or public.has_any_role(independent_reviewer,array['reviewer']))
 then raise exception using errcode='P1001',message='Incident gate restoration prerequisites are not satisfied.'; end if;
 insert into public.research_incident_gate_effects(incident_id,predecessor_gate_effect_id,gate_name,gate_posture,reason_code,restoration_authority,actor_user_id,occurred_at,correlation_id)
 values(i.id,prior.id,p_gate_name,'OPEN',btrim(p_reason_code),p_restoration_authority,p_actor_user_id,clock_timestamp(),p_correlation_id) returning id into nid;
 insert into public.research_control_audit_events(participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,authority_versions,reason_code,occurred_at,correlation_id,metadata)
 values(i.participant_research_identity_id,i.enrollment_id,'RESEARCH_INCIDENT_GATE_RESTORED','ADMIN',p_actor_user_id,jsonb_build_object('incident',i.authority_version),btrim(p_reason_code),clock_timestamp(),p_correlation_id,jsonb_build_object('incident_id',i.id,'gate_name',p_gate_name,'gate_effect_id',nid)); return nid;
end $$;

create function public.create_successor_research_incident(p_predecessor_incident_id uuid,p_actor_user_id uuid,p_materially_new_evidence boolean,p_occurrence_time timestamptz,p_affected_object_refs jsonb,p_correlation_id uuid)
returns uuid language plpgsql security definer set search_path=public,pg_catalog as $$
declare old public.research_incidents%rowtype; iid uuid; g text;
begin
 if not public.is_active_research_administrator(p_actor_user_id) or not p_materially_new_evidence then raise exception using errcode='P1001',message='Incident successor authority is invalid.'; end if;
 select * into old from public.research_incidents where id=p_predecessor_incident_id;
 if public.current_research_incident_status(old.id)<>'CLOSED' then raise exception using errcode='P1001',message='Only a closed Incident may receive a successor identity.'; end if;
 insert into public.research_incidents(predecessor_incident_id,participant_research_identity_id,enrollment_id,incident_family,incident_type,discovery_time,occurrence_time,occurrence_time_state,affected_scope,affected_object_refs,affected_gates,priority_status_class,material_protected_effect,reporter_user_id,authority_version,correlation_id)
 values(old.id,old.participant_research_identity_id,old.enrollment_id,old.incident_family,old.incident_type,clock_timestamp(),p_occurrence_time,case when p_occurrence_time is null then 'UNKNOWN' else 'KNOWN' end,old.affected_scope,coalesce(p_affected_object_refs,'[]'),old.affected_gates,old.priority_status_class,true,p_actor_user_id,old.authority_version,p_correlation_id) returning id into iid;
 insert into public.research_incident_status_events(incident_id,status,reason_code,satisfied_preconditions,actor_user_id,occurred_at,correlation_id,metadata) values(iid,'REPORTED','INC-RSN-13',array['INC-PRE-12'],p_actor_user_id,clock_timestamp(),p_correlation_id,jsonb_build_object('predecessor_incident_id',old.id));
 foreach g in array old.affected_gates loop insert into public.research_incident_gate_effects(incident_id,gate_name,gate_posture,reason_code,actor_user_id,occurred_at,correlation_id) values(iid,g,'BLOCKED','SUCCESSOR_PROTECTIVE_HOLD',p_actor_user_id,clock_timestamp(),p_correlation_id); end loop;
 insert into public.research_control_audit_events(participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,authority_versions,reason_code,occurred_at,correlation_id,metadata) values(old.participant_research_identity_id,old.enrollment_id,'RESEARCH_INCIDENT_SUCCEEDED','ADMIN',p_actor_user_id,jsonb_build_object('incident',old.authority_version),'INC-RSN-13',clock_timestamp(),p_correlation_id,jsonb_build_object('predecessor_incident_id',old.id,'successor_incident_id',iid)); return iid;
end $$;

create function public.assert_wave3_incident_gate(p_enrollment_id uuid,p_gate_name text) returns void language plpgsql stable security definer set search_path=public,pg_catalog as $$
begin
 if exists(select 1 from public.research_incidents i where i.enrollment_id=p_enrollment_id and i.material_protected_effect and public.current_research_incident_gate(i.id,p_gate_name) in ('BLOCKED','UNRESOLVED')) then raise exception using errcode='P1001',message='A material unresolved Incident blocks this research operation.'; end if;
end $$;

create or replace function public.assert_wave2_synthetic_gate(p_enrollment_id uuid,p_family text,p_actor_user_id uuid,p_follow_up boolean default false)
returns void language plpgsql stable security definer set search_path=public,pg_catalog as $$
declare v public.research_enrollments%rowtype; v_ready record;
begin
 if not public.has_any_role(p_actor_user_id,array['administrator','research_coordinator','reviewer','evidence_verifier']) then raise exception using errcode='P1001',message='Actor is not authorized for synthetic research operations.'; end if;
 select * into v from public.research_enrollments where id=p_enrollment_id;
 if not found or v.environment not in ('synthetic_development','synthetic_test') or p_family not in ('FSH','MGN','RUNWAY','STRESS') then raise exception using errcode='P1001',message='Synthetic research context is invalid.'; end if;
 select * into v_ready from public.evaluate_wave1_research_readiness(p_enrollment_id,p_family,p_follow_up);
 if v_ready.wave1_gate<>'OPEN' then raise exception using errcode='P1001',message='Synthetic research authority gate is blocked.'; end if;
 if not exists(select 1 from public.research_release_firewall f where f.environment=v.environment and f.actual_enrollment_status='BLOCKED' and f.evidence_collection_status='BLOCKED' and f.pilot_status='NOT_AUTHORIZED' and f.production_status='NOT_AUTHORIZED') then raise exception using errcode='P1001',message='Research release firewall integrity check failed.'; end if;
 perform public.assert_wave3_incident_gate(p_enrollment_id,case when p_follow_up then 'FOLLOW_UP' else 'RESEARCH_COLLECTION' end);
end $$;

create function public.jsonb_contains_number(p_value jsonb) returns boolean language plpgsql immutable set search_path=public,pg_catalog as $$
declare x jsonb;
begin
 if jsonb_typeof(p_value)='number' then return true; elsif jsonb_typeof(p_value)='object' then for x in select value from jsonb_each(p_value) loop if public.jsonb_contains_number(x) then return true; end if; end loop; elsif jsonb_typeof(p_value)='array' then for x in select value from jsonb_array_elements(p_value) loop if public.jsonb_contains_number(x) then return true; end if; end loop; end if; return false;
end $$;

create function public.execute_synthetic_governed_fsh(p_snapshot_id uuid,p_actor_user_id uuid,p_cap_qualification_metadata jsonb,p_correlation_id uuid)
returns table(result_id uuid,load_total text,flow_total text,fsh_value text,current_status text,system_state_status text,participant_release_status text)
language plpgsql security definer set search_path=public,pg_catalog as $$
declare s public.research_snapshots%rowtype; bad integer; load_id uuid; flow_id uuid; rid uuid; prior uuid; load_sum numeric; flow_sum numeric; ccy text; u text; ps date; pe date; checksum text; m record; li integer:=0; fi integer:=0; currency_count integer; unit_count integer; period_start_count integer; period_end_count integer;
begin
 if not public.has_any_role(p_actor_user_id,array['administrator','research_coordinator','reviewer']) then raise exception using errcode='P1001',message='Actor is not authorized to execute governed synthetic FSH.'; end if;
 select * into s from public.research_snapshots where id=p_snapshot_id;
 perform public.assert_wave2_synthetic_gate(s.enrollment_id,'FSH',p_actor_user_id,false); perform public.assert_wave3_incident_gate(s.enrollment_id,'FSH_EXECUTION');
 if s.research_family<>'FSH' or s.snapshot_status<>'FROZEN' or s.completeness_status<>'COMPLETE' or s.currentness_status<>'CURRENT' or exists(select 1 from public.research_snapshots n where n.predecessor_snapshot_id=s.id) then raise exception using errcode='P1001',message='FSH requires the current complete frozen FSH snapshot.'; end if;
 if public.jsonb_contains_number(coalesce(p_cap_qualification_metadata,'{}')) then raise exception using errcode='P1001',message='CAP is non-numerical qualification metadata only.'; end if;
 select count(*) into bad from public.research_snapshot_members sm join public.research_evidence_versions v on v.id=sm.evidence_version_id
 where sm.snapshot_id=s.id and (sm.admission_status<>'ADMITTED' or v.value_state not in ('PRESENT','CONFIRMED_ZERO') or v.version_status in ('DISPUTED','RESTRICTED','WITHDRAWN_USE','UNRESOLVED') or exists(select 1 from public.research_evidence_versions nv where nv.predecessor_version_id=v.id)
 or not (v.governed_value ?& array['value','operand_identity','canonical_membership_identity','currency','unit','period_start','period_end','mechanics_state','authority_state','current_status','collection_complete'])
 or v.governed_value->>'operand_identity' not in ('FSH-OP-LOAD-CURRENT-AMOUNT-v0.1','FSH-OP-FLOW-CURRENT-AMOUNT-v0.1') or v.governed_value->>'mechanics_state'<>'ELIGIBLE' or v.governed_value->>'authority_state'<>'RESOLVED' or v.governed_value->>'current_status'<>'CURRENT' or (v.governed_value->>'collection_complete')::boolean is not true
 or coalesce(v.governed_value->>'flow_current_state','CURRENT')='CURRENT_INTERRUPTED'
 or (v.governed_value->>'value')::numeric<>round((v.governed_value->>'value')::numeric,4)
 or (v.value_state='CONFIRMED_ZERO' and (v.governed_value->>'value')::numeric<>0));
 if bad>0 then raise exception using errcode='P1001',message='FSH snapshot contains blocked, unresolved, stale, or ineligible operands.'; end if;
 if exists(select 1 from public.research_snapshot_members sm join public.research_evidence_versions v on v.id=sm.evidence_version_id where sm.snapshot_id=s.id group by v.governed_value->>'canonical_membership_identity' having count(*)>1) then raise exception using errcode='P1001',message='FSH canonical membership identity is duplicated.'; end if;
 select min(v.governed_value->>'currency'),min(v.governed_value->>'unit'),min((v.governed_value->>'period_start')::date),min((v.governed_value->>'period_end')::date),count(distinct v.governed_value->>'currency'),count(distinct v.governed_value->>'unit'),count(distinct (v.governed_value->>'period_start')),count(distinct (v.governed_value->>'period_end'))
 into ccy,u,ps,pe,currency_count,unit_count,period_start_count,period_end_count from public.research_snapshot_members sm join public.research_evidence_versions v on v.id=sm.evidence_version_id where sm.snapshot_id=s.id;
 if currency_count<>1 or unit_count<>1 or period_start_count<>1 or period_end_count<>1 then raise exception using errcode='P1001',message='FSH operands have incompatible currency, unit, or period.'; end if;
 select count(*) into li from public.research_snapshot_members sm join public.research_evidence_versions v on v.id=sm.evidence_version_id where sm.snapshot_id=s.id and v.governed_value->>'operand_identity'='FSH-OP-LOAD-CURRENT-AMOUNT-v0.1';
 select count(*) into fi from public.research_snapshot_members sm join public.research_evidence_versions v on v.id=sm.evidence_version_id where sm.snapshot_id=s.id and v.governed_value->>'operand_identity'='FSH-OP-FLOW-CURRENT-AMOUNT-v0.1';
 if li=0 or fi=0 then raise exception using errcode='P1001',message='FSH LOAD and FLOW collections must both be non-empty.'; end if;
 select coalesce(sum((v.governed_value->>'value')::numeric),0) into load_sum from public.research_snapshot_members sm join public.research_evidence_versions v on v.id=sm.evidence_version_id where sm.snapshot_id=s.id and v.governed_value->>'operand_identity'='FSH-OP-LOAD-CURRENT-AMOUNT-v0.1';
 select coalesce(sum((v.governed_value->>'value')::numeric),0) into flow_sum from public.research_snapshot_members sm join public.research_evidence_versions v on v.id=sm.evidence_version_id where sm.snapshot_id=s.id and v.governed_value->>'operand_identity'='FSH-OP-FLOW-CURRENT-AMOUNT-v0.1';
 if abs(load_sum)>=1e20::numeric or abs(flow_sum)>=1e20::numeric or abs(flow_sum-load_sum)>=1e20::numeric then raise exception using errcode='P1001',message='FSH fixed-point overflow.'; end if;
 insert into public.research_fsh_collections(participant_research_identity_id,enrollment_id,evaluation_id,snapshot_id,collection_family,operand_identity,collection_status,currency,unit,period_start,period_end,member_count,total_amount,authority_versions,created_by,correlation_id)
 values(s.participant_research_identity_id,s.enrollment_id,s.evaluation_id,s.id,'LOAD','FSH-OP-LOAD-CURRENT-AMOUNT-v0.1','COMPLETE_ELIGIBLE',ccy,u,ps,pe,li,load_sum,jsonb_build_object('multi_record','HFOS_FSH_Multi_Record_Inclusion_and_Aggregation_Authority_Contract_v0.1'),p_actor_user_id,p_correlation_id) returning id into load_id;
 insert into public.research_fsh_collections(participant_research_identity_id,enrollment_id,evaluation_id,snapshot_id,collection_family,operand_identity,collection_status,currency,unit,period_start,period_end,member_count,total_amount,authority_versions,created_by,correlation_id)
 values(s.participant_research_identity_id,s.enrollment_id,s.evaluation_id,s.id,'FLOW','FSH-OP-FLOW-CURRENT-AMOUNT-v0.1','COMPLETE_ELIGIBLE',ccy,u,ps,pe,fi,flow_sum,jsonb_build_object('multi_record','HFOS_FSH_Multi_Record_Inclusion_and_Aggregation_Authority_Contract_v0.1'),p_actor_user_id,p_correlation_id) returning id into flow_id;
 li:=0; fi:=0;
 for m in select v.id,v.value_state,v.governed_value,case when v.governed_value->>'operand_identity'='FSH-OP-LOAD-CURRENT-AMOUNT-v0.1' then load_id else flow_id end collection_id from public.research_snapshot_members sm join public.research_evidence_versions v on v.id=sm.evidence_version_id where sm.snapshot_id=s.id order by v.governed_value->>'operand_identity',v.governed_value->>'canonical_membership_identity' loop
  if m.governed_value->>'operand_identity'='FSH-OP-LOAD-CURRENT-AMOUNT-v0.1' then li:=li+1; else fi:=fi+1; end if;
  insert into public.research_fsh_collection_members(collection_id,evidence_version_id,canonical_membership_identity,ordinal,amount,value_state,shared_fact_disposition) values(m.collection_id,m.id,m.governed_value->>'canonical_membership_identity',case when m.governed_value->>'operand_identity'='FSH-OP-LOAD-CURRENT-AMOUNT-v0.1' then li else fi end,(m.governed_value->>'value')::numeric,m.value_state,coalesce(m.governed_value->>'shared_fact_disposition','SINGLE_CONTRIBUTION'));
 end loop;
 select r.id into prior from public.research_fsh_results r join public.research_snapshots old on old.id=r.snapshot_id where old.id=s.predecessor_snapshot_id and not exists(select 1 from public.research_fsh_result_supersession_events x where x.predecessor_result_id=r.id);
 checksum:=encode(extensions.digest(concat_ws('|',s.id::text,ccy,u,ps::text,pe::text,to_char(load_sum,'FM99999999999999999999D0000'),to_char(flow_sum,'FM99999999999999999999D0000'),to_char(flow_sum-load_sum,'FM99999999999999999999D0000'),'HFOS_FSH_Cross_Family_F_AGG_Authority_v0.1','HFOS_Deterministic_FSH_Mechanics_Rulebook_v0.6'),'sha256'),'hex');
 insert into public.research_fsh_results(predecessor_result_id,participant_research_identity_id,enrollment_id,evaluation_id,snapshot_id,load_collection_id,flow_collection_id,load_total,flow_total,load_component,flow_component,fsh_value,currency,unit,period_start,period_end,cap_qualification_metadata,formula_authority_version,mechanics_authority_version,source_authority_versions,result_sha256,created_by,correlation_id)
 values(prior,s.participant_research_identity_id,s.enrollment_id,s.evaluation_id,s.id,load_id,flow_id,load_sum,flow_sum,load_sum,flow_sum,flow_sum-load_sum,ccy,u,ps,pe,coalesce(p_cap_qualification_metadata,'{}'),'HFOS_FSH_Cross_Family_F_AGG_Authority_v0.1','HFOS_Deterministic_FSH_Mechanics_Rulebook_v0.6',jsonb_build_object('formula_input_shape','HFOS_FSH_Formula_Input_Consumption_and_Shape_Authority_Contract_v0.1','multi_record','HFOS_FSH_Multi_Record_Inclusion_and_Aggregation_Authority_Contract_v0.1','component_numerical','HFOS_FSH_Component_Numerical_Parameterization_Authority_v0.1','snapshot_manifest',s.manifest_sha256),checksum,p_actor_user_id,p_correlation_id) returning id into rid;
 if prior is not null then insert into public.research_fsh_result_supersession_events(predecessor_result_id,successor_result_id,disposition,actor_user_id,correlation_id) values(prior,rid,'SUPERSEDED',p_actor_user_id,p_correlation_id); end if;
 insert into public.research_control_audit_events(participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,authority_versions,reason_code,occurred_at,correlation_id,metadata) values(s.participant_research_identity_id,s.enrollment_id,'GOVERNED_FSH_EXECUTED','ADMIN',p_actor_user_id,jsonb_build_object('formula','HFOS_FSH_Cross_Family_F_AGG_Authority_v0.1','mechanics','HFOS_Deterministic_FSH_Mechanics_Rulebook_v0.6'),'SYNTHETIC_RESEARCH_ONLY',clock_timestamp(),p_correlation_id,jsonb_build_object('result_id',rid,'result_sha256',checksum,'system_state','NOT_AUTHORIZED','participant_release','BLOCKED'));
 return query select rid,to_char(load_sum,'FM99999999999999999999D0000'),to_char(flow_sum,'FM99999999999999999999D0000'),to_char(flow_sum-load_sum,'FM99999999999999999999D0000'),'CURRENT'::text,'NOT_AUTHORIZED'::text,'BLOCKED'::text;
exception when unique_violation then raise exception using errcode='P1001',message='FSH execution already exists for this governed snapshot or contains duplicate identity.'; when numeric_value_out_of_range then raise exception using errcode='P1001',message='FSH fixed-point overflow.'; end $$;

create function public.evaluate_wave3_release_gate(p_environment text,p_actor_user_id uuid,p_correlation_id uuid)
returns table(assessment_id uuid,gate_status text,reason_codes text[]) language plpgsql security definer set search_path=public,pg_catalog as $$
declare aid uuid; reasons text[]:=array['CONSENT_WORDING_NOT_OPERATIONAL','LEGAL_PRIVACY_DEPENDENCY_UNRESOLVED','OPERATIONAL_READINESS_BLOCKED','SECURITY_READINESS_BLOCKED','SYNTHETIC_E2E_INCOMPLETE','B1_BLOCKERS_REMAIN','RELEASE_APPROVAL_MISSING']; deps jsonb;
begin
 if not public.is_active_research_administrator(p_actor_user_id) or p_environment not in ('synthetic_development','synthetic_test') then raise exception using errcode='P1001',message='Actor or release environment is not authorized.'; end if;
 deps:=jsonb_build_object('participant_facing_consent_wording','BLOCKED','legal_privacy_dependencies','UNRESOLVED','operational_gate_readiness','BLOCKED','security_readiness','BLOCKED','synthetic_e2e','BLOCKED','outstanding_b1','BLOCKED','participant_output_suppression','OPEN','release_approval','BLOCKED','actual_enrollment','NOT_AUTHORIZED','evidence_collection','NOT_AUTHORIZED','pilot','NOT_AUTHORIZED','production','NOT_AUTHORIZED');
 insert into public.research_release_gate_assessments(environment,gate_status,dependency_results,reason_codes,assessed_by,correlation_id) values(p_environment,'BLOCKED',deps,reasons,p_actor_user_id,p_correlation_id) returning id into aid;
 insert into public.research_control_audit_events(event_type,actor_type,actor_user_id,authority_versions,reason_code,occurred_at,correlation_id,metadata) values('RESEARCH_RELEASE_GATE_EVALUATED','ADMIN',p_actor_user_id,jsonb_build_object('readiness','HFOS_Final_Operational_Readiness_Review_v1.0'),'RELEASE_REMAINS_BLOCKED',clock_timestamp(),p_correlation_id,jsonb_build_object('assessment_id',aid,'environment',p_environment,'gate_status','BLOCKED','reason_codes',reasons));
 return query select aid,'BLOCKED'::text,reasons;
end $$;

create function public.record_privileged_research_access(p_enrollment_id uuid,p_actor_user_id uuid,p_access_type text,p_object_type text,p_object_id uuid,p_reason_code text,p_correlation_id uuid)
returns uuid language plpgsql security definer set search_path=public,pg_catalog as $$
declare e public.research_enrollments%rowtype; aid uuid;
begin
 if not public.is_active_research_administrator(p_actor_user_id) and not public.has_any_role(p_actor_user_id,array['reviewer','evidence_verifier']) then raise exception using errcode='P1001',message='Actor is not authorized for privileged research access.'; end if;
 if p_access_type not in ('IDENTITY_LINKAGE','REIDENTIFICATION_ATTEMPT','SENSITIVE_EVIDENCE_ACCESS','ADMIN_OVERRIDE_ATTEMPT','INCIDENT_ACCESS','RELEASE_GATE_ACCESS') then raise exception using errcode='P1001',message='Privileged access type is invalid.'; end if;
 select * into e from public.research_enrollments where id=p_enrollment_id;
 insert into public.research_control_audit_events(participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,authority_versions,reason_code,occurred_at,correlation_id,metadata) values(e.participant_research_identity_id,e.id,'PRIVILEGED_RESEARCH_ACCESS','ADMIN',p_actor_user_id,jsonb_build_object('audit','HFOS_Research_Audit_and_Withdrawal_Trail_Authority_v0.1'),btrim(p_reason_code),clock_timestamp(),p_correlation_id,jsonb_build_object('access_type',p_access_type,'object_type',p_object_type,'object_id',p_object_id)) returning id into aid; return aid;
end $$;

create function public.assess_research_audit_completeness(p_enrollment_id uuid,p_incident_id uuid,p_assessment_scope text,p_required_event_types text[],p_actor_user_id uuid,p_create_incident_candidate boolean,p_correlation_id uuid)
returns table(assessment_id uuid,integrity_status text,missing_event_types text[],incident_candidate_id uuid)
language plpgsql security definer set search_path=public,pg_catalog as $$
declare e public.research_enrollments%rowtype; present_types text[]; missing_types text[]; status text; aid uuid; iid uuid;
begin
 if not public.is_active_research_administrator(p_actor_user_id) and not public.has_any_role(p_actor_user_id,array['reviewer']) then raise exception using errcode='P1001',message='Actor is not authorized to assess research Audit completeness.'; end if;
 select * into e from public.research_enrollments where id=p_enrollment_id;
 select coalesce(array_agg(distinct event_type order by event_type),'{}') into present_types from public.research_control_audit_events where enrollment_id=e.id and (p_incident_id is null or metadata->>'incident_id'=p_incident_id::text);
 missing_types:=array(select x from unnest(coalesce(p_required_event_types,'{}'))x where not x=any(present_types));
 status:=case when cardinality(missing_types)=0 then 'COMPLETE' else 'AUDIT_INTEGRITY_UNRESOLVED' end;
 insert into public.research_audit_integrity_assessments(enrollment_id,incident_id,assessment_scope,integrity_status,required_event_types,present_event_types,missing_event_types,assessed_by,correlation_id)
 values(e.id,p_incident_id,btrim(p_assessment_scope),status,coalesce(p_required_event_types,'{}'),present_types,missing_types,p_actor_user_id,p_correlation_id) returning id into aid;
 insert into public.research_control_audit_events(participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,authority_versions,reason_code,occurred_at,correlation_id,metadata)
 values(e.participant_research_identity_id,e.id,'RESEARCH_AUDIT_COMPLETENESS_ASSESSED','ADMIN',p_actor_user_id,jsonb_build_object('audit','HFOS_Research_Audit_and_Withdrawal_Trail_Authority_v0.1'),status,clock_timestamp(),p_correlation_id,jsonb_build_object('assessment_id',aid,'incident_id',p_incident_id,'missing_event_types',missing_types));
 if status='AUDIT_INTEGRITY_UNRESOLVED' and p_create_incident_candidate and not exists(select 1 from public.research_incidents i where i.enrollment_id=e.id and i.incident_family='INC-FAM-11' and i.affected_scope=p_assessment_scope and i.correlation_id=p_correlation_id) then
  iid:=public.report_research_incident(e.id,p_actor_user_id,'INC-FAM-11','AUDIT_INTEGRITY_FAILURE',null,'UNKNOWN',p_assessment_scope,jsonb_build_array(jsonb_build_object('audit_assessment_id',aid)),array['EVIDENCE_USE','FSH_EXECUTION','RELEASE_GATE'],'PROTECTIVE_HOLD_REQUIRED',true,p_correlation_id);
 end if;
 return query select aid,status,missing_types,iid;
end $$;

create function public.get_admin_research_wave3_overview(p_participant_id uuid,p_actor_user_id uuid,p_correlation_id uuid)
returns table(research_identity_id uuid,enrollment_id uuid,incident_records jsonb,audit_event_count bigint,audit_integrity_status text,fsh_results jsonb,release_gate_status text,release_reason_codes text[])
language plpgsql security definer set search_path=public,pg_catalog as $$
declare r public.participant_research_identities%rowtype; e public.research_enrollments%rowtype; incidents jsonb; fsh jsonb; audit_count bigint; integrity text; release_status text; release_reasons text[];
begin
 if not public.is_active_research_administrator(p_actor_user_id) and not public.has_any_role(p_actor_user_id,array['reviewer']) then raise exception using errcode='P1001',message='Actor is not authorized to view Wave 3 research governance.'; end if;
 select * into r from public.participant_research_identities where participant_id=p_participant_id; if not found then return; end if;
 select * into e from public.research_enrollments where participant_research_identity_id=r.id order by created_at desc,id desc limit 1;
 select coalesce(jsonb_agg(jsonb_build_object('incident_id',i.id,'family',i.incident_family,'type',i.incident_type,'status',public.current_research_incident_status(i.id),'priority',i.priority_status_class,'material',i.material_protected_effect,'affected_gates',i.affected_gates,'gate_effects',(select coalesce(jsonb_object_agg(x.gate_name,x.gate_posture),'{}') from (select distinct on (g.gate_name) g.gate_name,g.gate_posture from public.research_incident_gate_effects g where g.incident_id=i.id order by g.gate_name,g.recorded_at desc,g.id desc)x),'correlation_id',i.correlation_id,'created_at',i.created_at) order by i.created_at desc,i.id desc),'[]') into incidents from public.research_incidents i where i.enrollment_id=e.id;
 select count(*) into audit_count from public.research_control_audit_events a where a.enrollment_id=e.id;
 select a.integrity_status into integrity from public.research_audit_integrity_assessments a where a.enrollment_id=e.id order by a.assessed_at desc,a.id desc limit 1;
 select coalesce(jsonb_agg(jsonb_build_object('result_id',x.id,'status',x.current_status,'snapshot_id',x.snapshot_id,'load_total',x.load_total::text,'flow_total',x.flow_total::text,'fsh_value',x.fsh_value::text,'currency',x.currency,'unit',x.unit,'period_start',x.period_start,'period_end',x.period_end,'result_sha256',x.result_sha256,'system_state_status',x.system_state_status,'participant_release_status',x.participant_release_status,'formula_authority_version',x.formula_authority_version,'mechanics_authority_version',x.mechanics_authority_version) order by x.calculation_timestamp desc,x.id desc),'[]') into fsh from public.research_fsh_result_status x where x.enrollment_id=e.id;
 select a.gate_status,a.reason_codes into release_status,release_reasons from public.research_release_gate_assessments a where a.environment=e.environment order by a.assessed_at desc,a.id desc limit 1;
 perform public.record_privileged_research_access(e.id,p_actor_user_id,'INCIDENT_ACCESS','RESEARCH_WAVE3_OVERVIEW',e.id,'INTERNAL_RESEARCH_GOVERNANCE_VIEW',p_correlation_id);
 return query select r.id,e.id,incidents,audit_count,coalesce(integrity,'AUDIT_INTEGRITY_UNRESOLVED'),fsh,coalesce(release_status,'BLOCKED'),coalesce(release_reasons,array['RELEASE_ASSESSMENT_NOT_RECORDED']);
end $$;

do $$ declare f regprocedure; begin
 foreach f in array array[
  'public.current_research_incident_status(uuid)'::regprocedure,'public.current_research_incident_gate(uuid,text)'::regprocedure,'public.report_research_incident(uuid,uuid,text,text,timestamptz,text,text,jsonb,text[],text,boolean,uuid)'::regprocedure,
  'public.transition_research_incident(uuid,uuid,text,text[],jsonb,uuid)'::regprocedure,'public.restore_research_incident_gate(uuid,text,uuid,jsonb,text,uuid)'::regprocedure,'public.create_successor_research_incident(uuid,uuid,boolean,timestamptz,jsonb,uuid)'::regprocedure,
  'public.assert_wave3_incident_gate(uuid,text)'::regprocedure,'public.assert_wave2_synthetic_gate(uuid,text,uuid,boolean)'::regprocedure,'public.jsonb_contains_number(jsonb)'::regprocedure,
  'public.enforce_wave3_outcome_actor_independence()'::regprocedure,
  'public.execute_synthetic_governed_fsh(uuid,uuid,jsonb,uuid)'::regprocedure,'public.evaluate_wave3_release_gate(text,uuid,uuid)'::regprocedure,'public.record_privileged_research_access(uuid,uuid,text,text,uuid,text,uuid)'::regprocedure
  ,'public.assess_research_audit_completeness(uuid,uuid,text,text[],uuid,boolean,uuid)'::regprocedure,'public.get_admin_research_wave3_overview(uuid,uuid,uuid)'::regprocedure
 ] loop execute format('alter function %s owner to postgres',f); execute format('revoke all on function %s from public,anon,authenticated,service_role',f); end loop;
end $$;
grant execute on function public.report_research_incident(uuid,uuid,text,text,timestamptz,text,text,jsonb,text[],text,boolean,uuid),public.transition_research_incident(uuid,uuid,text,text[],jsonb,uuid),public.restore_research_incident_gate(uuid,text,uuid,jsonb,text,uuid),public.create_successor_research_incident(uuid,uuid,boolean,timestamptz,jsonb,uuid),public.execute_synthetic_governed_fsh(uuid,uuid,jsonb,uuid),public.evaluate_wave3_release_gate(text,uuid,uuid),public.record_privileged_research_access(uuid,uuid,text,text,uuid,text,uuid),public.assess_research_audit_completeness(uuid,uuid,text,text[],uuid,boolean,uuid),public.get_admin_research_wave3_overview(uuid,uuid,uuid) to service_role;

comment on table public.research_incident_transition_rules is 'Complete approved 9x9 Incident matrix: exactly 25 allowed and 56 prohibited/invalid pairs.';
comment on table public.research_fsh_results is 'Append-only synthetic research FSH: exact fixed-point FLOW_TOTAL minus LOAD_TOTAL; never System State or participant output.';
comment on table public.research_release_gate_assessments is 'Wave 3 release evidence. The physical domain intentionally excludes OPEN.';

commit;
