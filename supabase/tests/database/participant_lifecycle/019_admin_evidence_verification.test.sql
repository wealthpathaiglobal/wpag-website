begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(88);

select ok(to_regprocedure(name) is not null,name || ' exists') from unnest(array[
 'public.list_admin_evidence_queue(uuid)','public.get_admin_evidence_detail(uuid,uuid)',
 'public.transition_evidence_verification(uuid,uuid,text,text,text)','public.get_admin_evidence_download(uuid,uuid,integer)']) name;
select ok((select prosecdef from pg_proc where oid=to_regprocedure(name)),name || ' security definer') from unnest(array[
 'public.list_admin_evidence_queue(uuid)','public.get_admin_evidence_detail(uuid,uuid)',
 'public.transition_evidence_verification(uuid,uuid,text,text,text)','public.get_admin_evidence_download(uuid,uuid,integer)']) name;
select is((select proowner::regrole::text from pg_proc where oid=to_regprocedure(name)),'postgres',name || ' owner postgres') from unnest(array[
 'public.list_admin_evidence_queue(uuid)','public.get_admin_evidence_detail(uuid,uuid)',
 'public.transition_evidence_verification(uuid,uuid,text,text,text)','public.get_admin_evidence_download(uuid,uuid,integer)']) name;
select ok((select proconfig @> array['search_path=public, pg_catalog'] from pg_proc where oid=to_regprocedure(name)),name || ' search path controlled') from unnest(array[
 'public.list_admin_evidence_queue(uuid)','public.get_admin_evidence_detail(uuid,uuid)',
 'public.transition_evidence_verification(uuid,uuid,text,text,text)','public.get_admin_evidence_download(uuid,uuid,integer)']) name;
select ok(has_function_privilege('service_role',name,'EXECUTE'),name || ' service role granted') from unnest(array[
 'public.list_admin_evidence_queue(uuid)','public.get_admin_evidence_detail(uuid,uuid)',
 'public.transition_evidence_verification(uuid,uuid,text,text,text)','public.get_admin_evidence_download(uuid,uuid,integer)']) name;
select ok(not has_function_privilege(role_name,name,'EXECUTE'),role_name || ' denied ' || name)
from unnest(array['public','anon','authenticated']) role_name cross join unnest(array[
 'public.list_admin_evidence_queue(uuid)','public.get_admin_evidence_detail(uuid,uuid)',
 'public.transition_evidence_verification(uuid,uuid,text,text,text)','public.get_admin_evidence_download(uuid,uuid,integer)']) name;
select ok((select pg_get_constraintdef(oid) like '%internal_notes_saved%' from pg_constraint where conname='evidence_verification_history_verification_event_check'),'internal notes event canonicalized');
select ok(to_regclass('public.notifications_evidence_verification_event_unique') is not null,'notification event uniqueness installed');

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('00000000-0000-0000-0000-000000000000','f1000000-0000-4000-8000-000000000001','authenticated','authenticated','admin49@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','f1000000-0000-4000-8000-000000000002','authenticated','authenticated','outsider49@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','f1000000-0000-4000-8000-000000000011','authenticated','authenticated','participant49@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01');
insert into public.staff_members(id,auth_user_id,staff_code,full_name,email,status,created_at) values
('f2000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000001','WPAG-STF-999001','Evidence Reviewer','admin49@test.local','active','2026-01-01');
insert into public.staff_member_roles(staff_member_id,staff_role_id,is_active,assigned_at)
select 'f2000000-0000-4000-8000-000000000001',id,true,'2026-01-01' from public.staff_roles where role_code='administrator';
insert into public.participants(id,auth_user_id,participant_code,lifecycle_status,created_at) values
('f3000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000011','WPAG-999001','active','2026-01-01');
insert into public.assessment_sessions(id,participant_id,assessment_number,assessment_type,assessment_version,status,current_stage,started_at,submitted_at,created_at) values
('f4000000-0000-4000-8000-000000000001','f3000000-0000-4000-8000-000000000001',1,'initial','1.0','submitted','assessment_processing','2026-01-01','2026-01-02','2026-01-01'),
('f4000000-0000-4000-8000-000000000002','f3000000-0000-4000-8000-000000000001',2,'initial','1.0','in_progress','financial_data_collection','2026-01-01',null,'2026-01-01');
insert into public.assessments(id,participant_id,assessment_session_id,assessment_number,assessment_version,hfos_version,assessment_date,currency_code,country_code,household_size,dependents,created_at) values
('f5000000-0000-4000-8000-000000000001','f3000000-0000-4000-8000-000000000001','f4000000-0000-4000-8000-000000000001',1,'1.0','phase-1-draft','2026-01-01','INR','IN',1,0,'2026-01-01'),
('f5000000-0000-4000-8000-000000000002','f3000000-0000-4000-8000-000000000001','f4000000-0000-4000-8000-000000000002',2,'1.0','phase-1-draft','2026-01-01','INR','IN',1,0,'2026-01-01');
insert into public.assessment_documents(id,assessment_id,document_category,document_type,document_name,original_filename,storage_bucket,storage_path,mime_type,file_size_bytes,checksum,verification_status,evidence_governance_version,created_at,updated_at) values
('f6000000-0000-4000-8000-000000000001','f5000000-0000-4000-8000-000000000001','income','bank_statement','Request document','request.pdf','assessment-evidence','f3000000-0000-4000-8000-000000000001/f5000000-0000-4000-8000-000000000001/f6000000-0000-4000-8000-000000000001/v1/object.pdf','application/pdf',100,repeat('a',64),'pending','evidence-v1','2026-01-02','2026-01-02'),
('f6000000-0000-4000-8000-000000000002','f5000000-0000-4000-8000-000000000001','asset','statement','Verify document','verify.pdf','assessment-evidence','f3000000-0000-4000-8000-000000000001/f5000000-0000-4000-8000-000000000001/f6000000-0000-4000-8000-000000000002/v1/object.pdf','application/pdf',110,repeat('b',64),'pending','evidence-v1','2026-01-02','2026-01-02'),
('f6000000-0000-4000-8000-000000000003','f5000000-0000-4000-8000-000000000001','liability','statement','Reject document','reject.pdf','assessment-evidence','f3000000-0000-4000-8000-000000000001/f5000000-0000-4000-8000-000000000001/f6000000-0000-4000-8000-000000000003/v1/object.pdf','application/pdf',120,repeat('c',64),'pending','evidence-v1','2026-01-02','2026-01-02'),
('f6000000-0000-4000-8000-000000000004','f5000000-0000-4000-8000-000000000002','income','statement','Unsubmitted document','unsubmitted.pdf','assessment-evidence','f3000000-0000-4000-8000-000000000001/f5000000-0000-4000-8000-000000000002/f6000000-0000-4000-8000-000000000004/v1/object.pdf','application/pdf',130,repeat('d',64),'pending','evidence-v1','2026-01-02','2026-01-02'),
('f6000000-0000-4000-8000-000000000005','f5000000-0000-4000-8000-000000000001','income','statement','Deleted document','deleted.pdf','assessment-evidence','f3000000-0000-4000-8000-000000000001/f5000000-0000-4000-8000-000000000001/f6000000-0000-4000-8000-000000000005/v1/object.pdf','application/pdf',140,repeat('e',64),'pending','evidence-v1','2026-01-02','2026-01-02');
update public.assessment_documents set deleted_at='2026-01-03' where id='f6000000-0000-4000-8000-000000000005';
insert into public.file_version_history(id,file_id,evidence_document_id,version_number,storage_path,file_name,file_size_bytes,mime_type,checksum,created_at)
select gen_random_uuid(),id,id,1,storage_path,original_filename,file_size_bytes,mime_type,checksum,created_at from public.assessment_documents;
insert into public.evidence_verification_history(assessment_document_id,verification_event,verification_status,created_at)
select id,'submitted','pending',created_at from public.assessment_documents;

select throws_ok($$select * from public.list_admin_evidence_queue('f1000000-0000-4000-8000-000000000002')$$,'P1001','Actor is not authorized to verify evidence.','non-admin queue denied');
select throws_ok($$select * from public.get_admin_evidence_detail('f6000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000002')$$,'P1001','Actor is not authorized to verify evidence.','non-admin detail denied');
select throws_ok($$select * from public.transition_evidence_verification('f6000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000002','start_verification',null,null)$$,'P1001','Actor is not authorized to verify evidence.','non-admin transition denied');
select throws_ok($$select * from public.get_admin_evidence_download('f6000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000002',1)$$,'P1001','Actor is not authorized to verify evidence.','non-admin download denied');
select is((select count(*) from public.list_admin_evidence_queue('f1000000-0000-4000-8000-000000000001')),3::bigint,'queue includes submitted active evidence');
select is((select count(*) from public.list_admin_evidence_queue('f1000000-0000-4000-8000-000000000001') where document_id='f6000000-0000-4000-8000-000000000004'),0::bigint,'non-submitted assessment excluded');
select is((select count(*) from public.list_admin_evidence_queue('f1000000-0000-4000-8000-000000000001') where document_id='f6000000-0000-4000-8000-000000000005'),0::bigint,'soft-deleted evidence excluded');
select ok((select can_start_verification and can_download from public.get_admin_evidence_detail('f6000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000001')),'pending detail exposes governed actions');
select ok(pg_get_function_result('public.get_participant_evidence(uuid,uuid)'::regprocedure) !~* '(internal_notes|verified_by|storage_path|checksum)','participant projection remains narrow');

select lives_ok($$select * from public.transition_evidence_verification('f6000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000001','start_verification',null,null)$$,'start verification succeeds');
select is((select verification_status from public.assessment_documents where id='f6000000-0000-4000-8000-000000000001'),'in_progress','start moves to in progress');
select is((select count(*) from public.evidence_verification_history where assessment_document_id='f6000000-0000-4000-8000-000000000001' and verification_event='verification_started'),1::bigint,'start history appended');
select is((select verified_by from public.evidence_verification_history where assessment_document_id='f6000000-0000-4000-8000-000000000001' and verification_event='verification_started'),'f1000000-0000-4000-8000-000000000001'::uuid,'reviewer identity preserved');
select ok((select verified_at is not null from public.evidence_verification_history where assessment_document_id='f6000000-0000-4000-8000-000000000001' and verification_event='verification_started'),'review timestamp preserved');
select throws_ok($$select * from public.transition_evidence_verification('f6000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000001','save_internal_notes',null,null)$$,'P1001','Internal evidence notes are required.','empty internal notes rejected');
select lives_ok($$select * from public.transition_evidence_verification('f6000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000001','save_internal_notes',null,'Private evidence note')$$,'internal notes save succeeds');
select is((select verification_status from public.assessment_documents where id='f6000000-0000-4000-8000-000000000001'),'in_progress','internal notes do not change status');
select is((select internal_notes from public.evidence_verification_history where assessment_document_id='f6000000-0000-4000-8000-000000000001' and verification_event='internal_notes_saved'),'Private evidence note','internal notes remain separate');
select ok((select verification_history::text not like '%Private evidence note%' from public.get_participant_evidence('f6000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000011')),'participant cannot see internal note');
select throws_ok($$select * from public.transition_evidence_verification('f6000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000001','request_information',' ',null)$$,'P1001','Participant-visible evidence feedback is required.','information request requires comment');
select lives_ok($$select * from public.transition_evidence_verification('f6000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000001','request_information','Please provide all pages.','Private follow-up')$$,'information request succeeds');
select is((select comments from public.evidence_verification_history where assessment_document_id='f6000000-0000-4000-8000-000000000001' and verification_event='information_requested'),'Please provide all pages.','participant comment stored');
select is((select internal_notes from public.evidence_verification_history where assessment_document_id='f6000000-0000-4000-8000-000000000001' and verification_event='information_requested'),'Private follow-up','request internal note separate');
select ok((select can_resubmit from public.get_participant_evidence('f6000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000011')),'information request makes evidence actionable');
select is((select count(*) from public.notifications where metadata->>'document_id'='f6000000-0000-4000-8000-000000000001'),1::bigint,'information notification exactly once');
select is((select title from public.notifications where metadata->>'document_id'='f6000000-0000-4000-8000-000000000001'),'Evidence Information Required','information notification canonical');
select ok((select message not like '%Private%' from public.notifications where metadata->>'document_id'='f6000000-0000-4000-8000-000000000001'),'notification excludes internal note');
select is((select count(*) from public.activity_timeline where entity_id='f6000000-0000-4000-8000-000000000001' and event_type='evidence_request_information'),1::bigint,'information request activity appended');
select throws_ok($$select * from public.transition_evidence_verification('f6000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000001','request_information','Again',null)$$,'P1001','Evidence verification transition is not allowed.','repeated information request rejected');
select throws_ok($$select * from public.transition_evidence_verification('f6000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000001','verify',null,null)$$,'P1001','Evidence verification transition is not allowed.','verification waits for resubmission');
select is((select version_number from public.get_admin_evidence_download('f6000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000001',1)),1,'admin exact download resolves');
select throws_ok($$select * from public.get_admin_evidence_download('f6000000-0000-4000-8000-000000000001','f1000000-0000-4000-8000-000000000001',99)$$,'P1001','Evidence download is unavailable.','missing version denied');
select throws_ok($$select * from public.get_admin_evidence_download(gen_random_uuid(),'f1000000-0000-4000-8000-000000000001',1)$$,'P1001','Evidence download is unavailable.','wrong document denied');

select lives_ok($$select * from public.transition_evidence_verification('f6000000-0000-4000-8000-000000000002','f1000000-0000-4000-8000-000000000001','start_verification',null,null)$$,'verify path starts');
select lives_ok($$select * from public.transition_evidence_verification('f6000000-0000-4000-8000-000000000002','f1000000-0000-4000-8000-000000000001','verify',null,'Verified internally')$$,'verify succeeds');
select is((select verification_status from public.assessment_documents where id='f6000000-0000-4000-8000-000000000002'),'verified','verified terminal status stored');
select ok((select verified_at is not null and verified_by='f1000000-0000-4000-8000-000000000001' from public.assessment_documents where id='f6000000-0000-4000-8000-000000000002'),'verified attribution stored');
select throws_ok($$select * from public.transition_evidence_verification('f6000000-0000-4000-8000-000000000002','f1000000-0000-4000-8000-000000000001','verify',null,null)$$,'P1001','Evidence verification transition is not allowed.','repeated terminal verify rejected');
select is((select count(*) from public.notifications where notification_type='evidence_verified'),1::bigint,'verified notification exactly once');
select ok((select not can_resubmit from public.get_participant_evidence('f6000000-0000-4000-8000-000000000002','f1000000-0000-4000-8000-000000000011')),'verified evidence read only');

select lives_ok($$select * from public.transition_evidence_verification('f6000000-0000-4000-8000-000000000003','f1000000-0000-4000-8000-000000000001','start_verification',null,null)$$,'reject path starts');
select throws_ok($$select * from public.transition_evidence_verification('f6000000-0000-4000-8000-000000000003','f1000000-0000-4000-8000-000000000001','reject',null,null)$$,'P1001','Participant-visible evidence feedback is required.','reject requires reason');
select lives_ok($$select * from public.transition_evidence_verification('f6000000-0000-4000-8000-000000000003','f1000000-0000-4000-8000-000000000001','reject','File is illegible.','Private rejection note')$$,'reject succeeds');
select is((select verification_status from public.assessment_documents where id='f6000000-0000-4000-8000-000000000003'),'rejected','rejected terminal status stored');
select is((select verification_notes from public.assessment_documents where id='f6000000-0000-4000-8000-000000000003'),'File is illegible.','participant rejection reason stored');
select is((select count(*) from public.notifications where notification_type='evidence_rejected'),1::bigint,'rejected notification exactly once');
select ok((select can_resubmit from public.get_participant_evidence('f6000000-0000-4000-8000-000000000003','f1000000-0000-4000-8000-000000000011')),'rejected evidence actionable');
select throws_ok($$select * from public.transition_evidence_verification('f6000000-0000-4000-8000-000000000003','f1000000-0000-4000-8000-000000000001','start_verification',null,null)$$,'P1001','Evidence verification transition is not allowed.','rejected terminal transition denied');
select throws_ok($$update public.evidence_verification_history set internal_notes='changed' where assessment_document_id='f6000000-0000-4000-8000-000000000003'$$,'P1001','Evidence verification history is append-only.','verification history update denied');
select throws_ok($$delete from public.file_version_history where evidence_document_id='f6000000-0000-4000-8000-000000000003'$$,'P1001','Evidence file version history is append-only.','file version delete denied');
select ok(not has_table_privilege('authenticated','public.assessment_documents','INSERT'),'authenticated direct document insert denied');
select ok(not has_table_privilege('authenticated','public.evidence_verification_history','INSERT'),'authenticated direct history insert denied');
select ok(not has_table_privilege('anon','public.assessment_documents','SELECT'),'anonymous evidence read denied');
select ok((select relrowsecurity from pg_class where oid='public.assessment_documents'::regclass),'assessment document RLS remains enabled');

select * from finish();
rollback;
