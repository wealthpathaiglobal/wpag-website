begin;

-- Sprint 29: governed participant-request intake and routing only.
-- This migration does not determine legal entitlement, response deadlines,
-- jurisdiction, retention periods, release authority, Pilot, or Production.

create table public.research_participant_request_details (
  request_event_id uuid primary key references public.research_control_audit_events(id) on update cascade on delete restrict,
  details text not null check (nullif(btrim(details),'') is not null and length(details)<=4000),
  created_at timestamptz not null default clock_timestamp()
);
alter table public.research_participant_request_details enable row level security;
alter table public.research_participant_request_details force row level security;
revoke all on public.research_participant_request_details from public,anon,authenticated,service_role;
create trigger research_participant_request_details_immutable before update or delete on public.research_participant_request_details for each row execute function public.prevent_research_control_mutation();

create function public.submit_research_participant_request(
  p_enrollment_id uuid,
  p_actor_user_id uuid,
  p_request_type text,
  p_details text,
  p_correlation_id uuid
)
returns table(request_event_id uuid,request_status text,routing_class text)
language plpgsql security definer set search_path=public,pg_catalog as $$
declare
  v_enrollment public.research_enrollments%rowtype;
  v_identity public.participant_research_identities%rowtype;
  v_participant_auth uuid;
  v_route text;
  v_event_id uuid;
  v_now timestamptz:=clock_timestamp();
begin
  if p_request_type not in ('ACCESS_REQUEST','CORRECTION_REQUEST','PRIVACY_QUESTION','COMPLAINT_INCIDENT')
     or nullif(btrim(p_details),'') is null or length(p_details)>4000 then
    raise exception using errcode='P1001',message='Participant research request is invalid.';
  end if;
  select * into v_enrollment from public.research_enrollments where id=p_enrollment_id;
  if not found then raise exception using errcode='P1001',message='Participant research request context is invalid.'; end if;
  select * into v_identity from public.participant_research_identities where id=v_enrollment.participant_research_identity_id;
  select auth_user_id into v_participant_auth from public.participants where id=v_identity.participant_id;
  if p_actor_user_id is distinct from v_participant_auth then
    raise exception using errcode='P1001',message='Actor is not authorized to submit this research request.';
  end if;
  v_route:=case p_request_type
    when 'ACCESS_REQUEST' then 'PRIVACY_OPERATIONS'
    when 'CORRECTION_REQUEST' then 'EVIDENCE_CORRECTION'
    when 'PRIVACY_QUESTION' then 'PRIVACY_OPERATIONS'
    else 'INCIDENT_OPERATIONS'
  end;
  insert into public.research_control_audit_events(
    participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,
    authority_versions,reason_code,occurred_at,correlation_id,metadata
  ) values(
    v_identity.id,p_enrollment_id,'PARTICIPANT_REQUEST_RECEIVED','PARTICIPANT',p_actor_user_id,
    jsonb_build_object('privacy','HFOS_Research_Privacy_and_Data_Governance_Authority_v0.1','incident','HFOS_Research_Incident_and_Error_Handling_Authority_v0.2'),
    p_request_type,v_now,p_correlation_id,
    jsonb_build_object('request_type',p_request_type,'request_status','RECEIVED','routing_class',v_route,'detail_access_class','RESTRICTED_ADMIN','legal_entitlement_status','UNRESOLVED','legal_deadline_status','NOT_AUTHORIZED')
  ) returning id into v_event_id;
  insert into public.research_participant_request_details(request_event_id,details) values(v_event_id,btrim(p_details));
  return query select v_event_id,'RECEIVED'::text,v_route;
exception when sqlstate 'P1001' then raise;
  when others then raise exception using errcode='P1002',message='Participant research request could not be recorded.';
end $$;

create function public.route_research_participant_request(
  p_request_event_id uuid,
  p_actor_user_id uuid,
  p_target_status text,
  p_routing_class text,
  p_internal_note text,
  p_correlation_id uuid
)
returns table(routing_event_id uuid,request_status text)
language plpgsql security definer set search_path=public,pg_catalog as $$
declare
  v_request public.research_control_audit_events%rowtype;
  v_latest_status text;
  v_event_id uuid;
  v_allowed boolean:=false;
  v_now timestamptz:=clock_timestamp();
begin
  if not public.is_active_research_administrator(p_actor_user_id) then
    raise exception using errcode='P1001',message='Actor is not authorized to route participant research requests.';
  end if;
  if p_target_status not in ('ROUTED','IN_REVIEW','COMPLETED','ESCALATED')
     or p_routing_class not in ('PRIVACY_OPERATIONS','EVIDENCE_CORRECTION','WITHDRAWAL_OPERATIONS','INCIDENT_OPERATIONS')
     or p_internal_note !~ '^[A-Z][A-Z0-9_]{2,79}$' then
    raise exception using errcode='P1001',message='Participant research request routing is invalid.';
  end if;
  select * into v_request from public.research_control_audit_events
  where id=p_request_event_id and event_type='PARTICIPANT_REQUEST_RECEIVED' for update;
  if not found then raise exception using errcode='P1001',message='Participant research request was not found.'; end if;
  select coalesce(e.metadata->>'request_status','RECEIVED') into v_latest_status
  from public.research_control_audit_events e
  where e.id=p_request_event_id or e.metadata->>'request_event_id'=p_request_event_id::text
  order by e.recorded_at desc,e.id desc limit 1;
  v_allowed := (v_latest_status='RECEIVED' and p_target_status in ('ROUTED','ESCALATED'))
    or (v_latest_status='ROUTED' and p_target_status in ('IN_REVIEW','COMPLETED','ESCALATED'))
    or (v_latest_status='IN_REVIEW' and p_target_status in ('COMPLETED','ESCALATED'))
    or (v_latest_status='ESCALATED' and p_target_status in ('IN_REVIEW','COMPLETED'));
  if not v_allowed then raise exception using errcode='P1001',message='Participant research request transition is not allowed.'; end if;
  insert into public.research_control_audit_events(
    participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,
    authority_versions,reason_code,occurred_at,correlation_id,metadata
  ) values(
    v_request.participant_research_identity_id,v_request.enrollment_id,'PARTICIPANT_REQUEST_'||p_target_status,'ADMIN',p_actor_user_id,
    v_request.authority_versions,p_target_status,v_now,p_correlation_id,
    jsonb_build_object('request_event_id',p_request_event_id,'request_type',v_request.metadata->>'request_type','request_status',p_target_status,'routing_class',p_routing_class,'routing_reason_code',p_internal_note,'legal_entitlement_status','UNRESOLVED','legal_deadline_status','NOT_AUTHORIZED')
  ) returning id into v_event_id;
  return query select v_event_id,p_target_status;
exception when sqlstate 'P1001' then raise;
  when others then raise exception using errcode='P1002',message='Participant research request routing could not be completed.';
end $$;

create function public.list_participant_research_requests(p_participant_id uuid,p_actor_user_id uuid)
returns table(request_event_id uuid,request_type text,request_status text,submitted_at timestamptz)
language plpgsql stable security definer set search_path=public,pg_catalog as $$
declare v_auth uuid;
begin
  select auth_user_id into v_auth from public.participants where id=p_participant_id;
  if p_actor_user_id is distinct from v_auth then raise exception using errcode='P1001',message='Actor is not authorized to access participant research requests.'; end if;
  return query
  select r.id,r.metadata->>'request_type',coalesce(latest.metadata->>'request_status','RECEIVED'),r.recorded_at
  from public.research_control_audit_events r
  join public.participant_research_identities i on i.id=r.participant_research_identity_id and i.participant_id=p_participant_id
  left join lateral (
    select e.metadata from public.research_control_audit_events e
    where e.id=r.id or e.metadata->>'request_event_id'=r.id::text
    order by e.recorded_at desc,e.id desc limit 1
  ) latest on true
  where r.event_type='PARTICIPANT_REQUEST_RECEIVED'
  order by r.recorded_at desc,r.id desc;
end $$;

create function public.list_admin_research_requests(p_participant_id uuid,p_actor_user_id uuid)
returns table(request_event_id uuid,request_type text,request_status text,routing_class text,details text,submitted_at timestamptz)
language plpgsql stable security definer set search_path=public,pg_catalog as $$
begin
  if not public.is_active_research_administrator(p_actor_user_id) then raise exception using errcode='P1001',message='Actor is not authorized to access participant research requests.'; end if;
  return query
  select r.id,r.metadata->>'request_type',coalesce(latest.metadata->>'request_status','RECEIVED'),coalesce(latest.metadata->>'routing_class',r.metadata->>'routing_class'),d.details,r.recorded_at
  from public.research_control_audit_events r
  join public.participant_research_identities i on i.id=r.participant_research_identity_id and i.participant_id=p_participant_id
  join public.research_participant_request_details d on d.request_event_id=r.id
  left join lateral (
    select e.metadata from public.research_control_audit_events e
    where e.id=r.id or e.metadata->>'request_event_id'=r.id::text
    order by e.recorded_at desc,e.id desc limit 1
  ) latest on true
  where r.event_type='PARTICIPANT_REQUEST_RECEIVED'
  order by r.recorded_at desc,r.id desc;
end $$;

alter function public.submit_research_participant_request(uuid,uuid,text,text,uuid) owner to postgres;
alter function public.route_research_participant_request(uuid,uuid,text,text,text,uuid) owner to postgres;
alter function public.list_participant_research_requests(uuid,uuid) owner to postgres;
alter function public.list_admin_research_requests(uuid,uuid) owner to postgres;

revoke all on function public.submit_research_participant_request(uuid,uuid,text,text,uuid),public.route_research_participant_request(uuid,uuid,text,text,text,uuid),public.list_participant_research_requests(uuid,uuid),public.list_admin_research_requests(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.submit_research_participant_request(uuid,uuid,text,text,uuid),public.route_research_participant_request(uuid,uuid,text,text,text,uuid),public.list_participant_research_requests(uuid,uuid),public.list_admin_research_requests(uuid,uuid) to service_role;

commit;
