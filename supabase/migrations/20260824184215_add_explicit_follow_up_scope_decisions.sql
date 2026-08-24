begin;

-- Additive explicit follow-up decision authority. The predecessor Boolean RPC
-- and all historical records remain unchanged; no legacy classification occurs.

create table public.research_follow_up_scope_decision_events (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.research_enrollments(id) on update cascade on delete restrict,
  decision_consent_id uuid not null unique references public.research_consent_records(id) on update cascade on delete restrict,
  presentation_event_id uuid not null unique references public.research_consent_presentation_events(id) on update cascade on delete restrict,
  follow_up_scope_decision text not null check (follow_up_scope_decision in ('EXPLICITLY_GRANTED','EXPLICITLY_DECLINED')),
  decision_actor_user_id uuid not null references auth.users(id) on update cascade on delete restrict,
  decision_source text not null check (decision_source='PARTICIPANT_RESEARCH_PORTAL'),
  decision_capture_version text not null check (decision_capture_version='HFOS-FOLLOW-UP-SCOPE-DECISION-v0.1'),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default clock_timestamp(),
  correlation_id uuid not null,
  check (occurred_at<=recorded_at)
);

alter table public.research_follow_up_scope_decision_events enable row level security;
alter table public.research_follow_up_scope_decision_events force row level security;
revoke all on public.research_follow_up_scope_decision_events from public,anon,authenticated,service_role;
create trigger research_follow_up_scope_decision_events_immutable
  before update or delete on public.research_follow_up_scope_decision_events
  for each row execute function public.prevent_research_control_mutation();

create function public.decide_wave4_synthetic_research_consent_v2(
  p_enrollment_id uuid,p_actor_user_id uuid,p_decision text,p_direct_consent_attested boolean,
  p_baseline_scope_granted boolean,p_follow_up_scope_decision text,p_acknowledgements jsonb,
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
  follow_up_granted boolean;
  decided_at_value timestamptz:=clock_timestamp();
begin
  select * into e from public.research_enrollments where id=p_enrollment_id;
  select p.auth_user_id into participant_auth
  from public.participants p
  join public.participant_research_identities r on r.participant_id=p.id
  where r.id=e.participant_research_identity_id and p.deleted_at is null;

  if p_actor_user_id is distinct from participant_auth
     or e.environment not in ('synthetic_development','synthetic_test')
     or p_decision not in ('GRANTED','DECLINED')
     or p_direct_consent_attested is distinct from true
  then raise exception using errcode='P1001',message='Wave 4 direct research-consent decision is not authorized.'; end if;

  select * into current_consent from public.research_consent_records
  where enrollment_id=e.id order by recorded_at desc,id desc limit 1 for update;
  select * into presentation from public.research_consent_presentation_events where id=p_presentation_event_id;
  select * into current_approval from public.research_consent_presentation_approval_events
  order by approved_at desc,recorded_at desc,id desc limit 1;
  select * into a from public.research_consent_presentation_artifacts where id=current_approval.artifact_id;

  if current_consent.consent_status<>'PRESENTED' or presentation.id is null or presentation.enrollment_id<>e.id
     or presentation.presentation_consent_id<>current_consent.id or presentation.approval_event_id<>current_approval.id
     or presentation.artifact_id<>a.id or presentation.artifact_version is distinct from p_presented_artifact_version
     or presentation.artifact_sha256 is distinct from lower(p_presented_artifact_sha256)
     or presentation.presented_at is distinct from p_presented_at
     or presentation.consent_authority_version<>e.consent_authority_version
     or presentation.privacy_authority_version<>e.privacy_authority_version
  then rejection_reason:='CONSENT_PRESENTATION_STALE';
  elsif p_decision='GRANTED' and (p_follow_up_scope_decision is null or p_follow_up_scope_decision not in ('EXPLICITLY_GRANTED','EXPLICITLY_DECLINED'))
  then rejection_reason:='FOLLOW_UP_SCOPE_DECISION_REQUIRED';
  elsif p_decision='DECLINED' and p_follow_up_scope_decision is distinct from 'NOT_APPLICABLE'
  then rejection_reason:='CONSENT_DECLINE_PAYLOAD_INVALID';
  elsif p_decision='GRANTED' and (p_baseline_scope_granted is distinct from true or jsonb_typeof(p_acknowledgements)<>'object' or p_acknowledgements<>expected_acknowledgements)
  then rejection_reason:='CONSENT_ACKNOWLEDGEMENT_INVALID';
  elsif p_decision='DECLINED' and coalesce(p_acknowledgements,'{}'::jsonb)<>'{}'::jsonb
  then rejection_reason:='CONSENT_DECLINE_PAYLOAD_INVALID';
  end if;

  if rejection_reason is not null then
    insert into public.research_control_audit_events(
      participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,
      authority_versions,reason_code,occurred_at,correlation_id,metadata
    ) values (
      e.participant_research_identity_id,e.id,'CONSENT_DECISION_REJECTED','PARTICIPANT',p_actor_user_id,
      jsonb_build_object('consent',e.consent_authority_version,'privacy',e.privacy_authority_version),
      rejection_reason,clock_timestamp(),p_correlation_id,
      jsonb_build_object('presentation_event_id',p_presentation_event_id,'target_decision',p_decision)
    );
    return query select null::uuid,current_consent.consent_status,
      public.evaluate_research_consent_gate(e.id,'FSH',false),rejection_reason;
    return;
  end if;

  follow_up_granted:=p_decision='GRANTED' and p_follow_up_scope_decision='EXPLICITLY_GRANTED';
  select * into result from public.record_research_consent_transition(
    e.id,p_actor_user_id,p_decision,a.artifact_version,a.artifact_sha256,e.protocol_version,
    case when p_decision='GRANTED' then jsonb_build_object('FSH','HFOS-FSH-SYNTHETIC-RESEARCH-PLAN-v0.1') else '{}'::jsonb end,
    case when p_decision='GRANTED' then array['FSH']::text[] else '{}'::text[] end,
    case when follow_up_granted then array['BASELINE_RESEARCH','FOLLOW_UP_RESEARCH']::text[]
         when p_decision='GRANTED' then array['BASELINE_RESEARCH']::text[] else '{}'::text[] end,
    follow_up_granted,'en-v1','PARTICIPANT_RESEARCH_PORTAL_SYNTHETIC',
    coalesce(p_acknowledgements,'{}'::jsonb)||jsonb_build_object(
      'direct_consent_attested',true,'baseline_scope_granted',p_baseline_scope_granted,
      'follow_up_scope_granted',follow_up_granted,'follow_up_scope_decision',p_follow_up_scope_decision,
      'follow_up_decision_capture_version','HFOS-FOLLOW-UP-SCOPE-DECISION-v0.1',
      'approval_event_id',current_approval.id,'presentation_event_id',presentation.id,
      'presented_at',presentation.presented_at,'consent_authority_version',e.consent_authority_version,
      'privacy_authority_version',e.privacy_authority_version
    ),
    case when p_decision='GRANTED' then 'WAVE4_SYNTHETIC_DIRECT_CONSENT_GRANTED'
         else 'WAVE4_SYNTHETIC_DIRECT_CONSENT_DECLINED' end,p_correlation_id
  );

  insert into public.research_consent_decision_bindings(
    enrollment_id,presentation_event_id,decision_consent_id,decision,artifact_version,artifact_sha256,
    consent_authority_version,privacy_authority_version,presented_at,decided_at,actor_user_id,correlation_id
  ) values (
    e.id,presentation.id,result.consent_id,p_decision,a.artifact_version,a.artifact_sha256,
    e.consent_authority_version,e.privacy_authority_version,presentation.presented_at,
    decided_at_value,p_actor_user_id,p_correlation_id
  );

  if p_decision='GRANTED' then
    insert into public.research_follow_up_scope_decision_events(
      enrollment_id,decision_consent_id,presentation_event_id,follow_up_scope_decision,
      decision_actor_user_id,decision_source,decision_capture_version,occurred_at,correlation_id
    ) values (
      e.id,result.consent_id,presentation.id,p_follow_up_scope_decision,p_actor_user_id,
      'PARTICIPANT_RESEARCH_PORTAL','HFOS-FOLLOW-UP-SCOPE-DECISION-v0.1',decided_at_value,p_correlation_id
    );
  end if;

  return query select result.consent_id,result.consent_status,
    public.evaluate_research_consent_gate(e.id,'FSH',false),
    case when p_decision='GRANTED' then 'CONSENT_GRANTED' else 'CONSENT_DECLINED' end;
end $$;

alter table public.research_follow_up_scope_decision_events owner to postgres;
alter function public.decide_wave4_synthetic_research_consent_v2(uuid,uuid,text,boolean,boolean,text,jsonb,uuid,text,text,timestamptz,uuid) owner to postgres;
revoke all on function public.decide_wave4_synthetic_research_consent_v2(uuid,uuid,text,boolean,boolean,text,jsonb,uuid,text,text,timestamptz,uuid) from public,anon,authenticated,service_role;
grant execute on function public.decide_wave4_synthetic_research_consent_v2(uuid,uuid,text,boolean,boolean,text,jsonb,uuid,text,text,timestamptz,uuid) to service_role;

comment on table public.research_follow_up_scope_decision_events is
  'Append-only explicit participant follow-up scope decisions. Absence before completed consent is UNANSWERED; legacy Boolean-only records remain unclassified.';
comment on function public.decide_wave4_synthetic_research_consent_v2(uuid,uuid,text,boolean,boolean,text,jsonb,uuid,text,text,timestamptz,uuid) is
  'Versioned synthetic-only direct-consent boundary requiring an explicit follow-up Yes/No decision for baseline grants.';

commit;
