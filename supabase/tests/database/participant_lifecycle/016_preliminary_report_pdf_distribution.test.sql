begin;
select plan(67);

select has_table('public','preliminary_report_artifacts','artifact table exists');
select has_column('public','preliminary_reports','released_artifact_id','released artifact pointer exists');
select ok((select not public from storage.buckets where id='preliminary-report-artifacts'),'artifact bucket is private');
select is((select file_size_limit from storage.buckets where id='preliminary-report-artifacts'),10485760::bigint,'bucket size limit is ten MiB');
select ok((select relrowsecurity from pg_class where oid='public.preliminary_report_artifacts'::regclass),'artifact RLS enabled');
select has_function('public','prepare_preliminary_report_artifact',array['uuid','uuid'],'prepare RPC exists');
select has_function('public','finalize_preliminary_report_artifact',array['uuid','uuid','text','text','bigint','text'],'finalize RPC exists');
select has_function('public','discard_preliminary_report_artifact_reservation',array['uuid','uuid'],'discard RPC exists');
select has_function('public','get_preliminary_report_artifact_for_admin',array['uuid','uuid'],'admin artifact RPC exists');
select has_function('public','get_current_participant_report_download',array['uuid'],'participant download RPC exists');
select is((select prosecdef from pg_proc where oid='public.prepare_preliminary_report_artifact(uuid,uuid)'::regprocedure),true,'prepare is security definer');
select is((select prosecdef from pg_proc where oid='public.finalize_preliminary_report_artifact(uuid,uuid,text,text,bigint,text)'::regprocedure),true,'finalize is security definer');
select is((select prosecdef from pg_proc where oid='public.get_current_participant_report_download(uuid)'::regprocedure),true,'participant lookup is security definer');
select is((select proowner::regrole::text from pg_proc where oid='public.prepare_preliminary_report_artifact(uuid,uuid)'::regprocedure),'postgres','prepare owner postgres');
select is((select proowner::regrole::text from pg_proc where oid='public.finalize_preliminary_report_artifact(uuid,uuid,text,text,bigint,text)'::regprocedure),'postgres','finalize owner postgres');
select is((select proowner::regrole::text from pg_proc where oid='public.get_current_participant_report_download(uuid)'::regprocedure),'postgres','participant lookup owner postgres');
select is((select proconfig[1] from pg_proc where oid='public.prepare_preliminary_report_artifact(uuid,uuid)'::regprocedure),'search_path=public, pg_catalog','prepare search path controlled');
select is((select proconfig[1] from pg_proc where oid='public.finalize_preliminary_report_artifact(uuid,uuid,text,text,bigint,text)'::regprocedure),'search_path=public, pg_catalog','finalize search path controlled');
select is((select proconfig[1] from pg_proc where oid='public.get_current_participant_report_download(uuid)'::regprocedure),'search_path=public, pg_catalog','participant lookup search path controlled');
select ok(has_function_privilege('service_role','public.prepare_preliminary_report_artifact(uuid,uuid)','EXECUTE'),'service role can prepare');
select ok(has_function_privilege('service_role','public.finalize_preliminary_report_artifact(uuid,uuid,text,text,bigint,text)','EXECUTE'),'service role can finalize');
select ok(not has_function_privilege('authenticated','public.prepare_preliminary_report_artifact(uuid,uuid)','EXECUTE'),'authenticated cannot prepare');
select ok(not has_function_privilege('anon','public.prepare_preliminary_report_artifact(uuid,uuid)','EXECUTE'),'anon cannot prepare');
select ok(has_function_privilege('authenticated','public.get_current_participant_report_download(uuid)','EXECUTE'),'authenticated can use governed download lookup');
select ok(not has_function_privilege('anon','public.get_current_participant_report_download(uuid)','EXECUTE'),'anon cannot use download lookup');
select ok(not has_table_privilege('service_role','public.preliminary_report_artifacts','INSERT'),'service role has no artifact insert');
select ok(not has_table_privilege('authenticated','public.preliminary_report_artifacts','SELECT'),'authenticated has no artifact select');
select ok(not has_table_privilege('anon','public.preliminary_report_artifacts','SELECT'),'anon has no artifact select');
select is((select count(*) from pg_policies where schemaname='storage' and tablename='objects' and (qual::text like '%preliminary-report-artifacts%' or with_check::text like '%preliminary-report-artifacts%')),0::bigint,'no public storage object policy introduced');

insert into public.staff_roles(id,role_code,role_name,description,is_active,created_at) values
('b1000000-0000-4000-8000-000000000001','administrator','Administrator','Test administrator',true,'2026-01-01')
on conflict(role_code) do update set is_active=true;
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('00000000-0000-0000-0000-000000000000','b0000000-0000-4000-8000-000000000001','authenticated','authenticated','pdf.admin@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','b0000000-0000-4000-8000-000000000002','authenticated','authenticated','pdf.outsider@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','b0000000-0000-4000-8000-000000000011','authenticated','authenticated','pdf.one@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','b0000000-0000-4000-8000-000000000012','authenticated','authenticated','pdf.two@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','b0000000-0000-4000-8000-000000000013','authenticated','authenticated','pdf.deleted@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01');
insert into public.staff_members(id,auth_user_id,staff_code,full_name,email,status,created_at) values
('b2000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','WPAG-STF-996001','PDF Administrator','pdf.admin@test.local','active','2026-01-01');
insert into public.staff_member_roles(staff_member_id,staff_role_id,is_active,assigned_at) values
('b2000000-0000-4000-8000-000000000001',(select id from public.staff_roles where role_code='administrator'),true,'2026-01-01');
insert into public.participants(id,auth_user_id,participant_code,lifecycle_status,created_at) values
('b3000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000011','WPAG-996001','active','2026-01-01'),
('b3000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000012','WPAG-996002','active','2026-01-01'),
('b3000000-0000-4000-8000-000000000003','b0000000-0000-4000-8000-000000000013','WPAG-996003','active','2026-01-01');
update public.participants set deleted_at='2026-02-01' where id='b3000000-0000-4000-8000-000000000003';
insert into public.assessment_sessions(id,participant_id,assessment_number,assessment_type,assessment_version,status,current_stage,started_at,submitted_at,created_at) values
('b4000000-0000-4000-8000-000000000001','b3000000-0000-4000-8000-000000000001',1,'initial','1.0','submitted','assessment_processing','2026-01-01','2026-01-02','2026-01-01'),
('b4000000-0000-4000-8000-000000000002','b3000000-0000-4000-8000-000000000002',1,'initial','1.0','submitted','assessment_processing','2026-01-01','2026-01-02','2026-01-01'),
('b4000000-0000-4000-8000-000000000003','b3000000-0000-4000-8000-000000000003',1,'initial','1.0','submitted','assessment_processing','2026-01-01','2026-01-02','2026-01-01');
insert into public.assessments(id,participant_id,assessment_session_id,assessment_number,assessment_version,hfos_version,assessment_date,currency_code,country_code,household_size,dependents,created_at) values
('b5000000-0000-4000-8000-000000000001','b3000000-0000-4000-8000-000000000001','b4000000-0000-4000-8000-000000000001',1,'1.0','phase-1-draft','2026-01-02','INR','IN',2,0,'2026-01-01'),
('b5000000-0000-4000-8000-000000000002','b3000000-0000-4000-8000-000000000002','b4000000-0000-4000-8000-000000000002',1,'1.0','phase-1-draft','2026-01-02','INR','IN',2,0,'2026-01-01'),
('b5000000-0000-4000-8000-000000000003','b3000000-0000-4000-8000-000000000003','b4000000-0000-4000-8000-000000000003',1,'1.0','phase-1-draft','2026-01-02','INR','IN',2,0,'2026-01-01');
insert into public.assessment_reviews(id,assessment_id,review_status,review_decision,review_started_at,review_completed_at,reviewed_by,review_notes,created_at) values
('b6000000-0000-4000-8000-000000000001','b5000000-0000-4000-8000-000000000001','completed','approved','2026-01-02','2026-01-03','b0000000-0000-4000-8000-000000000001','Approved', '2026-01-02'),
('b6000000-0000-4000-8000-000000000002','b5000000-0000-4000-8000-000000000002','completed','approved','2026-01-02','2026-01-03','b0000000-0000-4000-8000-000000000001','Approved', '2026-01-02'),
('b6000000-0000-4000-8000-000000000003','b5000000-0000-4000-8000-000000000003','completed','approved','2026-01-02','2026-01-03','b0000000-0000-4000-8000-000000000001','Approved', '2026-01-02');

create temporary table pdf_test_content(content jsonb);
insert into pdf_test_content values ('{"reportTitle":"Preliminary Research Report","reportPurpose":"Research purpose.","participantContext":"Participant context.","assessmentContext":"Assessment context.","informationBasis":"Participant-provided information.","humanReviewSummary":"Authorized human review completed.","reportedFinancialConditions":["Condition"],"reportedStrengths":["Strength"],"reportedPressures":["Pressure"],"evidenceStatus":"Evidence reviewed.","limitations":"Evidence limitations apply.","preliminaryObservations":"Preliminary observation.","nextSteps":["Next step"],"participantNotice":"Not financial advice."}'::jsonb);

insert into public.preliminary_reports(id,participant_id,assessment_id,assessment_review_id,report_number,status,current_version,title,prepared_by,prepared_at,submitted_for_review_by,submitted_for_review_at,reviewed_by,reviewed_at,approved_by,approved_at,created_at) values
('b7000000-0000-4000-8000-000000000001','b3000000-0000-4000-8000-000000000001','b5000000-0000-4000-8000-000000000001','b6000000-0000-4000-8000-000000000001','WPAG-PRR-900001','approved',1,'Preliminary Research Report','b0000000-0000-4000-8000-000000000001','2026-01-03','b0000000-0000-4000-8000-000000000001','2026-01-03','b0000000-0000-4000-8000-000000000001','2026-01-04','b0000000-0000-4000-8000-000000000001','2026-01-04','2026-01-03'),
('b7000000-0000-4000-8000-000000000002','b3000000-0000-4000-8000-000000000002','b5000000-0000-4000-8000-000000000002','b6000000-0000-4000-8000-000000000002','WPAG-PRR-900002','approved',1,'Preliminary Research Report','b0000000-0000-4000-8000-000000000001','2026-01-03','b0000000-0000-4000-8000-000000000001','2026-01-03','b0000000-0000-4000-8000-000000000001','2026-01-04','b0000000-0000-4000-8000-000000000001','2026-01-04','2026-01-03'),
('b7000000-0000-4000-8000-000000000003','b3000000-0000-4000-8000-000000000003','b5000000-0000-4000-8000-000000000003','b6000000-0000-4000-8000-000000000003','WPAG-PRR-900003','approved',1,'Preliminary Research Report','b0000000-0000-4000-8000-000000000001','2026-01-03','b0000000-0000-4000-8000-000000000001','2026-01-03','b0000000-0000-4000-8000-000000000001','2026-01-04','b0000000-0000-4000-8000-000000000001','2026-01-04','2026-01-03');
insert into public.preliminary_report_versions(report_id,version_number,content,change_summary,content_hash,created_by,created_at)
select id,1,(select content from pdf_test_content),'Initial',repeat('a',64),'b0000000-0000-4000-8000-000000000001','2026-01-03' from public.preliminary_reports where id in ('b7000000-0000-4000-8000-000000000001','b7000000-0000-4000-8000-000000000002','b7000000-0000-4000-8000-000000000003');

select throws_ok($$select * from public.prepare_preliminary_report_artifact('b7000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000002')$$,'P1001','Actor is not authorized to manage preliminary report artifacts.','unauthorized reservation rejected');
update public.preliminary_reports set status='under_review',approved_by=null,approved_at=null where id='b7000000-0000-4000-8000-000000000002';
select throws_ok($$select * from public.prepare_preliminary_report_artifact('b7000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000001')$$,'P1001','Only an approved preliminary report can generate a PDF.','non-approved generation rejected');
select throws_ok($$select * from public.prepare_preliminary_report_artifact('b7000000-0000-4000-8000-000000000003','b0000000-0000-4000-8000-000000000001')$$,'P1001','Preliminary report was not found.','soft-deleted participant excluded');
select throws_ok($$select * from public.transition_preliminary_report('b7000000-0000-4000-8000-000000000001',null,'b0000000-0000-4000-8000-000000000001','release',null,null,null)$$,'P1001','A finalized PDF artifact is required before release.','release without artifact rejected');
select lives_ok($$select * from public.prepare_preliminary_report_artifact('b7000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001')$$,'approved report reserves artifact');
select is((select count(*) from public.preliminary_report_artifacts where report_id='b7000000-0000-4000-8000-000000000001'),1::bigint,'one reservation persisted');
select is((select status from public.preliminary_report_artifacts where report_id='b7000000-0000-4000-8000-000000000001'),'reserved','reservation status persisted');
select is((select report_version from public.preliminary_report_artifacts where report_id='b7000000-0000-4000-8000-000000000001'),1,'current version reserved');
select is((select storage_bucket from public.preliminary_report_artifacts where report_id='b7000000-0000-4000-8000-000000000001'),'preliminary-report-artifacts','private bucket reserved');
select ok((select storage_path ~ '^b3000000-.*/b7000000-.*/v1/[0-9a-f-]{36}\.pdf$' from public.preliminary_report_artifacts where report_id='b7000000-0000-4000-8000-000000000001'),'non-guessable immutable path reserved');
select is((select original_filename from public.preliminary_report_artifacts where report_id='b7000000-0000-4000-8000-000000000001'),'WPAG_Preliminary_Research_Report_WPAG-PRR-900001_v1.pdf','deterministic filename reserved');
select throws_ok($$select * from public.prepare_preliminary_report_artifact('b7000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001')$$,'P1001','A PDF artifact already exists for this report version.','duplicate artifact prevented');
select throws_ok($$select * from public.finalize_preliminary_report_artifact((select id from public.preliminary_report_artifacts where report_id='b7000000-0000-4000-8000-000000000001'),'b0000000-0000-4000-8000-000000000001','wrong.pdf','application/pdf',100,repeat('a',64))$$,'P1001','Preliminary report artifact metadata is invalid.','filename mismatch rejected');
select throws_ok($$select * from public.finalize_preliminary_report_artifact((select id from public.preliminary_report_artifacts where report_id='b7000000-0000-4000-8000-000000000001'),'b0000000-0000-4000-8000-000000000001','WPAG_Preliminary_Research_Report_WPAG-PRR-900001_v1.pdf','text/plain',100,repeat('a',64))$$,'P1001','Preliminary report artifact metadata is invalid.','MIME mismatch rejected');
select throws_ok($$select * from public.finalize_preliminary_report_artifact((select id from public.preliminary_report_artifacts where report_id='b7000000-0000-4000-8000-000000000001'),'b0000000-0000-4000-8000-000000000001','WPAG_Preliminary_Research_Report_WPAG-PRR-900001_v1.pdf','application/pdf',0,repeat('a',64))$$,'P1001','Preliminary report artifact metadata is invalid.','empty artifact rejected');
select throws_ok($$select * from public.finalize_preliminary_report_artifact((select id from public.preliminary_report_artifacts where report_id='b7000000-0000-4000-8000-000000000001'),'b0000000-0000-4000-8000-000000000001','WPAG_Preliminary_Research_Report_WPAG-PRR-900001_v1.pdf','application/pdf',100,'bad')$$,'P1001','Preliminary report artifact metadata is invalid.','invalid hash rejected');
select lives_ok($$select * from public.finalize_preliminary_report_artifact((select id from public.preliminary_report_artifacts where report_id='b7000000-0000-4000-8000-000000000001'),'b0000000-0000-4000-8000-000000000001','WPAG_Preliminary_Research_Report_WPAG-PRR-900001_v1.pdf','application/pdf',100,repeat('a',64))$$,'valid artifact finalized');
select is((select status from public.preliminary_report_artifacts where report_id='b7000000-0000-4000-8000-000000000001'),'finalized','finalized status persisted');
select is((select byte_size from public.preliminary_report_artifacts where report_id='b7000000-0000-4000-8000-000000000001'),100::bigint,'byte size persisted');
select is((select sha256 from public.preliminary_report_artifacts where report_id='b7000000-0000-4000-8000-000000000001'),repeat('a',64),'hash persisted');
select ok((select generated_at is not null from public.preliminary_report_artifacts where report_id='b7000000-0000-4000-8000-000000000001'),'generation timestamp persisted');
select is((select count(*) from public.get_preliminary_report_artifact_for_admin('b7000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001')),1::bigint,'admin artifact projection returns finalized artifact');
select throws_ok($$update public.preliminary_report_artifacts set sha256=repeat('b',64) where report_id='b7000000-0000-4000-8000-000000000001'$$,'P1001','Finalized preliminary report artifacts are immutable.','finalized hash immutable');
select throws_ok($$delete from public.preliminary_report_artifacts where report_id='b7000000-0000-4000-8000-000000000001'$$,'P1001','Finalized preliminary report artifacts are immutable.','finalized artifact deletion denied');
select lives_ok($$select * from public.transition_preliminary_report('b7000000-0000-4000-8000-000000000001',null,'b0000000-0000-4000-8000-000000000001','release',null,null,null)$$,'release with matching artifact succeeds');
select is((select status from public.preliminary_reports where id='b7000000-0000-4000-8000-000000000001'),'released','report released');
select is((select released_artifact_id from public.preliminary_reports where id='b7000000-0000-4000-8000-000000000001'),(select id from public.preliminary_report_artifacts where report_id='b7000000-0000-4000-8000-000000000001'),'exact artifact bound to release');
select ok((select released_at is not null from public.preliminary_report_artifacts where report_id='b7000000-0000-4000-8000-000000000001'),'artifact release timestamp persisted');
select is((select count(*) from public.notifications where notification_type='preliminary_report_available' and metadata->>'report_id'='b7000000-0000-4000-8000-000000000001'),1::bigint,'release notification created once');
select is((select title from public.notifications where notification_type='preliminary_report_available' and metadata->>'report_id'='b7000000-0000-4000-8000-000000000001'),'Preliminary Research Report Available','notification title canonical');
select is((select message from public.notifications where notification_type='preliminary_report_available' and metadata->>'report_id'='b7000000-0000-4000-8000-000000000001'),'Your Preliminary Research Report is now available in your participant portal.','notification message canonical');
select is((select count(*) from public.activity_timeline where entity_id='b7000000-0000-4000-8000-000000000001' and event_type='report_pdf_generation_started'),1::bigint,'generation start audited');
select is((select count(*) from public.activity_timeline where entity_id='b7000000-0000-4000-8000-000000000001' and event_type='report_pdf_generated'),1::bigint,'generation completion audited');

set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000011';
select is((select count(*) from public.get_current_participant_report_download('b7000000-0000-4000-8000-000000000001')),1::bigint,'participant can access own released artifact');
select is((select original_filename from public.get_current_participant_report_download('b7000000-0000-4000-8000-000000000001')),'WPAG_Preliminary_Research_Report_WPAG-PRR-900001_v1.pdf','participant receives safe filename');
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000012';
select throws_ok($$select * from public.get_current_participant_report_download('b7000000-0000-4000-8000-000000000001')$$,'P1001','Released preliminary report PDF was not found.','cross-participant access denied');
set local request.jwt.claim.sub='b0000000-0000-4000-8000-000000000011';
select throws_ok($$select * from public.get_current_participant_report_download('b7000000-0000-4000-8000-000000000002')$$,'P1001','Released preliminary report PDF was not found.','unreleased artifact access denied');
select ok(not (select to_jsonb(x)::text from public.get_current_participant_report_download('b7000000-0000-4000-8000-000000000001') x) ~* '(generated_by|participant_id|review_notes|actor)','participant projection excludes internal fields');

select * from finish();
rollback;
