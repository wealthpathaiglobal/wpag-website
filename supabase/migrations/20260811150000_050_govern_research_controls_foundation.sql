begin;

-- Sprint 24 / Wave 1: research identity, pre-enrollment, consent, privacy,
-- withdrawal, audit, and release-suppression foundation. This migration is
-- additive and does not activate enrollment or evidence collection.

create sequence public.participant_research_code_seq start with 1;

create table public.participant_research_identities (
    id uuid primary key default gen_random_uuid(),
    research_id text not null unique default (
        'HFOS-RID-' || lpad(nextval('public.participant_research_code_seq')::text, 8, '0')
    ),
    participant_id uuid not null unique references public.participants(id) on update cascade on delete restrict,
    linkage_status text not null default 'ACTIVE' check (linkage_status in ('ACTIVE','RESTRICTED','CLOSED')),
    lifecycle_authority_version text not null,
    created_by uuid not null references auth.users(id) on update cascade on delete restrict,
    created_at timestamptz not null default clock_timestamp(),
    correlation_id uuid not null default gen_random_uuid(),
    constraint participant_research_identities_code_check check (research_id ~ '^HFOS-RID-[0-9]{8,}$'),
    constraint participant_research_identities_authority_check check (btrim(lifecycle_authority_version) <> '')
);

create table public.research_enrollments (
    id uuid primary key default gen_random_uuid(),
    participant_research_identity_id uuid not null references public.participant_research_identities(id) on update cascade on delete restrict,
    predecessor_enrollment_id uuid references public.research_enrollments(id) on update cascade on delete restrict,
    research_scope text not null,
    research_purpose_id text not null,
    protocol_version text not null,
    consent_authority_version text not null,
    privacy_authority_version text not null,
    lifecycle_authority_version text not null,
    evidence_schema_authority_version text not null,
    environment text not null default 'synthetic_development' check (environment in ('synthetic_development','synthetic_test')),
    activation_authority_status text not null default 'BLOCKED' check (activation_authority_status in ('BLOCKED','UNRESOLVED')),
    created_by uuid not null references auth.users(id) on update cascade on delete restrict,
    created_at timestamptz not null default clock_timestamp(),
    correlation_id uuid not null default gen_random_uuid(),
    constraint research_enrollments_predecessor_check check (predecessor_enrollment_id is null or predecessor_enrollment_id <> id),
    constraint research_enrollments_text_check check (
        btrim(research_scope) <> '' and btrim(research_purpose_id) <> '' and
        btrim(protocol_version) <> '' and btrim(consent_authority_version) <> '' and
        btrim(privacy_authority_version) <> '' and btrim(lifecycle_authority_version) <> '' and
        btrim(evidence_schema_authority_version) <> ''
    )
);

create unique index research_enrollments_one_open_episode
    on public.research_enrollments(participant_research_identity_id)
    where predecessor_enrollment_id is null;

create table public.research_enrollment_status_history (
    id uuid primary key default gen_random_uuid(),
    enrollment_id uuid not null references public.research_enrollments(id) on update cascade on delete restrict,
    predecessor_status_event_id uuid references public.research_enrollment_status_history(id) on update cascade on delete restrict,
    lifecycle_status text not null check (lifecycle_status in (
        'PRE_ENROLLMENT','ELIGIBILITY_READY','CONSENT_PENDING','PRIVACY_PENDING','ENROLLMENT_READY',
        'ENROLLED','BASELINE_PENDING','BASELINE_IN_PROGRESS','BASELINE_COMPLETE','ACTIVE_RESEARCH',
        'FOLLOWUP_PENDING','FOLLOWUP_ACTIVE','FOLLOWUP_COMPLETE','PAUSED','RESTRICTED',
        'RECONSENT_REQUIRED','WITHDRAWAL_REQUESTED','WITHDRAWN','COMPLETED','CLOSED','REVIEW_REQUIRED'
    )),
    reason_code text not null,
    effective_at timestamptz not null,
    occurred_at timestamptz not null,
    recorded_at timestamptz not null default clock_timestamp(),
    actor_user_id uuid not null references auth.users(id) on update cascade on delete restrict,
    correlation_id uuid not null,
    metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
    constraint research_enrollment_status_predecessor_check check (predecessor_status_event_id is null or predecessor_status_event_id <> id),
    constraint research_enrollment_status_time_check check (occurred_at <= recorded_at and effective_at <= recorded_at),
    constraint research_enrollment_status_reason_check check (btrim(reason_code) <> '')
);

create unique index research_enrollment_status_successor_unique
    on public.research_enrollment_status_history(predecessor_status_event_id)
    where predecessor_status_event_id is not null;

create table public.research_consent_records (
    id uuid primary key default gen_random_uuid(),
    enrollment_id uuid not null references public.research_enrollments(id) on update cascade on delete restrict,
    predecessor_consent_id uuid references public.research_consent_records(id) on update cascade on delete restrict,
    legacy_consent_id uuid references public.consents(id) on update cascade on delete restrict,
    consent_status text not null check (consent_status in (
        'NOT_PRESENTED','PRESENTED','GRANTED','DECLINED','RECONSENT_REQUIRED','WITHDRAWN','SUPERSEDED'
    )),
    consent_content_version text not null,
    consent_content_sha256 text,
    protocol_research_plan_version text not null,
    family_plan_versions jsonb not null default '{}'::jsonb check (jsonb_typeof(family_plan_versions) = 'object'),
    granted_family_scope text[] not null default '{}'::text[],
    evidence_use_scope text[] not null default '{}'::text[],
    follow_up_scope_granted boolean not null default false,
    prohibited_scope text[] not null default array['PARTICIPANT_OUTPUT','ADVICE','PILOT','PRODUCTION']::text[],
    locale_language_version text not null,
    source_interface text not null,
    acknowledgement_record jsonb not null default '{}'::jsonb check (jsonb_typeof(acknowledgement_record) = 'object'),
    reconsent_requirement text not null default 'NONE' check (reconsent_requirement in ('NONE','REQUIRED','SATISFIED_BY_SUCCESSOR','NOT_APPLICABLE')),
    decision_actor_user_id uuid references auth.users(id) on update cascade on delete restrict,
    effective_at timestamptz,
    occurred_at timestamptz not null,
    recorded_at timestamptz not null default clock_timestamp(),
    correlation_id uuid not null,
    constraint research_consent_predecessor_check check (predecessor_consent_id is null or predecessor_consent_id <> id),
    constraint research_consent_hash_check check (consent_content_sha256 is null or consent_content_sha256 ~ '^[0-9a-f]{64}$'),
    constraint research_consent_versions_check check (
        btrim(consent_content_version) <> '' and btrim(protocol_research_plan_version) <> '' and
        btrim(locale_language_version) <> '' and btrim(source_interface) <> ''
    ),
    constraint research_consent_family_scope_check check (
        granted_family_scope <@ array['FSH','MGN','RUNWAY','STRESS']::text[]
    ),
    constraint research_consent_state_payload_check check (
        (consent_status = 'GRANTED' and decision_actor_user_id is not null and effective_at is not null and
         consent_content_sha256 is not null and cardinality(granted_family_scope) > 0 and acknowledgement_record <> '{}'::jsonb)
        or (consent_status in ('PRESENTED','DECLINED') and consent_content_sha256 is not null and effective_at is null)
        or (consent_status = 'RECONSENT_REQUIRED' and reconsent_requirement = 'REQUIRED' and effective_at is null)
        or (consent_status in ('NOT_PRESENTED','WITHDRAWN','SUPERSEDED') and effective_at is null)
    ),
    constraint research_consent_time_check check (occurred_at <= recorded_at and (effective_at is null or effective_at <= recorded_at))
);

create unique index research_consent_successor_unique
    on public.research_consent_records(predecessor_consent_id)
    where predecessor_consent_id is not null;

create table public.research_privacy_bindings (
    id uuid primary key default gen_random_uuid(),
    enrollment_id uuid not null references public.research_enrollments(id) on update cascade on delete restrict,
    predecessor_privacy_binding_id uuid references public.research_privacy_bindings(id) on update cascade on delete restrict,
    privacy_authority_version text not null,
    purpose_id text not null,
    data_classes text[] not null,
    sensitivity_classification text not null check (sensitivity_classification in ('STANDARD_RESTRICTED','ENHANCED_RESTRICTED','NOT_APPLICABLE','UNRESOLVED')),
    access_class text not null check (access_class in ('PARTICIPANT_OWN','RESTRICTED_ADMIN','RESTRICTED_RESEARCH','AUDIT_ONLY','UNRESOLVED')),
    use_restriction text not null check (use_restriction in ('PURPOSE_SCOPED','USE_BLOCKED','REVIEW_REQUIRED')),
    retention_class text not null check (retention_class in ('RC-01','RC-02','RC-03','RC-04','RC-05','RC-06')),
    canonical_disposition text not null check (canonical_disposition in (
        'ACTIVE_RETAIN','USE_RESTRICTED','DELETE_WHEN_AUTHORIZED','DEIDENTIFY_WHEN_VALID',
        'AGGREGATE_WHEN_VALID','PRESERVE_MINIMUM_AUDIT','REVIEW_REQUIRED'
    )),
    sharing_status text not null check (sharing_status in ('NO_EXTERNAL_SHARING','SEPARATE_AUTHORITY_REQUIRED','NOT_AUTHORIZED')),
    export_status text not null check (export_status in ('NOT_AUTHORIZED','BLOCKED','SEPARATE_AUTHORITY_REQUIRED')),
    legal_review_dependency text not null check (legal_review_dependency in ('NONE','REQUIRED','UNRESOLVED')),
    identity_linkage_valid boolean not null,
    consent_scope_compatible boolean not null,
    environment_authorized boolean not null,
    sensitive_controls_satisfied boolean not null,
    restriction_active boolean not null,
    incident_block_active boolean not null,
    occurred_at timestamptz not null,
    recorded_at timestamptz not null default clock_timestamp(),
    actor_user_id uuid not null references auth.users(id) on update cascade on delete restrict,
    correlation_id uuid not null,
    constraint research_privacy_predecessor_check check (predecessor_privacy_binding_id is null or predecessor_privacy_binding_id <> id),
    constraint research_privacy_text_check check (btrim(privacy_authority_version) <> '' and btrim(purpose_id) <> '' and cardinality(data_classes) > 0),
    constraint research_privacy_data_class_check check (data_classes <@ array[
        'DIRECT_IDENTITY','RESEARCH_IDENTITY','FINANCIAL_EVIDENCE','DERIVED_HFOS_OUTPUT','RESEARCH_EVENT',
        'ADJUDICATED_OUTCOME','CONSENT_WITHDRAWAL','AUDIT_PROVENANCE','SENSITIVE_SUPPORTING','AGGREGATE_DEIDENTIFIED'
    ]::text[]),
    constraint research_privacy_time_check check (occurred_at <= recorded_at)
);

create unique index research_privacy_successor_unique
    on public.research_privacy_bindings(predecessor_privacy_binding_id)
    where predecessor_privacy_binding_id is not null;

create table public.research_withdrawal_records (
    id uuid primary key default gen_random_uuid(),
    enrollment_id uuid not null references public.research_enrollments(id) on update cascade on delete restrict,
    predecessor_withdrawal_id uuid references public.research_withdrawal_records(id) on update cascade on delete restrict,
    withdrawal_status text not null check (withdrawal_status in (
        'NONE','REQUESTED','VERIFIED','EFFECTIVE','PROCESSING','COMPLETED','EXCEPTION_REVIEW_REQUIRED'
    )),
    asserted_scope text[] not null default array['ALL_RESEARCH']::text[],
    request_channel text not null,
    reason text,
    received_at timestamptz,
    verified_at timestamptz,
    effective_at timestamptz,
    processed_at timestamptz,
    completed_at timestamptz,
    actor_user_id uuid not null references auth.users(id) on update cascade on delete restrict,
    occurred_at timestamptz not null,
    recorded_at timestamptz not null default clock_timestamp(),
    correlation_id uuid not null,
    constraint research_withdrawal_predecessor_check check (predecessor_withdrawal_id is null or predecessor_withdrawal_id <> id),
    constraint research_withdrawal_scope_check check (cardinality(asserted_scope) > 0),
    constraint research_withdrawal_payload_check check (
        (withdrawal_status = 'NONE' and received_at is null and verified_at is null and effective_at is null and processed_at is null and completed_at is null)
        or (withdrawal_status = 'REQUESTED' and received_at is not null)
        or (withdrawal_status = 'VERIFIED' and received_at is not null and verified_at is not null)
        or (withdrawal_status = 'EFFECTIVE' and received_at is not null and verified_at is not null and effective_at is not null)
        or (withdrawal_status = 'PROCESSING' and received_at is not null and effective_at is not null and processed_at is not null)
        or (withdrawal_status = 'COMPLETED' and received_at is not null and effective_at is not null and completed_at is not null)
        or (withdrawal_status = 'EXCEPTION_REVIEW_REQUIRED' and received_at is not null and reason is not null)
    ),
    constraint research_withdrawal_time_check check (occurred_at <= recorded_at)
);

create unique index research_withdrawal_successor_unique
    on public.research_withdrawal_records(predecessor_withdrawal_id)
    where predecessor_withdrawal_id is not null;

create table public.research_control_audit_events (
    id uuid primary key default gen_random_uuid(),
    participant_research_identity_id uuid references public.participant_research_identities(id) on update cascade on delete restrict,
    enrollment_id uuid references public.research_enrollments(id) on update cascade on delete restrict,
    event_type text not null,
    actor_type text not null check (actor_type in ('PARTICIPANT','ADMIN','SYSTEM')),
    actor_user_id uuid references auth.users(id) on update cascade on delete restrict,
    authority_versions jsonb not null default '{}'::jsonb check (jsonb_typeof(authority_versions) = 'object'),
    reason_code text not null,
    occurred_at timestamptz not null,
    recorded_at timestamptz not null default clock_timestamp(),
    correlation_id uuid not null,
    metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
    constraint research_control_audit_event_check check (btrim(event_type) <> '' and btrim(reason_code) <> ''),
    constraint research_control_audit_time_check check (occurred_at <= recorded_at)
);

create table public.research_release_firewall (
    environment text primary key check (environment in ('synthetic_development','synthetic_test','controlled_research','pilot','production')),
    actual_enrollment_status text not null check (actual_enrollment_status in ('BLOCKED','NOT_AUTHORIZED')),
    evidence_collection_status text not null check (evidence_collection_status in ('BLOCKED','NOT_AUTHORIZED')),
    pilot_status text not null check (pilot_status = 'NOT_AUTHORIZED'),
    production_status text not null check (production_status = 'NOT_AUTHORIZED'),
    authority_version text not null,
    created_at timestamptz not null default clock_timestamp()
);

insert into public.research_release_firewall(environment,actual_enrollment_status,evidence_collection_status,pilot_status,production_status,authority_version)
values
 ('synthetic_development','BLOCKED','BLOCKED','NOT_AUTHORIZED','NOT_AUTHORIZED','HFOS-FORR-v1.0'),
 ('synthetic_test','BLOCKED','BLOCKED','NOT_AUTHORIZED','NOT_AUTHORIZED','HFOS-FORR-v1.0'),
 ('controlled_research','NOT_AUTHORIZED','NOT_AUTHORIZED','NOT_AUTHORIZED','NOT_AUTHORIZED','HFOS-FORR-v1.0'),
 ('pilot','NOT_AUTHORIZED','NOT_AUTHORIZED','NOT_AUTHORIZED','NOT_AUTHORIZED','HFOS-FORR-v1.0'),
 ('production','NOT_AUTHORIZED','NOT_AUTHORIZED','NOT_AUTHORIZED','NOT_AUTHORIZED','HFOS-FORR-v1.0');

create index research_enrollments_identity_idx on public.research_enrollments(participant_research_identity_id,created_at desc);
create index research_enrollment_status_current_idx on public.research_enrollment_status_history(enrollment_id,recorded_at desc,id desc);
create index research_consent_current_idx on public.research_consent_records(enrollment_id,recorded_at desc,id desc);
create index research_privacy_current_idx on public.research_privacy_bindings(enrollment_id,recorded_at desc,id desc);
create index research_withdrawal_current_idx on public.research_withdrawal_records(enrollment_id,recorded_at desc,id desc);
create index research_control_audit_enrollment_idx on public.research_control_audit_events(enrollment_id,recorded_at desc,id desc);

alter table public.participant_research_identities enable row level security;
alter table public.participant_research_identities force row level security;
alter table public.research_enrollments enable row level security;
alter table public.research_enrollments force row level security;
alter table public.research_enrollment_status_history enable row level security;
alter table public.research_enrollment_status_history force row level security;
alter table public.research_consent_records enable row level security;
alter table public.research_consent_records force row level security;
alter table public.research_privacy_bindings enable row level security;
alter table public.research_privacy_bindings force row level security;
alter table public.research_withdrawal_records enable row level security;
alter table public.research_withdrawal_records force row level security;
alter table public.research_control_audit_events enable row level security;
alter table public.research_control_audit_events force row level security;
alter table public.research_release_firewall enable row level security;
alter table public.research_release_firewall force row level security;

create function public.prevent_research_control_mutation()
returns trigger language plpgsql set search_path = public, pg_catalog as $$
begin
    raise exception using errcode='P1001', message='Research control history is append-only.';
end;
$$;

create trigger research_identity_immutable before update or delete on public.participant_research_identities for each row execute function public.prevent_research_control_mutation();
create trigger research_enrollment_immutable before update or delete on public.research_enrollments for each row execute function public.prevent_research_control_mutation();
create trigger research_enrollment_status_immutable before update or delete on public.research_enrollment_status_history for each row execute function public.prevent_research_control_mutation();
create trigger research_consent_immutable before update or delete on public.research_consent_records for each row execute function public.prevent_research_control_mutation();
create trigger research_privacy_immutable before update or delete on public.research_privacy_bindings for each row execute function public.prevent_research_control_mutation();
create trigger research_withdrawal_immutable before update or delete on public.research_withdrawal_records for each row execute function public.prevent_research_control_mutation();
create trigger research_control_audit_immutable before update or delete on public.research_control_audit_events for each row execute function public.prevent_research_control_mutation();
create trigger research_release_firewall_immutable before update or delete on public.research_release_firewall for each row execute function public.prevent_research_control_mutation();

create function public.is_active_research_administrator(p_actor_user_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_catalog as $$
    select public.has_any_role(p_actor_user_id,array['administrator','research_coordinator']);
$$;

create function public.create_or_get_participant_research_identity(
    p_participant_id uuid,p_actor_user_id uuid,p_lifecycle_authority_version text,p_correlation_id uuid
)
returns table(research_identity_id uuid,research_id text,participant_id uuid,linkage_status text,created_at timestamptz)
language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_identity public.participant_research_identities%rowtype; v_now timestamptz:=clock_timestamp();
begin
    if not public.is_active_research_administrator(p_actor_user_id) then raise exception using errcode='P1001',message='Actor is not authorized to govern research identity.'; end if;
    if nullif(btrim(p_lifecycle_authority_version),'') is null or p_correlation_id is null then raise exception using errcode='P1001',message='Research identity authority binding is invalid.'; end if;
    if not exists(select 1 from public.participants p where p.id=p_participant_id and p.deleted_at is null and p.auth_user_id is not null) then raise exception using errcode='P1001',message='Participant is not eligible for research identity linkage.'; end if;
    select * into v_identity from public.participant_research_identities where participant_research_identities.participant_id=p_participant_id;
    if not found then
      insert into public.participant_research_identities(participant_id,lifecycle_authority_version,created_by,created_at,correlation_id)
      values(p_participant_id,btrim(p_lifecycle_authority_version),p_actor_user_id,v_now,p_correlation_id) returning * into v_identity;
      insert into public.research_control_audit_events(participant_research_identity_id,event_type,actor_type,actor_user_id,authority_versions,reason_code,occurred_at,correlation_id)
      values(v_identity.id,'RESEARCH_IDENTITY_LINKED','ADMIN',p_actor_user_id,jsonb_build_object('lifecycle',p_lifecycle_authority_version),'IDENTITY_CREATED',v_now,p_correlation_id);
    end if;
    return query select v_identity.id,v_identity.research_id,v_identity.participant_id,v_identity.linkage_status,v_identity.created_at;
exception when sqlstate 'P1001' then raise; when others then raise exception using errcode='P1002',message='Research identity operation could not be completed.';
end;
$$;

create function public.create_or_get_research_enrollment(
    p_participant_id uuid,p_actor_user_id uuid,p_research_scope text,p_research_purpose_id text,p_protocol_version text,
    p_consent_authority_version text,p_privacy_authority_version text,p_lifecycle_authority_version text,
    p_evidence_schema_authority_version text,p_environment text,p_correlation_id uuid
)
returns table(enrollment_id uuid,research_identity_id uuid,research_id text,lifecycle_status text,activation_status text,created_at timestamptz)
language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_identity record; v_enrollment public.research_enrollments%rowtype; v_now timestamptz:=clock_timestamp();
begin
    if not public.is_active_research_administrator(p_actor_user_id) then raise exception using errcode='P1001',message='Actor is not authorized to govern research enrollment.'; end if;
    if p_environment not in ('synthetic_development','synthetic_test') or p_correlation_id is null or
       nullif(btrim(p_research_scope),'') is null or nullif(btrim(p_research_purpose_id),'') is null or nullif(btrim(p_protocol_version),'') is null or
       nullif(btrim(p_consent_authority_version),'') is null or nullif(btrim(p_privacy_authority_version),'') is null or
       nullif(btrim(p_lifecycle_authority_version),'') is null or nullif(btrim(p_evidence_schema_authority_version),'') is null
    then raise exception using errcode='P1001',message='Research enrollment authority binding is invalid.'; end if;
    select * into v_identity from public.create_or_get_participant_research_identity(p_participant_id,p_actor_user_id,p_lifecycle_authority_version,p_correlation_id);
    select * into v_enrollment from public.research_enrollments where participant_research_identity_id=v_identity.research_identity_id and predecessor_enrollment_id is null order by created_at desc limit 1;
    if not found then
      insert into public.research_enrollments(participant_research_identity_id,research_scope,research_purpose_id,protocol_version,consent_authority_version,privacy_authority_version,lifecycle_authority_version,evidence_schema_authority_version,environment,created_by,created_at,correlation_id)
      values(v_identity.research_identity_id,btrim(p_research_scope),btrim(p_research_purpose_id),btrim(p_protocol_version),btrim(p_consent_authority_version),btrim(p_privacy_authority_version),btrim(p_lifecycle_authority_version),btrim(p_evidence_schema_authority_version),p_environment,p_actor_user_id,v_now,p_correlation_id) returning * into v_enrollment;
      insert into public.research_enrollment_status_history(enrollment_id,lifecycle_status,reason_code,effective_at,occurred_at,actor_user_id,correlation_id)
      values(v_enrollment.id,'PRE_ENROLLMENT','WAVE1_FOUNDATION_CREATED',v_now,v_now,p_actor_user_id,p_correlation_id);
      insert into public.research_consent_records(enrollment_id,consent_status,consent_content_version,protocol_research_plan_version,locale_language_version,source_interface,reconsent_requirement,occurred_at,correlation_id)
      values(v_enrollment.id,'NOT_PRESENTED','NOT_APPROVED',p_protocol_version,'NOT_APPROVED','INTERNAL_FOUNDATION','NOT_APPLICABLE',v_now,p_correlation_id);
      insert into public.research_privacy_bindings(enrollment_id,privacy_authority_version,purpose_id,data_classes,sensitivity_classification,access_class,use_restriction,retention_class,canonical_disposition,sharing_status,export_status,legal_review_dependency,identity_linkage_valid,consent_scope_compatible,environment_authorized,sensitive_controls_satisfied,restriction_active,incident_block_active,occurred_at,actor_user_id,correlation_id)
      values(v_enrollment.id,p_privacy_authority_version,p_research_purpose_id,array['RESEARCH_IDENTITY','CONSENT_WITHDRAWAL','AUDIT_PROVENANCE'],'UNRESOLVED','UNRESOLVED','REVIEW_REQUIRED','RC-06','REVIEW_REQUIRED','NOT_AUTHORIZED','NOT_AUTHORIZED','UNRESOLVED',true,false,true,false,true,false,v_now,p_actor_user_id,p_correlation_id);
      insert into public.research_withdrawal_records(enrollment_id,withdrawal_status,request_channel,actor_user_id,occurred_at,correlation_id)
      values(v_enrollment.id,'NONE','SYSTEM_INITIALIZATION',p_actor_user_id,v_now,p_correlation_id);
      insert into public.research_control_audit_events(participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,authority_versions,reason_code,occurred_at,correlation_id)
      values(v_enrollment.participant_research_identity_id,v_enrollment.id,'RESEARCH_PRE_ENROLLMENT_CREATED','ADMIN',p_actor_user_id,jsonb_build_object('consent',p_consent_authority_version,'privacy',p_privacy_authority_version,'lifecycle',p_lifecycle_authority_version,'evidence_schema',p_evidence_schema_authority_version),'FOUNDATION_ONLY_NO_ACTIVATION',v_now,p_correlation_id);
    end if;
    return query select v_enrollment.id,v_enrollment.participant_research_identity_id,v_identity.research_id,'PRE_ENROLLMENT'::text,v_enrollment.activation_authority_status,v_enrollment.created_at;
exception when sqlstate 'P1001' then raise; when others then raise exception using errcode='P1002',message='Research enrollment operation could not be completed.';
end;
$$;

create function public.evaluate_research_consent_gate(p_enrollment_id uuid,p_required_family text,p_follow_up_required boolean)
returns text language plpgsql stable security definer set search_path = public, pg_catalog as $$
declare v_consent public.research_consent_records%rowtype; v_enrollment public.research_enrollments%rowtype; v_withdrawal text; v_valid_identity boolean;
begin
    select e.* into v_enrollment from public.research_enrollments e where e.id=p_enrollment_id;
    select c.* into v_consent from public.research_consent_records c where c.enrollment_id=p_enrollment_id order by c.recorded_at desc,c.id desc limit 1;
    select w.withdrawal_status into v_withdrawal from public.research_withdrawal_records w where w.enrollment_id=p_enrollment_id order by w.recorded_at desc,w.id desc limit 1;
    select exists(select 1 from public.research_enrollments e join public.participant_research_identities r on r.id=e.participant_research_identity_id join public.participants p on p.id=r.participant_id where e.id=p_enrollment_id and r.linkage_status='ACTIVE' and p.deleted_at is null and p.auth_user_id is not null) into v_valid_identity;
    if v_consent.id is not null and v_consent.consent_status='GRANTED' and v_consent.reconsent_requirement <> 'REQUIRED' and
       v_consent.protocol_research_plan_version=v_enrollment.protocol_version and
       nullif(btrim(v_consent.family_plan_versions ->> p_required_family),'') is not null and
       v_withdrawal='NONE' and v_valid_identity and p_required_family=any(v_consent.granted_family_scope) and
       (not coalesce(p_follow_up_required,false) or v_consent.follow_up_scope_granted)
    then return 'OPEN'; end if;
    return 'BLOCKED';
end;
$$;

create function public.evaluate_research_privacy_gate(p_enrollment_id uuid)
returns text language plpgsql stable security definer set search_path = public, pg_catalog as $$
declare v public.research_privacy_bindings%rowtype; v_withdrawal text;
begin
    select b.* into v from public.research_privacy_bindings b where b.enrollment_id=p_enrollment_id order by b.recorded_at desc,b.id desc limit 1;
    select w.withdrawal_status into v_withdrawal from public.research_withdrawal_records w where w.enrollment_id=p_enrollment_id order by w.recorded_at desc,w.id desc limit 1;
    if v.id is null or v.legal_review_dependency in ('REQUIRED','UNRESOLVED') or v.sensitivity_classification='UNRESOLVED' or v.access_class='UNRESOLVED' then return 'UNRESOLVED'; end if;
    if v_withdrawal is distinct from 'NONE' or not v.identity_linkage_valid or not v.consent_scope_compatible or not v.environment_authorized or
       not v.sensitive_controls_satisfied or v.restriction_active or v.incident_block_active or v.use_restriction <> 'PURPOSE_SCOPED' or
       v.canonical_disposition not in ('ACTIVE_RETAIN','PRESERVE_MINIMUM_AUDIT') or v.sharing_status <> 'NO_EXTERNAL_SHARING' or v.export_status <> 'NOT_AUTHORIZED'
    then return 'BLOCKED'; end if;
    return 'OPEN';
end;
$$;

create function public.evaluate_wave1_research_readiness(p_enrollment_id uuid,p_required_family text,p_follow_up_required boolean)
returns table(consent_gate text,privacy_gate text,wave1_gate text,actual_enrollment_authorized boolean,evidence_collection_authorized boolean,soft_launch_release_gate text,pilot_authorized boolean,production_authorized boolean)
language plpgsql stable security definer set search_path = public, pg_catalog as $$
declare v_consent text; v_privacy text;
begin
  v_consent:=public.evaluate_research_consent_gate(p_enrollment_id,p_required_family,p_follow_up_required);
  v_privacy:=public.evaluate_research_privacy_gate(p_enrollment_id);
  return query select v_consent,v_privacy,case when v_consent='OPEN' and v_privacy='OPEN' then 'OPEN' else 'BLOCKED' end,
    false,false,'BLOCKED'::text,false,false;
end;
$$;

create function public.record_research_consent_transition(
    p_enrollment_id uuid,p_actor_user_id uuid,p_target_status text,p_consent_content_version text,p_consent_content_sha256 text,
    p_protocol_version text,p_family_plan_versions jsonb,p_granted_family_scope text[],p_evidence_use_scope text[],p_follow_up_scope_granted boolean,
    p_locale_language_version text,p_source_interface text,p_acknowledgement_record jsonb,p_reason_code text,p_correlation_id uuid
)
returns table(consent_id uuid,consent_status text,consent_gate text)
language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_current public.research_consent_records%rowtype; v_enrollment public.research_enrollments%rowtype; v_participant_auth uuid; v_new public.research_consent_records%rowtype; v_now timestamptz:=clock_timestamp(); v_allowed boolean:=false;
begin
    select e.* into v_enrollment from public.research_enrollments e where e.id=p_enrollment_id;
    if not found then raise exception using errcode='P1001',message='Research enrollment was not found.'; end if;
    select p.auth_user_id into v_participant_auth from public.participants p join public.participant_research_identities r on r.participant_id=p.id where r.id=v_enrollment.participant_research_identity_id and p.deleted_at is null;
    select c.* into v_current from public.research_consent_records c where c.enrollment_id=p_enrollment_id order by c.recorded_at desc,c.id desc limit 1 for update;
    if cardinality(coalesce(p_granted_family_scope,'{}'::text[])) <>
       (select count(distinct value) from unnest(coalesce(p_granted_family_scope,'{}'::text[])) value) then
      raise exception using errcode='P1001',message='Research consent family scope is invalid.';
    end if;
    v_allowed := (v_current.consent_status='NOT_PRESENTED' and p_target_status='PRESENTED' and public.is_active_research_administrator(p_actor_user_id)) or
      (v_current.consent_status='PRESENTED' and p_target_status in ('GRANTED','DECLINED') and p_actor_user_id=v_participant_auth) or
      (v_current.consent_status='RECONSENT_REQUIRED' and p_target_status='PRESENTED' and public.is_active_research_administrator(p_actor_user_id));
    if not v_allowed then
      insert into public.research_control_audit_events(participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,reason_code,occurred_at,correlation_id,metadata)
      values(v_enrollment.participant_research_identity_id,p_enrollment_id,'RESEARCH_GATE_BYPASS_REJECTED',case when p_actor_user_id=v_participant_auth then 'PARTICIPANT' else 'ADMIN' end,p_actor_user_id,'INVALID_CONSENT_TRANSITION',v_now,p_correlation_id,jsonb_build_object('target_status',p_target_status));
      raise exception using errcode='P1001',message='Research consent transition is not authorized.';
    end if;
    insert into public.research_consent_records(enrollment_id,predecessor_consent_id,consent_status,consent_content_version,consent_content_sha256,protocol_research_plan_version,family_plan_versions,granted_family_scope,evidence_use_scope,follow_up_scope_granted,locale_language_version,source_interface,acknowledgement_record,reconsent_requirement,decision_actor_user_id,effective_at,occurred_at,correlation_id)
    values(p_enrollment_id,v_current.id,p_target_status,btrim(p_consent_content_version),lower(p_consent_content_sha256),btrim(p_protocol_version),coalesce(p_family_plan_versions,'{}'::jsonb),coalesce(p_granted_family_scope,'{}'::text[]),coalesce(p_evidence_use_scope,'{}'::text[]),coalesce(p_follow_up_scope_granted,false),btrim(p_locale_language_version),btrim(p_source_interface),coalesce(p_acknowledgement_record,'{}'::jsonb),'NONE',case when p_target_status in ('GRANTED','DECLINED') then p_actor_user_id end,case when p_target_status='GRANTED' then v_now end,v_now,p_correlation_id) returning * into v_new;
    insert into public.research_control_audit_events(participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,authority_versions,reason_code,occurred_at,correlation_id,metadata)
    values(v_enrollment.participant_research_identity_id,p_enrollment_id,'CONSENT_'||p_target_status,case when p_actor_user_id=v_participant_auth then 'PARTICIPANT' else 'ADMIN' end,p_actor_user_id,jsonb_build_object('consent',v_enrollment.consent_authority_version,'protocol',p_protocol_version),coalesce(nullif(btrim(p_reason_code),''),'CONSENT_TRANSITION'),v_now,p_correlation_id,jsonb_build_object('consent_id',v_new.id));
    return query select v_new.id,v_new.consent_status,public.evaluate_research_consent_gate(p_enrollment_id,coalesce(p_granted_family_scope[1],'FSH'),false);
exception when sqlstate 'P1001' then raise; when others then raise exception using errcode='P1002',message='Research consent operation could not be completed.';
end;
$$;

create function public.require_research_reconsent(p_enrollment_id uuid,p_actor_user_id uuid,p_reason_code text,p_correlation_id uuid)
returns uuid language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_current public.research_consent_records%rowtype; v_enrollment public.research_enrollments%rowtype; v_new_id uuid; v_now timestamptz:=clock_timestamp();
begin
 if not public.is_active_research_administrator(p_actor_user_id) then raise exception using errcode='P1001',message='Actor is not authorized to require research re-consent.'; end if;
 select * into v_enrollment from public.research_enrollments where id=p_enrollment_id;
 select * into v_current from public.research_consent_records where enrollment_id=p_enrollment_id order by recorded_at desc,id desc limit 1 for update;
 if v_current.consent_status<>'GRANTED' then raise exception using errcode='P1001',message='Research re-consent transition is not allowed.'; end if;
 insert into public.research_consent_records(enrollment_id,predecessor_consent_id,consent_status,consent_content_version,consent_content_sha256,protocol_research_plan_version,family_plan_versions,granted_family_scope,evidence_use_scope,follow_up_scope_granted,locale_language_version,source_interface,acknowledgement_record,reconsent_requirement,occurred_at,correlation_id)
 values(p_enrollment_id,v_current.id,'RECONSENT_REQUIRED',v_current.consent_content_version,v_current.consent_content_sha256,v_current.protocol_research_plan_version,v_current.family_plan_versions,v_current.granted_family_scope,v_current.evidence_use_scope,v_current.follow_up_scope_granted,v_current.locale_language_version,v_current.source_interface,v_current.acknowledgement_record,'REQUIRED',v_now,p_correlation_id) returning id into v_new_id;
 insert into public.research_control_audit_events(participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,authority_versions,reason_code,occurred_at,correlation_id,metadata)
 values(v_enrollment.participant_research_identity_id,p_enrollment_id,'RECONSENT_REQUESTED','ADMIN',p_actor_user_id,jsonb_build_object('consent',v_enrollment.consent_authority_version),btrim(p_reason_code),v_now,p_correlation_id,jsonb_build_object('consent_id',v_new_id));
 return v_new_id;
end;
$$;

create function public.record_research_privacy_binding(
 p_enrollment_id uuid,p_actor_user_id uuid,p_purpose_id text,p_data_classes text[],p_sensitivity_classification text,p_access_class text,
 p_use_restriction text,p_retention_class text,p_canonical_disposition text,p_sharing_status text,p_export_status text,p_legal_review_dependency text,
 p_identity_linkage_valid boolean,p_consent_scope_compatible boolean,p_environment_authorized boolean,p_sensitive_controls_satisfied boolean,
 p_restriction_active boolean,p_incident_block_active boolean,p_reason_code text,p_correlation_id uuid
)
returns table(privacy_binding_id uuid,privacy_gate text)
language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_current public.research_privacy_bindings%rowtype; v_enrollment public.research_enrollments%rowtype; v_new_id uuid; v_now timestamptz:=clock_timestamp();
begin
 if not public.is_active_research_administrator(p_actor_user_id) then raise exception using errcode='P1001',message='Actor is not authorized to govern research privacy.'; end if;
 select * into v_enrollment from public.research_enrollments where id=p_enrollment_id;
 if not found then raise exception using errcode='P1001',message='Research enrollment was not found.'; end if;
 select * into v_current from public.research_privacy_bindings where enrollment_id=p_enrollment_id order by recorded_at desc,id desc limit 1 for update;
 insert into public.research_privacy_bindings(enrollment_id,predecessor_privacy_binding_id,privacy_authority_version,purpose_id,data_classes,sensitivity_classification,access_class,use_restriction,retention_class,canonical_disposition,sharing_status,export_status,legal_review_dependency,identity_linkage_valid,consent_scope_compatible,environment_authorized,sensitive_controls_satisfied,restriction_active,incident_block_active,occurred_at,actor_user_id,correlation_id)
 values(p_enrollment_id,v_current.id,v_enrollment.privacy_authority_version,btrim(p_purpose_id),p_data_classes,p_sensitivity_classification,p_access_class,p_use_restriction,p_retention_class,p_canonical_disposition,p_sharing_status,p_export_status,p_legal_review_dependency,p_identity_linkage_valid,p_consent_scope_compatible,p_environment_authorized,p_sensitive_controls_satisfied,p_restriction_active,p_incident_block_active,v_now,p_actor_user_id,p_correlation_id) returning id into v_new_id;
 insert into public.research_control_audit_events(participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,authority_versions,reason_code,occurred_at,correlation_id,metadata)
 values(v_enrollment.participant_research_identity_id,p_enrollment_id,'PRIVACY_BINDING_RECORDED','ADMIN',p_actor_user_id,jsonb_build_object('privacy',v_enrollment.privacy_authority_version),btrim(p_reason_code),v_now,p_correlation_id,jsonb_build_object('privacy_binding_id',v_new_id));
 return query select v_new_id,public.evaluate_research_privacy_gate(p_enrollment_id);
exception when sqlstate 'P1001' then raise; when check_violation then raise exception using errcode='P1001',message='Research privacy binding is invalid.'; when others then raise exception using errcode='P1002',message='Research privacy operation could not be completed.';
end;
$$;

create function public.request_research_withdrawal(p_enrollment_id uuid,p_actor_user_id uuid,p_asserted_scope text[],p_request_channel text,p_reason text,p_correlation_id uuid)
returns table(withdrawal_id uuid,withdrawal_status text,consent_gate text,collection_authorized boolean)
language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_enrollment public.research_enrollments%rowtype; v_participant_auth uuid; v_current public.research_withdrawal_records%rowtype; v_new_id uuid; v_now timestamptz:=clock_timestamp();
begin
 select * into v_enrollment from public.research_enrollments where id=p_enrollment_id;
 select p.auth_user_id into v_participant_auth from public.participants p join public.participant_research_identities r on r.participant_id=p.id where r.id=v_enrollment.participant_research_identity_id and p.deleted_at is null;
 if p_actor_user_id is distinct from v_participant_auth then raise exception using errcode='P1001',message='Only the linked participant may request research withdrawal.'; end if;
 select * into v_current from public.research_withdrawal_records where enrollment_id=p_enrollment_id order by recorded_at desc,id desc limit 1 for update;
 if v_current.withdrawal_status<>'NONE' then raise exception using errcode='P1001',message='Research withdrawal is already controlling.'; end if;
 insert into public.research_withdrawal_records(enrollment_id,predecessor_withdrawal_id,withdrawal_status,asserted_scope,request_channel,reason,received_at,actor_user_id,occurred_at,correlation_id)
 values(p_enrollment_id,v_current.id,'REQUESTED',coalesce(p_asserted_scope,array['ALL_RESEARCH']::text[]),btrim(p_request_channel),nullif(btrim(p_reason),''),v_now,p_actor_user_id,v_now,p_correlation_id) returning id into v_new_id;
 insert into public.research_enrollment_status_history(enrollment_id,predecessor_status_event_id,lifecycle_status,reason_code,effective_at,occurred_at,actor_user_id,correlation_id,metadata)
 select p_enrollment_id,h.id,'WITHDRAWAL_REQUESTED','WITHDRAWAL_PRECEDENCE',v_now,v_now,p_actor_user_id,p_correlation_id,jsonb_build_object('withdrawal_id',v_new_id) from public.research_enrollment_status_history h where h.enrollment_id=p_enrollment_id order by h.recorded_at desc,h.id desc limit 1;
 insert into public.research_control_audit_events(participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,reason_code,occurred_at,correlation_id,metadata)
 values(v_enrollment.participant_research_identity_id,p_enrollment_id,'WITHDRAWAL_REQUESTED','PARTICIPANT',p_actor_user_id,'PARTICIPANT_REQUEST',v_now,p_correlation_id,jsonb_build_object('withdrawal_id',v_new_id));
 return query select v_new_id,'REQUESTED'::text,'BLOCKED'::text,false;
exception when sqlstate 'P1001' then raise; when others then raise exception using errcode='P1002',message='Research withdrawal request could not be completed.';
end;
$$;

create function public.transition_research_withdrawal(p_enrollment_id uuid,p_actor_user_id uuid,p_target_status text,p_reason text,p_correlation_id uuid)
returns table(withdrawal_id uuid,withdrawal_status text,collection_authorized boolean)
language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_current public.research_withdrawal_records%rowtype; v_enrollment public.research_enrollments%rowtype; v_new_id uuid; v_now timestamptz:=clock_timestamp(); v_allowed boolean:=false;
begin
 if not public.is_active_research_administrator(p_actor_user_id) then raise exception using errcode='P1001',message='Actor is not authorized to process research withdrawal.'; end if;
 select * into v_enrollment from public.research_enrollments where id=p_enrollment_id;
 select * into v_current from public.research_withdrawal_records where enrollment_id=p_enrollment_id order by recorded_at desc,id desc limit 1 for update;
 v_allowed := (v_current.withdrawal_status='REQUESTED' and p_target_status in ('VERIFIED','EXCEPTION_REVIEW_REQUIRED')) or
   (v_current.withdrawal_status='VERIFIED' and p_target_status in ('EFFECTIVE','EXCEPTION_REVIEW_REQUIRED')) or
   (v_current.withdrawal_status='EFFECTIVE' and p_target_status='PROCESSING') or
   (v_current.withdrawal_status='PROCESSING' and p_target_status in ('COMPLETED','EXCEPTION_REVIEW_REQUIRED')) or
   (v_current.withdrawal_status='EXCEPTION_REVIEW_REQUIRED' and p_target_status in ('VERIFIED','EFFECTIVE','PROCESSING','COMPLETED'));
 if not v_allowed then raise exception using errcode='P1001',message='Research withdrawal transition is not allowed.'; end if;
 insert into public.research_withdrawal_records(enrollment_id,predecessor_withdrawal_id,withdrawal_status,asserted_scope,request_channel,reason,received_at,verified_at,effective_at,processed_at,completed_at,actor_user_id,occurred_at,correlation_id)
 values(p_enrollment_id,v_current.id,p_target_status,v_current.asserted_scope,v_current.request_channel,coalesce(nullif(btrim(p_reason),''),v_current.reason),v_current.received_at,
   case when p_target_status in ('VERIFIED','EFFECTIVE') then coalesce(v_current.verified_at,v_now) else v_current.verified_at end,
   case when p_target_status in ('EFFECTIVE','PROCESSING','COMPLETED') then coalesce(v_current.effective_at,v_now) else v_current.effective_at end,
   case when p_target_status in ('PROCESSING','COMPLETED') then coalesce(v_current.processed_at,v_now) else v_current.processed_at end,
   case when p_target_status='COMPLETED' then v_now else v_current.completed_at end,p_actor_user_id,v_now,p_correlation_id) returning id into v_new_id;
 insert into public.research_control_audit_events(participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,reason_code,occurred_at,correlation_id,metadata)
 values(v_enrollment.participant_research_identity_id,p_enrollment_id,'WITHDRAWAL_'||p_target_status,'ADMIN',p_actor_user_id,coalesce(nullif(btrim(p_reason),''),'WITHDRAWAL_TRANSITION'),v_now,p_correlation_id,jsonb_build_object('withdrawal_id',v_new_id));
 return query select v_new_id,p_target_status,false;
exception when sqlstate 'P1001' then raise; when others then raise exception using errcode='P1002',message='Research withdrawal operation could not be completed.';
end;
$$;

create function public.get_research_controls_status(p_participant_id uuid,p_actor_user_id uuid,p_required_family text default 'FSH')
returns table(research_identity_id uuid,research_id text,enrollment_id uuid,lifecycle_status text,consent_status text,withdrawal_status text,consent_gate text,privacy_gate text,wave1_gate text,actual_enrollment_authorized boolean,evidence_collection_authorized boolean,soft_launch_release_gate text,pilot_authorized boolean,production_authorized boolean)
language plpgsql stable security definer set search_path = public, pg_catalog as $$
declare v_participant_auth uuid; v_identity public.participant_research_identities%rowtype; v_enrollment public.research_enrollments%rowtype; v_lifecycle text; v_consent text; v_withdrawal text; v_ready record;
begin
 select p.auth_user_id into v_participant_auth from public.participants p where p.id=p_participant_id and p.deleted_at is null;
 if p_actor_user_id is distinct from v_participant_auth and not public.is_active_research_administrator(p_actor_user_id) then raise exception using errcode='P1001',message='Actor is not authorized to access research controls.'; end if;
 select * into v_identity from public.participant_research_identities where participant_id=p_participant_id;
 if not found then return; end if;
 select * into v_enrollment from public.research_enrollments where participant_research_identity_id=v_identity.id order by created_at desc,id desc limit 1;
 select h.lifecycle_status into v_lifecycle from public.research_enrollment_status_history h where h.enrollment_id=v_enrollment.id order by h.recorded_at desc,h.id desc limit 1;
 select c.consent_status into v_consent from public.research_consent_records c where c.enrollment_id=v_enrollment.id order by c.recorded_at desc,c.id desc limit 1;
 select w.withdrawal_status into v_withdrawal from public.research_withdrawal_records w where w.enrollment_id=v_enrollment.id order by w.recorded_at desc,w.id desc limit 1;
 select * into v_ready from public.evaluate_wave1_research_readiness(v_enrollment.id,p_required_family,false);
 return query select v_identity.id,v_identity.research_id,v_enrollment.id,v_lifecycle,v_consent,v_withdrawal,v_ready.consent_gate,v_ready.privacy_gate,v_ready.wave1_gate,v_ready.actual_enrollment_authorized,v_ready.evidence_collection_authorized,v_ready.soft_launch_release_gate,v_ready.pilot_authorized,v_ready.production_authorized;
end;
$$;

alter function public.prevent_research_control_mutation() owner to postgres;
alter function public.is_active_research_administrator(uuid) owner to postgres;
alter function public.create_or_get_participant_research_identity(uuid,uuid,text,uuid) owner to postgres;
alter function public.create_or_get_research_enrollment(uuid,uuid,text,text,text,text,text,text,text,text,uuid) owner to postgres;
alter function public.evaluate_research_consent_gate(uuid,text,boolean) owner to postgres;
alter function public.evaluate_research_privacy_gate(uuid) owner to postgres;
alter function public.evaluate_wave1_research_readiness(uuid,text,boolean) owner to postgres;
alter function public.record_research_consent_transition(uuid,uuid,text,text,text,text,jsonb,text[],text[],boolean,text,text,jsonb,text,uuid) owner to postgres;
alter function public.require_research_reconsent(uuid,uuid,text,uuid) owner to postgres;
alter function public.record_research_privacy_binding(uuid,uuid,text,text[],text,text,text,text,text,text,text,text,boolean,boolean,boolean,boolean,boolean,boolean,text,uuid) owner to postgres;
alter function public.request_research_withdrawal(uuid,uuid,text[],text,text,uuid) owner to postgres;
alter function public.transition_research_withdrawal(uuid,uuid,text,text,uuid) owner to postgres;
alter function public.get_research_controls_status(uuid,uuid,text) owner to postgres;

revoke all on public.participant_research_identities,public.research_enrollments,public.research_enrollment_status_history,public.research_consent_records,public.research_privacy_bindings,public.research_withdrawal_records,public.research_control_audit_events,public.research_release_firewall from public,anon,authenticated,service_role;
revoke all on function public.prevent_research_control_mutation(),public.is_active_research_administrator(uuid),public.create_or_get_participant_research_identity(uuid,uuid,text,uuid),public.create_or_get_research_enrollment(uuid,uuid,text,text,text,text,text,text,text,text,uuid),public.evaluate_research_consent_gate(uuid,text,boolean),public.evaluate_research_privacy_gate(uuid),public.evaluate_wave1_research_readiness(uuid,text,boolean),public.record_research_consent_transition(uuid,uuid,text,text,text,text,jsonb,text[],text[],boolean,text,text,jsonb,text,uuid),public.require_research_reconsent(uuid,uuid,text,uuid),public.record_research_privacy_binding(uuid,uuid,text,text[],text,text,text,text,text,text,text,text,boolean,boolean,boolean,boolean,boolean,boolean,text,uuid),public.request_research_withdrawal(uuid,uuid,text[],text,text,uuid),public.transition_research_withdrawal(uuid,uuid,text,text,uuid),public.get_research_controls_status(uuid,uuid,text) from public,anon,authenticated,service_role;

grant execute on function public.create_or_get_participant_research_identity(uuid,uuid,text,uuid),public.create_or_get_research_enrollment(uuid,uuid,text,text,text,text,text,text,text,text,uuid),public.evaluate_research_consent_gate(uuid,text,boolean),public.evaluate_research_privacy_gate(uuid),public.evaluate_wave1_research_readiness(uuid,text,boolean),public.record_research_consent_transition(uuid,uuid,text,text,text,text,jsonb,text[],text[],boolean,text,text,jsonb,text,uuid),public.require_research_reconsent(uuid,uuid,text,uuid),public.record_research_privacy_binding(uuid,uuid,text,text[],text,text,text,text,text,text,text,text,boolean,boolean,boolean,boolean,boolean,boolean,text,uuid),public.request_research_withdrawal(uuid,uuid,text[],text,text,uuid),public.transition_research_withdrawal(uuid,uuid,text,text,uuid),public.get_research_controls_status(uuid,uuid,text) to service_role;

comment on table public.participant_research_identities is 'Restricted pseudonymous research identity linked to, but distinct from, the direct participant identity.';
comment on table public.research_enrollments is 'Immutable pre-enrollment episode authority binding. Wave 1 cannot activate actual enrollment.';
comment on table public.research_consent_records is 'Append-only exact-version research consent state history; legacy generic consents remain preserved separately.';
comment on table public.research_privacy_bindings is 'Append-only privacy purpose, class, restriction, retention, disposition, sharing, export, and legal-dependency authority binding.';
comment on table public.research_withdrawal_records is 'Append-only withdrawal state history. Any non-NONE current state blocks collection authority.';
comment on table public.research_release_firewall is 'Migration-controlled release firewall. Sprint 24 does not authorize actual enrollment, evidence collection, Pilot, or Production.';

commit;
