begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,pg_catalog;
select no_plan();

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('00000000-0000-0000-0000-000000000000','f1000000-0000-4000-8000-000000000001','authenticated','authenticated','admin59@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','f1000000-0000-4000-8000-000000000011','authenticated','authenticated','no59@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','f1000000-0000-4000-8000-000000000012','authenticated','authenticated','yes59@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','f1000000-0000-4000-8000-000000000013','authenticated','authenticated','unanswered59@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01');
insert into public.staff_members(id,auth_user_id,staff_code,full_name,email,status,created_at)
values('f2000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000001','WPAG-STF-959001','Explicit Decision Admin','admin59@test.local','active','2026-01-01');
insert into public.staff_member_roles(staff_member_id,staff_role_id,is_active,assigned_at)
select 'f2000000-0000-4000-8000-000000000001',id,true,'2026-01-01' from public.staff_roles where role_code='administrator';
insert into public.participants(id,auth_user_id,participant_code,lifecycle_status,created_at) values
('f3000000-0000-4000-8000-000000000011','f1000000-0000-4000-8000-000000000011','WPAG-959011','active','2026-01-01'),
('f3000000-0000-4000-8000-000000000012','f1000000-0000-4000-8000-000000000012','WPAG-959012','active','2026-01-01'),
('f3000000-0000-4000-8000-000000000013','f1000000-0000-4000-8000-000000000013','WPAG-959013','active','2026-01-01');

create temporary table f59(label text primary key,participant_id uuid not null,actor_id uuid not null,enrollment_id uuid,presentation_id uuid);
insert into f59(label,participant_id,actor_id) values
('NO','f3000000-0000-4000-8000-000000000011','f1000000-0000-4000-8000-000000000011'),
('YES','f3000000-0000-4000-8000-000000000012','f1000000-0000-4000-8000-000000000012'),
('UNANSWERED','f3000000-0000-4000-8000-000000000013','f1000000-0000-4000-8000-000000000013');
update f59 set enrollment_id=(select enrollment_id from public.create_or_get_research_enrollment(
  'f3000000-0000-4000-8000-000000000011','f1000000-0000-4000-8000-000000000001','FSH Phase 1','PUR-01','Protocol-v1',
  'Consent-v0.2','Privacy-v0.1','Lifecycle-v0.2','Evidence-v0.1','synthetic_test',gen_random_uuid())) where label='NO';
update f59 set enrollment_id=(select enrollment_id from public.create_or_get_research_enrollment(
  'f3000000-0000-4000-8000-000000000012','f1000000-0000-4000-8000-000000000001','FSH Phase 1','PUR-01','Protocol-v1',
  'Consent-v0.2','Privacy-v0.1','Lifecycle-v0.2','Evidence-v0.1','synthetic_test',gen_random_uuid())) where label='YES';
update f59 set enrollment_id=(select enrollment_id from public.create_or_get_research_enrollment(
  'f3000000-0000-4000-8000-000000000013','f1000000-0000-4000-8000-000000000001','FSH Phase 1','PUR-01','Protocol-v1',
  'Consent-v0.2','Privacy-v0.1','Lifecycle-v0.2','Evidence-v0.1','synthetic_test',gen_random_uuid())) where label='UNANSWERED';
select lives_ok(format($q$select * from public.present_wave4_synthetic_research_consent(%L,'f1000000-0000-4000-8000-000000000001',gen_random_uuid())$q$,enrollment_id),'controlled consent presented for '||label) from f59;
update f59 x set presentation_id=p.id from public.research_consent_presentation_events p where p.enrollment_id=x.enrollment_id;

select ok(to_regprocedure('public.decide_wave4_synthetic_research_consent(uuid,uuid,text,boolean,boolean,boolean,jsonb,uuid,text,text,timestamptz,uuid)') is not null,'legacy Boolean RPC remains installed');
select ok(to_regprocedure('public.decide_wave4_synthetic_research_consent_v2(uuid,uuid,text,boolean,boolean,text,jsonb,uuid,text,text,timestamptz,uuid)') is not null,'versioned explicit-decision RPC is installed');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid='public.research_follow_up_scope_decision_events'::regclass),'explicit follow-up events force RLS');
select ok(not has_table_privilege('authenticated','public.research_follow_up_scope_decision_events','SELECT'),'participants cannot directly read decision events');
select is((select count(*) from public.research_follow_up_scope_decision_events),0::bigint,'migration performs no legacy classification or backfill');

select is((select d.technical_result from f59 x join public.research_consent_presentation_events p on p.id=x.presentation_id cross join lateral public.decide_wave4_synthetic_research_consent_v2(
  x.enrollment_id,x.actor_id,'GRANTED',true,true,null,
  '{"research_purpose":true,"voluntary_participation":true,"research_only_no_final_state":true,"privacy_data_use":true,"withdrawal_no_automatic_deletion":true}',
  x.presentation_id,p.artifact_version,p.artifact_sha256,p.presented_at,gen_random_uuid()
) d where x.label='UNANSWERED'),'FOLLOW_UP_SCOPE_DECISION_REQUIRED','unanswered follow-up decision is rejected');
select is((select consent_status from public.research_consent_records c join f59 x on x.enrollment_id=c.enrollment_id where x.label='UNANSWERED' order by c.recorded_at desc,c.id desc limit 1),'PRESENTED','unanswered leaves consent at PRESENTED');
select is((select count(*) from public.research_follow_up_scope_decision_events e join f59 x on x.enrollment_id=e.enrollment_id where x.label='UNANSWERED'),0::bigint,'unanswered creates no decision event');

select is((select d.technical_result from f59 x join public.research_consent_presentation_events p on p.id=x.presentation_id cross join lateral public.decide_wave4_synthetic_research_consent_v2(
  x.enrollment_id,x.actor_id,'GRANTED',true,true,'EXPLICITLY_DECLINED',
  '{"research_purpose":true,"voluntary_participation":true,"research_only_no_final_state":true,"privacy_data_use":true,"withdrawal_no_automatic_deletion":true}',
  x.presentation_id,p.artifact_version,p.artifact_sha256,p.presented_at,gen_random_uuid()
) d where x.label='NO'),'CONSENT_GRANTED','explicit No preserves baseline grant');
select is((select follow_up_scope_decision from public.research_follow_up_scope_decision_events e join f59 x on x.enrollment_id=e.enrollment_id where x.label='NO'),'EXPLICITLY_DECLINED','explicit No is immutably distinct');
select is((select follow_up_scope_granted from public.research_consent_records c join f59 x on x.enrollment_id=c.enrollment_id where x.label='NO' order by c.recorded_at desc,c.id desc limit 1),false,'explicit No derives follow-up Boolean false');
select is((select evidence_use_scope from public.research_consent_records c join f59 x on x.enrollment_id=c.enrollment_id where x.label='NO' order by c.recorded_at desc,c.id desc limit 1),array['BASELINE_RESEARCH']::text[],'explicit No preserves baseline-only scope');
select is((select public.evaluate_research_consent_gate(enrollment_id,'FSH',false) from f59 where label='NO'),'OPEN','explicit No permits baseline gate');
select is((select public.evaluate_research_consent_gate(enrollment_id,'FSH',true) from f59 where label='NO'),'BLOCKED','explicit No blocks follow-up-required gate');

select is((select d.technical_result from f59 x join public.research_consent_presentation_events p on p.id=x.presentation_id cross join lateral public.decide_wave4_synthetic_research_consent_v2(
  x.enrollment_id,x.actor_id,'GRANTED',true,true,'EXPLICITLY_GRANTED',
  '{"research_purpose":true,"voluntary_participation":true,"research_only_no_final_state":true,"privacy_data_use":true,"withdrawal_no_automatic_deletion":true}',
  x.presentation_id,p.artifact_version,p.artifact_sha256,p.presented_at,gen_random_uuid()
) d where x.label='YES'),'CONSENT_GRANTED','explicit Yes grants baseline and follow-up scope');
select is((select follow_up_scope_decision from public.research_follow_up_scope_decision_events e join f59 x on x.enrollment_id=e.enrollment_id where x.label='YES'),'EXPLICITLY_GRANTED','explicit Yes is immutably distinct');
select is((select follow_up_scope_granted from public.research_consent_records c join f59 x on x.enrollment_id=c.enrollment_id where x.label='YES' order by c.recorded_at desc,c.id desc limit 1),true,'explicit Yes derives follow-up Boolean true');
select is((select public.evaluate_research_consent_gate(enrollment_id,'FSH',true) from f59 where label='YES'),'OPEN','explicit Yes permits follow-up gate subject to existing controls');

select is((select consent_baseline_scope_status from f59 x cross join lateral public.get_participant_research_journey(x.participant_id,x.actor_id) j where x.label='NO'),'GRANTED','receipt reports the completed baseline scope');
select is((select consent_follow_up_scope_status from f59 x cross join lateral public.get_participant_research_journey(x.participant_id,x.actor_id) j where x.label='NO'),'NOT_GRANTED','receipt reports explicit No without inferring legacy intent');
select is((select consent_follow_up_scope_status from f59 x cross join lateral public.get_participant_research_journey(x.participant_id,x.actor_id) j where x.label='YES'),'GRANTED','receipt reports explicit Yes');
select ok((select consent_decided_at is not null from f59 x cross join lateral public.get_participant_research_journey(x.participant_id,x.actor_id) j where x.label='YES'),'receipt exposes the immutable decision-binding timestamp');
select is(
  (select j.consent_decided_at from f59 x cross join lateral public.get_participant_research_journey(x.participant_id,x.actor_id) j where x.label='YES'),
  (select b.decided_at from f59 x join public.research_consent_records c on c.enrollment_id=x.enrollment_id join public.research_consent_decision_bindings b on b.decision_consent_id=c.id where x.label='YES' and c.consent_status='GRANTED'),
  'receipt timestamp is sourced exactly from the immutable decision binding'
);
select is(
  (select j.consent_information_version from f59 x cross join lateral public.get_participant_research_journey(x.participant_id,x.actor_id) j where x.label='YES'),
  (select b.artifact_version from f59 x join public.research_consent_records c on c.enrollment_id=x.enrollment_id join public.research_consent_decision_bindings b on b.decision_consent_id=c.id where x.label='YES' and c.consent_status='GRANTED'),
  'receipt exposes the controlled consent information version from the binding'
);
select throws_ok(
  $q$select * from public.get_participant_research_journey('f3000000-0000-4000-8000-000000000012','f1000000-0000-4000-8000-000000000011')$q$,
  'P1001','Actor is not authorized to access research controls.','participant cannot retrieve another participant receipt'
);

select is((select d.technical_result from f59 x join public.research_consent_presentation_events p on p.id=x.presentation_id cross join lateral public.decide_wave4_synthetic_research_consent(
  x.enrollment_id,x.actor_id,'GRANTED',true,true,false,
  '{"research_purpose":true,"voluntary_participation":true,"research_only_no_final_state":true,"privacy_data_use":true,"withdrawal_no_automatic_deletion":true}',
  x.presentation_id,p.artifact_version,p.artifact_sha256,p.presented_at,gen_random_uuid()
) d where x.label='UNANSWERED'),'CONSENT_GRANTED','legacy Boolean decision remains executable without reclassification');
select is((select consent_follow_up_scope_status from f59 x cross join lateral public.get_participant_research_journey(x.participant_id,x.actor_id) j where x.label='UNANSWERED'),'LEGACY_UNRESOLVED','legacy false remains neutral because explicit choice provenance is absent');
select is((select count(*) from public.research_follow_up_scope_decision_events e join f59 x on x.enrollment_id=e.enrollment_id where x.label='UNANSWERED'),0::bigint,'receipt projection does not backfill a legacy decision event');

select throws_ok('update public.research_follow_up_scope_decision_events set follow_up_scope_decision=''EXPLICITLY_GRANTED''','P1001','Research control history is append-only.','explicit follow-up decision events are append-only');
select throws_ok('delete from public.research_follow_up_scope_decision_events','P1001','Research control history is append-only.','explicit follow-up decision events cannot be deleted');
select is((select gate_status from public.evaluate_wave3_release_gate('synthetic_test','f1000000-0000-4000-8000-000000000001',gen_random_uuid())),'BLOCKED','release gate remains blocked');

select * from finish();
rollback;
