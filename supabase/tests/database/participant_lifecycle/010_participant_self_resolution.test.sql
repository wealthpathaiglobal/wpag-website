begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(24);

select ok(to_regprocedure('public.get_current_participant()') is not null, 'self-resolution RPC exists');
select ok((select prosecdef from pg_proc where oid=to_regprocedure('public.get_current_participant()')), 'RPC is security definer');
select is((select provolatile from pg_proc where oid=to_regprocedure('public.get_current_participant()')), 's'::"char", 'RPC is stable');
select is((select pg_get_userbyid(proowner) from pg_proc where oid=to_regprocedure('public.get_current_participant()')), 'postgres', 'RPC owner is postgres');
select ok((select proconfig @> array['search_path=public, pg_catalog'] from pg_proc where oid=to_regprocedure('public.get_current_participant()')), 'RPC search path controlled');
select ok((select not exists(select 1 from aclexplode(proacl) where grantee=0) from pg_proc where oid=to_regprocedure('public.get_current_participant()')), 'PUBLIC denied');
select ok(not has_function_privilege('anon','public.get_current_participant()','EXECUTE'), 'anon denied');
select ok(has_function_privilege('authenticated','public.get_current_participant()','EXECUTE'), 'authenticated allowed');
select ok(not has_function_privilege('service_role','public.get_current_participant()','EXECUTE'), 'service role not granted');
select is((select proargnames from pg_proc where oid=to_regprocedure('public.get_current_participant()')), array['participant_id','participant_code','lifecycle_status','research_status','enrollment_date','profile_completed']::text[], 'projection names are exact');
select throws_ok($$select * from public.get_current_participant()$$, 'P1001', 'Authentication is required.', 'missing authentication rejected');

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('00000000-0000-0000-0000-000000000000','a1000000-0000-4000-8000-000000000001','authenticated','authenticated','linked@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','a1000000-0000-4000-8000-000000000002','authenticated','authenticated','other@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','a1000000-0000-4000-8000-000000000003','authenticated','authenticated','deleted@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01');
insert into public.participants(id,participant_code,auth_user_id,lifecycle_status,research_status,enrollment_date,deleted_at,created_at) values
('a2000000-0000-4000-8000-000000000001','WPAG-990001','a1000000-0000-4000-8000-000000000001','active','enrolled','2026-01-02',null,'2026-01-01'),
('a2000000-0000-4000-8000-000000000002','WPAG-990002','a1000000-0000-4000-8000-000000000003','active','enrolled','2026-01-02','2026-02-01','2026-01-01');
insert into public.participant_profiles(participant_id,auth_user_id,first_name,last_name,profile_completed,profile_completed_at) values
('a2000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000001','Linked','Participant',true,'2026-01-03');

set local role authenticated;
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000001',true);
select is((select participant_id from public.get_current_participant()), 'a2000000-0000-4000-8000-000000000001'::uuid, 'linked participant resolved');
select is((select participant_code from public.get_current_participant()), 'WPAG-990001', 'participant code mapped');
select is((select lifecycle_status from public.get_current_participant()), 'active', 'lifecycle status mapped');
select is((select research_status from public.get_current_participant()), 'enrolled', 'research status mapped');
select is((select enrollment_date from public.get_current_participant()), '2026-01-02'::date, 'enrollment date mapped');
select ok((select profile_completed from public.get_current_participant()), 'profile completion mapped');
select is((select count(*) from public.get_current_participant()), 1::bigint, 'cannot resolve another participant');
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000002',true);
select is((select count(*) from public.get_current_participant()), 0::bigint, 'nonparticipant returns no row');
select set_config('request.jwt.claim.sub','a1000000-0000-4000-8000-000000000003',true);
select is((select count(*) from public.get_current_participant()), 0::bigint, 'soft-deleted participant excluded');
reset role;

select ok(not has_table_privilege('authenticated','public.participants','SELECT'), 'authenticated participant table read remains denied');
select ok(not has_table_privilege('authenticated','public.participant_profiles','SELECT'), 'authenticated profile table read remains denied');
select ok(not has_table_privilege('anon','public.participants','SELECT'), 'anon participant table read remains denied');
select ok(has_function_privilege('service_role','public.accept_participant_invitation(uuid,uuid)','EXECUTE'), 'invitation acceptance permission preserved');
select * from finish();
rollback;
