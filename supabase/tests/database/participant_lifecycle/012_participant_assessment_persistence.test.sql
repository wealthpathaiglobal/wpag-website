begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,pg_catalog;
select plan(191);
create temporary table phase_c3_test_state(key text primary key,value text) on commit drop;
grant all on phase_c3_test_state to authenticated;

select ok(to_regclass('public.assessment_module_statuses') is not null,'module status table exists');
select ok(to_regclass('public.participant_assessment_question_registry') is not null,'question registry exists');
select ok(to_regclass('public.assessment_sessions_one_editable_per_participant_idx') is not null,'one editable session index exists');
select has_column('public','assessment_module_statuses',column_name,'module status has '||column_name) from unnest(array['assessment_session_id','assessment_id','module_key','status','answered_required_count','required_count','completed_at']) column_name;
select has_column('public','participant_assessment_question_registry',column_name,'question registry has '||column_name) from unnest(array['question_key','module_key','value_type','is_required','enum_values','minimum_value','maximum_value']) column_name;
select ok(to_regprocedure(name) is not null,name||' exists') from unnest(array['public.get_current_participant_assessment()','public.start_or_resume_current_assessment()','public.save_current_assessment_module(text,jsonb)','public.submit_current_assessment()','public.get_admin_participant_assessment_summary(uuid)','public.current_participant_assessment_projection(uuid)']) name;
select ok((select prosecdef from pg_proc where oid=to_regprocedure(name)),name||' is security definer') from unnest(array['public.get_current_participant_assessment()','public.start_or_resume_current_assessment()','public.save_current_assessment_module(text,jsonb)','public.submit_current_assessment()','public.get_admin_participant_assessment_summary(uuid)','public.current_participant_assessment_projection(uuid)']) name;
select is((select pg_get_userbyid(proowner) from pg_proc where oid=to_regprocedure(name)),'postgres',name||' owner is postgres') from unnest(array['public.get_current_participant_assessment()','public.start_or_resume_current_assessment()','public.save_current_assessment_module(text,jsonb)','public.submit_current_assessment()','public.get_admin_participant_assessment_summary(uuid)','public.current_participant_assessment_projection(uuid)']) name;
select ok((select proconfig @> array['search_path=public, pg_catalog'] from pg_proc where oid=to_regprocedure(name)),name||' search path controlled') from unnest(array['public.get_current_participant_assessment()','public.start_or_resume_current_assessment()','public.save_current_assessment_module(text,jsonb)','public.submit_current_assessment()','public.get_admin_participant_assessment_summary(uuid)','public.current_participant_assessment_projection(uuid)']) name;
select is((select provolatile from pg_proc where oid=to_regprocedure(name)),expected,name||' volatility correct') from (values('public.get_current_participant_assessment()','s'::"char"),('public.start_or_resume_current_assessment()','v'::"char"),('public.save_current_assessment_module(text,jsonb)','v'::"char"),('public.submit_current_assessment()','v'::"char"),('public.get_admin_participant_assessment_summary(uuid)','s'::"char"),('public.current_participant_assessment_projection(uuid)','s'::"char")) x(name,expected);
select ok(has_function_privilege('authenticated',name,'EXECUTE'),name||' authenticated execute granted') from unnest(array['public.get_current_participant_assessment()','public.start_or_resume_current_assessment()','public.save_current_assessment_module(text,jsonb)','public.submit_current_assessment()']) name;
select ok(not has_function_privilege('public',name,'EXECUTE'),name||' PUBLIC denied') from unnest(array['public.get_current_participant_assessment()','public.start_or_resume_current_assessment()','public.save_current_assessment_module(text,jsonb)','public.submit_current_assessment()']) name;
select ok(not has_function_privilege('anon',name,'EXECUTE'),name||' anon denied') from unnest(array['public.get_current_participant_assessment()','public.start_or_resume_current_assessment()','public.save_current_assessment_module(text,jsonb)','public.submit_current_assessment()']) name;
select ok(has_function_privilege('service_role','public.get_admin_participant_assessment_summary(uuid)','EXECUTE'),'service role admin summary granted');
select ok(not has_function_privilege('authenticated','public.get_admin_participant_assessment_summary(uuid)','EXECUTE'),'authenticated denied admin summary');
select ok(not has_table_privilege('authenticated',table_name,privilege),table_name||' authenticated '||privilege||' denied') from unnest(array['public.assessment_sessions','public.assessments','public.assessment_answers','public.assessment_module_statuses','public.assessment_audit_log']) table_name cross join unnest(array['SELECT','INSERT','UPDATE','DELETE']) privilege;
select ok((select count(*)>0 from public.participant_assessment_question_registry where module_key=module),'registry has '||module) from unnest(array['financial_profile','cash_flow','debt_obligations','stability_margin','protection_risk','goals_planning']) module;
select ok(exists(select 1 from pg_constraint where conname='assessment_module_statuses_session_module_unique'),'session module unique constraint exists');
select ok(exists(select 1 from pg_constraint where conname='assessment_module_statuses_module_check'),'module key constraint exists');
select ok(exists(select 1 from pg_constraint where conname='assessment_module_statuses_status_check'),'module status constraint exists');
select ok(exists(select 1 from pg_constraint where conname='assessment_module_statuses_counts_check'),'module count constraint exists');
select ok(exists(select 1 from pg_constraint where conname='participant_assessment_question_enum_values_check'),'enum values constraint exists');
select ok(exists(select 1 from pg_constraint where conname='participant_assessment_question_json_enum_check'),'structured enum constraint exists');

select throws_ok($$select * from public.get_current_participant_assessment()$$,'P0001','ASSESSMENT_AUTH_REQUIRED','unauthenticated read rejected');
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values('00000000-0000-0000-0000-000000000000','c1000000-0000-4000-8000-000000000001','authenticated','authenticated','assessment@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01');
insert into public.participants(id,participant_code,auth_user_id,lifecycle_status,created_at) values('c2000000-0000-4000-8000-000000000001','WPAG-992001','c1000000-0000-4000-8000-000000000001','active','2026-01-01');
insert into public.participant_profiles(id,participant_id,auth_user_id,first_name,last_name,email,country_code,household_size,dependents,created_at) values('c3000000-0000-4000-8000-000000000001','c2000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','Assessment','Owner','assessment@test.local','IN',2,0,'2026-01-01');
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);
select lives_ok($$select * from public.start_or_resume_current_assessment()$$,'active participant starts assessment');
select is((select count(*) from public.assessment_sessions),1::bigint,'one session created');
select is((select count(*) from public.assessments),1::bigint,'one assessment created');
select is((select count(*) from public.assessment_module_statuses),6::bigint,'six module rows created');
select is(m.required_count,(select count(*)::integer from public.participant_assessment_question_registry r where r.module_key=m.module_key and r.is_required),m.module_key||' required count initialized') from public.assessment_module_statuses m order by m.module_key;
select is((select assessment_version from public.get_current_participant_assessment()),'1.0','assessment version server controlled');
select is((select hfos_version from public.get_current_participant_assessment()),'phase-1-draft','HFOS reference server controlled');
select lives_ok($$select * from public.start_or_resume_current_assessment()$$,'repeated start resumes');
select is((select count(*) from public.assessment_audit_log where event_type='assessment_started'),1::bigint,'one start audit event');
select lives_ok($$select * from public.save_current_assessment_module('financial_profile','{"financial_profile.full_name":"Asha Rao","financial_profile.age":35}'::jsonb)$$,'canonical module save succeeds');
select is((select count(*) from public.assessment_answers),2::bigint,'first save inserts revision one');
select lives_ok($$select * from public.save_current_assessment_module('financial_profile','{"financial_profile.full_name":"Asha Rao","financial_profile.age":35}'::jsonb)$$,'identical save succeeds');
select is((select count(*) from public.assessment_answers),2::bigint,'identical save creates no revision');
select lives_ok($$select * from public.save_current_assessment_module('financial_profile','{"financial_profile.age":36}'::jsonb)$$,'changed answer saves');
select is((select max(response_order) from public.assessment_answers where question_code='financial_profile.age'),2,'changed answer increments revision');
select throws_ok($$select * from public.save_current_assessment_module('invalid','{}'::jsonb)$$,'P0001','ASSESSMENT_INVALID_MODULE','invalid module rejected');
select throws_ok($$select * from public.save_current_assessment_module('financial_profile','{"financial_profile.unknown":"x"}'::jsonb)$$,'P0001','ASSESSMENT_UNKNOWN_QUESTION','unknown question rejected');
select throws_ok($$select * from public.submit_current_assessment()$$,'P0001','ASSESSMENT_INCOMPLETE','incomplete submission rejected');

select lives_ok($$select * from public.save_current_assessment_module('financial_profile','{"financial_profile.gender":"female"}'::jsonb)$$,'valid canonical enum accepted');
select throws_ok($$select * from public.save_current_assessment_module('financial_profile','{"financial_profile.gender":"Female"}'::jsonb)$$,'P0001','ASSESSMENT_INVALID_VALUE','display label rejected');
select throws_ok($$select * from public.save_current_assessment_module('financial_profile','{"financial_profile.gender":"FEMALE"}'::jsonb)$$,'P0001','ASSESSMENT_INVALID_VALUE','invalid enum casing rejected');
select throws_ok($$select * from public.save_current_assessment_module('financial_profile','{"financial_profile.assets":{"cryptoWallet":true}}'::jsonb)$$,'P0001','ASSESSMENT_INVALID_VALUE','invalid multi-select member rejected');
select throws_ok($$select * from public.save_current_assessment_module('financial_profile','{"financial_profile.age":17}'::jsonb)$$,'P0001','ASSESSMENT_INVALID_VALUE','numeric minimum enforced');
select throws_ok($$select * from public.save_current_assessment_module('financial_profile','{"financial_profile.age":121}'::jsonb)$$,'P0001','ASSESSMENT_INVALID_VALUE','numeric maximum enforced');
select lives_ok($$select * from public.save_current_assessment_module('financial_profile','{"financial_profile.age":18}'::jsonb)$$,'numeric lower boundary accepted');
select lives_ok($$select * from public.save_current_assessment_module('financial_profile','{"financial_profile.age":120}'::jsonb)$$,'numeric upper boundary accepted');

select lives_ok(
 format('select * from public.save_current_assessment_module(%L,%L::jsonb)',module_key,answers::text),
 module_key||' required answers save succeeds'
) from (
 select module_key,jsonb_object_agg(question_key,case value_type when 'number' then to_jsonb(minimum_value) when 'json' then jsonb_build_object(enum_values[1],true) else to_jsonb(coalesce(enum_values[1],'Provided')) end) answers
 from public.participant_assessment_question_registry where is_required group by module_key
) required_payloads;
select is((select count(*) from public.assessment_module_statuses where status='complete'),6::bigint,'all six modules complete');
select is(status,'complete',module_key||' status complete') from public.assessment_module_statuses order by module_key;
select is((select count(distinct section_code) from public.assessment_answers),6::bigint,'answers persisted for all six modules');
select is((select count(*) from public.assessment_answers where response_order=1 and question_code='financial_profile.age'),1::bigint,'earlier revision preserved');
select is((select answers->'financial_profile'->'financial_profile.age'->>'response_order' from public.get_current_participant_assessment()),(select max(response_order)::text from public.assessment_answers where question_code='financial_profile.age'),'projection exposes highest revision only');
select ok(not exists(select 1 from public.assessment_audit_log where metadata::text like '%Asha Rao%'),'audit metadata omits full answer values');

select lives_ok($$select * from public.save_current_assessment_module('financial_profile','{"financial_profile.gender":null}'::jsonb)$$,'required enum can be cleared before submission');
select is((select status from public.assessment_module_statuses where module_key='financial_profile'),'in_progress','complete module reopens');
select is((select completed_at from public.assessment_module_statuses where module_key='financial_profile'),null::timestamptz,'reopened completion timestamp clears');
select is((select count(*) from public.assessment_audit_log where event_type='module_reopened'),1::bigint,'module reopened audit written once');
select lives_ok($$select * from public.save_current_assessment_module('financial_profile','{"financial_profile.gender":null}'::jsonb)$$,'repeated clear is a no-op');
select is((select count(*) from public.assessment_audit_log where event_type='module_reopened'),1::bigint,'no-op clear creates no duplicate reopen audit');
reset role;update public.assessment_module_statuses set status='complete',completed_at=transaction_timestamp() where module_key='financial_profile';select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);
select throws_ok($$select * from public.submit_current_assessment()$$,'P0001','ASSESSMENT_INCOMPLETE','tampered module status cannot bypass required answers');
reset role;update public.assessment_module_statuses set status='in_progress',completed_at=null where module_key='financial_profile';select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);
select lives_ok($$select * from public.save_current_assessment_module('financial_profile','{"financial_profile.gender":"female"}'::jsonb)$$,'required enum can be restored');
select is((select status from public.assessment_module_statuses where module_key='financial_profile'),'complete','restored answer completes module');

insert into phase_c3_test_state values('participant_status',(select lifecycle_status from public.participants where id='c2000000-0000-4000-8000-000000000001')),('profile_updated',(select updated_at::text from public.participant_profiles where participant_id='c2000000-0000-4000-8000-000000000001')),('session_id',(select id::text from public.assessment_sessions)),('assessment_id',(select id::text from public.assessments));
select lives_ok($$select * from public.submit_current_assessment()$$,'valid complete assessment submits');
insert into phase_c3_test_state values('submitted_at',(select submitted_at::text from public.assessment_sessions));
select is((select status from public.assessment_sessions),'submitted','session status submitted');
select ok((select submitted_at is not null from public.assessment_sessions),'submitted timestamp set');
select is((select count(*) from public.assessment_audit_log where event_type='assessment_submitted'),1::bigint,'one submit audit event written');
select is((select lifecycle_status from public.participants where id='c2000000-0000-4000-8000-000000000001'),(select value from phase_c3_test_state where key='participant_status'),'participant lifecycle unchanged');
select is((select updated_at::text from public.participant_profiles where participant_id='c2000000-0000-4000-8000-000000000001'),(select value from phase_c3_test_state where key='profile_updated'),'participant profile unchanged');
select is((select count(*) from public.assessment_documents),0::bigint,'submission creates no document or report');
select is((select count(*) from public.assessment_reviews),0::bigint,'submission creates no diagnosis review');
select lives_ok($$select * from public.submit_current_assessment()$$,'repeated submit is idempotent');
select is((select submitted_at::text from public.assessment_sessions),(select value from phase_c3_test_state where key='submitted_at'),'submitted timestamp remains stable');
select is((select count(*) from public.assessment_audit_log where event_type='assessment_submitted'),1::bigint,'repeated submit creates no audit event');
select is((select count(*) from public.assessment_sessions),1::bigint,'repeated submit creates no session');
select is((select count(*) from public.assessments),1::bigint,'repeated submit creates no assessment');
insert into phase_c3_test_state values('answer_count',(select count(*)::text from public.assessment_answers)),('module_saved_count',(select count(*)::text from public.assessment_audit_log where event_type='module_saved'));
select throws_ok($$select * from public.save_current_assessment_module('financial_profile','{"financial_profile.gender":"male"}'::jsonb)$$,'P0001','ASSESSMENT_ALREADY_SUBMITTED','post-submission save rejected');
select is((select count(*)::text from public.assessment_answers),(select value from phase_c3_test_state where key='answer_count'),'rejected save creates no revision');
select is((select count(*)::text from public.assessment_audit_log where event_type='module_saved'),(select value from phase_c3_test_state where key='module_saved_count'),'rejected save creates no module audit');

select ok(not has_table_privilege('authenticated','public.participants','SELECT'),'migration 034 participant SELECT denial preserved');
select ok(not has_table_privilege('authenticated','public.participant_profiles',privilege),'migration 041 profile direct '||privilege||' denial preserved') from unnest(array['INSERT','UPDATE','DELETE']) privilege;
select ok(has_function_privilege('authenticated','public.get_current_participant()','EXECUTE'),'migration 040 self-resolution grant preserved');
select ok(not has_function_privilege('anon','public.get_current_participant()','EXECUTE'),'migration 040 anon denial preserved');
select ok(not has_function_privilege('service_role','public.get_current_participant()','EXECUTE'),'migration 040 service role denial preserved');
select ok(has_function_privilege('authenticated',name,'EXECUTE'),name||' profile grant preserved') from unnest(array['public.get_current_participant_profile()','public.save_current_participant_profile(text,text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer,text,text,text)','public.complete_current_participant_profile()']) name;
select ok(not has_function_privilege('service_role',name,'EXECUTE'),name||' profile service role denial preserved') from unnest(array['public.get_current_participant_profile()','public.save_current_participant_profile(text,text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,integer,integer,text,text,text)','public.complete_current_participant_profile()']) name;
reset role;
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('00000000-0000-0000-0000-000000000000','c1000000-0000-4000-8000-000000000002','authenticated','authenticated','assessment-other@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','c1000000-0000-4000-8000-000000000003','authenticated','authenticated','assessment-none@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','c1000000-0000-4000-8000-000000000004','authenticated','authenticated','assessment-pending@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','c1000000-0000-4000-8000-000000000005','authenticated','authenticated','assessment-deleted@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','c1000000-0000-4000-8000-000000000006','authenticated','authenticated','assessment-third@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01');
insert into public.participants(id,participant_code,auth_user_id,lifecycle_status,created_at,deleted_at) values
('c2000000-0000-4000-8000-000000000002','WPAG-992002','c1000000-0000-4000-8000-000000000002','active','2026-01-01',null),
('c2000000-0000-4000-8000-000000000004','WPAG-992004','c1000000-0000-4000-8000-000000000004','pending_enrollment','2026-01-01',null),
('c2000000-0000-4000-8000-000000000005','WPAG-992005','c1000000-0000-4000-8000-000000000005','active','2026-01-01','2026-02-01'),
('c2000000-0000-4000-8000-000000000006','WPAG-992006','c1000000-0000-4000-8000-000000000006','active','2026-01-01',null);
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000002',true);
select lives_ok($$select * from public.start_or_resume_current_assessment()$$,'second participant starts own assessment');
select ok((select session_id::text<>(select value from phase_c3_test_state where key='session_id') from public.get_current_participant_assessment()),'participant cannot read another participant assessment');
insert into phase_c3_test_state values('first_answer_count',(select count(*)::text from public.assessment_answers where assessment_id=(select value::uuid from phase_c3_test_state where key='assessment_id')));
select lives_ok($$select * from public.save_current_assessment_module('financial_profile','{"financial_profile.gender":"female"}'::jsonb)$$,'second participant saves only own assessment');
select is((select count(*)::text from public.assessment_answers where assessment_id=(select value::uuid from phase_c3_test_state where key='assessment_id')),(select value from phase_c3_test_state where key='first_answer_count'),'other participant assessment remains unchanged');
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000003',true);
select throws_ok($$select * from public.get_current_participant_assessment()$$,'P0001','ASSESSMENT_PARTICIPANT_NOT_FOUND','authenticated nonparticipant blocked');
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000004',true);
select throws_ok($$select * from public.start_or_resume_current_assessment()$$,'P0001','ASSESSMENT_LIFECYCLE_BLOCKED','pending enrollment participant blocked');
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000005',true);
select throws_ok($$select * from public.start_or_resume_current_assessment()$$,'P0001','ASSESSMENT_PARTICIPANT_NOT_FOUND','deleted participant blocked');
reset role;
update public.assessment_sessions set deleted_at=transaction_timestamp() where participant_id='c2000000-0000-4000-8000-000000000002';
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000002',true);
select is((select count(*) from public.get_current_participant_assessment()),0::bigint,'deleted session excluded');
reset role;
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000006',true);select lives_ok($$select * from public.start_or_resume_current_assessment()$$,'third participant assessment starts');
reset role;update public.assessments set deleted_at=transaction_timestamp() where participant_id='c2000000-0000-4000-8000-000000000006';
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000006',true);
select is((select count(*) from public.get_current_participant_assessment()),0::bigint,'deleted assessment excluded');
reset role;update public.assessment_answers set deleted_at=transaction_timestamp() where assessment_id=(select value::uuid from phase_c3_test_state where key='assessment_id') and question_code='financial_profile.age' and response_order=(select max(response_order) from public.assessment_answers where assessment_id=(select value::uuid from phase_c3_test_state where key='assessment_id') and question_code='financial_profile.age');
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);
select is((select answers->'financial_profile'->'financial_profile.age'->>'response_order' from public.get_current_participant_assessment()),(select max(response_order)::text from public.assessment_answers where assessment_id=(select value::uuid from phase_c3_test_state where key='assessment_id') and question_code='financial_profile.age' and deleted_at is null),'soft-deleted current revision is hidden');
reset role;
select * from finish();
rollback;
