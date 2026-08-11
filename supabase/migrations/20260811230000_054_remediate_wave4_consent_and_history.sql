begin;

-- Sprint 28A: close only the independently confirmed Wave 4 consent,
-- presentation-binding, analytics-adjacent data loading, and history-bound defects.
-- Real enrollment/evidence collection and every release authority remain blocked.

create table public.research_consent_presentation_approval_events (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references public.research_consent_presentation_artifacts(id) on update cascade on delete restrict,
  review_artifact_sha256 text not null check (review_artifact_sha256 ~ '^[0-9a-f]{64}$'),
  decision text not null check (decision='APPROVED_WITH_NON_BLOCKING_GOVERNANCE_NOTES'),
  reviewer_identity text not null,
  approved_at timestamptz not null,
  recorded_at timestamptz not null default clock_timestamp(),
  unique (artifact_id,review_artifact_sha256),
  check (btrim(reviewer_identity)<>'' and approved_at<=recorded_at)
);

insert into public.research_consent_presentation_approval_events(
  artifact_id,review_artifact_sha256,decision,reviewer_identity,approved_at
)
select id,'d79d2e836d7841e1eb96366c1dfb295725f1cf2cd68758aaf76f2b470b6c3acb',
  'APPROVED_WITH_NON_BLOCKING_GOVERNANCE_NOTES',
  'HFOS_WAVE_4_PARTICIPANT_RESEARCH_CONSENT_PRESENTATION_v0.1_Independent_Governance_Review_v1.0',
  clock_timestamp()
from public.research_consent_presentation_artifacts
where artifact_version='HFOS-W4-PARTICIPANT-RESEARCH-CONSENT-v0.1'
  and artifact_sha256='a8fedbe933d893fd7bbdf31c1b2351a49508cb83c660dac88fda3852ae93f744';

create table public.research_consent_presentation_events (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.research_enrollments(id) on update cascade on delete restrict,
  presentation_consent_id uuid not null unique references public.research_consent_records(id) on update cascade on delete restrict,
  artifact_id uuid not null references public.research_consent_presentation_artifacts(id) on update cascade on delete restrict,
  approval_event_id uuid not null references public.research_consent_presentation_approval_events(id) on update cascade on delete restrict,
  artifact_version text not null,
  artifact_sha256 text not null check (artifact_sha256 ~ '^[0-9a-f]{64}$'),
  consent_authority_version text not null,
  privacy_authority_version text not null,
  presented_at timestamptz not null,
  presented_by uuid not null references auth.users(id) on update cascade on delete restrict,
  correlation_id uuid not null,
  recorded_at timestamptz not null default clock_timestamp(),
  check (btrim(artifact_version)<>'' and btrim(consent_authority_version)<>'' and btrim(privacy_authority_version)<>'' and presented_at<=recorded_at)
);

create table public.research_consent_decision_bindings (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.research_enrollments(id) on update cascade on delete restrict,
  presentation_event_id uuid not null unique references public.research_consent_presentation_events(id) on update cascade on delete restrict,
  decision_consent_id uuid not null unique references public.research_consent_records(id) on update cascade on delete restrict,
  decision text not null check (decision in ('GRANTED','DECLINED')),
  artifact_version text not null,
  artifact_sha256 text not null check (artifact_sha256 ~ '^[0-9a-f]{64}$'),
  consent_authority_version text not null,
  privacy_authority_version text not null,
  presented_at timestamptz not null,
  decided_at timestamptz not null,
  actor_user_id uuid not null references auth.users(id) on update cascade on delete restrict,
  correlation_id uuid not null,
  recorded_at timestamptz not null default clock_timestamp(),
  check (btrim(artifact_version)<>'' and btrim(consent_authority_version)<>'' and btrim(privacy_authority_version)<>'' and presented_at<=decided_at and decided_at<=recorded_at)
);

alter table public.research_consent_presentation_approval_events enable row level security;
alter table public.research_consent_presentation_approval_events force row level security;
alter table public.research_consent_presentation_events enable row level security;
alter table public.research_consent_presentation_events force row level security;
alter table public.research_consent_decision_bindings enable row level security;
alter table public.research_consent_decision_bindings force row level security;

revoke all on public.research_consent_presentation_approval_events,public.research_consent_presentation_events,public.research_consent_decision_bindings from public,anon,authenticated,service_role;

create trigger research_consent_presentation_approval_events_immutable before update or delete on public.research_consent_presentation_approval_events for each row execute function public.prevent_research_control_mutation();
create trigger research_consent_presentation_events_immutable before update or delete on public.research_consent_presentation_events for each row execute function public.prevent_research_control_mutation();
create trigger research_consent_decision_bindings_immutable before update or delete on public.research_consent_decision_bindings for each row execute function public.prevent_research_control_mutation();

create or replace function public.present_wave4_synthetic_research_consent(p_enrollment_id uuid,p_actor_user_id uuid,p_correlation_id uuid)
returns table(consent_id uuid,consent_status text,consent_gate text)
language plpgsql security definer set search_path=public,pg_catalog as $$
declare
  e public.research_enrollments%rowtype;
  a public.research_consent_presentation_artifacts%rowtype;
  approval public.research_consent_presentation_approval_events%rowtype;
  result record;
  presented_at_value timestamptz;
begin
  if not public.is_active_research_administrator(p_actor_user_id) then raise exception using errcode='P1001',message='Actor is not authorized to present research consent.'; end if;
  select * into e from public.research_enrollments where id=p_enrollment_id;
  select x.* into approval from public.research_consent_presentation_approval_events x order by x.approved_at desc,x.recorded_at desc,x.id desc limit 1;
  select x.* into a from public.research_consent_presentation_artifacts x where x.id=approval.artifact_id;
  if e.id is null or a.id is null or e.environment not in ('synthetic_development','synthetic_test') or a.runtime_scope<>'SYNTHETIC_ONLY' or a.real_activation_status<>'BLOCKED'
     or approval.decision<>'APPROVED_WITH_NON_BLOCKING_GOVERNANCE_NOTES'
  then raise exception using errcode='P1001',message='Wave 4 consent presentation is not authorized for this context.'; end if;
  select * into result from public.record_research_consent_transition(
    e.id,p_actor_user_id,'PRESENTED',a.artifact_version,a.artifact_sha256,e.protocol_version,
    jsonb_build_object('FSH','HFOS-FSH-SYNTHETIC-RESEARCH-PLAN-v0.1'),array['FSH']::text[],
    array['BASELINE_RESEARCH','FOLLOW_UP_RESEARCH']::text[],true,'en-v1','PARTICIPANT_RESEARCH_PORTAL_SYNTHETIC',
    jsonb_build_object('artifact_review_status',approval.decision,'approval_event_id',approval.id,'direct_consent_only',true,'real_activation','BLOCKED','consent_authority_version',e.consent_authority_version,'privacy_authority_version',e.privacy_authority_version),
    'WAVE4_SYNTHETIC_CONSENT_PRESENTED',p_correlation_id
  );
  select occurred_at into presented_at_value from public.research_consent_records where id=result.consent_id;
  insert into public.research_consent_presentation_events(
    enrollment_id,presentation_consent_id,artifact_id,approval_event_id,artifact_version,artifact_sha256,
    consent_authority_version,privacy_authority_version,presented_at,presented_by,correlation_id
  ) values (
    e.id,result.consent_id,a.id,approval.id,a.artifact_version,a.artifact_sha256,
    e.consent_authority_version,e.privacy_authority_version,presented_at_value,p_actor_user_id,p_correlation_id
  );
  return query select result.consent_id,result.consent_status,result.consent_gate;
end $$;

drop function public.decide_wave4_synthetic_research_consent(uuid,uuid,text,boolean,boolean,boolean,jsonb,uuid);

create function public.decide_wave4_synthetic_research_consent(
  p_enrollment_id uuid,p_actor_user_id uuid,p_decision text,p_direct_consent_attested boolean,
  p_baseline_scope_granted boolean,p_follow_up_scope_granted boolean,p_acknowledgements jsonb,
  p_presentation_event_id uuid,p_presented_artifact_version text,p_presented_artifact_sha256 text,
  p_presented_at timestamptz,p_correlation_id uuid
)
returns table(consent_id uuid,consent_status text,consent_gate text,technical_result text)
language plpgsql security definer set search_path=public,pg_catalog as $$
declare
  e public.research_enrollments%rowtype;
  current_consent public.research_consent_records%rowtype;
  presentation public.research_consent_presentation_events%rowtype;
  current_approval public.research_consent_presentation_approval_events%rowtype;
  a public.research_consent_presentation_artifacts%rowtype;
  participant_auth uuid;
  result record;
  expected_acknowledgements constant jsonb:=jsonb_build_object(
    'research_purpose',true,
    'voluntary_participation',true,
    'research_only_no_final_state',true,
    'privacy_data_use',true,
    'withdrawal_no_automatic_deletion',true
  );
  rejection_reason text;
begin
  select * into e from public.research_enrollments where id=p_enrollment_id;
  select p.auth_user_id into participant_auth from public.participants p join public.participant_research_identities r on r.participant_id=p.id where r.id=e.participant_research_identity_id and p.deleted_at is null;
  if p_actor_user_id is distinct from participant_auth or e.environment not in ('synthetic_development','synthetic_test') or p_decision not in ('GRANTED','DECLINED') or not p_direct_consent_attested
  then raise exception using errcode='P1001',message='Wave 4 direct research-consent decision is not authorized.'; end if;

  select * into current_consent from public.research_consent_records where enrollment_id=e.id order by recorded_at desc,id desc limit 1 for update;
  select * into presentation from public.research_consent_presentation_events where id=p_presentation_event_id;
  select * into current_approval from public.research_consent_presentation_approval_events order by approved_at desc,recorded_at desc,id desc limit 1;
  select * into a from public.research_consent_presentation_artifacts where id=current_approval.artifact_id;

  if current_consent.consent_status<>'PRESENTED' or presentation.id is null or presentation.enrollment_id<>e.id
     or presentation.presentation_consent_id<>current_consent.id or presentation.approval_event_id<>current_approval.id
     or presentation.artifact_id<>a.id or presentation.artifact_version is distinct from p_presented_artifact_version
     or presentation.artifact_sha256 is distinct from lower(p_presented_artifact_sha256)
     or presentation.presented_at is distinct from p_presented_at
     or presentation.consent_authority_version<>e.consent_authority_version
     or presentation.privacy_authority_version<>e.privacy_authority_version
  then rejection_reason:='CONSENT_PRESENTATION_STALE';
  elsif p_decision='GRANTED' and (not p_baseline_scope_granted or jsonb_typeof(p_acknowledgements)<>'object' or p_acknowledgements<>expected_acknowledgements)
  then rejection_reason:='CONSENT_ACKNOWLEDGEMENT_INVALID';
  elsif p_decision='DECLINED' and coalesce(p_acknowledgements,'{}'::jsonb)<>'{}'::jsonb
  then rejection_reason:='CONSENT_DECLINE_PAYLOAD_INVALID';
  end if;

  if rejection_reason is not null then
    insert into public.research_control_audit_events(
      participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,authority_versions,reason_code,occurred_at,correlation_id,metadata
    ) values (
      e.participant_research_identity_id,e.id,'CONSENT_DECISION_REJECTED','PARTICIPANT',p_actor_user_id,
      jsonb_build_object('consent',e.consent_authority_version,'privacy',e.privacy_authority_version),rejection_reason,clock_timestamp(),p_correlation_id,
      jsonb_build_object('presentation_event_id',p_presentation_event_id,'target_decision',p_decision)
    );
    return query select null::uuid,current_consent.consent_status,public.evaluate_research_consent_gate(e.id,'FSH',false),rejection_reason;
    return;
  end if;

  select * into result from public.record_research_consent_transition(
    e.id,p_actor_user_id,p_decision,a.artifact_version,a.artifact_sha256,e.protocol_version,
    case when p_decision='GRANTED' then jsonb_build_object('FSH','HFOS-FSH-SYNTHETIC-RESEARCH-PLAN-v0.1') else '{}'::jsonb end,
    case when p_decision='GRANTED' then array['FSH']::text[] else '{}'::text[] end,
    case when p_decision='GRANTED' and p_follow_up_scope_granted then array['BASELINE_RESEARCH','FOLLOW_UP_RESEARCH']::text[] when p_decision='GRANTED' then array['BASELINE_RESEARCH']::text[] else '{}'::text[] end,
    p_decision='GRANTED' and p_follow_up_scope_granted,'en-v1','PARTICIPANT_RESEARCH_PORTAL_SYNTHETIC',
    coalesce(p_acknowledgements,'{}'::jsonb)||jsonb_build_object(
      'direct_consent_attested',true,'baseline_scope_granted',p_baseline_scope_granted,'follow_up_scope_granted',p_follow_up_scope_granted,
      'approval_event_id',current_approval.id,'presentation_event_id',presentation.id,'presented_at',presentation.presented_at,
      'consent_authority_version',e.consent_authority_version,'privacy_authority_version',e.privacy_authority_version
    ),
    case when p_decision='GRANTED' then 'WAVE4_SYNTHETIC_DIRECT_CONSENT_GRANTED' else 'WAVE4_SYNTHETIC_DIRECT_CONSENT_DECLINED' end,p_correlation_id
  );
  insert into public.research_consent_decision_bindings(
    enrollment_id,presentation_event_id,decision_consent_id,decision,artifact_version,artifact_sha256,
    consent_authority_version,privacy_authority_version,presented_at,decided_at,actor_user_id,correlation_id
  ) values (
    e.id,presentation.id,result.consent_id,p_decision,a.artifact_version,a.artifact_sha256,
    e.consent_authority_version,e.privacy_authority_version,presentation.presented_at,clock_timestamp(),p_actor_user_id,p_correlation_id
  );
  return query select result.consent_id,result.consent_status,result.consent_gate,case when p_decision='GRANTED' then 'CONSENT_GRANTED' else 'CONSENT_DECLINED' end;
end $$;

-- The lower-level transition helper is no longer an application-callable authority boundary.
revoke execute on function public.record_research_consent_transition(uuid,uuid,text,text,text,text,jsonb,text[],text[],boolean,text,text,jsonb,text,uuid) from service_role;

drop function public.get_participant_research_journey(uuid,uuid);

create function public.get_participant_research_journey(p_participant_id uuid,p_actor_user_id uuid)
returns table(
  research_id text,enrollment_id uuid,lifecycle_status text,consent_status text,withdrawal_status text,
  consent_gate text,privacy_gate text,wave1_gate text,baseline_snapshot_status text,evidence_version_count bigint,
  follow_up_records jsonb,consent_artifact_version text,consent_artifact_sha256 text,consent_wording_review_status text,
  consent_presentation_event_id uuid,consent_presented_at timestamptz,consent_authority_version text,privacy_authority_version text,
  consent_action_available boolean,participant_output_scope text,fsh_output_status text,soft_launch_release_gate text
)
language plpgsql stable security definer set search_path=public,pg_catalog as $$
declare
  s record;
  current_consent public.research_consent_records%rowtype;
  presentation public.research_consent_presentation_events%rowtype;
  approval public.research_consent_presentation_approval_events%rowtype;
  snapshot_status text;
  evidence_count bigint;
  followups jsonb;
begin
  select * into s from public.get_research_controls_status(p_participant_id,p_actor_user_id,'FSH');
  if not found then return; end if;
  select c.* into current_consent from public.research_consent_records c where c.enrollment_id=s.enrollment_id order by c.recorded_at desc,c.id desc limit 1;
  if current_consent.consent_status='PRESENTED' then
    select p.* into presentation from public.research_consent_presentation_events p where p.presentation_consent_id=current_consent.id;
  else
    select p.* into presentation from public.research_consent_decision_bindings d join public.research_consent_presentation_events p on p.id=d.presentation_event_id where d.decision_consent_id=current_consent.id;
  end if;
  select a.* into approval from public.research_consent_presentation_approval_events a where a.id=presentation.approval_event_id;
  select concat_ws(' / ',x.snapshot_status,x.completeness_status,x.currentness_status) into snapshot_status from public.research_snapshots x where x.enrollment_id=s.enrollment_id and x.snapshot_kind='BASELINE' order by x.frozen_at desc,x.id desc limit 1;
  select count(*) into evidence_count from public.research_evidence_versions v join public.research_evidence_items i on i.id=v.evidence_item_id where i.enrollment_id=s.enrollment_id;
  select coalesce(jsonb_agg(z.item order by z.sequence_number desc),'[]') into followups from (
    select f.sequence_number,jsonb_build_object('sequence_number',f.sequence_number,'family',f.research_family,'status',f.follow_up_status,'created_at',f.created_at) item
    from public.research_follow_up_records f where f.enrollment_id=s.enrollment_id order by f.sequence_number desc limit 25
  ) z;
  return query select s.research_id,s.enrollment_id,s.lifecycle_status,s.consent_status,s.withdrawal_status,s.consent_gate,s.privacy_gate,s.wave1_gate,
    coalesce(snapshot_status,'NOT_AVAILABLE'),evidence_count,followups,presentation.artifact_version,presentation.artifact_sha256,approval.decision,
    presentation.id,presentation.presented_at,presentation.consent_authority_version,presentation.privacy_authority_version,
    s.consent_status='PRESENTED' and presentation.id is not null,coalesce((select x.participant_output_scope from public.research_consent_presentation_artifacts x where x.id=presentation.artifact_id),'FACTUAL_STATUS_ONLY'),'SUPPRESSED'::text,'BLOCKED'::text;
end $$;

-- A normalized, revoked view supports one deterministic bounded history interface.
create view public.research_admin_history_events with (security_invoker=true) as
select i.enrollment_id,'EVIDENCE'::text history_family,v.created_at event_at,v.id event_id,
  jsonb_build_object('history_type','EVIDENCE_VERSION','history_id',v.id,'occurred_at',v.created_at,'source_identity',i.source_identity,'family',i.research_family,'version_number',v.version_number,'status',v.version_status,'value_state',v.value_state) item
from public.research_evidence_versions v join public.research_evidence_items i on i.id=v.evidence_item_id
union all
select s.enrollment_id,'SNAPSHOT',s.frozen_at,s.id,jsonb_build_object('history_type','SNAPSHOT','history_id',s.id,'occurred_at',s.frozen_at,'kind',s.snapshot_kind,'family',s.research_family,'status',s.snapshot_status,'completeness',s.completeness_status,'currentness',s.currentness_status)
from public.research_snapshots s
union all
select f.enrollment_id,'FOLLOW_UP',f.created_at,f.id,jsonb_build_object('history_type','FOLLOW_UP','history_id',f.id,'occurred_at',f.created_at,'sequence_number',f.sequence_number,'family',f.research_family,'status',f.follow_up_status)
from public.research_follow_up_records f
union all
select h.enrollment_id,'LIFECYCLE',h.recorded_at,h.id,jsonb_build_object('history_type','LIFECYCLE_STATUS','history_id',h.id,'occurred_at',h.recorded_at,'status',h.lifecycle_status,'reason_code',h.reason_code)
from public.research_enrollment_status_history h
union all
select o.enrollment_id,'OBSERVATION',o.recorded_at,o.id,jsonb_build_object('history_type','RAW_OBSERVATION','history_id',o.id,'occurred_at',o.recorded_at,'family',o.research_family,'source_class',o.source_class,'observation_code',o.observation_code)
from public.research_raw_observations o
union all
select o.enrollment_id,'VERIFIED_EVENT',v.verified_at,v.id,jsonb_build_object('history_type','VERIFIED_EVENT','history_id',v.id,'occurred_at',v.verified_at,'event_class',v.event_class,'status',v.event_status,'source_sufficiency',v.source_sufficiency)
from public.research_verified_events v join public.research_raw_observations o on o.id=v.raw_observation_id
union all
select o.enrollment_id,'OUTCOME',o.created_at,o.id,jsonb_build_object('history_type','RESEARCH_OUTCOME','history_id',o.id,'occurred_at',o.created_at,'family',o.research_family,'outcome_class',o.outcome_class,'status',o.outcome_status,'quality',o.outcome_quality,'use_status',o.outcome_use_status)
from public.research_outcomes o
union all
select o.enrollment_id,'OUTCOME',a.decided_at,a.id,jsonb_build_object('history_type','OUTCOME_ADJUDICATION','history_id',a.id,'occurred_at',a.decided_at,'outcome_id',o.id,'review_status',a.review_status,'independence_status',a.independence_status,'conflict_status',a.conflict_status)
from public.research_review_adjudications a join public.research_outcomes o on o.id=a.outcome_id
union all
select i.enrollment_id,'INCIDENT',i.created_at,i.id,jsonb_build_object('history_type','INCIDENT','history_id',i.id,'occurred_at',i.created_at,'family',i.incident_family,'incident_type',i.incident_type,'priority',i.priority_status_class)
from public.research_incidents i
union all
select i.enrollment_id,'INCIDENT',s.recorded_at,s.id,jsonb_build_object('history_type','INCIDENT_STATUS','history_id',s.id,'occurred_at',s.recorded_at,'incident_id',i.id,'status',s.status,'reason_code',s.reason_code)
from public.research_incident_status_events s join public.research_incidents i on i.id=s.incident_id
union all
select a.enrollment_id,'AUDIT',a.recorded_at,a.id,jsonb_build_object('history_type','AUDIT_EVENT','history_id',a.id,'occurred_at',a.recorded_at,'event_type',a.event_type,'actor_type',a.actor_type,'reason_code',a.reason_code,'correlation_id',a.correlation_id)
from public.research_control_audit_events a where a.enrollment_id is not null
union all
select r.enrollment_id,'FSH',r.calculation_timestamp,r.id,jsonb_build_object('history_type','FSH_RESULT','history_id',r.id,'occurred_at',r.calculation_timestamp,'status',r.current_status,'snapshot_id',r.snapshot_id,'result_sha256',r.result_sha256,'system_state_status',r.system_state_status,'participant_release_status',r.participant_release_status)
from public.research_fsh_result_status r;

revoke all on public.research_admin_history_events from public,anon,authenticated,service_role;

create function public.get_admin_research_history_page(
  p_participant_id uuid,p_actor_user_id uuid,p_history_family text,p_cursor_at timestamptz,p_cursor_id uuid,p_limit integer,p_correlation_id uuid
)
returns table(enrollment_id uuid,history_family text,items jsonb,next_cursor_at timestamptz,next_cursor_id uuid,has_more boolean)
language plpgsql security definer set search_path=public,pg_catalog as $$
declare
  r public.participant_research_identities%rowtype;
  e public.research_enrollments%rowtype;
begin
  if not public.is_active_research_administrator(p_actor_user_id) and not public.has_any_role(p_actor_user_id,array['reviewer','evidence_verifier'])
  then raise exception using errcode='P1001',message='Actor is not authorized to view bounded research history.'; end if;
  if p_history_family not in ('EVIDENCE','SNAPSHOT','FOLLOW_UP','LIFECYCLE','OBSERVATION','VERIFIED_EVENT','OUTCOME','INCIDENT','AUDIT','FSH')
     or p_limit is null or p_limit<1 or p_limit>100 or ((p_cursor_at is null)<>(p_cursor_id is null))
  then raise exception using errcode='P1001',message='Research history page request is invalid.'; end if;
  select * into r from public.participant_research_identities where participant_id=p_participant_id;
  if not found then return; end if;
  select * into e from public.research_enrollments where participant_research_identity_id=r.id order by created_at desc,id desc limit 1;
  perform public.record_privileged_research_access(e.id,p_actor_user_id,'INCIDENT_ACCESS','RESEARCH_HISTORY_PAGE',e.id,'BOUNDED_INTERNAL_RESEARCH_HISTORY_VIEW',p_correlation_id);
  return query
  with candidates as (
    select h.event_at,h.event_id,h.item from public.research_admin_history_events h
    where h.enrollment_id=e.id and h.history_family=p_history_family
      and (p_cursor_at is null or (h.event_at,h.event_id)<(p_cursor_at,p_cursor_id))
    order by h.event_at desc,h.event_id desc limit p_limit+1
  ), page_rows as (
    select * from candidates order by event_at desc,event_id desc limit p_limit
  ), page_summary as (
    select coalesce(jsonb_agg(item order by event_at desc,event_id desc),'[]'::jsonb) page_items from page_rows
  ), last_row as (
    select event_at,event_id from page_rows order by event_at,event_id limit 1
  )
  select e.id,p_history_family,s.page_items,
    case when (select count(*) from candidates)>p_limit then l.event_at end,
    case when (select count(*) from candidates)>p_limit then l.event_id end,
    (select count(*) from candidates)>p_limit
  from page_summary s left join last_row l on true;
end $$;

-- Bound every collection in both core research administrator overview functions.
create or replace function public.get_admin_research_wave3_overview(p_participant_id uuid,p_actor_user_id uuid,p_correlation_id uuid)
returns table(research_identity_id uuid,enrollment_id uuid,incident_records jsonb,audit_event_count bigint,audit_integrity_status text,fsh_results jsonb,release_gate_status text,release_reason_codes text[])
language plpgsql security definer set search_path=public,pg_catalog as $$
declare r public.participant_research_identities%rowtype; e public.research_enrollments%rowtype; incidents jsonb; fsh jsonb; audit_count bigint; integrity text; release_status text; release_reasons text[];
begin
 if not public.is_active_research_administrator(p_actor_user_id) and not public.has_any_role(p_actor_user_id,array['reviewer']) then raise exception using errcode='P1001',message='Actor is not authorized to view Wave 3 research governance.'; end if;
 select * into r from public.participant_research_identities where participant_id=p_participant_id; if not found then return; end if;
 select * into e from public.research_enrollments where participant_research_identity_id=r.id order by created_at desc,id desc limit 1;
 select coalesce(jsonb_agg(z.item order by z.created_at desc,z.id desc),'[]') into incidents from (
   select i.created_at,i.id,jsonb_build_object('incident_id',i.id,'family',i.incident_family,'type',i.incident_type,'status',public.current_research_incident_status(i.id),'priority',i.priority_status_class,'material',i.material_protected_effect,'affected_gates',i.affected_gates,'gate_effects',(select coalesce(jsonb_object_agg(x.gate_name,x.gate_posture),'{}') from (select distinct on (g.gate_name) g.gate_name,g.gate_posture from public.research_incident_gate_effects g where g.incident_id=i.id order by g.gate_name,g.recorded_at desc,g.id desc)x),'correlation_id',i.correlation_id,'created_at',i.created_at) item
   from public.research_incidents i where i.enrollment_id=e.id order by i.created_at desc,i.id desc limit 25
 ) z;
 select count(*) into audit_count from public.research_control_audit_events a where a.enrollment_id=e.id;
 select a.integrity_status into integrity from public.research_audit_integrity_assessments a where a.enrollment_id=e.id order by a.assessed_at desc,a.id desc limit 1;
 select coalesce(jsonb_agg(z.item order by z.calculation_timestamp desc,z.id desc),'[]') into fsh from (
   select x.calculation_timestamp,x.id,jsonb_build_object('result_id',x.id,'status',x.current_status,'snapshot_id',x.snapshot_id,'load_total',x.load_total::text,'flow_total',x.flow_total::text,'fsh_value',x.fsh_value::text,'currency',x.currency,'unit',x.unit,'period_start',x.period_start,'period_end',x.period_end,'result_sha256',x.result_sha256,'system_state_status',x.system_state_status,'participant_release_status',x.participant_release_status,'formula_authority_version',x.formula_authority_version,'mechanics_authority_version',x.mechanics_authority_version) item
   from public.research_fsh_result_status x where x.enrollment_id=e.id order by x.calculation_timestamp desc,x.id desc limit 25
 ) z;
 select a.gate_status,a.reason_codes into release_status,release_reasons from public.research_release_gate_assessments a where a.environment=e.environment order by a.assessed_at desc,a.id desc limit 1;
 perform public.record_privileged_research_access(e.id,p_actor_user_id,'INCIDENT_ACCESS','RESEARCH_WAVE3_OVERVIEW',e.id,'INTERNAL_RESEARCH_GOVERNANCE_VIEW',p_correlation_id);
 return query select r.id,e.id,incidents,audit_count,coalesce(integrity,'AUDIT_INTEGRITY_UNRESOLVED'),fsh,coalesce(release_status,'BLOCKED'),coalesce(release_reasons,array['RELEASE_ASSESSMENT_NOT_RECORDED']);
end $$;

create or replace function public.get_admin_research_wave4_overview(p_participant_id uuid,p_actor_user_id uuid,p_correlation_id uuid)
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
    (select coalesce(jsonb_agg(z.item order by z.created_at desc,z.id desc),'[]') from (select v.created_at,v.id,jsonb_build_object('evidence_version_id',v.id,'source_identity',i.source_identity,'family',i.research_family,'version_number',v.version_number,'version_status',v.version_status,'value_state',v.value_state,'created_at',v.created_at) item from public.research_evidence_versions v join public.research_evidence_items i on i.id=v.evidence_item_id where i.enrollment_id=e.id order by v.created_at desc,v.id desc limit 25) z),
    (select coalesce(jsonb_agg(z.item order by z.frozen_at desc,z.id desc),'[]') from (select s.frozen_at,s.id,jsonb_build_object('snapshot_id',s.id,'kind',s.snapshot_kind,'family',s.research_family,'status',s.snapshot_status,'completeness',s.completeness_status,'currentness',s.currentness_status,'manifest_sha256',s.manifest_sha256,'frozen_at',s.frozen_at) item from public.research_snapshots s where s.enrollment_id=e.id order by s.frozen_at desc,s.id desc limit 25) z),
    (select coalesce(jsonb_agg(z.item order by z.sequence_number desc),'[]') from (select f.sequence_number,jsonb_build_object('follow_up_id',f.id,'sequence_number',f.sequence_number,'family',f.research_family,'status',f.follow_up_status,'predecessor_snapshot_id',f.predecessor_snapshot_id,'current_snapshot_id',f.current_snapshot_id,'created_at',f.created_at) item from public.research_follow_up_records f where f.enrollment_id=e.id order by f.sequence_number desc limit 25) z),
    (select coalesce(jsonb_agg(z.item order by z.recorded_at desc,z.id desc),'[]') from (select o.recorded_at,o.id,jsonb_build_object('observation_id',o.id,'snapshot_id',o.snapshot_id,'family',o.research_family,'source_class',o.source_class,'observation_code',o.observation_code,'observed_at',o.observed_at,'recorded_by',o.recorded_by,'correlation_id',o.correlation_id) item from public.research_raw_observations o where o.enrollment_id=e.id order by o.recorded_at desc,o.id desc limit 25) z),
    (select coalesce(jsonb_agg(z.item order by z.verified_at desc,z.id desc),'[]') from (select v.verified_at,v.id,jsonb_build_object('event_id',v.id,'raw_observation_id',v.raw_observation_id,'event_class',v.event_class,'status',v.event_status,'source_sufficiency',v.source_sufficiency,'verified_by',v.verified_by,'verified_at',v.verified_at,'correlation_id',v.correlation_id) item from public.research_verified_events v join public.research_raw_observations o on o.id=v.raw_observation_id where o.enrollment_id=e.id order by v.verified_at desc,v.id desc limit 25) z),
    (select coalesce(jsonb_agg(z.item order by z.created_at desc,z.id desc),'[]') from (select o.created_at,o.id,jsonb_build_object('outcome_id',o.id,'family',o.research_family,'outcome_class',o.outcome_class,'status',o.outcome_status,'quality',o.outcome_quality,'use_status',o.outcome_use_status,'proposed_by',o.proposed_by,'created_at',o.created_at,'adjudications',(select coalesce(jsonb_agg(x.item order by x.decided_at desc,x.id desc),'[]') from (select a.decided_at,a.id,jsonb_build_object('review_status',a.review_status,'adjudicator_user_id',a.adjudicator_user_id,'independence_status',a.independence_status,'conflict_status',a.conflict_status,'decided_at',a.decided_at) item from public.research_review_adjudications a where a.outcome_id=o.id order by a.decided_at desc,a.id desc limit 25) x)) item from public.research_outcomes o where o.enrollment_id=e.id order by o.created_at desc,o.id desc limit 25) z),
    (select coalesce(jsonb_agg(z.item order by z.recorded_at desc,z.id desc),'[]') from (select a.recorded_at,a.id,jsonb_build_object('event_id',a.id,'event_type',a.event_type,'actor_type',a.actor_type,'reason_code',a.reason_code,'occurred_at',a.occurred_at,'correlation_id',a.correlation_id) item from public.research_control_audit_events a where a.enrollment_id=e.id order by a.recorded_at desc,a.id desc limit 25) z),
    jsonb_build_object('can_present_consent',public.is_active_research_administrator(p_actor_user_id),'can_manage_privacy',public.is_active_research_administrator(p_actor_user_id),'can_create_follow_up',public.is_active_research_administrator(p_actor_user_id),'can_record_observation',public.has_any_role(p_actor_user_id,array['administrator','research_coordinator','reviewer','evidence_verifier']),'can_verify_event',public.has_any_role(p_actor_user_id,array['reviewer','evidence_verifier']),'can_adjudicate_outcome',public.has_any_role(p_actor_user_id,array['reviewer']),'can_manage_incident',public.is_active_research_administrator(p_actor_user_id) or public.has_any_role(p_actor_user_id,array['reviewer'])),
    'APPROVED_WITH_NON_BLOCKING_GOVERNANCE_NOTES'::text,'BLOCKED'::text;
end $$;

create or replace function public.evaluate_wave3_release_gate(p_environment text,p_actor_user_id uuid,p_correlation_id uuid)
returns table(assessment_id uuid,gate_status text,reason_codes text[]) language plpgsql security definer set search_path=public,pg_catalog as $$
declare aid uuid; reasons text[]:=array['LEGAL_PRIVACY_DEPENDENCY_UNRESOLVED','DEPLOYMENT_SECURITY_REVIEW_REQUIRED','B1_BLOCKERS_REMAIN','INDEPENDENT_REMEDIATION_REVIEW_REQUIRED','RELEASE_APPROVAL_MISSING']; deps jsonb;
begin
 if not public.is_active_research_administrator(p_actor_user_id) or p_environment not in ('synthetic_development','synthetic_test') then raise exception using errcode='P1001',message='Actor or release environment is not authorized.'; end if;
 deps:=jsonb_build_object('participant_facing_consent_wording','APPROVED_WITH_NON_BLOCKING_GOVERNANCE_NOTES','consent_remediation','IMPLEMENTED_PENDING_TARGETED_RE_REVIEW','legal_privacy_dependencies','UNRESOLVED','operational_gate_readiness','BLOCKED','security_readiness','UNRESOLVED','synthetic_e2e','IMPLEMENTED_PENDING_TARGETED_RE_REVIEW','outstanding_b1','BLOCKED','participant_output_suppression','OPEN','release_approval','BLOCKED','actual_enrollment','NOT_AUTHORIZED','evidence_collection','NOT_AUTHORIZED','pilot','NOT_AUTHORIZED','production','NOT_AUTHORIZED');
 insert into public.research_release_gate_assessments(environment,gate_status,dependency_results,reason_codes,assessed_by,correlation_id) values(p_environment,'BLOCKED',deps,reasons,p_actor_user_id,p_correlation_id) returning id into aid;
 insert into public.research_control_audit_events(event_type,actor_type,actor_user_id,authority_versions,reason_code,occurred_at,correlation_id,metadata) values('RESEARCH_RELEASE_GATE_EVALUATED','ADMIN',p_actor_user_id,jsonb_build_object('readiness','HFOS_Final_Operational_Readiness_Review_v1.0','remediation','HFOS_SPRINT_28A'),'RELEASE_REMAINS_BLOCKED',clock_timestamp(),p_correlation_id,jsonb_build_object('assessment_id',aid,'environment',p_environment,'gate_status','BLOCKED','reason_codes',reasons));
 return query select aid,'BLOCKED'::text,reasons;
end $$;

alter table public.research_consent_presentation_approval_events owner to postgres;
alter table public.research_consent_presentation_events owner to postgres;
alter table public.research_consent_decision_bindings owner to postgres;
alter view public.research_admin_history_events owner to postgres;
alter function public.present_wave4_synthetic_research_consent(uuid,uuid,uuid) owner to postgres;
alter function public.decide_wave4_synthetic_research_consent(uuid,uuid,text,boolean,boolean,boolean,jsonb,uuid,text,text,timestamptz,uuid) owner to postgres;
alter function public.get_participant_research_journey(uuid,uuid) owner to postgres;
alter function public.get_admin_research_history_page(uuid,uuid,text,timestamptz,uuid,integer,uuid) owner to postgres;

revoke all on function public.decide_wave4_synthetic_research_consent(uuid,uuid,text,boolean,boolean,boolean,jsonb,uuid,text,text,timestamptz,uuid),public.get_participant_research_journey(uuid,uuid),public.get_admin_research_history_page(uuid,uuid,text,timestamptz,uuid,integer,uuid) from public,anon,authenticated,service_role;
grant execute on function public.decide_wave4_synthetic_research_consent(uuid,uuid,text,boolean,boolean,boolean,jsonb,uuid,text,text,timestamptz,uuid),public.get_participant_research_journey(uuid,uuid),public.get_admin_research_history_page(uuid,uuid,text,timestamptz,uuid,integer,uuid) to service_role;

comment on table public.research_consent_presentation_approval_events is 'Append-only independent approval identity for controlled participant consent wording; approval does not open release.';
comment on table public.research_consent_presentation_events is 'Exact immutable consent presentation binding: artifact, approval, authority versions, and timestamp.';
comment on table public.research_consent_decision_bindings is 'Immutable grant/decline binding to the exact presentation event; stale presentations cannot authorize a decision.';
comment on function public.get_admin_research_history_page(uuid,uuid,text,timestamptz,uuid,integer,uuid) is 'Deterministic keyset-paginated internal research history. No authoritative history is deleted or truncated.';

commit;
