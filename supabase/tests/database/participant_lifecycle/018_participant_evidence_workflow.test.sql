begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(87);

select ok(to_regprocedure(name) is not null, name || ' exists') from unnest(array[
 'public.get_participant_evidence_context(uuid)', 'public.list_participant_evidence(uuid)',
 'public.get_participant_evidence(uuid,uuid)', 'public.prepare_evidence_resubmission(uuid,uuid,text,text,bigint,text)',
 'public.finalize_evidence_resubmission(uuid,uuid,bigint,text)', 'public.get_participant_evidence_download(uuid,uuid,integer)'
]) name;
select ok((select prosecdef from pg_proc where oid=to_regprocedure(name)),name || ' security definer') from unnest(array[
 'public.get_participant_evidence_context(uuid)', 'public.list_participant_evidence(uuid)',
 'public.get_participant_evidence(uuid,uuid)', 'public.prepare_evidence_resubmission(uuid,uuid,text,text,bigint,text)',
 'public.finalize_evidence_resubmission(uuid,uuid,bigint,text)', 'public.get_participant_evidence_download(uuid,uuid,integer)'
]) name;
select is((select proowner::regrole::text from pg_proc where oid=to_regprocedure(name)),'postgres',name || ' owner postgres') from unnest(array[
 'public.get_participant_evidence_context(uuid)', 'public.list_participant_evidence(uuid)',
 'public.get_participant_evidence(uuid,uuid)', 'public.prepare_evidence_resubmission(uuid,uuid,text,text,bigint,text)',
 'public.finalize_evidence_resubmission(uuid,uuid,bigint,text)', 'public.get_participant_evidence_download(uuid,uuid,integer)'
]) name;
select ok((select proconfig @> array['search_path=public, pg_catalog'] from pg_proc where oid=to_regprocedure(name)),name || ' search path controlled') from unnest(array[
 'public.get_participant_evidence_context(uuid)', 'public.list_participant_evidence(uuid)',
 'public.get_participant_evidence(uuid,uuid)', 'public.prepare_evidence_resubmission(uuid,uuid,text,text,bigint,text)',
 'public.finalize_evidence_resubmission(uuid,uuid,bigint,text)', 'public.get_participant_evidence_download(uuid,uuid,integer)'
]) name;
select ok(has_function_privilege('service_role',name,'EXECUTE'),name || ' service role granted') from unnest(array[
 'public.get_participant_evidence_context(uuid)', 'public.list_participant_evidence(uuid)',
 'public.get_participant_evidence(uuid,uuid)', 'public.prepare_evidence_resubmission(uuid,uuid,text,text,bigint,text)',
 'public.finalize_evidence_resubmission(uuid,uuid,bigint,text)', 'public.get_participant_evidence_download(uuid,uuid,integer)'
]) name;
select ok(not has_function_privilege(role_name,name,'EXECUTE'),role_name || ' denied ' || name)
from unnest(array['public','anon','authenticated']) role_name cross join unnest(array[
 'public.get_participant_evidence_context(uuid)', 'public.list_participant_evidence(uuid)',
 'public.get_participant_evidence(uuid,uuid)', 'public.prepare_evidence_resubmission(uuid,uuid,text,text,bigint,text)',
 'public.finalize_evidence_resubmission(uuid,uuid,bigint,text)', 'public.get_participant_evidence_download(uuid,uuid,integer)'
]) name;
select ok((select pg_get_constraintdef(oid) like '%version_number > 0%' from pg_constraint where conname='evidence_upload_reservations_version_number_check'),'reservation version constraint permits positive immutable versions');

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('00000000-0000-0000-0000-000000000000','e1000000-0000-4000-8000-000000000001','authenticated','authenticated','evidence.one@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','e1000000-0000-4000-8000-000000000002','authenticated','authenticated','evidence.two@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01');
insert into public.participants(id,auth_user_id,participant_code,lifecycle_status,created_at) values
('e2000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','WPAG-996001','active','2026-01-01'),
('e2000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000002','WPAG-996002','active','2026-01-01');
insert into public.assessment_sessions(id,participant_id,assessment_number,assessment_type,assessment_version,status,current_stage,started_at,created_at) values
('e3000000-0000-4000-8000-000000000001','e2000000-0000-4000-8000-000000000001',1,'initial','1.0','submitted','assessment_processing','2026-01-01','2026-01-01'),
('e3000000-0000-4000-8000-000000000002','e2000000-0000-4000-8000-000000000002',1,'initial','1.0','submitted','assessment_processing','2026-01-01','2026-01-01');
insert into public.assessments(id,participant_id,assessment_session_id,assessment_number,assessment_version,hfos_version,assessment_date,currency_code,country_code,household_size,dependents,created_at) values
('e4000000-0000-4000-8000-000000000001','e2000000-0000-4000-8000-000000000001','e3000000-0000-4000-8000-000000000001',1,'1.0','phase-1-draft','2026-01-01','INR','IN',1,0,'2026-01-01'),
('e4000000-0000-4000-8000-000000000002','e2000000-0000-4000-8000-000000000002','e3000000-0000-4000-8000-000000000002',1,'1.0','phase-1-draft','2026-01-01','INR','IN',1,0,'2026-01-01');
insert into public.assessment_documents(id,assessment_id,document_category,document_type,document_name,description,original_filename,storage_bucket,storage_path,mime_type,file_size_bytes,checksum,verification_status,verified_at,verified_by,verification_notes,evidence_governance_version,created_at,updated_at) values
('e5000000-0000-4000-8000-000000000001','e4000000-0000-4000-8000-000000000001','income','bank_statement','January statement','Initial statement','statement-v1.pdf','assessment-evidence','e2000000/e4000000/e5000000/v1/object.pdf','application/pdf',100,repeat('a',64),'rejected','2026-01-03','e9000000-0000-4000-8000-000000000001','Please provide a complete statement.','evidence-v1','2026-01-02','2026-01-03'),
('e5000000-0000-4000-8000-000000000002','e4000000-0000-4000-8000-000000000001','income','bank_statement','Verified statement',null,'verified.pdf','assessment-evidence','e2000000/e4000000/e5000002/v1/object.pdf','application/pdf',120,repeat('b',64),'verified','2026-01-03','e9000000-0000-4000-8000-000000000001',null,'evidence-v1','2026-01-02','2026-01-03');
insert into public.file_version_history(id,file_id,evidence_document_id,version_number,storage_path,file_name,file_size_bytes,mime_type,checksum,created_at) values
('e6000000-0000-4000-8000-000000000001','e5000000-0000-4000-8000-000000000001','e5000000-0000-4000-8000-000000000001',1,'e2000000/e4000000/e5000000/v1/object.pdf','statement-v1.pdf',100,'application/pdf',repeat('a',64),'2026-01-02'),
('e6000000-0000-4000-8000-000000000002','e5000000-0000-4000-8000-000000000002','e5000000-0000-4000-8000-000000000002',1,'e2000000/e4000000/e5000002/v1/object.pdf','verified.pdf',120,'application/pdf',repeat('b',64),'2026-01-02');
insert into public.evidence_verification_history(id,assessment_document_id,verification_event,verification_status,verified_by,verified_at,comments,internal_notes,created_at) values
('e7000000-0000-4000-8000-000000000001','e5000000-0000-4000-8000-000000000001','rejected','rejected','e9000000-0000-4000-8000-000000000001','2026-01-03','Please provide a complete statement.','Private reviewer note.','2026-01-03'),
('e7000000-0000-4000-8000-000000000002','e5000000-0000-4000-8000-000000000002','verified','verified','e9000000-0000-4000-8000-000000000001','2026-01-03',null,'Private verified note.','2026-01-03');

select is((select assessment_id from public.get_participant_evidence_context('e1000000-0000-4000-8000-000000000001')),'e4000000-0000-4000-8000-000000000001'::uuid,'active assessment context resolves');
select is((select count(*) from public.get_participant_evidence('e5000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000002')),0::bigint,'cross-participant detail denied');
select is((select count(*) from public.get_participant_evidence('e5000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001')),1::bigint,'participant gets own detail');
select ok(pg_get_function_result('public.get_participant_evidence(uuid,uuid)'::regprocedure) !~* '(storage_path|storage_bucket|sha256|checksum|verified_by|internal_notes|actor_id)','detail signature excludes internal fields');
select is((select jsonb_array_length(versions) from public.get_participant_evidence('e5000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001')),1,'detail includes version history');
select ok((select not (verification_history::text like '%Private reviewer note%') from public.get_participant_evidence('e5000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001')),'participant history excludes internal notes');
select ok((select can_resubmit from public.get_participant_evidence('e5000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001')),'rejected evidence is actionable');
select throws_ok($$select * from public.prepare_evidence_resubmission('e5000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000001','verified-new.pdf','application/pdf',130,repeat('c',64))$$,'P1001','Evidence is not available for resubmission.','verified evidence cannot be resubmitted');
select throws_ok($$select * from public.prepare_evidence_resubmission('e5000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000002','cross.pdf','application/pdf',130,repeat('c',64))$$,'P1001','Evidence resubmission is unavailable.','cross-participant resubmission denied');
select throws_ok($$select * from public.prepare_evidence_resubmission('e5000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','bad.txt','text/plain',130,repeat('c',64))$$,'P1001','Evidence upload metadata is invalid.','resubmission MIME validated');

create temporary table evidence_resubmission as select * from public.prepare_evidence_resubmission('e5000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','statement-v2.pdf','application/pdf',130,repeat('c',64));
select is((select version_number from evidence_resubmission),2,'resubmission increments version under lock');
select ok((select storage_path like '%/v2/%' from evidence_resubmission),'resubmission path is immutable and versioned');
select is((select count(*) from public.evidence_upload_reservations where id=(select reservation_id from evidence_resubmission)),1::bigint,'resubmission reservation persisted');
select throws_ok($$update public.evidence_upload_reservations set document_id='e5000000-0000-4000-8000-000000000002' where id=(select reservation_id from evidence_resubmission)$$,'P1001','Evidence upload reservation identity is immutable.','resubmission binding immutable');
select throws_ok($$select * from public.finalize_evidence_resubmission((select reservation_id from evidence_resubmission),'e1000000-0000-4000-8000-000000000002',130,repeat('c',64))$$,'P1001','Evidence upload reservation is unavailable.','wrong participant cannot finalize');
select throws_ok($$select * from public.finalize_evidence_resubmission((select reservation_id from evidence_resubmission),'e1000000-0000-4000-8000-000000000001',130,repeat('c',64))$$,'P1001','Evidence storage object is unavailable.','missing storage object blocks resubmission');
insert into storage.objects(bucket_id,name,metadata) select storage_bucket,storage_path,jsonb_build_object('size',130,'mimetype','application/pdf') from evidence_resubmission;
select lives_ok($$select * from public.finalize_evidence_resubmission((select reservation_id from evidence_resubmission),'e1000000-0000-4000-8000-000000000001',130,repeat('c',64))$$,'valid resubmission finalizes');
select is((select count(*) from public.file_version_history where evidence_document_id='e5000000-0000-4000-8000-000000000001'),2::bigint,'new immutable version appended');
select is((select checksum from public.file_version_history where evidence_document_id='e5000000-0000-4000-8000-000000000001' and version_number=1),repeat('a',64),'prior version remains unchanged');
select is((select verification_status from public.assessment_documents where id='e5000000-0000-4000-8000-000000000001'),'pending','resubmission resets current verification state');
select is((select count(*) from public.evidence_verification_history where assessment_document_id='e5000000-0000-4000-8000-000000000001' and verification_event='resubmitted'),1::bigint,'immutable resubmission event appended');
select is((select count(*) from public.activity_timeline where entity_id='e5000000-0000-4000-8000-000000000001' and event_type='evidence_resubmitted'),1::bigint,'resubmission activity appended');
select ok((select consumed_at is not null from public.evidence_upload_reservations where id=(select reservation_id from evidence_resubmission)),'reservation consumed atomically');
select throws_ok($$select * from public.finalize_evidence_resubmission((select reservation_id from evidence_resubmission),'e1000000-0000-4000-8000-000000000001',130,repeat('c',64))$$,'P1001','Evidence upload reservation is unavailable.','resubmission reservation single use');
select is((select (versions->0->>'version_number')::integer from public.get_participant_evidence('e5000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001')),2,'version history newest first');
select is((select version_number from public.get_participant_evidence_download('e5000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001',null)),2,'download defaults to current version');
select is((select version_number from public.get_participant_evidence_download('e5000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001',1)),1,'historical version download resolves');
select throws_ok($$select * from public.get_participant_evidence_download('e5000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000002',null)$$,'P1001','Evidence download is unavailable.','cross-participant download denied');
select throws_ok($$select * from public.get_participant_evidence_download('e5000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001',99)$$,'P1001','Evidence download is unavailable.','missing version download denied');
select throws_ok($$select * from public.get_participant_evidence_download('e5000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001',0)$$,'P1001','Evidence download is unavailable.','invalid version download denied');
select is((select count(*) from public.list_participant_evidence('e1000000-0000-4000-8000-000000000001')),2::bigint,'participant lists only own evidence');
select is((select count(*) from public.list_participant_evidence('e1000000-0000-4000-8000-000000000002')),0::bigint,'other participant list excludes evidence');
insert into public.file_version_history(id,file_id,version_number,storage_path,file_name,file_size_bytes,mime_type) values ('e8000000-0000-4000-8000-000000000001','e8100000-0000-4000-8000-000000000001',1,'generic/file','generic.bin',0,'application/octet-stream');
select is((select count(*) from public.file_version_history where id='e8000000-0000-4000-8000-000000000001' and evidence_document_id is null),1::bigint,'generic file history remains compatible');
update public.assessment_documents set deleted_at=transaction_timestamp() where id='e5000000-0000-4000-8000-000000000001';
select is((select count(*) from public.get_participant_evidence('e5000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001')),0::bigint,'soft-deleted detail excluded');
select is((select count(*) from public.list_participant_evidence('e1000000-0000-4000-8000-000000000001')),1::bigint,'soft-deleted evidence excluded from list');

-- Expired resubmission reservations are retired under the document lock, while
-- a concurrent active reservation receives a safe governed conflict.
update public.assessment_documents set deleted_at=null where id='e5000000-0000-4000-8000-000000000001';
insert into public.evidence_verification_history(assessment_document_id,verification_event,verification_status,comments,created_at)
values ('e5000000-0000-4000-8000-000000000001','information_requested','pending','Provide another version.','2027-01-01');
insert into public.evidence_upload_reservations(id,participant_id,assessment_id,assessment_session_id,document_id,version_number,storage_bucket,storage_path,document_category,document_type,document_name,original_filename,declared_mime_type,expected_file_size_bytes,expected_sha256,prepared_by,prepared_at,expires_at)
values ('e9000000-0000-4000-8000-000000000010','e2000000-0000-4000-8000-000000000001','e4000000-0000-4000-8000-000000000001','e3000000-0000-4000-8000-000000000001','e5000000-0000-4000-8000-000000000001',3,'assessment-evidence','expired/v3/object.pdf','income','bank_statement','Expired v3','expired-v3.pdf','application/pdf',140,repeat('d',64),'e1000000-0000-4000-8000-000000000001',transaction_timestamp()-interval '2 hours',transaction_timestamp()-interval '1 hour');
create temporary table evidence_retry as select * from public.prepare_evidence_resubmission('e5000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','retry-v3.pdf','application/pdf',140,repeat('e',64));
select ok((select cancelled_at is not null from public.evidence_upload_reservations where id='e9000000-0000-4000-8000-000000000010'),'expired reservation is retired safely');
select is((select version_number from evidence_retry),3,'retry reserves the next immutable version');
select throws_ok($$select * from public.prepare_evidence_resubmission('e5000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','concurrent-v3.pdf','application/pdf',140,repeat('f',64))$$,'P1001','Evidence resubmission reservation already exists.','concurrent active reservation conflicts safely');

select * from finish();
rollback;
