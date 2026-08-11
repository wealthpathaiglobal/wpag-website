begin;

-- Sprint 25 / Wave 2. Synthetic-only research evidence backbone. This
-- migration does not open actual enrollment, real evidence collection,
-- participant outputs, Pilot, Production, or final System State authority.

create table public.research_evaluations (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.research_enrollments(id) on update cascade on delete restrict,
  predecessor_evaluation_id uuid references public.research_evaluations(id) on update cascade on delete restrict,
  research_family text not null check (research_family in ('FSH','MGN','RUNWAY','STRESS')),
  evaluation_kind text not null check (evaluation_kind in ('BASELINE','FOLLOW_UP')),
  sequence_number integer not null check (sequence_number > 0),
  lifecycle_context text not null,
  authority_versions jsonb not null check (jsonb_typeof(authority_versions)='object' and authority_versions <> '{}'::jsonb),
  environment text not null check (environment in ('synthetic_development','synthetic_test')),
  created_by uuid not null references auth.users(id) on update cascade on delete restrict,
  created_at timestamptz not null default clock_timestamp(),
  correlation_id uuid not null,
  unique(enrollment_id,research_family,evaluation_kind,sequence_number),
  unique(predecessor_evaluation_id),
  check (predecessor_evaluation_id is null or predecessor_evaluation_id <> id),
  check (btrim(lifecycle_context)<>'')
);

create table public.research_evidence_items (
  id uuid primary key default gen_random_uuid(),
  participant_research_identity_id uuid not null references public.participant_research_identities(id) on update cascade on delete restrict,
  enrollment_id uuid not null references public.research_enrollments(id) on update cascade on delete restrict,
  evaluation_id uuid not null references public.research_evaluations(id) on update cascade on delete restrict,
  research_family text not null check (research_family in ('FSH','MGN','RUNWAY','STRESS')),
  purpose_id text not null,
  source_identity text not null,
  source_type text not null check (source_type in ('PARTICIPANT_REPORTED','DOCUMENTARY_EVIDENCE','SYSTEM_RECORDED','REVIEWER_OBSERVED','EXTERNALLY_VERIFIED_SOURCE')),
  observed_at timestamptz not null,
  effective_at timestamptz not null,
  consent_record_id uuid not null references public.research_consent_records(id) on update cascade on delete restrict,
  privacy_binding_id uuid not null references public.research_privacy_bindings(id) on update cascade on delete restrict,
  lifecycle_context text not null,
  authority_versions jsonb not null check (jsonb_typeof(authority_versions)='object' and authority_versions <> '{}'::jsonb),
  environment text not null check (environment in ('synthetic_development','synthetic_test')),
  created_by uuid not null references auth.users(id) on update cascade on delete restrict,
  created_at timestamptz not null default clock_timestamp(),
  correlation_id uuid not null,
  check (btrim(purpose_id)<>'' and btrim(source_identity)<>'' and btrim(lifecycle_context)<>'')
);

create table public.research_evidence_versions (
  id uuid primary key default gen_random_uuid(),
  evidence_item_id uuid not null references public.research_evidence_items(id) on update cascade on delete restrict,
  predecessor_version_id uuid references public.research_evidence_versions(id) on update cascade on delete restrict,
  version_number integer not null check (version_number > 0),
  version_status text not null check (version_status in ('ORIGINAL','CORRECTED','SUPERSEDED','DISPUTED','RESTRICTED','WITHDRAWN_USE','UNRESOLVED')),
  value_state text not null check (value_state in ('PRESENT','CONFIRMED_ZERO','MISSING','INVALID','STALE','CONFLICTING','UNRESOLVED','NOT_APPLICABLE')),
  governed_value jsonb not null default '{}'::jsonb check (jsonb_typeof(governed_value)='object'),
  assessment_document_id uuid references public.assessment_documents(id) on update cascade on delete restrict,
  file_version_history_id uuid references public.file_version_history(id) on update cascade on delete restrict,
  provenance jsonb not null check (jsonb_typeof(provenance)='object' and provenance <> '{}'::jsonb),
  privacy_metadata jsonb not null check (jsonb_typeof(privacy_metadata)='object' and privacy_metadata ?& array['purpose','data_class','sensitivity_class','access_class','use_restriction','retention_class','disposition','sharing_status','export_status']),
  correction_reason text,
  authority_versions jsonb not null check (jsonb_typeof(authority_versions)='object' and authority_versions <> '{}'::jsonb),
  created_by uuid not null references auth.users(id) on update cascade on delete restrict,
  created_at timestamptz not null default clock_timestamp(),
  correlation_id uuid not null,
  unique(evidence_item_id,version_number),
  unique(predecessor_version_id),
  check (predecessor_version_id is null or predecessor_version_id <> id),
  check ((version_number=1 and predecessor_version_id is null and version_status='ORIGINAL') or (version_number>1 and predecessor_version_id is not null and correction_reason is not null)),
  check (
    (value_state='PRESENT' and governed_value ? 'value' and governed_value->'value' <> 'null'::jsonb) or
    (value_state='CONFIRMED_ZERO' and jsonb_typeof(governed_value->'value')='number' and (governed_value->>'value')::numeric=0) or
    (value_state in ('MISSING','INVALID','STALE','CONFLICTING','UNRESOLVED','NOT_APPLICABLE') and not (governed_value ? 'value'))
  ),
  check ((assessment_document_id is null)=(file_version_history_id is null))
);

create table public.research_snapshots (
  id uuid primary key default gen_random_uuid(),
  participant_research_identity_id uuid not null references public.participant_research_identities(id) on update cascade on delete restrict,
  enrollment_id uuid not null references public.research_enrollments(id) on update cascade on delete restrict,
  evaluation_id uuid not null references public.research_evaluations(id) on update cascade on delete restrict,
  predecessor_snapshot_id uuid references public.research_snapshots(id) on update cascade on delete restrict,
  research_family text not null check (research_family in ('FSH','MGN','RUNWAY','STRESS')),
  snapshot_kind text not null check (snapshot_kind in ('BASELINE','FOLLOW_UP')),
  snapshot_status text not null check (snapshot_status in ('DRAFT','FROZEN','SUPERSEDED','RESTRICTED','INVALID','UNRESOLVED')),
  completeness_status text not null check (completeness_status in ('COMPLETE','INCOMPLETE','UNRESOLVED')),
  currentness_status text not null check (currentness_status in ('CURRENT','STALE','CONFLICTING','UNRESOLVED')),
  consent_record_id uuid not null references public.research_consent_records(id) on update cascade on delete restrict,
  privacy_binding_id uuid not null references public.research_privacy_bindings(id) on update cascade on delete restrict,
  manifest_sha256 text not null check (manifest_sha256 ~ '^[0-9a-f]{64}$'),
  authority_versions jsonb not null check (jsonb_typeof(authority_versions)='object' and authority_versions <> '{}'::jsonb),
  environment text not null check (environment in ('synthetic_development','synthetic_test')),
  frozen_at timestamptz not null,
  created_by uuid not null references auth.users(id) on update cascade on delete restrict,
  created_at timestamptz not null default clock_timestamp(),
  correlation_id uuid not null,
  unique(predecessor_snapshot_id),
  check (predecessor_snapshot_id is null or predecessor_snapshot_id <> id),
  check (snapshot_status='FROZEN')
);

create table public.research_snapshot_members (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.research_snapshots(id) on update cascade on delete restrict,
  evidence_version_id uuid not null references public.research_evidence_versions(id) on update cascade on delete restrict,
  ordinal integer not null check (ordinal > 0),
  admission_status text not null check (admission_status in ('ADMITTED','RESTRICTED','EXCLUDED','UNRESOLVED')),
  reason_code text not null,
  created_at timestamptz not null default clock_timestamp(),
  unique(snapshot_id,evidence_version_id),
  unique(snapshot_id,ordinal),
  check (btrim(reason_code)<>'')
);

create table public.research_follow_up_records (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.research_enrollments(id) on update cascade on delete restrict,
  participant_research_identity_id uuid not null references public.participant_research_identities(id) on update cascade on delete restrict,
  evaluation_id uuid not null references public.research_evaluations(id) on update cascade on delete restrict,
  predecessor_follow_up_id uuid references public.research_follow_up_records(id) on update cascade on delete restrict,
  predecessor_snapshot_id uuid not null references public.research_snapshots(id) on update cascade on delete restrict,
  current_snapshot_id uuid references public.research_snapshots(id) on update cascade on delete restrict,
  sequence_number integer not null check (sequence_number > 0),
  research_family text not null check (research_family in ('FSH','MGN','RUNWAY','STRESS')),
  follow_up_status text not null check (follow_up_status in ('NOT_APPLICABLE','ELIGIBLE','PENDING','IN_PROGRESS','EVIDENCE_COMPLETE','REVIEW_REQUIRED','COMPLETED','BLOCKED','WITHDRAWN_TERMINATED')),
  consent_record_id uuid not null references public.research_consent_records(id) on update cascade on delete restrict,
  privacy_binding_id uuid not null references public.research_privacy_bindings(id) on update cascade on delete restrict,
  authority_versions jsonb not null check (jsonb_typeof(authority_versions)='object' and authority_versions <> '{}'::jsonb),
  environment text not null check (environment in ('synthetic_development','synthetic_test')),
  reason_code text not null,
  created_by uuid not null references auth.users(id) on update cascade on delete restrict,
  created_at timestamptz not null default clock_timestamp(),
  correlation_id uuid not null,
  unique(predecessor_follow_up_id),
  check (predecessor_follow_up_id is null or predecessor_follow_up_id <> id),
  check (btrim(reason_code)<>'')
);

create unique index research_follow_up_sequence_root_unique on public.research_follow_up_records(enrollment_id,research_family,sequence_number) where predecessor_follow_up_id is null;

create table public.research_raw_observations (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.research_enrollments(id) on update cascade on delete restrict,
  evaluation_id uuid not null references public.research_evaluations(id) on update cascade on delete restrict,
  snapshot_id uuid not null references public.research_snapshots(id) on update cascade on delete restrict,
  research_family text not null check (research_family in ('FSH','MGN','RUNWAY','STRESS')),
  source_class text not null check (source_class in ('PARTICIPANT_REPORTED','DOCUMENTARY_EVIDENCE','SYSTEM_RECORDED','REVIEWER_OBSERVED','EXTERNALLY_VERIFIED_SOURCE')),
  observation_code text not null,
  observation_payload jsonb not null check (jsonb_typeof(observation_payload)='object'),
  observed_at timestamptz not null,
  authority_versions jsonb not null check (jsonb_typeof(authority_versions)='object' and authority_versions <> '{}'::jsonb),
  recorded_by uuid not null references auth.users(id) on update cascade on delete restrict,
  recorded_at timestamptz not null default clock_timestamp(),
  correlation_id uuid not null,
  check (btrim(observation_code)<>'')
);

create table public.research_verified_events (
  id uuid primary key default gen_random_uuid(),
  raw_observation_id uuid not null references public.research_raw_observations(id) on update cascade on delete restrict,
  evidence_version_id uuid not null references public.research_evidence_versions(id) on update cascade on delete restrict,
  event_class text not null check (event_class in ('CONTINUITY_MAINTAINED','CONTINUITY_DISRUPTED','OBLIGATION_MET','OBLIGATION_DELAYED','OBLIGATION_INTERRUPTED','OBLIGATION_FAILED','ESSENTIAL_COST_DISRUPTED','BUFFER_USED','BUFFER_DEPLETED','BUFFER_AVAILABILITY_CONFIRMED','FLOW_MAINTAINED','FLOW_REDUCED','FLOW_INTERRUPTED','FLOW_RESTORED','RECOVERY_COMPLETED','LOAD_CHANGED','CAPACITY_RELATED_CHANGE','MARGIN_RELATED_CHANGE','RUNWAY_CHANGED','STRESS_COMPONENT_CHANGED')),
  event_status text not null check (event_status in ('PROPOSED','VERIFIED','REJECTED','DISPUTED','SUPERSEDED','RESTRICTED','UNRESOLVED')),
  occurrence_at timestamptz not null,
  source_sufficiency text not null check (source_sufficiency in ('SUFFICIENT','LIMITED','CONFLICTING','UNRESOLVED','NOT_APPLICABLE')),
  reason_code text not null,
  authority_version text not null,
  verified_by uuid not null references auth.users(id) on update cascade on delete restrict,
  verified_at timestamptz not null default clock_timestamp(),
  correlation_id uuid not null,
  check (btrim(reason_code)<>'' and btrim(authority_version)<>'')
);

create table public.research_outcomes (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.research_enrollments(id) on update cascade on delete restrict,
  evaluation_id uuid not null references public.research_evaluations(id) on update cascade on delete restrict,
  predecessor_outcome_id uuid references public.research_outcomes(id) on update cascade on delete restrict,
  research_family text not null check (research_family in ('FSH','MGN','RUNWAY','STRESS')),
  outcome_class text not null check (outcome_class in ('CONTINUITY_PRESERVED','CONTINUITY_DISRUPTED','OBLIGATION_DISRUPTION_OBSERVED','BUFFER_ABSORPTION_OBSERVED','RECOVERY_OBSERVED','STRUCTURAL_CHANGE_OBSERVED','OUTCOME_UNRESOLVED')),
  outcome_status text not null check (outcome_status in ('PROPOSED','UNDER_REVIEW','ADJUDICATED_CONFIRMED','ADJUDICATED_REJECTED','DISPUTED','SUPERSEDED','RESTRICTED','UNRESOLVED')),
  outcome_quality text not null check (outcome_quality in ('SUFFICIENT','LIMITED','CONFLICTING','UNRESOLVED','NOT_APPLICABLE')),
  outcome_use_status text not null check (outcome_use_status in ('CURRENT','SUPERSEDED','USE_RESTRICTED','WITHDRAWN_USE','UNRESOLVED')),
  taxonomy_version text not null,
  evidence_event_manifest_sha256 text not null check (evidence_event_manifest_sha256 ~ '^[0-9a-f]{64}$'),
  reason_code text not null,
  evidence_delta jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence_delta)='object'),
  proposed_by uuid not null references auth.users(id) on update cascade on delete restrict,
  created_at timestamptz not null default clock_timestamp(),
  correlation_id uuid not null,
  unique(predecessor_outcome_id),
  check (predecessor_outcome_id is null or predecessor_outcome_id <> id),
  check (btrim(taxonomy_version)<>'' and btrim(reason_code)<>'')
);

create table public.research_outcome_event_members (
  outcome_id uuid not null references public.research_outcomes(id) on update cascade on delete restrict,
  verified_event_id uuid not null references public.research_verified_events(id) on update cascade on delete restrict,
  ordinal integer not null check (ordinal > 0),
  primary key(outcome_id,verified_event_id),
  unique(outcome_id,ordinal)
);

create table public.research_review_adjudications (
  id uuid primary key default gen_random_uuid(),
  outcome_id uuid not null references public.research_outcomes(id) on update cascade on delete restrict,
  review_status text not null check (review_status in ('REQUESTED','IN_REVIEW','CONFIRMED','CHANGED','REJECTED','ESCALATED','CONFLICTED','SUPERSEDED','UNRESOLVED')),
  adjudicator_role text not null,
  adjudicator_user_id uuid not null references auth.users(id) on update cascade on delete restrict,
  independence_status text not null check (independence_status in ('CONFIRMED_INDEPENDENT','CONFLICTED','UNRESOLVED')),
  conflict_status text not null check (conflict_status in ('NONE','DISAGREEMENT','ESCALATED','UNRESOLVED')),
  reason_code text not null,
  authority_version text not null,
  decided_at timestamptz not null default clock_timestamp(),
  correlation_id uuid not null,
  check (btrim(adjudicator_role)<>'' and btrim(reason_code)<>'' and btrim(authority_version)<>'')
);

create index research_evidence_items_context_idx on public.research_evidence_items(enrollment_id,research_family,evaluation_id);
create index research_evidence_versions_item_idx on public.research_evidence_versions(evidence_item_id,version_number);
create index research_snapshots_context_idx on public.research_snapshots(enrollment_id,research_family,snapshot_kind,frozen_at desc);
create index research_follow_ups_context_idx on public.research_follow_up_records(enrollment_id,research_family,sequence_number);
create index research_outcomes_context_idx on public.research_outcomes(enrollment_id,research_family,created_at desc);

do $$ declare t text; begin
  foreach t in array array['research_evaluations','research_evidence_items','research_evidence_versions','research_snapshots','research_snapshot_members','research_follow_up_records','research_raw_observations','research_verified_events','research_outcomes','research_outcome_event_members','research_review_adjudications'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('alter table public.%I force row level security',t);
    execute format('revoke all on public.%I from public,anon,authenticated,service_role',t);
  end loop;
end $$;

create function public.prevent_research_wave2_mutation()
returns trigger language plpgsql set search_path=public,pg_catalog as $$
begin raise exception using errcode='P1001',message='Research Wave 2 records are append-only.'; end; $$;

do $$ declare t text; begin
  foreach t in array array['research_evaluations','research_evidence_items','research_evidence_versions','research_snapshots','research_snapshot_members','research_follow_up_records','research_raw_observations','research_verified_events','research_outcomes','research_outcome_event_members','research_review_adjudications'] loop
    execute format('create trigger %I before update or delete on public.%I for each row execute function public.prevent_research_wave2_mutation()',t||'_immutable',t);
  end loop;
end $$;

create function public.assert_wave2_synthetic_gate(p_enrollment_id uuid,p_family text,p_actor_user_id uuid,p_follow_up boolean default false)
returns void language plpgsql stable security definer set search_path=public,pg_catalog as $$
declare v public.research_enrollments%rowtype; v_ready record;
begin
 if not public.has_any_role(p_actor_user_id,array['administrator','research_coordinator','reviewer','evidence_verifier']) then raise exception using errcode='P1001',message='Actor is not authorized for synthetic research operations.'; end if;
 select * into v from public.research_enrollments where id=p_enrollment_id;
 if not found or v.environment not in ('synthetic_development','synthetic_test') or p_family not in ('FSH','MGN','RUNWAY','STRESS') then raise exception using errcode='P1001',message='Synthetic research context is invalid.'; end if;
 select * into v_ready from public.evaluate_wave1_research_readiness(p_enrollment_id,p_family,p_follow_up);
 if v_ready.wave1_gate<>'OPEN' then raise exception using errcode='P1001',message='Synthetic research authority gate is blocked.'; end if;
 if not exists(select 1 from public.research_release_firewall f where f.environment=v.environment and f.actual_enrollment_status='BLOCKED' and f.evidence_collection_status='BLOCKED' and f.pilot_status='NOT_AUTHORIZED' and f.production_status='NOT_AUTHORIZED') then raise exception using errcode='P1001',message='Research release firewall integrity check failed.'; end if;
end $$;

create function public.create_synthetic_research_evidence(
 p_enrollment_id uuid,p_evaluation_id uuid,p_family text,p_actor_user_id uuid,p_purpose_id text,p_source_identity text,p_source_type text,
 p_observed_at timestamptz,p_effective_at timestamptz,p_value_state text,p_governed_value jsonb,p_provenance jsonb,
 p_assessment_document_id uuid,p_file_version_history_id uuid,p_correlation_id uuid)
returns table(evidence_item_id uuid,evidence_version_id uuid,evaluation_id uuid)
language plpgsql security definer set search_path=public,pg_catalog as $$
declare e public.research_enrollments%rowtype; c public.research_consent_records%rowtype; p public.research_privacy_bindings%rowtype; ev uuid; item uuid; ver uuid; now_at timestamptz:=clock_timestamp();
begin
 if not public.is_active_research_administrator(p_actor_user_id) then raise exception using errcode='P1001',message='Actor is not authorized to create synthetic research evidence.'; end if;
 perform public.assert_wave2_synthetic_gate(p_enrollment_id,p_family,p_actor_user_id,false);
 select * into e from public.research_enrollments where id=p_enrollment_id for share;
 select * into c from public.research_consent_records where enrollment_id=p_enrollment_id order by recorded_at desc,id desc limit 1;
 select * into p from public.research_privacy_bindings where enrollment_id=p_enrollment_id order by recorded_at desc,id desc limit 1;
 if (p_assessment_document_id is null)<>(p_file_version_history_id is null) or (p_file_version_history_id is not null and not exists(select 1 from public.file_version_history f where f.id=p_file_version_history_id and f.file_id=p_assessment_document_id)) then raise exception using errcode='P1001',message='Evidence storage adapter binding is invalid.'; end if;
 ev:=p_evaluation_id;
 if ev is null then
   select id into ev from public.research_evaluations where enrollment_id=p_enrollment_id and research_family=p_family and evaluation_kind='BASELINE' and sequence_number=1;
   if ev is null then insert into public.research_evaluations(enrollment_id,research_family,evaluation_kind,sequence_number,lifecycle_context,authority_versions,environment,created_by,correlation_id) values(p_enrollment_id,p_family,'BASELINE',1,'BASELINE_IN_PROGRESS',jsonb_build_object('evidence_schema',e.evidence_schema_authority_version,'lifecycle',e.lifecycle_authority_version),e.environment,p_actor_user_id,p_correlation_id) returning id into ev; end if;
 elsif not exists(select 1 from public.research_evaluations x where x.id=ev and x.enrollment_id=p_enrollment_id and x.research_family=p_family) then
   raise exception using errcode='P1001',message='Research evidence evaluation lineage is invalid.';
 end if;
 insert into public.research_evidence_items(participant_research_identity_id,enrollment_id,evaluation_id,research_family,purpose_id,source_identity,source_type,observed_at,effective_at,consent_record_id,privacy_binding_id,lifecycle_context,authority_versions,environment,created_by,correlation_id)
 values(e.participant_research_identity_id,e.id,ev,p_family,btrim(p_purpose_id),btrim(p_source_identity),p_source_type,p_observed_at,p_effective_at,c.id,p.id,'BASELINE_IN_PROGRESS',jsonb_build_object('evidence_schema',e.evidence_schema_authority_version,'consent',e.consent_authority_version,'privacy',e.privacy_authority_version),e.environment,p_actor_user_id,p_correlation_id) returning id into item;
 insert into public.research_evidence_versions(evidence_item_id,version_number,version_status,value_state,governed_value,assessment_document_id,file_version_history_id,provenance,privacy_metadata,authority_versions,created_by,correlation_id)
 values(item,1,'ORIGINAL',p_value_state,coalesce(p_governed_value,'{}'),p_assessment_document_id,p_file_version_history_id,p_provenance,jsonb_build_object('purpose',p.purpose_id,'data_class','FINANCIAL_EVIDENCE','sensitivity_class',p.sensitivity_classification,'access_class',p.access_class,'use_restriction',p.use_restriction,'retention_class',p.retention_class,'disposition',p.canonical_disposition,'sharing_status',p.sharing_status,'export_status',p.export_status),jsonb_build_object('evidence_schema',e.evidence_schema_authority_version),p_actor_user_id,p_correlation_id) returning id into ver;
 insert into public.research_control_audit_events(participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,authority_versions,reason_code,occurred_at,correlation_id,metadata) values(e.participant_research_identity_id,e.id,'RESEARCH_EVIDENCE_CREATED','ADMIN',p_actor_user_id,jsonb_build_object('evidence_schema',e.evidence_schema_authority_version),'SYNTHETIC_ONLY',now_at,p_correlation_id,jsonb_build_object('evidence_item_id',item,'evidence_version_id',ver));
 return query select item,ver,ev;
exception when sqlstate 'P1001' then raise; when check_violation then raise exception using errcode='P1001',message='Research evidence value or authority state is invalid.'; when others then raise exception using errcode='P1002',message='Synthetic research evidence operation could not be completed.'; end $$;

create function public.correct_synthetic_research_evidence_version(p_predecessor_version_id uuid,p_actor_user_id uuid,p_value_state text,p_governed_value jsonb,p_reason text,p_correlation_id uuid)
returns uuid language plpgsql security definer set search_path=public,pg_catalog as $$
declare old public.research_evidence_versions%rowtype; item public.research_evidence_items%rowtype; new_id uuid;
begin
 select * into old from public.research_evidence_versions where id=p_predecessor_version_id for share;
 select * into item from public.research_evidence_items where id=old.evidence_item_id;
 if not public.is_active_research_administrator(p_actor_user_id) then raise exception using errcode='P1001',message='Actor is not authorized to correct synthetic research evidence.'; end if;
 perform public.assert_wave2_synthetic_gate(item.enrollment_id,item.research_family,p_actor_user_id,false);
 if nullif(btrim(p_reason),'') is null or exists(select 1 from public.research_evidence_versions where predecessor_version_id=old.id) then raise exception using errcode='P1001',message='Evidence correction predecessor is not current.'; end if;
 insert into public.research_evidence_versions(evidence_item_id,predecessor_version_id,version_number,version_status,value_state,governed_value,assessment_document_id,file_version_history_id,provenance,privacy_metadata,correction_reason,authority_versions,created_by,correlation_id)
 values(old.evidence_item_id,old.id,old.version_number+1,'CORRECTED',p_value_state,coalesce(p_governed_value,'{}'),old.assessment_document_id,old.file_version_history_id,old.provenance,old.privacy_metadata,btrim(p_reason),old.authority_versions,p_actor_user_id,p_correlation_id) returning id into new_id;
 insert into public.research_control_audit_events(participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,reason_code,occurred_at,correlation_id,metadata) values(item.participant_research_identity_id,item.enrollment_id,'RESEARCH_EVIDENCE_CORRECTED','ADMIN',p_actor_user_id,'APPEND_ONLY_SUCCESSOR',clock_timestamp(),p_correlation_id,jsonb_build_object('predecessor_version_id',old.id,'successor_version_id',new_id));
 return new_id;
end $$;

create function public.freeze_synthetic_research_snapshot(p_enrollment_id uuid,p_family text,p_actor_user_id uuid,p_snapshot_kind text,p_predecessor_snapshot_id uuid,p_evidence_version_ids uuid[],p_completeness text,p_currentness text,p_correlation_id uuid)
returns uuid language plpgsql security definer set search_path=public,pg_catalog as $$
declare e public.research_enrollments%rowtype; c uuid; p uuid; ev uuid; sid uuid; manifest text; n integer; v uuid; i integer:=0;
begin
 if not public.is_active_research_administrator(p_actor_user_id) then raise exception using errcode='P1001',message='Actor is not authorized to freeze synthetic research snapshots.'; end if;
 perform public.assert_wave2_synthetic_gate(p_enrollment_id,p_family,p_actor_user_id,p_snapshot_kind='FOLLOW_UP');
 if cardinality(coalesce(p_evidence_version_ids,'{}'))=0 or cardinality(p_evidence_version_ids)<>(select count(distinct x) from unnest(p_evidence_version_ids)x) then raise exception using errcode='P1001',message='Snapshot evidence manifest is invalid.'; end if;
 select * into e from public.research_enrollments where id=p_enrollment_id;
 select id into c from public.research_consent_records where enrollment_id=p_enrollment_id order by recorded_at desc,id desc limit 1;
 select id into p from public.research_privacy_bindings where enrollment_id=p_enrollment_id order by recorded_at desc,id desc limit 1;
 select count(*) into n from public.research_evidence_versions rv join public.research_evidence_items ri on ri.id=rv.evidence_item_id where rv.id=any(p_evidence_version_ids) and ri.enrollment_id=p_enrollment_id and ri.research_family=p_family and not exists(select 1 from public.research_evidence_versions nx where nx.predecessor_version_id=rv.id) and rv.version_status not in ('DISPUTED','RESTRICTED','WITHDRAWN_USE','UNRESOLVED');
 if n<>cardinality(p_evidence_version_ids) then raise exception using errcode='P1001',message='Snapshot manifest contains ineligible evidence.'; end if;
 select evaluation_id into ev from public.research_evidence_items where enrollment_id=p_enrollment_id and research_family=p_family and id=(select evidence_item_id from public.research_evidence_versions where id=p_evidence_version_ids[1]);
 if p_predecessor_snapshot_id is not null and not exists(select 1 from public.research_snapshots where id=p_predecessor_snapshot_id and enrollment_id=p_enrollment_id and research_family=p_family) then raise exception using errcode='P1001',message='Snapshot predecessor is invalid.'; end if;
 manifest:=encode(extensions.digest(array_to_string((select array_agg(x::text order by x::text) from unnest(p_evidence_version_ids)x),','),'sha256'),'hex');
 insert into public.research_snapshots(participant_research_identity_id,enrollment_id,evaluation_id,predecessor_snapshot_id,research_family,snapshot_kind,snapshot_status,completeness_status,currentness_status,consent_record_id,privacy_binding_id,manifest_sha256,authority_versions,environment,frozen_at,created_by,correlation_id)
 values(e.participant_research_identity_id,e.id,ev,p_predecessor_snapshot_id,p_family,p_snapshot_kind,'FROZEN',p_completeness,p_currentness,c,p,manifest,jsonb_build_object('evidence_schema',e.evidence_schema_authority_version,'lifecycle',e.lifecycle_authority_version),e.environment,clock_timestamp(),p_actor_user_id,p_correlation_id) returning id into sid;
 foreach v in array p_evidence_version_ids loop i:=i+1; insert into public.research_snapshot_members(snapshot_id,evidence_version_id,ordinal,admission_status,reason_code) values(sid,v,i,'ADMITTED','GOVERNED_MANIFEST'); end loop;
 insert into public.research_control_audit_events(participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,reason_code,occurred_at,correlation_id,metadata) values(e.participant_research_identity_id,e.id,case when p_predecessor_snapshot_id is null then 'RESEARCH_SNAPSHOT_FROZEN' else 'RESEARCH_SNAPSHOT_SUCCEEDED' end,'ADMIN',p_actor_user_id,'IMMUTABLE_MANIFEST',clock_timestamp(),p_correlation_id,jsonb_build_object('snapshot_id',sid,'manifest_sha256',manifest));
 return sid;
end $$;

create function public.complete_synthetic_research_baseline(p_snapshot_id uuid,p_actor_user_id uuid,p_correlation_id uuid)
returns uuid language plpgsql security definer set search_path=public,pg_catalog as $$
declare s public.research_snapshots%rowtype; prior uuid; new_id uuid; now_at timestamptz:=clock_timestamp();
begin
 select * into s from public.research_snapshots where id=p_snapshot_id;
 if not public.is_active_research_administrator(p_actor_user_id) then raise exception using errcode='P1001',message='Actor is not authorized to complete a synthetic baseline.'; end if;
 perform public.assert_wave2_synthetic_gate(s.enrollment_id,s.research_family,p_actor_user_id,false);
 if s.snapshot_kind<>'BASELINE' or s.snapshot_status<>'FROZEN' or s.completeness_status<>'COMPLETE' or s.currentness_status<>'CURRENT' then raise exception using errcode='P1001',message='Baseline requires a complete current frozen snapshot.'; end if;
 select id into prior from public.research_enrollment_status_history where enrollment_id=s.enrollment_id order by recorded_at desc,id desc limit 1 for update;
 insert into public.research_enrollment_status_history(enrollment_id,predecessor_status_event_id,lifecycle_status,reason_code,effective_at,occurred_at,actor_user_id,correlation_id,metadata) values(s.enrollment_id,prior,'BASELINE_COMPLETE','FROZEN_BASELINE_SNAPSHOT',now_at,now_at,p_actor_user_id,p_correlation_id,jsonb_build_object('snapshot_id',s.id)) returning id into new_id;
 insert into public.research_control_audit_events(participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,reason_code,occurred_at,correlation_id,metadata) values(s.participant_research_identity_id,s.enrollment_id,'RESEARCH_BASELINE_COMPLETED','ADMIN',p_actor_user_id,'FROZEN_BASELINE_REQUIRED',now_at,p_correlation_id,jsonb_build_object('snapshot_id',s.id,'active_research_authorized',false));
 return new_id;
end $$;

create function public.create_synthetic_research_follow_up(p_enrollment_id uuid,p_family text,p_actor_user_id uuid,p_predecessor_snapshot_id uuid,p_correlation_id uuid)
returns table(follow_up_id uuid,evaluation_id uuid,sequence_number integer,follow_up_status text)
language plpgsql security definer set search_path=public,pg_catalog as $$
declare e public.research_enrollments%rowtype; c uuid; p uuid; prev uuid; seq integer; ev uuid; fid uuid;
begin
 if not public.is_active_research_administrator(p_actor_user_id) then raise exception using errcode='P1001',message='Actor is not authorized to create synthetic follow-up records.'; end if;
 perform public.assert_wave2_synthetic_gate(p_enrollment_id,p_family,p_actor_user_id,true);
 select * into e from public.research_enrollments where id=p_enrollment_id for update;
 if not exists(select 1 from public.research_snapshots where id=p_predecessor_snapshot_id and enrollment_id=p_enrollment_id and research_family=p_family and snapshot_status='FROZEN') then raise exception using errcode='P1001',message='Follow-up predecessor snapshot is invalid.'; end if;
 select f.id,f.sequence_number into prev,seq from public.research_follow_up_records f where f.enrollment_id=p_enrollment_id and f.research_family=p_family order by f.sequence_number desc limit 1;
 seq:=coalesce(seq,0)+1;
 select id into c from public.research_consent_records where enrollment_id=p_enrollment_id order by recorded_at desc,id desc limit 1;
 select id into p from public.research_privacy_bindings where enrollment_id=p_enrollment_id order by recorded_at desc,id desc limit 1;
 insert into public.research_evaluations(enrollment_id,predecessor_evaluation_id,research_family,evaluation_kind,sequence_number,lifecycle_context,authority_versions,environment,created_by,correlation_id) values(p_enrollment_id,(select s.evaluation_id from public.research_snapshots s where s.id=p_predecessor_snapshot_id),p_family,'FOLLOW_UP',seq,'FOLLOWUP_PENDING',jsonb_build_object('lifecycle',e.lifecycle_authority_version,'evidence_schema',e.evidence_schema_authority_version),e.environment,p_actor_user_id,p_correlation_id) returning id into ev;
 insert into public.research_follow_up_records(enrollment_id,participant_research_identity_id,evaluation_id,predecessor_follow_up_id,predecessor_snapshot_id,sequence_number,research_family,follow_up_status,consent_record_id,privacy_binding_id,authority_versions,environment,reason_code,created_by,correlation_id) values(e.id,e.participant_research_identity_id,ev,prev,p_predecessor_snapshot_id,seq,p_family,'PENDING',c,p,jsonb_build_object('lifecycle',e.lifecycle_authority_version,'follow_up_outcome','HFOS_Research_Follow_Up_and_Outcome_Adjudication_Authority_v0.1'),e.environment,'MANUAL_SYNTHETIC_INITIATION',p_actor_user_id,p_correlation_id) returning id into fid;
 insert into public.research_control_audit_events(participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,reason_code,occurred_at,correlation_id,metadata) values(e.participant_research_identity_id,e.id,'RESEARCH_FOLLOW_UP_CREATED','ADMIN',p_actor_user_id,'NO_AUTOMATIC_CADENCE',clock_timestamp(),p_correlation_id,jsonb_build_object('follow_up_id',fid,'sequence_number',seq));
 return query select fid,ev,seq,'PENDING'::text;
end $$;

create function public.record_synthetic_research_observation(p_snapshot_id uuid,p_actor_user_id uuid,p_source_class text,p_observation_code text,p_payload jsonb,p_observed_at timestamptz,p_correlation_id uuid)
returns uuid language plpgsql security definer set search_path=public,pg_catalog as $$
declare s public.research_snapshots%rowtype; oid uuid;
begin
 select * into s from public.research_snapshots where id=p_snapshot_id;
 if not public.is_active_research_administrator(p_actor_user_id) then raise exception using errcode='P1001',message='Actor is not authorized to record synthetic research observations.'; end if;
 perform public.assert_wave2_synthetic_gate(s.enrollment_id,s.research_family,p_actor_user_id,s.snapshot_kind='FOLLOW_UP');
 insert into public.research_raw_observations(enrollment_id,evaluation_id,snapshot_id,research_family,source_class,observation_code,observation_payload,observed_at,authority_versions,recorded_by,correlation_id) values(s.enrollment_id,s.evaluation_id,s.id,s.research_family,p_source_class,btrim(p_observation_code),coalesce(p_payload,'{}'),p_observed_at,jsonb_build_object('evidence_schema','HFOS_Research_Evidence_and_Outcome_Schema_Authority_v0.1'),p_actor_user_id,p_correlation_id) returning id into oid;
 insert into public.research_control_audit_events(participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,reason_code,occurred_at,correlation_id,metadata) values(s.participant_research_identity_id,s.enrollment_id,'RESEARCH_RAW_OBSERVATION_RECORDED','ADMIN',p_actor_user_id,'NON_ADJUDICATED',clock_timestamp(),p_correlation_id,jsonb_build_object('raw_observation_id',oid)); return oid;
end $$;

create function public.complete_synthetic_research_follow_up(p_follow_up_id uuid,p_current_snapshot_id uuid,p_actor_user_id uuid,p_correlation_id uuid)
returns uuid language plpgsql security definer set search_path=public,pg_catalog as $$
declare f public.research_follow_up_records%rowtype; s public.research_snapshots%rowtype; nid uuid;
begin
 select * into f from public.research_follow_up_records where id=p_follow_up_id;
 if exists(select 1 from public.research_follow_up_records where predecessor_follow_up_id=f.id) then raise exception using errcode='P1001',message='Follow-up record is not current.'; end if;
 perform public.assert_wave2_synthetic_gate(f.enrollment_id,f.research_family,p_actor_user_id,true);
 if not public.is_active_research_administrator(p_actor_user_id) then raise exception using errcode='P1001',message='Actor is not authorized to complete synthetic follow-up.'; end if;
 select * into s from public.research_snapshots where id=p_current_snapshot_id;
 if s.enrollment_id<>f.enrollment_id or s.evaluation_id<>f.evaluation_id or s.research_family<>f.research_family or s.snapshot_kind<>'FOLLOW_UP' or s.snapshot_status<>'FROZEN' or s.completeness_status<>'COMPLETE' or s.currentness_status<>'CURRENT' then raise exception using errcode='P1001',message='Follow-up completion snapshot is invalid.'; end if;
 insert into public.research_follow_up_records(enrollment_id,participant_research_identity_id,evaluation_id,predecessor_follow_up_id,predecessor_snapshot_id,current_snapshot_id,sequence_number,research_family,follow_up_status,consent_record_id,privacy_binding_id,authority_versions,environment,reason_code,created_by,correlation_id)
 values(f.enrollment_id,f.participant_research_identity_id,f.evaluation_id,f.id,f.predecessor_snapshot_id,s.id,f.sequence_number,f.research_family,'COMPLETED',f.consent_record_id,f.privacy_binding_id,f.authority_versions,f.environment,'FROZEN_FOLLOW_UP_SNAPSHOT',p_actor_user_id,p_correlation_id) returning id into nid;
 insert into public.research_control_audit_events(participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,reason_code,occurred_at,correlation_id,metadata) values(f.participant_research_identity_id,f.enrollment_id,'RESEARCH_FOLLOW_UP_COMPLETED','ADMIN',p_actor_user_id,'FROZEN_FOLLOW_UP_REQUIRED',clock_timestamp(),p_correlation_id,jsonb_build_object('predecessor_follow_up_id',f.id,'successor_follow_up_id',nid,'snapshot_id',s.id));
 return nid;
end $$;

create function public.verify_synthetic_research_event(p_raw_observation_id uuid,p_evidence_version_id uuid,p_actor_user_id uuid,p_event_class text,p_source_sufficiency text,p_reason_code text,p_correlation_id uuid)
returns uuid language plpgsql security definer set search_path=public,pg_catalog as $$
declare o public.research_raw_observations%rowtype; v public.research_evidence_versions%rowtype; i public.research_evidence_items%rowtype; eid uuid;
begin
 select * into o from public.research_raw_observations where id=p_raw_observation_id;
 select * into v from public.research_evidence_versions where id=p_evidence_version_id; select * into i from public.research_evidence_items where id=v.evidence_item_id;
 perform public.assert_wave2_synthetic_gate(o.enrollment_id,o.research_family,p_actor_user_id,o.snapshot_id in (select id from public.research_snapshots where snapshot_kind='FOLLOW_UP'));
 if i.enrollment_id<>o.enrollment_id or i.research_family<>o.research_family or p_actor_user_id in (o.recorded_by,v.created_by) or not public.has_any_role(p_actor_user_id,array['administrator','evidence_verifier','reviewer']) then raise exception using errcode='P1001',message='Event verifier independence or lineage is invalid.'; end if;
 insert into public.research_verified_events(raw_observation_id,evidence_version_id,event_class,event_status,occurrence_at,source_sufficiency,reason_code,authority_version,verified_by,correlation_id) values(o.id,v.id,p_event_class,'VERIFIED',o.observed_at,p_source_sufficiency,btrim(p_reason_code),'HFOS_Research_Follow_Up_and_Outcome_Adjudication_Authority_v0.1',p_actor_user_id,p_correlation_id) returning id into eid;
 insert into public.research_control_audit_events(enrollment_id,event_type,actor_type,actor_user_id,reason_code,occurred_at,correlation_id,metadata) values(o.enrollment_id,'RESEARCH_EVENT_VERIFIED','ADMIN',p_actor_user_id,'OBJECTIVE_EVENT_ONLY',clock_timestamp(),p_correlation_id,jsonb_build_object('verified_event_id',eid)); return eid;
exception when check_violation then raise exception using errcode='P1001',message='Reserved or unauthorized research event class is prohibited.'; end $$;

create function public.propose_synthetic_research_outcome(p_enrollment_id uuid,p_evaluation_id uuid,p_family text,p_actor_user_id uuid,p_outcome_class text,p_event_ids uuid[],p_reason_code text,p_correlation_id uuid)
returns uuid language plpgsql security definer set search_path=public,pg_catalog as $$
declare oid uuid; manifest text; v uuid; i integer:=0; n integer;
begin
 perform public.assert_wave2_synthetic_gate(p_enrollment_id,p_family,p_actor_user_id,false);
 if cardinality(coalesce(p_event_ids,'{}'))=0 then raise exception using errcode='P1001',message='Outcome event manifest is required.'; end if;
 select count(*) into n from public.research_verified_events e join public.research_raw_observations o on o.id=e.raw_observation_id where e.id=any(p_event_ids) and e.event_status='VERIFIED' and o.enrollment_id=p_enrollment_id and o.evaluation_id=p_evaluation_id and o.research_family=p_family;
 if n<>cardinality(p_event_ids) then raise exception using errcode='P1001',message='Outcome event manifest is invalid.'; end if;
 manifest:=encode(extensions.digest(array_to_string((select array_agg(x::text order by x::text) from unnest(p_event_ids)x),','),'sha256'),'hex');
 insert into public.research_outcomes(enrollment_id,evaluation_id,research_family,outcome_class,outcome_status,outcome_quality,outcome_use_status,taxonomy_version,evidence_event_manifest_sha256,reason_code,proposed_by,correlation_id) values(p_enrollment_id,p_evaluation_id,p_family,p_outcome_class,'PROPOSED','UNRESOLVED','UNRESOLVED','HFOS-RESEARCH-OUTCOME/v0.1',manifest,btrim(p_reason_code),p_actor_user_id,p_correlation_id) returning id into oid;
 foreach v in array p_event_ids loop i:=i+1; insert into public.research_outcome_event_members values(oid,v,i); end loop;
 return oid;
exception when check_violation then raise exception using errcode='P1001',message='Reserved, final-State, or unauthorized outcome class is prohibited.'; end $$;

create function public.adjudicate_synthetic_research_outcome(p_outcome_id uuid,p_actor_user_id uuid,p_review_status text,p_outcome_quality text,p_reason_code text,p_correlation_id uuid)
returns table(adjudication_id uuid,successor_outcome_id uuid,outcome_status text)
language plpgsql security definer set search_path=public,pg_catalog as $$
declare old public.research_outcomes%rowtype; aid uuid; nid uuid; status text; conflict text; role_name text;
begin
 select * into old from public.research_outcomes where id=p_outcome_id;
 perform public.assert_wave2_synthetic_gate(old.enrollment_id,old.research_family,p_actor_user_id,false);
 if p_actor_user_id=old.proposed_by or not public.has_any_role(p_actor_user_id,array['administrator','reviewer']) or exists(select 1 from public.research_outcome_event_members m join public.research_verified_events e on e.id=m.verified_event_id where m.outcome_id=old.id and e.verified_by=p_actor_user_id) then raise exception using errcode='P1001',message='Outcome adjudicator independence is invalid.'; end if;
 status:=case p_review_status when 'CONFIRMED' then 'ADJUDICATED_CONFIRMED' when 'CHANGED' then 'ADJUDICATED_CONFIRMED' when 'REJECTED' then 'ADJUDICATED_REJECTED' when 'CONFLICTED' then 'UNRESOLVED' when 'ESCALATED' then 'UNRESOLVED' else null end;
 if status is null then raise exception using errcode='P1001',message='Outcome adjudication decision is invalid.'; end if;
 conflict:=case when p_review_status in ('CONFLICTED','ESCALATED') then case when p_review_status='ESCALATED' then 'ESCALATED' else 'DISAGREEMENT' end else 'NONE' end;
 select sr.role_code into role_name from public.staff_members sm join public.staff_member_roles smr on smr.staff_member_id=sm.id and smr.is_active join public.staff_roles sr on sr.id=smr.staff_role_id where sm.auth_user_id=p_actor_user_id and sm.status='active' and sr.role_code in ('administrator','reviewer') order by sr.role_code limit 1;
 insert into public.research_outcomes(enrollment_id,evaluation_id,predecessor_outcome_id,research_family,outcome_class,outcome_status,outcome_quality,outcome_use_status,taxonomy_version,evidence_event_manifest_sha256,reason_code,evidence_delta,proposed_by,correlation_id) values(old.enrollment_id,old.evaluation_id,old.id,old.research_family,case when status='UNRESOLVED' then 'OUTCOME_UNRESOLVED' else old.outcome_class end,status,case when status='UNRESOLVED' then 'UNRESOLVED' else p_outcome_quality end,case when status='ADJUDICATED_CONFIRMED' then 'CURRENT' else 'UNRESOLVED' end,old.taxonomy_version,old.evidence_event_manifest_sha256,btrim(p_reason_code),jsonb_build_object('adjudication_of',old.id),old.proposed_by,p_correlation_id) returning id into nid;
 insert into public.research_outcome_event_members select nid,verified_event_id,ordinal from public.research_outcome_event_members where outcome_id=old.id;
 insert into public.research_review_adjudications(outcome_id,review_status,adjudicator_role,adjudicator_user_id,independence_status,conflict_status,reason_code,authority_version,correlation_id) values(nid,p_review_status,role_name,p_actor_user_id,'CONFIRMED_INDEPENDENT',conflict,btrim(p_reason_code),'HFOS_Research_Follow_Up_and_Outcome_Adjudication_Authority_v0.1',p_correlation_id) returning id into aid;
 insert into public.research_control_audit_events(enrollment_id,event_type,actor_type,actor_user_id,reason_code,occurred_at,correlation_id,metadata) values(old.enrollment_id,case when status='UNRESOLVED' then 'RESEARCH_OUTCOME_ESCALATED' else 'RESEARCH_OUTCOME_ADJUDICATED' end,'ADMIN',p_actor_user_id,'INDEPENDENT_ADJUDICATION',clock_timestamp(),p_correlation_id,jsonb_build_object('predecessor_outcome_id',old.id,'successor_outcome_id',nid,'adjudication_id',aid));
 return query select aid,nid,status;
end $$;

alter function public.prevent_research_wave2_mutation() owner to postgres;
alter function public.assert_wave2_synthetic_gate(uuid,text,uuid,boolean) owner to postgres;
alter function public.create_synthetic_research_evidence(uuid,uuid,text,uuid,text,text,text,timestamptz,timestamptz,text,jsonb,jsonb,uuid,uuid,uuid) owner to postgres;
alter function public.correct_synthetic_research_evidence_version(uuid,uuid,text,jsonb,text,uuid) owner to postgres;
alter function public.freeze_synthetic_research_snapshot(uuid,text,uuid,text,uuid,uuid[],text,text,uuid) owner to postgres;
alter function public.complete_synthetic_research_baseline(uuid,uuid,uuid) owner to postgres;
alter function public.create_synthetic_research_follow_up(uuid,text,uuid,uuid,uuid) owner to postgres;
alter function public.record_synthetic_research_observation(uuid,uuid,text,text,jsonb,timestamptz,uuid) owner to postgres;
alter function public.complete_synthetic_research_follow_up(uuid,uuid,uuid,uuid) owner to postgres;
alter function public.verify_synthetic_research_event(uuid,uuid,uuid,text,text,text,uuid) owner to postgres;
alter function public.propose_synthetic_research_outcome(uuid,uuid,text,uuid,text,uuid[],text,uuid) owner to postgres;
alter function public.adjudicate_synthetic_research_outcome(uuid,uuid,text,text,text,uuid) owner to postgres;

revoke all on function public.prevent_research_wave2_mutation(),public.assert_wave2_synthetic_gate(uuid,text,uuid,boolean),public.create_synthetic_research_evidence(uuid,uuid,text,uuid,text,text,text,timestamptz,timestamptz,text,jsonb,jsonb,uuid,uuid,uuid),public.correct_synthetic_research_evidence_version(uuid,uuid,text,jsonb,text,uuid),public.freeze_synthetic_research_snapshot(uuid,text,uuid,text,uuid,uuid[],text,text,uuid),public.complete_synthetic_research_baseline(uuid,uuid,uuid),public.create_synthetic_research_follow_up(uuid,text,uuid,uuid,uuid),public.record_synthetic_research_observation(uuid,uuid,text,text,jsonb,timestamptz,uuid),public.complete_synthetic_research_follow_up(uuid,uuid,uuid,uuid),public.verify_synthetic_research_event(uuid,uuid,uuid,text,text,text,uuid),public.propose_synthetic_research_outcome(uuid,uuid,text,uuid,text,uuid[],text,uuid),public.adjudicate_synthetic_research_outcome(uuid,uuid,text,text,text,uuid) from public,anon,authenticated,service_role;
grant execute on function public.assert_wave2_synthetic_gate(uuid,text,uuid,boolean),public.create_synthetic_research_evidence(uuid,uuid,text,uuid,text,text,text,timestamptz,timestamptz,text,jsonb,jsonb,uuid,uuid,uuid),public.correct_synthetic_research_evidence_version(uuid,uuid,text,jsonb,text,uuid),public.freeze_synthetic_research_snapshot(uuid,text,uuid,text,uuid,uuid[],text,text,uuid),public.complete_synthetic_research_baseline(uuid,uuid,uuid),public.create_synthetic_research_follow_up(uuid,text,uuid,uuid,uuid),public.record_synthetic_research_observation(uuid,uuid,text,text,jsonb,timestamptz,uuid),public.complete_synthetic_research_follow_up(uuid,uuid,uuid,uuid),public.verify_synthetic_research_event(uuid,uuid,uuid,text,text,text,uuid),public.propose_synthetic_research_outcome(uuid,uuid,text,uuid,text,uuid[],text,uuid),public.adjudicate_synthetic_research_outcome(uuid,uuid,text,text,text,uuid) to service_role;

comment on table public.research_evidence_versions is 'Append-only research adapter over mature document/file-version infrastructure; explicit value states never coerce missingness to zero.';
comment on table public.research_snapshots is 'Frozen immutable evidence-version manifest. Correction requires a successor snapshot.';
comment on table public.research_raw_observations is 'Non-adjudicated observation; never a Verified Event or System State.';
comment on table public.research_outcomes is 'Governed research outcome; explicitly distinct from Stable, Under Pressure, Fragile, diagnosis, treatment, transition, or execution authority.';

commit;
