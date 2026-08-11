begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,pg_catalog;
select no_plan();

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('00000000-0000-0000-0000-000000000000','f1000000-0000-4000-8000-000000000001','authenticated','authenticated','hfos-30c-local-fixture-admin-reviewer-a@synthetic.invalid','','2026-01-01','{"provider":"email","providers":["email"]}','{"hfos_environment":"STAGING","hfos_fixture":"SPRINT_30C_SYNTHETIC","hfos_fixture_actor":"admin-reviewer-a"}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','f1000000-0000-4000-8000-000000000002','authenticated','authenticated','hfos-30c-local-fixture-admin-reviewer-b@synthetic.invalid','','2026-01-01','{"provider":"email","providers":["email"]}','{"hfos_environment":"STAGING","hfos_fixture":"SPRINT_30C_SYNTHETIC","hfos_fixture_actor":"admin-reviewer-b"}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','f1000000-0000-4000-8000-000000000003','authenticated','authenticated','hfos-30c-local-fixture-support-only@synthetic.invalid','','2026-01-01','{"provider":"email","providers":["email"]}','{"hfos_environment":"STAGING","hfos_fixture":"SPRINT_30C_SYNTHETIC","hfos_fixture_actor":"support-only"}','2026-01-01','2026-01-01');

select set_config('request.headers','{"host":"dllefpzhmelflbmopdas.supabase.co"}',true);
select lives_ok($q$select * from public.manage_sprint30c_synthetic_staff_fixtures(
  'STAGING','dllefpzhmelflbmopdas','BLOCKED','local-fixture',
  'f1000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000002','f1000000-0000-4000-8000-000000000003','CREATE')$q$,
  'exact staging boundary creates controlled synthetic staff fixtures');
select is((select count(*) from public.staff_members where email::text like 'hfos-30c-local-fixture-%@synthetic.invalid'),3::bigint,'only three controlled staff fixtures exist');
select is((select count(*) from public.staff_member_roles smr join public.staff_members sm on sm.id=smr.staff_member_id where sm.email::text like 'hfos-30c-local-fixture-%@synthetic.invalid' and smr.is_active),7::bigint,'exact governed role matrix is active');
select ok(public.has_role('f1000000-0000-4000-8000-000000000001','administrator'),'first independent actor is an administrator');
select ok(public.has_role('f1000000-0000-4000-8000-000000000002','administrator'),'second independent actor is an administrator');
select ok(not public.has_role('f1000000-0000-4000-8000-000000000003','administrator'),'support-only actor is not an administrator');
select throws_ok($q$select * from public.manage_sprint30c_synthetic_staff_fixtures(
  'PRODUCTION','ujitsgycbnswvomlqetr','BLOCKED','local-fixture',
  'f1000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000002','f1000000-0000-4000-8000-000000000003','CREATE')$q$,
  'P1001','Sprint 30C fixture boundary is not the controlled staging environment.','Production inputs are rejected');
select set_config('request.headers','{"host":"ujitsgycbnswvomlqetr.supabase.co"}',true);
select throws_ok($q$select * from public.manage_sprint30c_synthetic_staff_fixtures(
  'STAGING','dllefpzhmelflbmopdas','BLOCKED','local-fixture',
  'f1000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000002','f1000000-0000-4000-8000-000000000003','CREATE')$q$,
  'P1001','Sprint 30C fixture boundary is not the controlled staging environment.','Production host cannot activate staging fixture');
select set_config('request.headers','{"host":"dllefpzhmelflbmopdas.supabase.co"}',true);
select lives_ok($q$select * from public.manage_sprint30c_synthetic_staff_fixtures(
  'STAGING','dllefpzhmelflbmopdas','BLOCKED','local-fixture',
  'f1000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000002','f1000000-0000-4000-8000-000000000003','REVOKE')$q$,
  'controlled revocation succeeds');
select is((select count(*) from public.staff_members where email::text like 'hfos-30c-local-fixture-%@synthetic.invalid' and status='inactive'),3::bigint,'all synthetic staff fixtures are inactive after revocation');
select is((select count(*) from public.activity_timeline where entity_type='hfos_synthetic_fixture_actor'),6::bigint,'activation and revocation history is preserved');
select ok(not has_function_privilege('authenticated','public.manage_sprint30c_synthetic_staff_fixtures(text,text,text,text,uuid,uuid,uuid,text)','EXECUTE'),'browser role cannot execute the fixture boundary');
select ok(has_function_privilege('service_role','public.manage_sprint30c_synthetic_staff_fixtures(text,text,text,text,uuid,uuid,uuid,text)','EXECUTE'),'server-only operator role can execute the fixture boundary');

select * from finish();
rollback;
