begin;

-- Additive participant-safe receipt projection. Historical consent and explicit
-- follow-up decision records remain unchanged; no legacy classification occurs.

drop function public.get_participant_research_journey(uuid,uuid);

create function public.get_participant_research_journey(p_participant_id uuid,p_actor_user_id uuid)
returns table(
  research_id text,enrollment_id uuid,lifecycle_status text,consent_status text,withdrawal_status text,
  consent_gate text,privacy_gate text,wave1_gate text,baseline_snapshot_status text,evidence_version_count bigint,
  follow_up_records jsonb,consent_artifact_version text,consent_artifact_sha256 text,consent_wording_review_status text,
  consent_presentation_event_id uuid,consent_presented_at timestamptz,consent_authority_version text,privacy_authority_version text,
  consent_action_available boolean,participant_output_scope text,fsh_output_status text,soft_launch_release_gate text,
  consent_receipt_available boolean,consent_baseline_scope_status text,consent_follow_up_scope_status text,
  consent_decided_at timestamptz,consent_information_version text
)
language plpgsql stable security definer set search_path=public,pg_catalog as $$
declare
  s record;
  current_consent public.research_consent_records%rowtype;
  presentation public.research_consent_presentation_events%rowtype;
  approval public.research_consent_presentation_approval_events%rowtype;
  binding public.research_consent_decision_bindings%rowtype;
  explicit_follow_up public.research_follow_up_scope_decision_events%rowtype;
  snapshot_status text;
  evidence_count bigint;
  followups jsonb;
  receipt_available boolean:=false;
  baseline_scope_status text;
  follow_up_scope_status text;
begin
  select * into s from public.get_research_controls_status(p_participant_id,p_actor_user_id,'FSH');
  if not found then return; end if;
  select c.* into current_consent from public.research_consent_records c where c.enrollment_id=s.enrollment_id order by c.recorded_at desc,c.id desc limit 1;
  if current_consent.consent_status='PRESENTED' then
    select p.* into presentation from public.research_consent_presentation_events p where p.presentation_consent_id=current_consent.id;
  else
    select d.* into binding
    from public.research_consent_decision_bindings d
    where d.decision_consent_id=current_consent.id;
    select p.* into presentation
    from public.research_consent_presentation_events p
    where p.id=binding.presentation_event_id;
  end if;
  select a.* into approval from public.research_consent_presentation_approval_events a where a.id=presentation.approval_event_id;
  select concat_ws(' / ',x.snapshot_status,x.completeness_status,x.currentness_status) into snapshot_status from public.research_snapshots x where x.enrollment_id=s.enrollment_id and x.snapshot_kind='BASELINE' order by x.frozen_at desc,x.id desc limit 1;
  select count(*) into evidence_count from public.research_evidence_versions v join public.research_evidence_items i on i.id=v.evidence_item_id where i.enrollment_id=s.enrollment_id;
  select coalesce(jsonb_agg(z.item order by z.sequence_number desc),'[]') into followups from (
    select f.sequence_number,jsonb_build_object('sequence_number',f.sequence_number,'family',f.research_family,'status',f.follow_up_status,'created_at',f.created_at) item
    from public.research_follow_up_records f where f.enrollment_id=s.enrollment_id order by f.sequence_number desc limit 25
  ) z;

  receipt_available:=current_consent.consent_status in ('GRANTED','DECLINED');
  if receipt_available then
    baseline_scope_status:=case when current_consent.consent_status='GRANTED' and 'BASELINE_RESEARCH'=any(current_consent.evidence_use_scope) then 'GRANTED' else 'NOT_GRANTED' end;
    if current_consent.consent_status='DECLINED' then
      follow_up_scope_status:='NOT_APPLICABLE';
    else
      select f.* into explicit_follow_up from public.research_follow_up_scope_decision_events f where f.decision_consent_id=current_consent.id;
      follow_up_scope_status:=case explicit_follow_up.follow_up_scope_decision
        when 'EXPLICITLY_GRANTED' then 'GRANTED'
        when 'EXPLICITLY_DECLINED' then 'NOT_GRANTED'
        else 'LEGACY_UNRESOLVED'
      end;
    end if;
  end if;

  return query select s.research_id,s.enrollment_id,s.lifecycle_status,s.consent_status,s.withdrawal_status,s.consent_gate,s.privacy_gate,s.wave1_gate,
    coalesce(snapshot_status,'NOT_AVAILABLE'),evidence_count,followups,presentation.artifact_version,presentation.artifact_sha256,approval.decision,
    presentation.id,presentation.presented_at,presentation.consent_authority_version,presentation.privacy_authority_version,
    s.consent_status='PRESENTED' and presentation.id is not null,coalesce((select x.participant_output_scope from public.research_consent_presentation_artifacts x where x.id=presentation.artifact_id),'FACTUAL_STATUS_ONLY'),'SUPPRESSED'::text,'BLOCKED'::text,
    receipt_available,baseline_scope_status,follow_up_scope_status,binding.decided_at,
    coalesce(binding.artifact_version,current_consent.consent_content_version);
end $$;

alter function public.get_participant_research_journey(uuid,uuid) owner to postgres;
revoke all on function public.get_participant_research_journey(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.get_participant_research_journey(uuid,uuid) to service_role;

comment on function public.get_participant_research_journey(uuid,uuid) is
  'Participant-isolated factual research status and durable consent receipt projection. Internal identifiers, hashes, actors, correlation, acknowledgement payloads, and processing timestamps are excluded from the receipt.';

commit;
