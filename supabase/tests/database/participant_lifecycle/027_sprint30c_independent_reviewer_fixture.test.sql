begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,pg_catalog;
select no_plan();

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('00000000-0000-0000-0000-000000000000','f2000000-0000-4000-8000-000000000001','authenticated','authenticated','hfos-30c-local-independent-reviewer-c@synthetic.invalid','','2026-01-01','{"provider":"email","providers":["email"]}','{"hfos_environment":"STAGING","hfos_fixture":"SPRINT_30C_SYNTHETIC","hfos_fixture_actor":"independent-reviewer-c"}','2026-01-01','2026-01-01');

select set_config('request.headers','{"host":"dllefpzhmelflbmopdas.supabase.co"}',true);
select lives_ok($q$select * from public.manage_sprint30c_independent_reviewer_fixture(
  'STAGING','dllefpzhmelflbmopdas','BLOCKED','local','f2000000-0000-4000-8000-000000000001','CREATE')$q$,
  'exact staging boundary creates the reviewer-only independence fixture');
select ok(public.has_role('f2000000-0000-4000-8000-000000000001','reviewer'),'independent actor has reviewer authority');
select ok(not public.has_role('f2000000-0000-4000-8000-000000000001','administrator'),'independent actor has no administrator authority');
select throws_ok($q$select * from public.manage_sprint30c_independent_reviewer_fixture(
  'PRODUCTION','ujitsgycbnswvomlqetr','BLOCKED','local','f2000000-0000-4000-8000-000000000001','CREATE')$q$,
  'P1001','Sprint 30C independent-reviewer fixture boundary is not the controlled staging environment.','Production inputs are rejected');
select set_config('request.headers','{"host":"ujitsgycbnswvomlqetr.supabase.co"}',true);
select throws_ok($q$select * from public.manage_sprint30c_independent_reviewer_fixture(
  'STAGING','dllefpzhmelflbmopdas','BLOCKED','local','f2000000-0000-4000-8000-000000000001','CREATE')$q$,
  'P1001','Sprint 30C independent-reviewer fixture boundary is not the controlled staging environment.','Production host is rejected');
select set_config('request.headers','{"host":"dllefpzhmelflbmopdas.supabase.co"}',true);
select lives_ok($q$select * from public.manage_sprint30c_independent_reviewer_fixture(
  'STAGING','dllefpzhmelflbmopdas','BLOCKED','local','f2000000-0000-4000-8000-000000000001','REVOKE')$q$,
  'controlled revocation succeeds');
select ok(not public.has_role('f2000000-0000-4000-8000-000000000001','reviewer'),'reviewer authority is revoked');
select is((select count(*) from public.activity_timeline where entity_type='hfos_synthetic_fixture_actor' and entity_id='f2000000-0000-4000-8000-000000000001'),2::bigint,'activation and revocation audit events are preserved');
select ok(not has_function_privilege('authenticated','public.manage_sprint30c_independent_reviewer_fixture(text,text,text,text,uuid,text)','EXECUTE'),'browser role cannot execute the fixture boundary');
select ok(has_function_privilege('service_role','public.manage_sprint30c_independent_reviewer_fixture(text,text,text,text,uuid,text)','EXECUTE'),'server-only operator role can execute the fixture boundary');

select * from finish();
rollback;
