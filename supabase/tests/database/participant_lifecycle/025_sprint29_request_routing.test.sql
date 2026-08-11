begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,pg_catalog;
select no_plan();

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('00000000-0000-0000-0000-000000000000','e1000000-0000-4000-8000-000000000001','authenticated','authenticated','admin55@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','e1000000-0000-4000-8000-000000000002','authenticated','authenticated','reviewer55@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','e1000000-0000-4000-8000-000000000011','authenticated','authenticated','participant55@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','e1000000-0000-4000-8000-000000000012','authenticated','authenticated','other55@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01');
insert into public.staff_members(id,auth_user_id,staff_code,full_name,email,status,created_at) values
('e2000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','WPAG-STF-955001','Sprint 29 Admin','admin55@test.local','active','2026-01-01'),
('e2000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000002','WPAG-STF-955002','Sprint 29 Reviewer','reviewer55@test.local','active','2026-01-01');
insert into public.staff_member_roles(staff_member_id,staff_role_id,is_active,assigned_at)
select s.id,r.id,true,'2026-01-01' from public.staff_members s join public.staff_roles r on r.role_code=case when s.id='e2000000-0000-4000-8000-000000000001' then 'administrator' else 'reviewer' end where s.id::text like 'e2000000%';
insert into public.participants(id,auth_user_id,participant_code,lifecycle_status,created_at) values
('e3000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000011','WPAG-955001','active','2026-01-01'),
('e3000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000012','WPAG-955002','active','2026-01-01');

create temporary table s29(key text primary key,value uuid not null);
insert into s29 select 'enrollment',enrollment_id from public.create_or_get_research_enrollment('e3000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','FSH Phase 1','PUR-01','Protocol-v1','Consent-v0.2','Privacy-v0.1','Lifecycle-v0.2','Evidence-v0.1','synthetic_test','e9000000-0000-4000-8000-000000000001');

select lives_ok(format($q$select * from public.submit_research_participant_request(%L,'e1000000-0000-4000-8000-000000000011','ACCESS_REQUEST','Please route my access question.','e9000000-0000-4000-8000-000000000002')$q$,(select value from s29 where key='enrollment')),'owned access request is accepted');
insert into s29 select 'request',id from public.research_control_audit_events where event_type='PARTICIPANT_REQUEST_RECEIVED' limit 1;
select is((select metadata->>'request_status' from public.research_control_audit_events where id=(select value from s29 where key='request')),'RECEIVED','request is received append-only');
select is((select metadata->>'routing_class' from public.research_control_audit_events where id=(select value from s29 where key='request')),'PRIVACY_OPERATIONS','access request has deterministic route');
select is((select metadata->>'legal_entitlement_status' from public.research_control_audit_events where id=(select value from s29 where key='request')),'UNRESOLVED','no legal entitlement is invented');
select is((select metadata->>'legal_deadline_status' from public.research_control_audit_events where id=(select value from s29 where key='request')),'NOT_AUTHORIZED','no legal deadline is invented');
select throws_ok(format($q$select * from public.submit_research_participant_request(%L,'e1000000-0000-4000-8000-000000000012','ACCESS_REQUEST','Cross participant.','e9000000-0000-4000-8000-000000000003')$q$,(select value from s29 where key='enrollment')),'P1001','Actor is not authorized to submit this research request.','cross-participant request is denied');
select throws_ok(format($q$select * from public.submit_research_participant_request(%L,'e1000000-0000-4000-8000-000000000011','INVALID','Invalid.','e9000000-0000-4000-8000-000000000004')$q$,(select value from s29 where key='enrollment')),'P1001','Participant research request is invalid.','unsupported request type is denied');
select throws_ok(format($q$select * from public.route_research_participant_request(%L,'e1000000-0000-4000-8000-000000000002','ROUTED','PRIVACY_OPERATIONS','ROUTING_CONFIRMED','e9000000-0000-4000-8000-000000000005')$q$,(select value from s29 where key='request')),'P1001','Actor is not authorized to route participant research requests.','non-administrator routing is denied');
select lives_ok(format($q$select * from public.route_research_participant_request(%L,'e1000000-0000-4000-8000-000000000001','ROUTED','PRIVACY_OPERATIONS','ROUTING_CONFIRMED','e9000000-0000-4000-8000-000000000006')$q$,(select value from s29 where key='request')),'administrator routes request');
select lives_ok(format($q$select * from public.route_research_participant_request(%L,'e1000000-0000-4000-8000-000000000001','IN_REVIEW','PRIVACY_OPERATIONS','REVIEW_STARTED','e9000000-0000-4000-8000-000000000007')$q$,(select value from s29 where key='request')),'administrator starts review');
select lives_ok(format($q$select * from public.route_research_participant_request(%L,'e1000000-0000-4000-8000-000000000001','COMPLETED','PRIVACY_OPERATIONS','ROUTING_COMPLETED','e9000000-0000-4000-8000-000000000008')$q$,(select value from s29 where key='request')),'administrator completes operational routing');
select throws_ok(format($q$select * from public.route_research_participant_request(%L,'e1000000-0000-4000-8000-000000000001','COMPLETED','PRIVACY_OPERATIONS','REPEAT_COMPLETION','e9000000-0000-4000-8000-000000000009')$q$,(select value from s29 where key='request')),'P1001','Participant research request transition is not allowed.','terminal transition cannot repeat');
select is((select request_status from public.list_participant_research_requests('e3000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000011') where request_event_id=(select value from s29 where key='request')),'COMPLETED','participant safe list shows latest status');
select throws_ok($q$select * from public.list_participant_research_requests('e3000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000012')$q$,'P1001','Actor is not authorized to access participant research requests.','cross-participant list is denied');
select is((select details from public.list_admin_research_requests('e3000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001') where request_event_id=(select value from s29 where key='request')),'Please route my access question.','authorized administrator receives request detail');
select throws_ok($q$select * from public.list_admin_research_requests('e3000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000002')$q$,'P1001','Actor is not authorized to access participant research requests.','reviewer cannot access restricted request detail');
select throws_ok($q$update public.research_control_audit_events set reason_code='tampered' where event_type='PARTICIPANT_REQUEST_RECEIVED'$q$,'P1001','Research control history is append-only.','request history is immutable');
select ok(not has_function_privilege('authenticated','public.submit_research_participant_request(uuid,uuid,text,text,uuid)','EXECUTE'),'browser role has no direct request mutation grant');
select ok(not has_function_privilege('authenticated','public.list_admin_research_requests(uuid,uuid)','EXECUTE'),'browser role has no privileged request projection grant');
select ok(not has_table_privilege('service_role','public.research_participant_request_details','SELECT'),'service role cannot bypass the governed detail projection');
select is((select metadata ? 'details' from public.research_control_audit_events where id=(select value from s29 where key='request')),false,'general Audit metadata does not contain request free text');
select throws_ok($q$update public.research_participant_request_details set details='tampered'$q$,'P1001','Research control history is append-only.','restricted request detail is immutable');
select is((select gate_status from public.evaluate_wave3_release_gate('synthetic_test','e1000000-0000-4000-8000-000000000001','e9000000-0000-4000-8000-000000000010')),'BLOCKED','request routing cannot open release gate');
select is((select count(*) from public.research_release_gate_assessments where gate_status='OPEN'),0::bigint,'no open release assessment exists');

select * from finish();
rollback;
