begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;

select plan(64);

select ok(to_regprocedure('public.get_current_participant_profile()') is not null, 'profile read RPC exists');
select ok(to_regprocedure('public.save_current_participant_profile(text,text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer,text,text,text)') is not null, 'profile save RPC exists');
select ok(to_regprocedure('public.complete_current_participant_profile()') is not null, 'profile completion RPC exists');
select ok((select prosecdef from pg_proc where oid=to_regprocedure('public.get_current_participant_profile()')), 'read RPC is security definer');
select ok((select prosecdef from pg_proc where oid=to_regprocedure('public.save_current_participant_profile(text,text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer,text,text,text)')), 'save RPC is security definer');
select ok((select prosecdef from pg_proc where oid=to_regprocedure('public.complete_current_participant_profile()')), 'complete RPC is security definer');
select is((select provolatile from pg_proc where oid=to_regprocedure('public.get_current_participant_profile()')), 's'::"char", 'read RPC is stable');
select is((select provolatile from pg_proc where oid=to_regprocedure('public.save_current_participant_profile(text,text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer,text,text,text)')), 'v'::"char", 'save RPC is volatile');
select is((select provolatile from pg_proc where oid=to_regprocedure('public.complete_current_participant_profile()')), 'v'::"char", 'complete RPC is volatile');
select is((select pg_get_userbyid(proowner) from pg_proc where oid=to_regprocedure('public.get_current_participant_profile()')), 'postgres', 'read RPC owner is postgres');
select is((select pg_get_userbyid(proowner) from pg_proc where oid=to_regprocedure('public.save_current_participant_profile(text,text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer,text,text,text)')), 'postgres', 'save RPC owner is postgres');
select is((select pg_get_userbyid(proowner) from pg_proc where oid=to_regprocedure('public.complete_current_participant_profile()')), 'postgres', 'complete RPC owner is postgres');
select ok((select proconfig @> array['search_path=public, pg_catalog'] from pg_proc where oid=to_regprocedure('public.get_current_participant_profile()')), 'read search path controlled');
select ok((select proconfig @> array['search_path=public, pg_catalog'] from pg_proc where oid=to_regprocedure('public.save_current_participant_profile(text,text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer,text,text,text)')), 'save search path controlled');
select ok((select proconfig @> array['search_path=public, pg_catalog'] from pg_proc where oid=to_regprocedure('public.complete_current_participant_profile()')), 'complete search path controlled');
select ok(not has_function_privilege('anon','public.get_current_participant_profile()','EXECUTE') and not has_function_privilege('anon','public.save_current_participant_profile(text,text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer,text,text,text)','EXECUTE') and not has_function_privilege('anon','public.complete_current_participant_profile()','EXECUTE'), 'anon denied all profile RPCs');
select ok(has_function_privilege('authenticated','public.get_current_participant_profile()','EXECUTE') and has_function_privilege('authenticated','public.save_current_participant_profile(text,text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer,text,text,text)','EXECUTE') and has_function_privilege('authenticated','public.complete_current_participant_profile()','EXECUTE'), 'authenticated allowed all profile RPCs');
select ok(not has_function_privilege('service_role','public.get_current_participant_profile()','EXECUTE') and not has_function_privilege('service_role','public.save_current_participant_profile(text,text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer,text,text,text)','EXECUTE') and not has_function_privilege('service_role','public.complete_current_participant_profile()','EXECUTE'), 'service role profile RPC execution not granted');
select throws_ok($$select * from public.get_current_participant_profile()$$, 'P1001', 'Authentication is required.', 'unauthenticated read rejected');

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('00000000-0000-0000-0000-000000000000','b1000000-0000-4000-8000-000000000001','authenticated','authenticated','owner@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','b1000000-0000-4000-8000-000000000002','authenticated','authenticated','other@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','b1000000-0000-4000-8000-000000000003','authenticated','authenticated','blocked@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','b1000000-0000-4000-8000-000000000004','authenticated','authenticated','nonparticipant@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','b1000000-0000-4000-8000-000000000005','authenticated','authenticated','deletedparticipant@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','b1000000-0000-4000-8000-000000000006','authenticated','authenticated','deletedprofile@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01');
insert into public.participants(id,participant_code,auth_user_id,lifecycle_status,created_at,deleted_at) values
('b2000000-0000-4000-8000-000000000001','WPAG-991001','b1000000-0000-4000-8000-000000000001','pending_enrollment','2026-01-01',null),
('b2000000-0000-4000-8000-000000000002','WPAG-991002','b1000000-0000-4000-8000-000000000002','active','2026-01-01',null),
('b2000000-0000-4000-8000-000000000003','WPAG-991003','b1000000-0000-4000-8000-000000000003','withdrawn','2026-01-01',null),
('b2000000-0000-4000-8000-000000000005','WPAG-991005','b1000000-0000-4000-8000-000000000005','active','2026-01-01','2026-02-01'),
('b2000000-0000-4000-8000-000000000006','WPAG-991006','b1000000-0000-4000-8000-000000000006','active','2026-01-01',null);
insert into public.participant_profiles(id,participant_id,auth_user_id,first_name,last_name,email,created_at,deleted_at) values
('b3000000-0000-4000-8000-000000000001','b2000000-0000-4000-8000-000000000001','b1000000-0000-4000-8000-000000000001','Owner','Draft','owner@test.local','2026-01-01',null),
('b3000000-0000-4000-8000-000000000002','b2000000-0000-4000-8000-000000000002','b1000000-0000-4000-8000-000000000002','Other','Person','other@test.local','2026-01-01',null),
('b3000000-0000-4000-8000-000000000003','b2000000-0000-4000-8000-000000000003','b1000000-0000-4000-8000-000000000003','Blocked','Person','blocked@test.local','2026-01-01',null),
('b3000000-0000-4000-8000-000000000005','b2000000-0000-4000-8000-000000000005','b1000000-0000-4000-8000-000000000005','Deleted','Participant','deletedparticipant@test.local','2026-01-01',null),
('b3000000-0000-4000-8000-000000000006','b2000000-0000-4000-8000-000000000006','b1000000-0000-4000-8000-000000000006','Deleted','Profile','deletedprofile@test.local','2026-01-01','2026-02-01');

set local role authenticated;
select set_config('request.jwt.claim.sub','b1000000-0000-4000-8000-000000000001',true);
select is((select first_name from public.get_current_participant_profile()), 'Owner', 'owner reads own profile');
select is((select email from public.get_current_participant_profile()), 'owner@test.local', 'narrow read includes account email');
select is((select count(*) from public.get_current_participant_profile()), 1::bigint, 'read returns one owned profile');
select is((select proargnames from pg_proc where oid=to_regprocedure('public.get_current_participant_profile()')), array['first_name','middle_name','last_name','preferred_name','date_of_birth','gender','marital_status','email','phone_country_code','phone_number','country_code','state','district','city','postal_code','education_level','occupation','employment_status','household_size','dependents','emergency_contact_name','emergency_contact_relationship','emergency_contact_phone','profile_completed','profile_completed_at','updated_at']::text[], 'read projection is exact');
select set_config('request.jwt.claim.sub','b1000000-0000-4000-8000-000000000004',true);
select is((select count(*) from public.get_current_participant_profile()), 0::bigint, 'nonparticipant cannot read a profile');
select set_config('request.jwt.claim.sub','b1000000-0000-4000-8000-000000000005',true);
select is((select count(*) from public.get_current_participant_profile()), 0::bigint, 'soft-deleted participant cannot read a profile');
select set_config('request.jwt.claim.sub','b1000000-0000-4000-8000-000000000006',true);
select is((select count(*) from public.get_current_participant_profile()), 0::bigint, 'soft-deleted profile cannot be read');
select set_config('request.jwt.claim.sub','b1000000-0000-4000-8000-000000000001',true);
select throws_ok($$select * from public.complete_current_participant_profile()$$, 'P1005', 'Participant profile is incomplete.', 'incomplete profile cannot complete');
select lives_ok($$select * from public.save_current_participant_profile('  Owner  ','',' Updated ','','1990-01-01','prefer_not_to_say','single','+91','9876543210','in',' Karnataka ','',' Bengaluru ','560001','','Engineer','employed',3,1,'Emergency Person','Sibling','+91 9876543211')$$, 'valid draft saves');
select is((select last_name from public.get_current_participant_profile()), 'Updated', 'saved name normalized');
select is((select country_code from public.get_current_participant_profile()), 'IN', 'country code normalized');
select is((select middle_name from public.get_current_participant_profile()), null::text, 'blank optional field normalized to null');
select lives_ok($$select * from public.save_current_participant_profile('Owner','','Updated','','1990-01-01','prefer_not_to_say','single','+91','9876543210','IN','Karnataka','','Bengaluru','560001','','Engineer','employed',3,1,'Emergency Person','Sibling','+91 9876543211')$$, 'repeated draft save is deterministic');
select ok((select updated_at > '2026-01-01 00:00:00+00'::timestamptz from public.get_current_participant_profile()), 'save updates audit timestamp');
select ok(not (select profile_completed from public.get_current_participant_profile()), 'draft save does not falsely complete');
select lives_ok($$select * from public.complete_current_participant_profile()$$, 'valid profile completes');
select ok((select profile_completed from public.get_current_participant_profile()), 'completion state persisted');
select ok((select profile_completed_at is not null from public.get_current_participant_profile()), 'completion timestamp persisted');
select lives_ok($$select * from public.complete_current_participant_profile()$$, 'repeated completion is idempotent');
select throws_ok($$select * from public.save_current_participant_profile('Owner','','Updated','','2099-01-01','female','single','+91','9876543210','IN','Karnataka','','Bengaluru','560001','','Engineer','employed',3,1,'Emergency Person','Sibling','+91 9876543211')$$, 'P1004', 'Profile data is invalid.', 'future DOB rejected');
select throws_ok($$select * from public.save_current_participant_profile('Owner','','Updated','','1990-01-01','invalid','single','+91','9876543210','IN','Karnataka','','Bengaluru','560001','','Engineer','employed',3,1,'Emergency Person','Sibling','+91 9876543211')$$, 'P1004', 'Profile data is invalid.', 'invalid enum rejected');
select throws_ok($$select * from public.save_current_participant_profile('Owner','','Updated','','1990-01-01','female','single','91','bad','IND','Karnataka','','Bengaluru','!','','Engineer','employed',0,2,'Emergency Person','Sibling','bad')$$, 'P1004', 'Profile data is invalid.', 'invalid phone country postal and counts rejected');
select lives_ok($$select * from public.save_current_participant_profile('Owner','','Updated','','1990-01-01','female','single','+91','9876543210','IN','','','Bengaluru','560001','','Engineer','employed',3,1,'Emergency Person','Sibling','+91 9876543211')$$, 'completed profile can save incomplete draft');
select ok(not (select profile_completed from public.get_current_participant_profile()), 'removing required field clears completion');
select is((select profile_completed_at from public.get_current_participant_profile()), null::timestamptz, 'invalidated completion timestamp clears');
select set_config('request.jwt.claim.sub','b1000000-0000-4000-8000-000000000003',true);
select throws_ok($$select * from public.save_current_participant_profile('Blocked','','Person','','1990-01-01','female','single','+91','9876543210','IN','State','','City','560001','','','employed',2,0,'Contact','Friend','+91 9876543211')$$, 'P1003', 'Participant profile changes are not allowed.', 'unsupported lifecycle save blocked');
reset role;

select is((select first_name from public.participant_profiles where participant_id='b2000000-0000-4000-8000-000000000002'), 'Other', 'another participant remains unaffected');
select is((select email from public.participant_profiles where participant_id='b2000000-0000-4000-8000-000000000001'), 'owner@test.local', 'system-managed email preserved');
select ok((select updated_by='b1000000-0000-4000-8000-000000000001' from public.participant_profiles where participant_id='b2000000-0000-4000-8000-000000000001'), 'authenticated actor attributed');
select is((select lifecycle_status from public.participants where id='b2000000-0000-4000-8000-000000000001'), 'pending_enrollment', 'profile completion does not change lifecycle');
select is((select count(*) from public.assessments where participant_id='b2000000-0000-4000-8000-000000000001'), 0::bigint, 'profile completion creates no assessment');
select ok(not has_table_privilege('authenticated','public.participant_profiles','SELECT'), 'authenticated direct profile select denied');
select ok(not has_table_privilege('authenticated','public.participant_profiles','INSERT'), 'authenticated direct profile insert denied');
select ok(not has_table_privilege('authenticated','public.participant_profiles','UPDATE'), 'authenticated direct profile update denied');
select ok(not has_table_privilege('authenticated','public.participant_profiles','DELETE'), 'authenticated direct profile delete denied');
select ok(not has_table_privilege('anon','public.participant_profiles','SELECT'), 'anon direct profile select denied');
select ok(not has_table_privilege('public','public.participant_profiles','SELECT'), 'PUBLIC direct profile select denied');

select ok(to_regprocedure('public.write_current_participant_profile(text,text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer,text,text,text,timestamp with time zone,boolean)') is not null, 'atomic versioned write RPC exists');
select ok((select prosecdef from pg_proc where oid=to_regprocedure('public.write_current_participant_profile(text,text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer,text,text,text,timestamp with time zone,boolean)')), 'atomic RPC is security definer');
select ok(has_function_privilege('authenticated','public.write_current_participant_profile(text,text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer,text,text,text,timestamp with time zone,boolean)','EXECUTE') and not has_function_privilege('anon','public.write_current_participant_profile(text,text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer,text,text,text,timestamp with time zone,boolean)','EXECUTE'), 'atomic RPC is authenticated-only');
set local role authenticated;
select set_config('request.jwt.claim.sub','b1000000-0000-4000-8000-000000000001',true);
create temporary table expected_profile_version(value timestamptz) on commit drop;
insert into expected_profile_version select updated_at from public.get_current_participant_profile();
select lives_ok($$select * from public.write_current_participant_profile('Owner','','Updated','Visible snapshot','1990-01-01','female','single','+91','9876543210','IN','Karnataka','','Bengaluru','560001','','Engineer','employed',3,1,'Emergency Person','Sibling','+91 9876543211',(select value from expected_profile_version),true)$$, 'visible snapshot saves and completes atomically');
select is((select preferred_name from public.get_current_participant_profile()), 'Visible snapshot', 'completion persisted the exact submitted snapshot');
select ok((select profile_completed from public.get_current_participant_profile()), 'atomic submitted snapshot is completed');
select throws_ok($$select * from public.write_current_participant_profile('Owner','','Stale','','1990-01-01','female','single','+91','9876543210','IN','Karnataka','','Bengaluru','560001','','Engineer','employed',3,1,'Emergency Person','Sibling','+91 9876543211',(select value - interval '1 microsecond' from expected_profile_version),false)$$, 'P1006', 'Participant profile version conflict.', 'stale draft write rejected');
select throws_ok($$select * from public.write_current_participant_profile('Owner','','Stale','','1990-01-01','female','single','+91','9876543210','IN','Karnataka','','Bengaluru','560001','','Engineer','employed',3,1,'Emergency Person','Sibling','+91 9876543211',(select value - interval '1 microsecond' from expected_profile_version),true)$$, 'P1006', 'Participant profile version conflict.', 'stale completion rejected');
reset role;

select * from finish();
rollback;
