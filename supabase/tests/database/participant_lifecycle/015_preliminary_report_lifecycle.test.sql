begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;

select plan(111);

-- Catalog, ownership, execution boundaries, and direct-DML posture: 54 assertions.
select ok(to_regprocedure(name) is not null, name || ' exists') from unnest(array[
  'public.list_preliminary_reports(uuid)',
  'public.get_preliminary_report(uuid,uuid)',
  'public.transition_preliminary_report(uuid,uuid,uuid,text,jsonb,text,text)',
  'public.list_current_participant_preliminary_reports()',
  'public.get_current_participant_preliminary_report(uuid)'
]) name;
select ok((select prosecdef from pg_proc where oid = to_regprocedure(name)), name || ' is security definer') from unnest(array[
  'public.list_preliminary_reports(uuid)', 'public.get_preliminary_report(uuid,uuid)',
  'public.transition_preliminary_report(uuid,uuid,uuid,text,jsonb,text,text)',
  'public.list_current_participant_preliminary_reports()', 'public.get_current_participant_preliminary_report(uuid)'
]) name;
select is((select pg_get_userbyid(proowner) from pg_proc where oid = to_regprocedure(name)), 'postgres', name || ' owner is postgres') from unnest(array[
  'public.list_preliminary_reports(uuid)', 'public.get_preliminary_report(uuid,uuid)',
  'public.transition_preliminary_report(uuid,uuid,uuid,text,jsonb,text,text)',
  'public.list_current_participant_preliminary_reports()', 'public.get_current_participant_preliminary_report(uuid)'
]) name;
select ok((select proconfig @> array['search_path=public, pg_catalog'] from pg_proc where oid = to_regprocedure(name)), name || ' search path controlled') from unnest(array[
  'public.list_preliminary_reports(uuid)', 'public.get_preliminary_report(uuid,uuid)',
  'public.transition_preliminary_report(uuid,uuid,uuid,text,jsonb,text,text)',
  'public.list_current_participant_preliminary_reports()', 'public.get_current_participant_preliminary_report(uuid)'
]) name;
select ok(has_function_privilege('service_role', name, 'EXECUTE'), name || ' service role granted') from unnest(array[
  'public.list_preliminary_reports(uuid)', 'public.get_preliminary_report(uuid,uuid)',
  'public.transition_preliminary_report(uuid,uuid,uuid,text,jsonb,text,text)'
]) name;
select ok(has_function_privilege('authenticated', name, 'EXECUTE'), name || ' authenticated granted') from unnest(array[
  'public.list_current_participant_preliminary_reports()', 'public.get_current_participant_preliminary_report(uuid)'
]) name;
select ok(not has_function_privilege(role_name, name, 'EXECUTE'), role_name || ' denied ' || name)
from unnest(array['public','anon','authenticated']) role_name cross join unnest(array[
  'public.list_preliminary_reports(uuid)', 'public.get_preliminary_report(uuid,uuid)',
  'public.transition_preliminary_report(uuid,uuid,uuid,text,jsonb,text,text)'
]) name;
select ok(not has_function_privilege(role_name, name, 'EXECUTE'), role_name || ' denied ' || name)
from unnest(array['public','anon','service_role']) role_name cross join unnest(array[
  'public.list_current_participant_preliminary_reports()', 'public.get_current_participant_preliminary_report(uuid)'
]) name;
select ok(relrowsecurity, relname || ' RLS enabled') from pg_class where oid in ('public.preliminary_reports'::regclass, 'public.preliminary_report_versions'::regclass);
select ok(not has_table_privilege(role_name, table_name, privilege), role_name || ' direct ' || table_name || ' ' || privilege || ' denied')
from unnest(array['service_role','authenticated']) role_name
cross join unnest(array['public.preliminary_reports','public.preliminary_report_versions']) table_name
cross join unnest(array['INSERT','UPDATE','DELETE']) privilege;

create temp table report_test_content(content jsonb not null);
insert into report_test_content values ('{
  "reportTitle":"Preliminary Research Report",
  "reportPurpose":"Summarize participant-provided information for governed research review.",
  "participantContext":"The participant completed the governed assessment workflow.",
  "assessmentContext":"Assessment number one was submitted and approved through human review.",
  "informationBasis":"Participant-provided assessment responses and linked evidence metadata.",
  "humanReviewSummary":"An authorized administrator completed human review.",
  "reportedFinancialConditions":["Reported conditions are recorded without scoring."],
  "reportedStrengths":["Reported strengths are descriptive only."],
  "reportedPressures":["Reported pressures are descriptive only."],
  "evidenceStatus":"Evidence status is preliminary and limited to available records.",
  "limitations":"This report is not advice, diagnosis, treatment, or an execution instruction.",
  "preliminaryObservations":"Observations remain preliminary research statements.",
  "nextSteps":["Continue governed human review where required."],
  "participantNotice":"Preliminary research report only; no Pilot or Production authority is created."
}'::jsonb);

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('00000000-0000-0000-0000-000000000000','fa000000-0000-4000-8000-000000000001','authenticated','authenticated','report.admin@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','fa000000-0000-4000-8000-000000000002','authenticated','authenticated','report.outsider@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','fa000000-0000-4000-8000-000000000011','authenticated','authenticated','report.one@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','fa000000-0000-4000-8000-000000000012','authenticated','authenticated','report.two@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','fa000000-0000-4000-8000-000000000013','authenticated','authenticated','report.deleted@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01');

insert into public.staff_members(id,staff_code,auth_user_id,full_name,email,status,created_at) values
('fb000000-0000-4000-8000-000000000001','WPAG-STF-995001','fa000000-0000-4000-8000-000000000001','Report Administrator','report.admin@test.local','active','2026-01-01');
insert into public.staff_member_roles(id,staff_member_id,staff_role_id,assigned_by,created_at)
select 'fb100000-0000-4000-8000-000000000001','fb000000-0000-4000-8000-000000000001',id,'fa000000-0000-4000-8000-000000000001','2026-01-01' from public.staff_roles where role_code='administrator';

insert into public.participants(id,participant_code,auth_user_id,lifecycle_status,created_at,deleted_at) values
('fc000000-0000-4000-8000-000000000001','WPAG-995001','fa000000-0000-4000-8000-000000000011','active','2026-01-01',null),
('fc000000-0000-4000-8000-000000000002','WPAG-995002','fa000000-0000-4000-8000-000000000012','active','2026-01-01',null),
('fc000000-0000-4000-8000-000000000003','WPAG-995003','fa000000-0000-4000-8000-000000000013','active','2026-01-01','2026-02-01');
insert into public.participant_profiles(id,participant_id,auth_user_id,first_name,last_name,email,country_code,household_size,dependents,created_at) values
('fd000000-0000-4000-8000-000000000001','fc000000-0000-4000-8000-000000000001','fa000000-0000-4000-8000-000000000011','Report','One','report.one@test.local','IN',2,0,'2026-01-01'),
('fd000000-0000-4000-8000-000000000002','fc000000-0000-4000-8000-000000000002','fa000000-0000-4000-8000-000000000012','Report','Two','report.two@test.local','IN',2,0,'2026-01-01'),
('fd000000-0000-4000-8000-000000000003','fc000000-0000-4000-8000-000000000003','fa000000-0000-4000-8000-000000000013','Report','Deleted','report.deleted@test.local','IN',2,0,'2026-01-01');

insert into public.assessment_sessions(id,participant_id,assessment_number,assessment_type,assessment_version,status,current_stage,started_at,submitted_at,created_at) values
('fe000000-0000-4000-8000-000000000001','fc000000-0000-4000-8000-000000000001',1,'initial','1.0','submitted','assessment_processing','2026-01-02','2026-01-03','2026-01-02'),
('fe000000-0000-4000-8000-000000000002','fc000000-0000-4000-8000-000000000002',1,'initial','1.0','submitted','assessment_processing','2026-01-02','2026-01-03','2026-01-02'),
('fe000000-0000-4000-8000-000000000003','fc000000-0000-4000-8000-000000000003',1,'initial','1.0','submitted','assessment_processing','2026-01-02','2026-01-03','2026-01-02'),
('fe000000-0000-4000-8000-000000000004','fc000000-0000-4000-8000-000000000001',2,'follow_up','1.0','draft','financial_data_collection','2026-01-04',null,'2026-01-04'),
('fe000000-0000-4000-8000-000000000005','fc000000-0000-4000-8000-000000000001',3,'follow_up','1.0','submitted','assessment_processing','2026-01-05','2026-01-06','2026-01-05'),
('fe000000-0000-4000-8000-000000000006','fc000000-0000-4000-8000-000000000001',4,'follow_up','1.0','submitted','assessment_processing','2026-01-07','2026-01-08','2026-01-07');
insert into public.assessments(id,participant_id,assessment_session_id,assessment_number,assessment_version,hfos_version,assessment_date,currency_code,country_code,household_size,dependents,created_at) values
('ff000000-0000-4000-8000-000000000001','fc000000-0000-4000-8000-000000000001','fe000000-0000-4000-8000-000000000001',1,'1.0','phase-1-draft','2026-01-03','INR','IN',2,0,'2026-01-02'),
('ff000000-0000-4000-8000-000000000002','fc000000-0000-4000-8000-000000000002','fe000000-0000-4000-8000-000000000002',1,'1.0','phase-1-draft','2026-01-03','INR','IN',2,0,'2026-01-02'),
('ff000000-0000-4000-8000-000000000003','fc000000-0000-4000-8000-000000000003','fe000000-0000-4000-8000-000000000003',1,'1.0','phase-1-draft','2026-01-03','INR','IN',2,0,'2026-01-02'),
('ff000000-0000-4000-8000-000000000004','fc000000-0000-4000-8000-000000000001','fe000000-0000-4000-8000-000000000004',2,'1.0','phase-1-draft','2026-01-04','INR','IN',2,0,'2026-01-04'),
('ff000000-0000-4000-8000-000000000005','fc000000-0000-4000-8000-000000000001','fe000000-0000-4000-8000-000000000005',3,'1.0','phase-1-draft','2026-01-06','INR','IN',2,0,'2026-01-05'),
('ff000000-0000-4000-8000-000000000006','fc000000-0000-4000-8000-000000000001','fe000000-0000-4000-8000-000000000006',4,'1.0','phase-1-draft','2026-01-08','INR','IN',2,0,'2026-01-07');
insert into public.assessment_reviews(id,assessment_id,review_status,review_decision,review_started_at,review_completed_at,reviewed_by,review_notes,information_request,created_at) values
('e1000000-0000-4000-8000-000000000001','ff000000-0000-4000-8000-000000000001','completed','approved','2026-01-03','2026-01-04','fa000000-0000-4000-8000-000000000001','Approved for preliminary report.',null,'2026-01-03'),
('e1000000-0000-4000-8000-000000000002','ff000000-0000-4000-8000-000000000002','completed','approved','2026-01-03','2026-01-04','fa000000-0000-4000-8000-000000000001','Approved for preliminary report.',null,'2026-01-03'),
('e1000000-0000-4000-8000-000000000003','ff000000-0000-4000-8000-000000000003','completed','approved','2026-01-03','2026-01-04','fa000000-0000-4000-8000-000000000001','Approved for preliminary report.',null,'2026-01-03'),
('e1000000-0000-4000-8000-000000000004','ff000000-0000-4000-8000-000000000005','completed','rejected','2026-01-06','2026-01-07','fa000000-0000-4000-8000-000000000001','Evidence was insufficient.',null,'2026-01-06'),
('e1000000-0000-4000-8000-000000000005','ff000000-0000-4000-8000-000000000006','returned','needs_information','2026-01-08','2026-01-09','fa000000-0000-4000-8000-000000000001','More information required.','Provide current evidence.','2026-01-08');

-- Administrator authorization and queue boundary: 7 assertions (61 total).
select throws_ok($$select * from public.list_preliminary_reports('fa000000-0000-4000-8000-000000000002')$$,'P1001','Actor is not authorized to manage preliminary reports.','unauthorized queue rejected');
select throws_ok($$select * from public.get_preliminary_report(gen_random_uuid(),'fa000000-0000-4000-8000-000000000002')$$,'P1001','Actor is not authorized to manage preliminary reports.','unauthorized detail rejected');
select throws_ok($$select * from public.transition_preliminary_report(null,'ff000000-0000-4000-8000-000000000001','fa000000-0000-4000-8000-000000000002','create_draft',(select content from report_test_content),null,null)$$,'P1001','Actor is not authorized to manage preliminary reports.','unauthorized transition rejected');
select is((select count(*) from public.list_preliminary_reports('fa000000-0000-4000-8000-000000000001')),2::bigint,'queue includes approved active submitted assessments');
select ok(exists(select 1 from public.list_preliminary_reports('fa000000-0000-4000-8000-000000000001') where assessment_id='ff000000-0000-4000-8000-000000000001'),'eligible assessment included');
select ok(not exists(select 1 from public.list_preliminary_reports('fa000000-0000-4000-8000-000000000001') where assessment_id='ff000000-0000-4000-8000-000000000003'),'soft-deleted participant excluded');
select ok(not exists(select 1 from public.list_preliminary_reports('fa000000-0000-4000-8000-000000000001') where assessment_id='ff000000-0000-4000-8000-000000000004'),'non-submitted assessment excluded');
select ok(not exists(select 1 from public.list_preliminary_reports('fa000000-0000-4000-8000-000000000001') where assessment_id='ff000000-0000-4000-8000-000000000005'),'rejected assessment review excluded');
select ok(not exists(select 1 from public.list_preliminary_reports('fa000000-0000-4000-8000-000000000001') where assessment_id='ff000000-0000-4000-8000-000000000006'),'returned assessment review excluded');

-- Draft, immutable versions, review, approval, release: 44 assertions (105 total).
select lives_ok($$select * from public.transition_preliminary_report(null,'ff000000-0000-4000-8000-000000000001','fa000000-0000-4000-8000-000000000001','create_draft',(select content from report_test_content),null,null)$$,'draft creation succeeds');
select is((select status from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),'draft','draft status persisted');
select is((select current_version from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),1,'initial version persisted');
select is((select title from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),'Preliminary Research Report','report title persisted');
select is((select count(*) from public.preliminary_report_versions where report_id=(select id from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001')),1::bigint,'one initial version persisted');
select ok((select content_hash ~ '^[0-9a-f]{64}$' from public.preliminary_report_versions where report_id=(select id from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001')),'content hash persisted');
select is((select count(*) from public.activity_timeline where entity_id=(select id from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001') and event_type='report_created'),1::bigint,'draft audit event persisted');
select throws_ok($$select * from public.transition_preliminary_report(null,'ff000000-0000-4000-8000-000000000001','fa000000-0000-4000-8000-000000000001','create_draft',(select content from report_test_content),null,null)$$,'P1001','An active preliminary report already exists for this assessment.','duplicate active report rejected');
select lives_ok($$select * from public.transition_preliminary_report((select id from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),null,'fa000000-0000-4000-8000-000000000001','save_draft',jsonb_set((select content from report_test_content),'{preliminaryObservations}','"Updated observation."'),'  Evidence wording updated.  ',null)$$,'draft save succeeds');
select is((select current_version from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),2,'draft save advances version');
select is((select count(*) from public.preliminary_report_versions where report_id=(select id from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001')),2::bigint,'draft save appends version');
select is((select content->>'preliminaryObservations' from public.preliminary_report_versions where report_id=(select id from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001') and version_number=1),'Observations remain preliminary research statements.','old version unchanged');
select is((select change_summary from public.preliminary_report_versions where report_id=(select id from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001') and version_number=2),'Evidence wording updated.','change summary normalized');
select isnt((select min(content_hash) from public.preliminary_report_versions where report_id=(select id from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001')),(select max(content_hash) from public.preliminary_report_versions where report_id=(select id from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001')),'version hashes differ');
select lives_ok($$select * from public.transition_preliminary_report((select id from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),null,'fa000000-0000-4000-8000-000000000001','submit_for_review',null,null,null)$$,'submit validates the persisted immutable version');
select is((select current_version from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),2,'submit does not create or alter content version');
select is((select status from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),'under_review','under review status persisted');
select is((select submitted_for_review_by from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),'fa000000-0000-4000-8000-000000000001'::uuid,'submitter attributed');
select ok((select submitted_for_review_at is not null from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),'submission timestamp persisted');
select throws_ok($$select * from public.transition_preliminary_report((select id from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),null,'fa000000-0000-4000-8000-000000000001','return_to_draft',null,null,' ')$$,'P1001','Report review notes are required.','return requires notes');
select lives_ok($$select * from public.transition_preliminary_report((select id from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),null,'fa000000-0000-4000-8000-000000000001','return_to_draft',null,null,'  Clarify evidence basis.  ')$$,'return succeeds');
select is((select status from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),'returned','returned status persisted');
select is((select review_notes from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),'Clarify evidence basis.','return notes normalized');
select lives_ok($$select * from public.transition_preliminary_report((select id from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),null,'fa000000-0000-4000-8000-000000000001','save_draft',(select content from report_test_content),'Revision after review.',null)$$,'returned report can be revised');
select is((select current_version from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),3,'revision advances to version three');
select lives_ok($$select * from public.transition_preliminary_report((select id from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),null,'fa000000-0000-4000-8000-000000000001','submit_for_review',(select content from report_test_content),null,null)$$,'revised report resubmits');
select lives_ok($$select * from public.transition_preliminary_report((select id from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),null,'fa000000-0000-4000-8000-000000000001','approve',null,null,null)$$,'report approval succeeds');
select is((select status from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),'approved','approved status persisted');
select ok((select approved_at is not null and approved_by='fa000000-0000-4000-8000-000000000001' from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),'approval attribution persisted');
select lives_ok($$select * from public.transition_preliminary_report((select id from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),null,'fa000000-0000-4000-8000-000000000001','release',null,null,null)$$,'report release succeeds');
select is((select status from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),'released','released status persisted');
select ok((select released_at is not null and released_by='fa000000-0000-4000-8000-000000000001' from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),'release attribution persisted');
select lives_ok($$select * from public.transition_preliminary_report(null,'ff000000-0000-4000-8000-000000000002','fa000000-0000-4000-8000-000000000001','create_draft',(select content from report_test_content),null,null)$$,'second participant draft created');
select lives_ok($$select * from public.transition_preliminary_report((select id from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000002'),null,'fa000000-0000-4000-8000-000000000001','submit_for_review',(select content from report_test_content),null,null)$$,'second participant report submitted');
select lives_ok($$select * from public.transition_preliminary_report((select id from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000002'),null,'fa000000-0000-4000-8000-000000000001','approve',null,null,null)$$,'second participant report approved but unreleased');
select throws_ok($$update public.preliminary_report_versions set change_summary='mutated' where report_id=(select id from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001')$$,'P1001','Preliminary report versions are immutable.','version update denied');
select throws_ok($$delete from public.preliminary_report_versions where report_id=(select id from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001')$$,'P1001','Preliminary report versions are immutable.','version delete denied');
select throws_ok($$update public.preliminary_reports set title='Changed' where assessment_id='ff000000-0000-4000-8000-000000000001'$$,'P1001','Released preliminary reports are immutable.','released report mutation denied');
select throws_ok($$select * from public.transition_preliminary_report((select id from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),null,'fa000000-0000-4000-8000-000000000001','release',null,null,null)$$,'P1001','Preliminary report transition is not allowed.','repeated release denied');
select is((select count(*) from public.activity_timeline where entity_id=(select id from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001')),9::bigint,'complete lifecycle audit trail persisted');
select ok(not ((select content from public.preliminary_report_versions where report_id=(select id from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001') order by version_number desc limit 1)::text ~* '"(formula|score|diagnosis|treatment|recommendation)"\s*:'),'content schema exposes no prohibited output field');

-- Participant release boundary and final structural checks.
set local request.jwt.claim.sub = 'fa000000-0000-4000-8000-000000000011';
select is((select count(*) from public.list_current_participant_preliminary_reports()),1::bigint,'participant sees exactly one released report');
select is((select report_title from public.list_current_participant_preliminary_reports()),'Preliminary Research Report','participant sees released report title');
select ok(not (select to_jsonb(detail) from public.get_current_participant_preliminary_report((select report_id from public.list_current_participant_preliminary_reports())) detail)::text ~* '(review_notes|prepared_by|approved_by|released_by|audit_history|documents)','participant detail excludes internal metadata');
select throws_ok($$select * from public.get_current_participant_preliminary_report((select id from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000002'))$$,'P1001','Released preliminary report was not found.','participant cannot see another or unreleased report');
select ok((select report_number ~ '^WPAG-PRR-[0-9]{6}$' from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),'report number is deterministic');
select is((select count(*) from pg_indexes where schemaname='public' and indexname='preliminary_reports_one_active_per_assessment_idx'),1::bigint,'one-active-report index exists');
select is((select jsonb_array_length(version_history) from public.get_preliminary_report((select id from public.preliminary_reports where assessment_id='ff000000-0000-4000-8000-000000000001'),'fa000000-0000-4000-8000-000000000001')),3,'admin detail returns complete immutable version history');

select * from finish();
rollback;
