begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;

select plan(137);

-- Catalog, storage, execution, and direct-table security.
select ok((select not public from storage.buckets where id = 'assessment-evidence'), 'evidence bucket is private');
select is((select file_size_limit from storage.buckets where id = 'assessment-evidence'), 10485760::bigint, 'evidence bucket limit is ten MiB');
select is((select allowed_mime_types::text from storage.buckets where id = 'assessment-evidence'), '{application/pdf,image/jpeg,image/png}', 'evidence bucket MIME allowlist exact');

select ok((select relrowsecurity from pg_class where oid = table_name::regclass), table_name || ' RLS enabled')
from unnest(array[
    'public.assessment_documents',
    'public.evidence_verification_history',
    'public.file_version_history',
    'public.evidence_upload_reservations'
]) table_name;

select ok(to_regprocedure(function_name) is not null, function_name || ' exists')
from unnest(array[
    'public.prepare_evidence_upload(uuid,uuid,text,text,text,text,text,text,bigint,text)',
    'public.finalize_evidence_upload(uuid,uuid,bigint,text)',
    'public.list_participant_evidence(uuid)',
    'public.list_admin_evidence(uuid,uuid,uuid)',
    'public.get_admin_evidence(uuid,uuid)'
]) function_name;

select ok((select prosecdef from pg_proc where oid = to_regprocedure(function_name)), function_name || ' is security definer')
from unnest(array[
    'public.prepare_evidence_upload(uuid,uuid,text,text,text,text,text,text,bigint,text)',
    'public.finalize_evidence_upload(uuid,uuid,bigint,text)',
    'public.list_participant_evidence(uuid)',
    'public.list_admin_evidence(uuid,uuid,uuid)',
    'public.get_admin_evidence(uuid,uuid)'
]) function_name;

select is((select proowner::regrole::text from pg_proc where oid = to_regprocedure(function_name)), 'postgres', function_name || ' owner postgres')
from unnest(array[
    'public.prepare_evidence_upload(uuid,uuid,text,text,text,text,text,text,bigint,text)',
    'public.finalize_evidence_upload(uuid,uuid,bigint,text)',
    'public.list_participant_evidence(uuid)',
    'public.list_admin_evidence(uuid,uuid,uuid)',
    'public.get_admin_evidence(uuid,uuid)'
]) function_name;

select ok((select proconfig @> array['search_path=public, pg_catalog'] from pg_proc where oid = to_regprocedure(function_name)), function_name || ' search path controlled')
from unnest(array[
    'public.prepare_evidence_upload(uuid,uuid,text,text,text,text,text,text,bigint,text)',
    'public.finalize_evidence_upload(uuid,uuid,bigint,text)',
    'public.list_participant_evidence(uuid)',
    'public.list_admin_evidence(uuid,uuid,uuid)',
    'public.get_admin_evidence(uuid,uuid)'
]) function_name;

select ok(has_function_privilege('service_role', function_name, 'EXECUTE'), function_name || ' service role granted')
from unnest(array[
    'public.prepare_evidence_upload(uuid,uuid,text,text,text,text,text,text,bigint,text)',
    'public.finalize_evidence_upload(uuid,uuid,bigint,text)',
    'public.list_participant_evidence(uuid)',
    'public.list_admin_evidence(uuid,uuid,uuid)',
    'public.get_admin_evidence(uuid,uuid)'
]) function_name;

select ok(not has_function_privilege(role_name, function_name, 'EXECUTE'), role_name || ' denied ' || function_name)
from unnest(array['public', 'anon', 'authenticated']) role_name
cross join unnest(array[
    'public.prepare_evidence_upload(uuid,uuid,text,text,text,text,text,text,bigint,text)',
    'public.finalize_evidence_upload(uuid,uuid,bigint,text)',
    'public.list_participant_evidence(uuid)',
    'public.list_admin_evidence(uuid,uuid,uuid)',
    'public.get_admin_evidence(uuid,uuid)'
]) function_name;

select ok(not has_table_privilege(role_name, table_name, privilege_name), role_name || ' denied ' || privilege_name || ' on ' || table_name)
from unnest(array['anon', 'authenticated', 'service_role']) role_name
cross join (values
    ('public.assessment_documents', 'INSERT'),
    ('public.evidence_verification_history', 'INSERT'),
    ('public.file_version_history', 'INSERT'),
    ('public.evidence_upload_reservations', 'INSERT')
) permissions(table_name, privilege_name);

select is((select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects' and (qual::text like '%assessment-evidence%' or with_check::text like '%assessment-evidence%')), 0::bigint, 'no browser storage policy introduced');
select ok(exists(select 1 from pg_constraint where conname = 'file_version_history_evidence_document_fk' and contype = 'f'), 'evidence version relationship enforced');
select has_trigger('public', 'evidence_verification_history', 'evidence_verification_history_append_only', 'verification history append-only trigger exists');
select has_trigger('public', 'file_version_history', 'file_version_history_append_only', 'file version append-only trigger exists');
select has_trigger('public', 'assessment_documents', 'assessment_document_file_identity_immutable', 'document file identity trigger exists');
select ok(exists(select 1 from pg_constraint where conname = 'assessment_documents_governed_evidence_check'), 'governed document MIME required conditionally');
select ok(exists(select 1 from pg_constraint where conname = 'file_version_history_governed_evidence_check'), 'governed evidence version integrity required conditionally');
select ok(exists(select 1 from pg_indexes where indexname = 'file_version_history_evidence_version_unique'), 'evidence version one uniqueness enforced');
select ok(exists(select 1 from pg_constraint where conname = 'assessment_documents_checksum_check'), 'document SHA-256 constraint exists');
select ok((select pg_get_constraintdef(oid) not like '%approved%' from pg_constraint where conname = 'evidence_verification_history_verification_status_check'), 'approved vocabulary removed');

-- Deterministic administrator and participant fixtures.
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('00000000-0000-0000-0000-000000000000','a1000000-0000-4000-8000-000000000001','authenticated','authenticated','evidence.admin@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','a1000000-0000-4000-8000-000000000002','authenticated','authenticated','evidence.outsider@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','a1000000-0000-4000-8000-000000000011','authenticated','authenticated','evidence.one@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','a1000000-0000-4000-8000-000000000012','authenticated','authenticated','evidence.two@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','a1000000-0000-4000-8000-000000000013','authenticated','authenticated','evidence.deleted@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01');

insert into public.staff_members(id,auth_user_id,staff_code,full_name,email,status,created_at) values
('a2000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000001','WPAG-STF-997001','Evidence Administrator','evidence.admin@test.local','active','2026-01-01');
insert into public.staff_member_roles(staff_member_id,staff_role_id,is_active,assigned_at)
select 'a2000000-0000-4000-8000-000000000001',id,true,'2026-01-01' from public.staff_roles where role_code='administrator';

insert into public.participants(id,auth_user_id,participant_code,lifecycle_status,created_at) values
('a3000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000011','WPAG-997001','active','2026-01-01'),
('a3000000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000000012','WPAG-997002','active','2026-01-01'),
('a3000000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000000013','WPAG-997003','active','2026-01-01');
update public.participants set deleted_at='2026-02-01' where id='a3000000-0000-4000-8000-000000000003';

insert into public.assessment_sessions(id,participant_id,assessment_number,assessment_type,assessment_version,status,current_stage,started_at,created_at) values
('a4000000-0000-4000-8000-000000000001','a3000000-0000-4000-8000-000000000001',1,'initial','1.0','in_progress','financial_data_collection','2026-01-01','2026-01-01'),
('a4000000-0000-4000-8000-000000000002','a3000000-0000-4000-8000-000000000002',1,'initial','1.0','in_progress','financial_data_collection','2026-01-01','2026-01-01'),
('a4000000-0000-4000-8000-000000000003','a3000000-0000-4000-8000-000000000003',1,'initial','1.0','in_progress','financial_data_collection','2026-01-01','2026-01-01'),
('a4000000-0000-4000-8000-000000000004','a3000000-0000-4000-8000-000000000001',2,'initial','1.0','cancelled','financial_data_collection','2026-01-01','2026-01-01'),
('a4000000-0000-4000-8000-000000000005','a3000000-0000-4000-8000-000000000001',3,'initial','1.0','completed','completed','2026-01-01','2026-01-01'),
('a4000000-0000-4000-8000-000000000006','a3000000-0000-4000-8000-000000000001',4,'initial','1.0','archived','financial_data_collection','2026-01-01','2026-01-01');
update public.assessment_sessions set deleted_at='2026-02-01' where id='a4000000-0000-4000-8000-000000000006';
insert into public.assessments(id,participant_id,assessment_session_id,assessment_number,assessment_version,hfos_version,assessment_date,currency_code,country_code,household_size,dependents,created_at) values
('a5000000-0000-4000-8000-000000000001','a3000000-0000-4000-8000-000000000001','a4000000-0000-4000-8000-000000000001',1,'1.0','phase-1-draft','2026-01-01','INR','IN',2,0,'2026-01-01'),
('a5000000-0000-4000-8000-000000000002','a3000000-0000-4000-8000-000000000002','a4000000-0000-4000-8000-000000000002',1,'1.0','phase-1-draft','2026-01-01','INR','IN',2,0,'2026-01-01'),
('a5000000-0000-4000-8000-000000000003','a3000000-0000-4000-8000-000000000003','a4000000-0000-4000-8000-000000000003',1,'1.0','phase-1-draft','2026-01-01','INR','IN',2,0,'2026-01-01'),
('a5000000-0000-4000-8000-000000000004','a3000000-0000-4000-8000-000000000001','a4000000-0000-4000-8000-000000000004',2,'1.0','phase-1-draft','2026-01-01','INR','IN',2,0,'2026-01-01'),
('a5000000-0000-4000-8000-000000000005','a3000000-0000-4000-8000-000000000001','a4000000-0000-4000-8000-000000000005',3,'1.0','phase-1-draft','2026-01-01','INR','IN',2,0,'2026-01-01'),
('a5000000-0000-4000-8000-000000000006','a3000000-0000-4000-8000-000000000001','a4000000-0000-4000-8000-000000000006',4,'1.0','phase-1-draft','2026-01-01','INR','IN',2,0,'2026-01-01');

-- Authorization, lifecycle, and input integrity.
select throws_ok($$select * from public.list_admin_evidence('a1000000-0000-4000-8000-000000000002',null,null)$$,'P1001','Actor is not authorized to access evidence.','non-admin list denied');
select throws_ok($$select * from public.get_admin_evidence(gen_random_uuid(),'a1000000-0000-4000-8000-000000000002')$$,'P1001','Actor is not authorized to access evidence.','non-admin detail denied');
select throws_ok($$select * from public.prepare_evidence_upload('a5000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000012','income','statement','Statement',null,'statement.pdf','application/pdf',100,repeat('a',64))$$,'P1001','Evidence upload is unavailable.','cross-participant prepare denied');
select throws_ok($$select * from public.prepare_evidence_upload('a5000000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000000013','income','statement','Statement',null,'statement.pdf','application/pdf',100,repeat('a',64))$$,'P1001','Evidence upload is unavailable.','soft-deleted participant prepare denied');
select throws_ok($$select * from public.prepare_evidence_upload('a5000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000011','income','statement','Statement',null,'statement.txt','text/plain',100,repeat('a',64))$$,'P1001','Evidence upload metadata is invalid.','disallowed MIME rejected');
select throws_ok($$select * from public.prepare_evidence_upload('a5000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000011','income','statement','Statement',null,'statement.pdf','application/pdf',10485761,repeat('a',64))$$,'P1001','Evidence upload metadata is invalid.','oversized evidence rejected');
select throws_ok($$select * from public.prepare_evidence_upload('a5000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000011','income','statement','Statement',null,'statement.pdf','application/pdf',100,'bad')$$,'P1001','Evidence upload metadata is invalid.','invalid SHA-256 rejected');
select throws_ok($$select * from public.prepare_evidence_upload('a5000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000011','income','statement','Statement',null,'../statement.pdf','application/pdf',100,repeat('a',64))$$,'P1001','Evidence upload metadata is invalid.','unsafe filename rejected');
select throws_ok($$select * from public.prepare_evidence_upload('a5000000-0000-4000-8000-000000000004','a1000000-0000-4000-8000-000000000011','income','statement','Statement',null,'statement.pdf','application/pdf',100,repeat('a',64))$$,'P1001','Evidence upload is unavailable.','cancelled session prepare denied');
select throws_ok($$select * from public.prepare_evidence_upload('a5000000-0000-4000-8000-000000000005','a1000000-0000-4000-8000-000000000011','income','statement','Statement',null,'statement.pdf','application/pdf',100,repeat('a',64))$$,'P1001','Evidence upload is unavailable.','completed session prepare denied');
select throws_ok($$select * from public.prepare_evidence_upload('a5000000-0000-4000-8000-000000000006','a1000000-0000-4000-8000-000000000011','income','statement','Statement',null,'statement.pdf','application/pdf',100,repeat('a',64))$$,'P1001','Evidence upload is unavailable.','deleted session prepare denied');
select lives_ok($$select * from public.prepare_evidence_upload('a5000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000011','income','statement','Statement',null,'statement.pdf','application/pdf',100,repeat('a',64))$$,'valid prepare succeeds');

create temporary table evidence_prepared as
select * from public.prepare_evidence_upload(
    'a5000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000011',
    'income','bank_statement','Bank Statement','January statement',
    'statement.pdf','application/pdf',100,repeat('a',64)
);

-- Persisted reservation, storage verification, and atomic finalization.
select is((select count(*) from public.assessment_documents),0::bigint,'prepare creates no incomplete document row');
select is((select count(*) from public.evidence_upload_reservations where id=(select reservation_id from evidence_prepared)),1::bigint,'prepare persists one bound reservation');
select is((select storage_bucket from evidence_prepared),'assessment-evidence','prepare returns private bucket');
select ok((select storage_path ~ '^a3000000-.*/a5000000-.*/[0-9a-f-]{36}/v1/[0-9a-f-]{36}\.pdf$' from evidence_prepared),'prepare returns immutable versioned path');
select is((select version_number from evidence_prepared),1,'prepare starts at version one');
select is((select sha256 from evidence_prepared),repeat('a',64),'prepare preserves computed SHA-256');
select ok(pg_get_function_result('public.list_participant_evidence(uuid)'::regprocedure) !~* '(storage_path|storage_bucket|sha256|checksum|verified_by|internal_notes)','participant projection excludes private fields');
select throws_ok($$update public.evidence_upload_reservations set storage_path='wrong/path.pdf' where id=(select reservation_id from evidence_prepared)$$,'P1001','Evidence upload reservation identity is immutable.','reservation path mutation denied');
select throws_ok($$update public.evidence_upload_reservations set declared_mime_type='image/png' where id=(select reservation_id from evidence_prepared)$$,'P1001','Evidence upload reservation identity is immutable.','reservation MIME mutation denied');
select throws_ok($$update public.evidence_upload_reservations set assessment_id='a5000000-0000-4000-8000-000000000002' where id=(select reservation_id from evidence_prepared)$$,'P1001','Evidence upload reservation identity is immutable.','reservation assessment mutation denied');
select throws_ok($$update public.evidence_upload_reservations set assessment_session_id='a4000000-0000-4000-8000-000000000002' where id=(select reservation_id from evidence_prepared)$$,'P1001','Evidence upload reservation identity is immutable.','reservation session mutation denied');
select throws_ok($$update public.evidence_upload_reservations set document_category='changed' where id=(select reservation_id from evidence_prepared)$$,'P1001','Evidence upload reservation identity is immutable.','reservation category mutation denied');
select throws_ok($$update public.evidence_upload_reservations set document_type='changed' where id=(select reservation_id from evidence_prepared)$$,'P1001','Evidence upload reservation identity is immutable.','reservation type mutation denied');
select throws_ok($$update public.evidence_upload_reservations set document_id=gen_random_uuid() where id=(select reservation_id from evidence_prepared)$$,'P1001','Evidence upload reservation identity is immutable.','reservation document mutation denied');
select throws_ok($$update public.evidence_upload_reservations set version_number=2 where id=(select reservation_id from evidence_prepared)$$,'P1001','Evidence upload reservation identity is immutable.','reservation version mutation denied');
select throws_ok($$select * from public.finalize_evidence_upload((select reservation_id from evidence_prepared),'a1000000-0000-4000-8000-000000000012',(select file_size_bytes from evidence_prepared),(select sha256 from evidence_prepared))$$,'P1001','Evidence upload reservation is unavailable.','cross-participant finalize denied');
select throws_ok($$select * from public.finalize_evidence_upload((select reservation_id from evidence_prepared),'a1000000-0000-4000-8000-000000000011',(select file_size_bytes from evidence_prepared),(select sha256 from evidence_prepared))$$,'P1001','Evidence storage object is unavailable.','finalize without exact storage object denied');
insert into storage.objects(bucket_id,name,metadata) select storage_bucket,storage_path,jsonb_build_object('size',file_size_bytes,'mimetype',mime_type) from evidence_prepared;
select lives_ok($$select * from public.finalize_evidence_upload((select reservation_id from evidence_prepared),'a1000000-0000-4000-8000-000000000011',(select file_size_bytes from evidence_prepared),(select sha256 from evidence_prepared))$$,'valid evidence finalizes atomically');
select is((select count(*) from public.assessment_documents where id=(select document_id from evidence_prepared)),1::bigint,'document metadata persisted');
select is((select verification_status from public.assessment_documents where id=(select document_id from evidence_prepared)),'pending','canonical pending status persisted');
select is((select checksum from public.assessment_documents where id=(select document_id from evidence_prepared)),repeat('a',64),'document SHA-256 persisted');
select is((select count(*) from public.file_version_history where evidence_document_id=(select document_id from evidence_prepared)),1::bigint,'initial evidence-linked file version persisted');
select is((select version_number from public.file_version_history where evidence_document_id=(select document_id from evidence_prepared)),1,'evidence file version one persisted');
select is((select count(*) from public.evidence_verification_history where assessment_document_id=(select document_id from evidence_prepared)),1::bigint,'submission history persisted');
select is((select verification_status from public.evidence_verification_history where assessment_document_id=(select document_id from evidence_prepared)),'pending','history uses canonical pending status');
select is((select count(*) from public.activity_timeline where entity_id=(select document_id from evidence_prepared) and event_type='evidence_submitted'),1::bigint,'evidence submission audited');
select ok((select consumed_at is not null from public.evidence_upload_reservations where id=(select reservation_id from evidence_prepared)),'reservation consumed atomically');
select ok((select not (to_jsonb(e) ?| array['storage_path','storage_bucket','sha256','checksum','verified_by','internal_notes']) from public.list_participant_evidence('a1000000-0000-4000-8000-000000000011') e),'runtime participant result excludes private fields');

insert into public.evidence_upload_reservations(
    id,participant_id,assessment_id,assessment_session_id,document_id,version_number,
    storage_bucket,storage_path,document_category,document_type,document_name,
    original_filename,declared_mime_type,expected_file_size_bytes,expected_sha256,
    expected_max_size,prepared_by,prepared_at,expires_at
) values (
    'b1000000-0000-4000-8000-000000000001','a3000000-0000-4000-8000-000000000001',
    'a5000000-0000-4000-8000-000000000001','a4000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000001',1,'assessment-evidence',
    'a3000000-0000-4000-8000-000000000001/a5000000-0000-4000-8000-000000000001/b2000000-0000-4000-8000-000000000001/v1/b3000000-0000-4000-8000-000000000001.pdf',
    'income','statement','Expired reservation','expired.pdf','application/pdf',100,repeat('b',64),10485760,
    'a1000000-0000-4000-8000-000000000011',transaction_timestamp()-interval '2 hours',transaction_timestamp()-interval '1 hour'
);
select throws_ok($$select * from public.finalize_evidence_upload('b1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000011',100,repeat('b',64))$$,'P1001','Evidence upload reservation is unavailable.','expired reservation rejected');

create temporary table evidence_bad_metadata as
select * from public.prepare_evidence_upload(
    'a5000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000011',
    'income','bank_statement','Metadata mismatch',null,'mismatch.pdf','application/pdf',100,repeat('c',64)
);
insert into storage.objects(bucket_id,name,metadata)
select storage_bucket,storage_path,jsonb_build_object('size',101,'mimetype',mime_type) from evidence_bad_metadata;
select throws_ok($$select * from public.finalize_evidence_upload((select reservation_id from evidence_bad_metadata),'a1000000-0000-4000-8000-000000000011',100,repeat('c',64))$$,'P1001','Evidence storage object metadata does not match.','storage size mismatch rejected');
select is((select count(*) from public.assessment_documents where id=(select document_id from evidence_bad_metadata)),0::bigint,'metadata mismatch creates no document');
select ok((select consumed_at is null from public.evidence_upload_reservations where id=(select reservation_id from evidence_bad_metadata)),'metadata mismatch leaves reservation safely unconsumed');
update storage.objects set metadata=jsonb_build_object('size',100,'mimetype','image/png')
where bucket_id=(select storage_bucket from evidence_bad_metadata) and name=(select storage_path from evidence_bad_metadata);
select throws_ok($$select * from public.finalize_evidence_upload((select reservation_id from evidence_bad_metadata),'a1000000-0000-4000-8000-000000000011',100,repeat('c',64))$$,'P1001','Evidence storage object metadata does not match.','storage MIME mismatch rejected');

-- Read boundaries, immutability, soft deletion, and regressions.
select is((select count(*) from public.list_participant_evidence('a1000000-0000-4000-8000-000000000011')),1::bigint,'participant lists own evidence');
select is((select count(*) from public.list_participant_evidence('a1000000-0000-4000-8000-000000000012')),0::bigint,'cross-participant list returns no evidence');
select is((select count(*) from public.list_admin_evidence('a1000000-0000-4000-8000-000000000001',null,null)),1::bigint,'authorized admin lists evidence');
select is((select count(*) from public.list_admin_evidence('a1000000-0000-4000-8000-000000000001','a3000000-0000-4000-8000-000000000002',null)),0::bigint,'admin participant filter enforced');
select is((select count(*) from public.list_admin_evidence('a1000000-0000-4000-8000-000000000001',null,'a5000000-0000-4000-8000-000000000002')),0::bigint,'admin assessment filter enforced');
select is((select count(*) from public.get_admin_evidence((select document_id from evidence_prepared),'a1000000-0000-4000-8000-000000000001')),1::bigint,'authorized admin gets evidence detail');
select is((select jsonb_array_length(versions) from public.get_admin_evidence((select document_id from evidence_prepared),'a1000000-0000-4000-8000-000000000001')),1,'admin detail includes version history');
select is((select jsonb_array_length(verification_history) from public.get_admin_evidence((select document_id from evidence_prepared),'a1000000-0000-4000-8000-000000000001')),1,'admin detail includes verification history');
select is((select sha256 from public.get_admin_evidence((select document_id from evidence_prepared),'a1000000-0000-4000-8000-000000000001')),repeat('a',64),'admin server detail includes integrity hash');
select throws_ok($$update public.evidence_verification_history set verification_status='verified' where assessment_document_id=(select document_id from evidence_prepared)$$,'P1001','Evidence verification history is append-only.','verification history update denied');
select throws_ok($$delete from public.evidence_verification_history where assessment_document_id=(select document_id from evidence_prepared)$$,'P1001','Evidence verification history is append-only.','verification history delete denied');
select throws_ok($$update public.file_version_history set checksum=repeat('b',64) where file_id=(select document_id from evidence_prepared)$$,'P1001','Evidence file version history is append-only.','file version update denied');
select throws_ok($$delete from public.file_version_history where file_id=(select document_id from evidence_prepared)$$,'P1001','Evidence file version history is append-only.','file version delete denied');
select throws_ok($$update public.assessment_documents set checksum=repeat('b',64) where id=(select document_id from evidence_prepared)$$,'P1001','Evidence file identity is immutable.','document checksum mutation denied');
select throws_ok($$select * from public.finalize_evidence_upload((select reservation_id from evidence_prepared),'a1000000-0000-4000-8000-000000000011',(select file_size_bytes from evidence_prepared),(select sha256 from evidence_prepared))$$,'P1001','Evidence upload reservation is unavailable.','duplicate finalization denied');
update public.assessment_documents set deleted_at=transaction_timestamp(),updated_by='a1000000-0000-4000-8000-000000000011' where id=(select document_id from evidence_prepared);
select is((select count(*) from public.list_participant_evidence('a1000000-0000-4000-8000-000000000011')),0::bigint,'soft-deleted evidence excluded from participant list');
select is((select count(*) from public.list_admin_evidence('a1000000-0000-4000-8000-000000000001',null,null)),0::bigint,'soft-deleted evidence excluded from admin list');

-- Legacy compatibility: governed constraints do not invent or reinterpret history.
insert into public.assessment_documents(
    id,assessment_id,document_category,document_type,document_name,original_filename,
    storage_bucket,storage_path,mime_type,file_size_bytes,checksum
) values
('d1000000-0000-4000-8000-000000000001','a5000000-0000-4000-8000-000000000001','legacy','legacy','Legacy nullable','legacy-null','legacy-bucket','legacy/null',null,null,null),
('d1000000-0000-4000-8000-000000000002','a5000000-0000-4000-8000-000000000001','legacy','legacy','Legacy unsupported','legacy.txt','legacy-bucket','legacy/text','text/plain',0,'legacy-checksum');
insert into public.file_version_history(
    id,file_id,version_number,storage_path,file_name,file_size_bytes,mime_type,checksum
) values (
    'd2000000-0000-4000-8000-000000000001','d3000000-0000-4000-8000-000000000001',
    1,'generic/orphan','generic.bin',0,'application/octet-stream',null
);
select is((select count(*) from public.assessment_documents where evidence_governance_version is null and document_category='legacy'),2::bigint,'legacy documents remain compatible and unclassified');
select is((select count(*) from public.assessment_documents where id='d1000000-0000-4000-8000-000000000001' and mime_type is null and file_size_bytes is null and checksum is null),1::bigint,'legacy nullable metadata remains explicit');
select is((select mime_type from public.assessment_documents where id='d1000000-0000-4000-8000-000000000002'),'text/plain','legacy unsupported MIME remains unchanged');
select is((select count(*) from public.file_version_history where id='d2000000-0000-4000-8000-000000000001' and evidence_document_id is null),1::bigint,'generic orphan file history is not reinterpreted as evidence');
select throws_ok($$insert into public.assessment_documents(id,assessment_id,document_category,document_type,document_name,original_filename,storage_bucket,storage_path) values ('d1000000-0000-4000-8000-000000000003','a5000000-0000-4000-8000-000000000001','legacy','legacy','Duplicate','duplicate','legacy-bucket','legacy/null')$$,'23505',null,'pre-existing duplicate storage path remains denied');
select is((select count(*) from public.list_admin_evidence('a1000000-0000-4000-8000-000000000001',null,null)),0::bigint,'legacy rows are excluded from governed evidence projection');

select * from finish();
rollback;
