begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select no_plan();

select ok(to_regclass(name) is not null,name || ' exists') from unnest(array[
 'public.participant_research_identities','public.research_enrollments','public.research_enrollment_status_history',
 'public.research_consent_records','public.research_privacy_bindings','public.research_withdrawal_records',
 'public.research_control_audit_events','public.research_release_firewall']) name;

select ok(to_regprocedure(name) is not null,name || ' exists') from unnest(array[
 'public.create_or_get_participant_research_identity(uuid,uuid,text,uuid)',
 'public.create_or_get_research_enrollment(uuid,uuid,text,text,text,text,text,text,text,text,uuid)',
 'public.evaluate_research_consent_gate(uuid,text,boolean)','public.evaluate_research_privacy_gate(uuid)',
 'public.evaluate_wave1_research_readiness(uuid,text,boolean)',
 'public.record_research_consent_transition(uuid,uuid,text,text,text,text,jsonb,text[],text[],boolean,text,text,jsonb,text,uuid)',
 'public.require_research_reconsent(uuid,uuid,text,uuid)',
 'public.record_research_privacy_binding(uuid,uuid,text,text[],text,text,text,text,text,text,text,text,boolean,boolean,boolean,boolean,boolean,boolean,text,uuid)',
 'public.request_research_withdrawal(uuid,uuid,text[],text,text,uuid)',
 'public.transition_research_withdrawal(uuid,uuid,text,text,uuid)',
 'public.get_research_controls_status(uuid,uuid,text)']) name;

select ok((select prosecdef from pg_proc where oid=to_regprocedure(name)),name || ' is security definer') from unnest(array[
 'public.create_or_get_participant_research_identity(uuid,uuid,text,uuid)',
 'public.create_or_get_research_enrollment(uuid,uuid,text,text,text,text,text,text,text,text,uuid)',
 'public.record_research_consent_transition(uuid,uuid,text,text,text,text,jsonb,text[],text[],boolean,text,text,jsonb,text,uuid)',
 'public.request_research_withdrawal(uuid,uuid,text[],text,text,uuid)',
 'public.transition_research_withdrawal(uuid,uuid,text,text,uuid)']) name;

select ok((select proconfig @> array['search_path=public, pg_catalog'] from pg_proc where oid=to_regprocedure(name)),name || ' has controlled search path') from unnest(array[
 'public.create_or_get_participant_research_identity(uuid,uuid,text,uuid)',
 'public.create_or_get_research_enrollment(uuid,uuid,text,text,text,text,text,text,text,text,uuid)',
 'public.record_research_consent_transition(uuid,uuid,text,text,text,text,jsonb,text[],text[],boolean,text,text,jsonb,text,uuid)',
 'public.request_research_withdrawal(uuid,uuid,text[],text,text,uuid)',
 'public.transition_research_withdrawal(uuid,uuid,text,text,uuid)']) name;

select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid=name::regclass),name || ' forces RLS') from unnest(array[
 'public.participant_research_identities','public.research_enrollments','public.research_enrollment_status_history',
 'public.research_consent_records','public.research_privacy_bindings','public.research_withdrawal_records',
 'public.research_control_audit_events','public.research_release_firewall']) name;

select ok(not has_table_privilege(role_name,'public.research_consent_records','SELECT'),role_name || ' cannot directly read research consent')
from unnest(array['anon','authenticated','service_role']) role_name;
select ok(not has_table_privilege(role_name,'public.research_withdrawal_records','INSERT'),role_name || ' cannot directly write withdrawal history')
from unnest(array['anon','authenticated','service_role']) role_name;

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('00000000-0000-0000-0000-000000000000','a1000000-0000-4000-8000-000000000001','authenticated','authenticated','admin50@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','a1000000-0000-4000-8000-000000000002','authenticated','authenticated','outsider50@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','a1000000-0000-4000-8000-000000000011','authenticated','authenticated','participant1@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','a1000000-0000-4000-8000-000000000012','authenticated','authenticated','participant2@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','a1000000-0000-4000-8000-000000000013','authenticated','authenticated','participant3@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','a1000000-0000-4000-8000-000000000014','authenticated','authenticated','participant4@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01');

insert into public.staff_members(id,auth_user_id,staff_code,full_name,email,status,created_at) values
('a2000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000001','WPAG-STF-950001','Research Administrator','admin50@test.local','active','2026-01-01');
insert into public.staff_member_roles(staff_member_id,staff_role_id,is_active,assigned_at)
select 'a2000000-0000-4000-8000-000000000001',id,true,'2026-01-01' from public.staff_roles where role_code='administrator';

insert into public.participants(id,auth_user_id,participant_code,lifecycle_status,created_at) values
('a3000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000011','WPAG-950001','active','2026-01-01'),
('a3000000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000000012','WPAG-950002','active','2026-01-01'),
('a3000000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000000013','WPAG-950003','active','2026-01-01'),
('a3000000-0000-4000-8000-000000000004','a1000000-0000-4000-8000-000000000014','WPAG-950004','active','2026-01-01'),
('a3000000-0000-4000-8000-000000000005',null,'WPAG-950005','active','2026-01-01');

select throws_ok($$select * from public.create_or_get_participant_research_identity('a3000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000002','Lifecycle-v0.2',gen_random_uuid())$$,'P1001','Actor is not authorized to govern research identity.','outsider cannot create research linkage');
select throws_ok($$select * from public.create_or_get_participant_research_identity('a3000000-0000-4000-8000-000000000005','a1000000-0000-4000-8000-000000000001','Lifecycle-v0.2',gen_random_uuid())$$,'P1001','Participant is not eligible for research identity linkage.','unlinked direct identity fails closed');

create temporary table wave1_test_ids(key text primary key,value uuid not null);
insert into wave1_test_ids
select 'enrollment1',enrollment_id from public.create_or_get_research_enrollment('a3000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000001','FSH Phase 1','PUR-01','Protocol-v1','Consent-v0.2','Privacy-v0.1','Lifecycle-v0.2','Evidence-v0.1','synthetic_test','a9000000-0000-4000-8000-000000000001');

select isnt((select r.id from public.participant_research_identities r where r.participant_id='a3000000-0000-4000-8000-000000000001'),
             'a3000000-0000-4000-8000-000000000001'::uuid,'research identity is distinct from direct participant identity');
select is((select lifecycle_status from public.research_enrollment_status_history where enrollment_id=(select value from wave1_test_ids where key='enrollment1')),'PRE_ENROLLMENT','foundation creates PRE_ENROLLMENT only');
select is((select activation_authority_status from public.research_enrollments where id=(select value from wave1_test_ids where key='enrollment1')),'BLOCKED','actual enrollment activation is blocked');
select is((select consent_status from public.research_consent_records where enrollment_id=(select value from wave1_test_ids where key='enrollment1')),'NOT_PRESENTED','consent begins NOT_PRESENTED');
select is((select withdrawal_status from public.research_withdrawal_records where enrollment_id=(select value from wave1_test_ids where key='enrollment1')),'NONE','withdrawal begins explicit NONE');
select is(public.evaluate_research_privacy_gate((select value from wave1_test_ids where key='enrollment1')),'UNRESOLVED','default legal/privacy posture is unresolved and fail closed');

select lives_ok(format($q$select * from public.record_research_consent_transition(%L,'a1000000-0000-4000-8000-000000000001','PRESENTED','Consent-Content-v1',repeat('a',64),'Protocol-v1','{"FSH":"FSH-PLAN-v1"}',array['FSH'],array['BASELINE_RESEARCH'],false,'en-IN-v1','INTERNAL_SYNTHETIC','{}','CONTROLLED_PRESENTATION','a9000000-0000-4000-8000-000000000002')$q$,(select value from wave1_test_ids where key='enrollment1')),'admin may record exact controlled presentation');
select throws_ok(format($q$select * from public.record_research_consent_transition(%L,'a1000000-0000-4000-8000-000000000001','GRANTED','Consent-Content-v1',repeat('a',64),'Protocol-v1','{"FSH":"FSH-PLAN-v1"}',array['FSH'],array['BASELINE_RESEARCH'],false,'en-IN-v1','INTERNAL_SYNTHETIC','{"affirmative":true}','PARTICIPANT_GRANT','a9000000-0000-4000-8000-000000000003')$q$,(select value from wave1_test_ids where key='enrollment1')),'P1001','Research consent transition is not authorized.','admin cannot grant consent for participant');
select lives_ok(format($q$select * from public.record_research_consent_transition(%L,'a1000000-0000-4000-8000-000000000011','GRANTED','Consent-Content-v1',repeat('a',64),'Protocol-v1','{"FSH":"FSH-PLAN-v1"}',array['FSH'],array['BASELINE_RESEARCH'],false,'en-IN-v1','INTERNAL_SYNTHETIC','{"affirmative":true}','PARTICIPANT_GRANT','a9000000-0000-4000-8000-000000000004')$q$,(select value from wave1_test_ids where key='enrollment1')),'linked participant may record affirmative synthetic grant');
select is(public.evaluate_research_consent_gate((select value from wave1_test_ids where key='enrollment1'),'FSH',false),'OPEN','GRANTED plus NONE and exact FSH versions opens consent gate');
select is(public.evaluate_research_consent_gate((select value from wave1_test_ids where key='enrollment1'),'MGN',false),'BLOCKED','ungranted family remains blocked');
select is(public.evaluate_research_consent_gate((select value from wave1_test_ids where key='enrollment1'),'FSH',true),'BLOCKED','baseline consent does not imply follow-up');

select lives_ok(format($q$select * from public.record_research_privacy_binding(%L,'a1000000-0000-4000-8000-000000000001','PUR-01',array['RESEARCH_IDENTITY','CONSENT_WITHDRAWAL','AUDIT_PROVENANCE'],'STANDARD_RESTRICTED','RESTRICTED_RESEARCH','PURPOSE_SCOPED','RC-01','ACTIVE_RETAIN','NO_EXTERNAL_SHARING','NOT_AUTHORIZED','NONE',true,true,true,true,false,false,'SYNTHETIC_PRIVACY_OPEN','a9000000-0000-4000-8000-000000000005')$q$,(select value from wave1_test_ids where key='enrollment1')),'governed privacy successor recorded');
select is(public.evaluate_research_privacy_gate((select value from wave1_test_ids where key='enrollment1')),'OPEN','complete compatible privacy binding opens privacy gate');
select ok((select consent_gate='OPEN' and privacy_gate='OPEN' and wave1_gate='OPEN' and not actual_enrollment_authorized and not evidence_collection_authorized and soft_launch_release_gate='BLOCKED' and not pilot_authorized and not production_authorized from public.evaluate_wave1_research_readiness((select value from wave1_test_ids where key='enrollment1'),'FSH',false)),'wave1 controls can pass while all activation firewalls remain closed');

select lives_ok(format($q$select * from public.request_research_withdrawal(%L,'a1000000-0000-4000-8000-000000000011',array['ALL_RESEARCH'],'PARTICIPANT_PORTAL','Synthetic request','a9000000-0000-4000-8000-000000000006')$q$,(select value from wave1_test_ids where key='enrollment1')),'participant withdrawal request succeeds');
select is(public.evaluate_research_consent_gate((select value from wave1_test_ids where key='enrollment1'),'FSH',false),'BLOCKED','REQUESTED withdrawal blocks consent gate immediately');
select throws_ok(format($q$select * from public.request_research_withdrawal(%L,'a1000000-0000-4000-8000-000000000001',array['ALL_RESEARCH'],'ADMIN','Override','a9000000-0000-4000-8000-000000000007')$q$,(select value from wave1_test_ids where key='enrollment1')),'P1001','Only the linked participant may request research withdrawal.','admin cannot request or override participant withdrawal');

select lives_ok(format($q$select * from public.transition_research_withdrawal(%L,'a1000000-0000-4000-8000-000000000001','VERIFIED','Identity verified','a9000000-0000-4000-8000-000000000008')$q$,(select value from wave1_test_ids where key='enrollment1')),'withdrawal verifies');
select is(public.evaluate_research_consent_gate((select value from wave1_test_ids where key='enrollment1'),'FSH',false),'BLOCKED','VERIFIED withdrawal stays blocked');
select lives_ok(format($q$select * from public.transition_research_withdrawal(%L,'a1000000-0000-4000-8000-000000000001','EFFECTIVE','Effective','a9000000-0000-4000-8000-000000000009')$q$,(select value from wave1_test_ids where key='enrollment1')),'withdrawal becomes effective');
select is(public.evaluate_research_consent_gate((select value from wave1_test_ids where key='enrollment1'),'FSH',false),'BLOCKED','EFFECTIVE withdrawal stays blocked');
select lives_ok(format($q$select * from public.transition_research_withdrawal(%L,'a1000000-0000-4000-8000-000000000001','PROCESSING','Processing','a9000000-0000-4000-8000-000000000010')$q$,(select value from wave1_test_ids where key='enrollment1')),'withdrawal enters processing');
select is(public.evaluate_research_consent_gate((select value from wave1_test_ids where key='enrollment1'),'FSH',false),'BLOCKED','PROCESSING withdrawal stays blocked');
select lives_ok(format($q$select * from public.transition_research_withdrawal(%L,'a1000000-0000-4000-8000-000000000001','COMPLETED','Completed','a9000000-0000-4000-8000-000000000011')$q$,(select value from wave1_test_ids where key='enrollment1')),'withdrawal completes');
select is(public.evaluate_research_consent_gate((select value from wave1_test_ids where key='enrollment1'),'FSH',false),'BLOCKED','COMPLETED withdrawal cannot reactivate');
select throws_ok(format($q$update public.research_withdrawal_records set reason='changed' where enrollment_id=%L$q$,(select value from wave1_test_ids where key='enrollment1')),'P1001','Research control history is append-only.','withdrawal history is immutable');
select throws_ok(format($q$delete from public.research_control_audit_events where enrollment_id=%L$q$,(select value from wave1_test_ids where key='enrollment1')),'P1001','Research control history is append-only.','research audit is immutable');

insert into wave1_test_ids
select 'enrollment2',enrollment_id from public.create_or_get_research_enrollment('a3000000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000000001','FSH Phase 1','PUR-01','Protocol-v1','Consent-v0.2','Privacy-v0.1','Lifecycle-v0.2','Evidence-v0.1','synthetic_test','a9000000-0000-4000-8000-000000000012');
select lives_ok(format($q$select * from public.record_research_consent_transition(%L,'a1000000-0000-4000-8000-000000000001','PRESENTED','Consent-Content-v1',repeat('b',64),'Protocol-v1','{"FSH":"FSH-PLAN-v1"}',array['FSH'],array['BASELINE_RESEARCH'],false,'en-IN-v1','INTERNAL_SYNTHETIC','{}','PRESENT','a9000000-0000-4000-8000-000000000013')$q$,(select value from wave1_test_ids where key='enrollment2')),'second presentation succeeds');
select lives_ok(format($q$select * from public.record_research_consent_transition(%L,'a1000000-0000-4000-8000-000000000012','GRANTED','Consent-Content-v1',repeat('b',64),'Protocol-v1','{"FSH":"FSH-PLAN-v1"}',array['FSH'],array['BASELINE_RESEARCH'],false,'en-IN-v1','INTERNAL_SYNTHETIC','{"affirmative":true}','GRANT','a9000000-0000-4000-8000-000000000014')$q$,(select value from wave1_test_ids where key='enrollment2')),'second grant succeeds');
select lives_ok(format($q$select public.require_research_reconsent(%L,'a1000000-0000-4000-8000-000000000001','MATERIAL_SCOPE_CHANGE','a9000000-0000-4000-8000-000000000015')$q$,(select value from wave1_test_ids where key='enrollment2')),'reconsent requirement creates successor');
select is(public.evaluate_research_consent_gate((select value from wave1_test_ids where key='enrollment2'),'FSH',false),'BLOCKED','RECONSENT_REQUIRED blocks immediately');
select is((select count(*) from public.research_consent_records where enrollment_id=(select value from wave1_test_ids where key='enrollment2')),4::bigint,'successor consent preserves predecessor history');

insert into wave1_test_ids
select 'enrollment3',enrollment_id from public.create_or_get_research_enrollment('a3000000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000000001','FSH Phase 1','PUR-01','Protocol-v1','Consent-v0.2','Privacy-v0.1','Lifecycle-v0.2','Evidence-v0.1','synthetic_test','a9000000-0000-4000-8000-000000000016');
select lives_ok(format($q$select * from public.record_research_consent_transition(%L,'a1000000-0000-4000-8000-000000000001','PRESENTED','Consent-Content-v1',repeat('c',64),'Protocol-v1','{"FSH":"FSH-PLAN-v1"}',array['FSH'],array['BASELINE_RESEARCH'],false,'en-IN-v1','INTERNAL_SYNTHETIC','{}','PRESENT','a9000000-0000-4000-8000-000000000017')$q$,(select value from wave1_test_ids where key='enrollment3')),'decline presentation succeeds');
select lives_ok(format($q$select * from public.record_research_consent_transition(%L,'a1000000-0000-4000-8000-000000000013','DECLINED','Consent-Content-v1',repeat('c',64),'Protocol-v1','{"FSH":"FSH-PLAN-v1"}',array['FSH'],array['BASELINE_RESEARCH'],false,'en-IN-v1','INTERNAL_SYNTHETIC','{}','DECLINE','a9000000-0000-4000-8000-000000000018')$q$,(select value from wave1_test_ids where key='enrollment3')),'participant decline succeeds');
select is(public.evaluate_research_consent_gate((select value from wave1_test_ids where key='enrollment3'),'FSH',false),'BLOCKED','DECLINED remains blocked');
insert into public.research_consent_records(enrollment_id,predecessor_consent_id,consent_status,consent_content_version,consent_content_sha256,protocol_research_plan_version,family_plan_versions,granted_family_scope,evidence_use_scope,follow_up_scope_granted,locale_language_version,source_interface,acknowledgement_record,reconsent_requirement,occurred_at,correlation_id)
select enrollment_id,id,'SUPERSEDED',consent_content_version,consent_content_sha256,protocol_research_plan_version,family_plan_versions,granted_family_scope,evidence_use_scope,follow_up_scope_granted,locale_language_version,source_interface,acknowledgement_record,'NOT_APPLICABLE',clock_timestamp(),'a9000000-0000-4000-8000-000000000019'
from public.research_consent_records where enrollment_id=(select value from wave1_test_ids where key='enrollment3') order by recorded_at desc,id desc limit 1;
select is(public.evaluate_research_consent_gate((select value from wave1_test_ids where key='enrollment3'),'FSH',false),'BLOCKED','SUPERSEDED historical record cannot open gate');

insert into wave1_test_ids
select 'enrollment4',enrollment_id from public.create_or_get_research_enrollment('a3000000-0000-4000-8000-000000000004','a1000000-0000-4000-8000-000000000001','FSH Phase 1','PUR-01','Protocol-v1','Consent-v0.2','Privacy-v0.1','Lifecycle-v0.2','Evidence-v0.1','synthetic_test','a9000000-0000-4000-8000-000000000020');
select lives_ok(format($q$select * from public.request_research_withdrawal(%L,'a1000000-0000-4000-8000-000000000014',array['ALL_RESEARCH'],'PARTICIPANT_PORTAL','Exception case','a9000000-0000-4000-8000-000000000021')$q$,(select value from wave1_test_ids where key='enrollment4')),'exception-case request succeeds');
select lives_ok(format($q$select * from public.transition_research_withdrawal(%L,'a1000000-0000-4000-8000-000000000001','EXCEPTION_REVIEW_REQUIRED','Identity mismatch','a9000000-0000-4000-8000-000000000022')$q$,(select value from wave1_test_ids where key='enrollment4')),'exception review status is governed');
select is(public.evaluate_research_consent_gate((select value from wave1_test_ids where key='enrollment4'),'FSH',false),'BLOCKED','EXCEPTION_REVIEW_REQUIRED remains blocked');

select ok((select count(*)=5 and bool_and(actual_enrollment_status in ('BLOCKED','NOT_AUTHORIZED')) and bool_and(evidence_collection_status in ('BLOCKED','NOT_AUTHORIZED')) and bool_and(pilot_status='NOT_AUTHORIZED') and bool_and(production_status='NOT_AUTHORIZED') from public.research_release_firewall),'release firewall blocks all configured environments');
select ok((select count(*) > 0 from public.research_control_audit_events where event_type='RESEARCH_IDENTITY_LINKED'),'identity linkage audit events are present');
select ok((select count(*) > 0 from public.research_control_audit_events where event_type='WITHDRAWAL_REQUESTED'),'withdrawal request audit event is present');
select is((select evidence_collection_authorized from public.get_research_controls_status('a3000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000011','FSH')),false,'participant-safe status projection never authorizes evidence collection');
select throws_ok($$select * from public.get_research_controls_status('a3000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000002','FSH')$$,'P1001','Actor is not authorized to access research controls.','cross-user status access denied');

select * from finish();
rollback;
