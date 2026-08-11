begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,pg_catalog;
select no_plan();

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('00000000-0000-0000-0000-000000000000','e1000000-0000-4000-8000-000000000001','authenticated','authenticated','admin54@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','e1000000-0000-4000-8000-000000000011','authenticated','authenticated','participant54@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01');
insert into public.staff_members(id,auth_user_id,staff_code,full_name,email,status,created_at)
values('e2000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','WPAG-STF-954001','Sprint 28A Admin','admin54@test.local','active','2026-01-01');
insert into public.staff_member_roles(staff_member_id,staff_role_id,is_active,assigned_at)
select 'e2000000-0000-4000-8000-000000000001',id,true,'2026-01-01' from public.staff_roles where role_code='administrator';
insert into public.participants(id,auth_user_id,participant_code,lifecycle_status,created_at)
values('e3000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000011','WPAG-954001','active','2026-01-01');

create temporary table r54(key text primary key,value uuid not null);
insert into r54 select 'enrollment',enrollment_id from public.create_or_get_research_enrollment(
  'e3000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','FSH Phase 1','PUR-01','Protocol-v1',
  'Consent-v0.2','Privacy-v0.1','Lifecycle-v0.2','Evidence-v0.1','synthetic_test','e9000000-0000-4000-8000-000000000001');
select lives_ok(format($q$select * from public.present_wave4_synthetic_research_consent(%L,'e1000000-0000-4000-8000-000000000001','e9000000-0000-4000-8000-000000000002')$q$,(select value from r54 where key='enrollment')),'approved exact consent presentation is recorded');
insert into r54 select 'presentation',id from public.research_consent_presentation_events where enrollment_id=(select value from r54 where key='enrollment');

select is((select artifact_sha256 from public.research_consent_presentation_events where id=(select value from r54 where key='presentation')),
  'a8fedbe933d893fd7bbdf31c1b2351a49508cb83c660dac88fda3852ae93f744','presentation binds exact controlled artifact hash');
select is((select review_artifact_sha256 from public.research_consent_presentation_approval_events where id=(select approval_event_id from public.research_consent_presentation_events where id=(select value from r54 where key='presentation'))),
  'd79d2e836d7841e1eb96366c1dfb295725f1cf2cd68758aaf76f2b470b6c3acb','presentation binds exact independent approval hash');
select is((select consent_authority_version from public.research_consent_presentation_events where id=(select value from r54 where key='presentation')),'Consent-v0.2','presentation binds enrollment consent authority');
select is((select privacy_authority_version from public.research_consent_presentation_events where id=(select value from r54 where key='presentation')),'Privacy-v0.1','presentation binds enrollment privacy authority');
select ok(not has_function_privilege('service_role','public.record_research_consent_transition(uuid,uuid,text,text,text,text,jsonb,text[],text[],boolean,text,text,jsonb,text,uuid)','EXECUTE'),'application service role cannot bypass the governed Wave 4 decision boundary');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid='public.research_consent_presentation_events'::regclass),'presentation bindings force row-level security');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid='public.research_consent_decision_bindings'::regclass),'decision bindings force row-level security');

create temporary table invalid_ack(payload jsonb,label text);
insert into invalid_ack values
('{"research_purpose":false,"voluntary_participation":true,"research_only_no_final_state":true,"privacy_data_use":true,"withdrawal_no_automatic_deletion":true}','one false'),
('{"research_purpose":false,"voluntary_participation":false,"research_only_no_final_state":false,"privacy_data_use":false,"withdrawal_no_automatic_deletion":false}','all false'),
('{"research_purpose":true,"voluntary_participation":true,"research_only_no_final_state":true,"privacy_data_use":true}','missing key'),
('{"research_purpose":"true","voluntary_participation":true,"research_only_no_final_state":true,"privacy_data_use":true,"withdrawal_no_automatic_deletion":true}','string true'),
('{"research_purpose":1,"voluntary_participation":true,"research_only_no_final_state":true,"privacy_data_use":true,"withdrawal_no_automatic_deletion":true}','numeric true'),
('{"research_purpose":null,"voluntary_participation":true,"research_only_no_final_state":true,"privacy_data_use":true,"withdrawal_no_automatic_deletion":true}','null'),
('[true,true,true,true,true]','array'),
('{"research_purpose":true,"voluntary_participation":true,"research_only_no_final_state":true,"privacy_data_use":true,"withdrawal_no_automatic_deletion":true,"extra":true}','extra key');

create temporary table invalid_results as
select x.label,d.technical_result
from invalid_ack x
cross join lateral public.decide_wave4_synthetic_research_consent(
  (select value from r54 where key='enrollment'),'e1000000-0000-4000-8000-000000000011','GRANTED',true,true,true,x.payload,
  (select value from r54 where key='presentation'),
  (select artifact_version from public.research_consent_presentation_events where id=(select value from r54 where key='presentation')),
  (select artifact_sha256 from public.research_consent_presentation_events where id=(select value from r54 where key='presentation')),
  (select presented_at from public.research_consent_presentation_events where id=(select value from r54 where key='presentation')),gen_random_uuid()
) d;
select is((select count(*) from invalid_results where technical_result='CONSENT_ACKNOWLEDGEMENT_INVALID'),8::bigint,'all false, missing, non-Boolean, null, malformed, and extra acknowledgements fail exact validation');
select is((select consent_status from public.research_consent_records where enrollment_id=(select value from r54 where key='enrollment') order by recorded_at desc,id desc limit 1),'PRESENTED','rejected acknowledgement attempts do not grant consent');
select is((select count(*) from public.research_control_audit_events where enrollment_id=(select value from r54 where key='enrollment') and event_type='CONSENT_DECISION_REJECTED' and reason_code='CONSENT_ACKNOWLEDGEMENT_INVALID'),8::bigint,'every rejected acknowledgement attempt is audit-visible');

select is((select technical_result from public.decide_wave4_synthetic_research_consent(
  (select value from r54 where key='enrollment'),'e1000000-0000-4000-8000-000000000011','GRANTED',true,true,true,
  '{"research_purpose":true,"voluntary_participation":true,"research_only_no_final_state":true,"privacy_data_use":true,"withdrawal_no_automatic_deletion":true}',
  (select value from r54 where key='presentation'),
  (select artifact_version from public.research_consent_presentation_events where id=(select value from r54 where key='presentation')),
  (select artifact_sha256 from public.research_consent_presentation_events where id=(select value from r54 where key='presentation')),
  (select presented_at from public.research_consent_presentation_events where id=(select value from r54 where key='presentation')) + interval '1 second',gen_random_uuid()
)),'CONSENT_PRESENTATION_STALE','stale or tampered presentation binding fails closed');
select is((select consent_status from public.research_consent_records where enrollment_id=(select value from r54 where key='enrollment') order by recorded_at desc,id desc limit 1),'PRESENTED','stale presentation rejection does not mutate consent state');

select is((select technical_result from public.decide_wave4_synthetic_research_consent(
  (select value from r54 where key='enrollment'),'e1000000-0000-4000-8000-000000000011','GRANTED',true,true,true,
  '{"research_purpose":true,"voluntary_participation":true,"research_only_no_final_state":true,"privacy_data_use":true,"withdrawal_no_automatic_deletion":true}',
  (select value from r54 where key='presentation'),
  (select artifact_version from public.research_consent_presentation_events where id=(select value from r54 where key='presentation')),
  (select artifact_sha256 from public.research_consent_presentation_events where id=(select value from r54 where key='presentation')),
  (select presented_at from public.research_consent_presentation_events where id=(select value from r54 where key='presentation')),gen_random_uuid()
)),'CONSENT_GRANTED','all five exact Boolean true acknowledgements grant consent');
select is((select count(*) from public.research_consent_decision_bindings where enrollment_id=(select value from r54 where key='enrollment')),1::bigint,'granted decision has one immutable presentation binding');
select throws_ok('update public.research_consent_decision_bindings set decision=''DECLINED''','P1001','Research control history is append-only.','consent decision binding is append-only');

select lives_ok(format($q$select public.require_research_reconsent(%L,'e1000000-0000-4000-8000-000000000001','AUTHORITY_VERSION_CHANGE',gen_random_uuid())$q$,(select value from r54 where key='enrollment')),'governed re-consent can still be required');
select is((select consent_status from public.research_consent_records where enrollment_id=(select value from r54 where key='enrollment') order by recorded_at desc,id desc limit 1),'RECONSENT_REQUIRED','re-consent requirement blocks prior grant');
select lives_ok(format($q$select * from public.present_wave4_synthetic_research_consent(%L,'e1000000-0000-4000-8000-000000000001',gen_random_uuid())$q$,(select value from r54 where key='enrollment')),'participant can receive a fresh controlled presentation after re-consent is required');
select is((select count(*) from public.research_consent_presentation_events where enrollment_id=(select value from r54 where key='enrollment')),2::bigint,'fresh re-consent presentation is preserved as a new immutable event');

insert into public.research_control_audit_events(participant_research_identity_id,enrollment_id,event_type,actor_type,actor_user_id,reason_code,occurred_at,recorded_at,correlation_id,metadata)
select e.participant_research_identity_id,e.id,'PAGINATION_FIXTURE_'||g,'SYSTEM',null,'TEST_HISTORY',
  timestamptz '2026-08-10 00:00:00+00' + g*interval '1 minute',timestamptz '2026-08-10 00:00:00+00' + g*interval '1 minute',gen_random_uuid(),jsonb_build_object('ordinal',g)
from public.research_enrollments e cross join generate_series(1,30) g where e.id=(select value from r54 where key='enrollment');

create temporary table page1 as select * from public.get_admin_research_history_page(
  'e3000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','AUDIT',null,null,10,gen_random_uuid());
create temporary table page2 as select * from public.get_admin_research_history_page(
  'e3000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','AUDIT',(select next_cursor_at from page1),(select next_cursor_id from page1),10,gen_random_uuid());
select is((select jsonb_array_length(items) from page1),10,'history page applies requested bound');
select ok((select has_more from page1),'first bounded history page exposes a continuation cursor');
select is((select jsonb_array_length(items) from page2),10,'history continuation returns the next bounded page');
select is((select count(*) from jsonb_array_elements((select items from page1)) a join jsonb_array_elements((select items from page2)) b on a->>'history_id'=b->>'history_id'),0::bigint,'deterministic keyset pages do not overlap');
select throws_ok(format($q$select * from public.get_admin_research_history_page('e3000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','AUDIT',null,null,101,%L)$q$,gen_random_uuid()),'P1001','Research history page request is invalid.','history page rejects unbounded limits');
select throws_ok('update public.research_control_audit_events set reason_code=''MUTATED'' where event_type like ''PAGINATION_FIXTURE_%''','P1001','Research control history is append-only.','pagination never weakens authoritative history immutability');
select ok((select count(*) from public.research_control_audit_events where event_type like 'PAGINATION_FIXTURE_%')=30,'pagination preserves every authoritative history row');

select is((select gate_status from public.evaluate_wave3_release_gate('synthetic_test','e1000000-0000-4000-8000-000000000001',gen_random_uuid())),'BLOCKED','release remains fail-closed after remediation');
select * from finish();
rollback;
