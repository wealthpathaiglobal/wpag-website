begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;

select plan(108);

-- Catalog, storage, execution, and direct-table security: 65 assertions.
select ok((select not public from storage.buckets where id = 'assessment-evidence'), 'evidence bucket is private');
select is((select file_size_limit from storage.buckets where id = 'assessment-evidence'), 10485760::bigint, 'evidence bucket limit is ten MiB');
select is((select allowed_mime_types::text from storage.buckets where id = 'assessment-evidence'), '{application/pdf,image/jpeg,image/png}', 'evidence bucket MIME allowlist exact');

select ok((select relrowsecurity from pg_class where oid = table_name::regclass), table_name || ' RLS enabled')
from unnest(array[
    'public.assessment_documents',
    'public.evidence_verification_history',
    'public.file_version_history'
]) table_name;

select ok(to_regprocedure(function_name) is not null, function_name || ' exists')
from unnest(array[
    'public.prepare_evidence_upload(uuid,uuid,text,text,text,text,text,text,bigint,text)',
    'public.finalize_evidence_upload(uuid,uuid,uuid,text,text,text,text,text,text,text,text,bigint,text)',
    'public.list_participant_evidence(uuid)',
    'public.list_admin_evidence(uuid,uuid,uuid)',
    'public.get_admin_evidence(uuid,uuid)'
]) function_name;

select ok((select prosecdef from pg_proc where oid = to_regprocedure(function_name)), function_name || ' is security definer')
from unnest(array[
    'public.prepare_evidence_upload(uuid,uuid,text,text,text,text,text,text,bigint,text)',
    'public.finalize_evidence_upload(uuid,uuid,uuid,text,text,text,text,text,text,text,text,bigint,text)',
    'public.list_participant_evidence(uuid)',
    'public.list_admin_evidence(uuid,uuid,uuid)',
    'public.get_admin_evidence(uuid,uuid)'
]) function_name;

select is((select proowner::regrole::text from pg_proc where oid = to_regprocedure(function_name)), 'postgres', function_name || ' owner postgres')
from unnest(array[
    'public.prepare_evidence_upload(uuid,uuid,text,text,text,text,text,text,bigint,text)',
    'public.finalize_evidence_upload(uuid,uuid,uuid,text,text,text,text,text,text,text,text,bigint,text)',
    'public.list_participant_evidence(uuid)',
    'public.list_admin_evidence(uuid,uuid,uuid)',
    'public.get_admin_evidence(uuid,uuid)'
]) function_name;

select ok((select proconfig @> array['search_path=public, pg_catalog'] from pg_proc where oid = to_regprocedure(function_name)), function_name || ' search path controlled')
from unnest(array[
    'public.prepare_evidence_upload(uuid,uuid,text,text,text,text,text,text,bigint,text)',
    'public.finalize_evidence_upload(uuid,uuid,uuid,text,text,text,text,text,text,text,text,bigint,text)',
    'public.list_participant_evidence(uuid)',
    'public.list_admin_evidence(uuid,uuid,uuid)',
    'public.get_admin_evidence(uuid,uuid)'
]) function_name;

select ok(has_function_privilege('service_role', function_name, 'EXECUTE'), function_name || ' service role granted')
from unnest(array[
    'public.prepare_evidence_upload(uuid,uuid,text,text,text,text,text,text,bigint,text)',
    'public.finalize_evidence_upload(uuid,uuid,uuid,text,text,text,text,text,text,text,text,bigint,text)',
    'public.list_participant_evidence(uuid)',
    'public.list_admin_evidence(uuid,uuid,uuid)',
    'public.get_admin_evidence(uuid,uuid)'
]) function_name;

select ok(not has_function_privilege(role_name, function_name, 'EXECUTE'), role_name || ' denied ' || function_name)
from unnest(array['public', 'anon', 'authenticated']) role_name
cross join unnest(array[
    'public.prepare_evidence_upload(uuid,uuid,text,text,text,text,text,text,bigint,text)',
    'public.finalize_evidence_upload(uuid,uuid,uuid,text,text,text,text,text,text,text,text,bigint,text)',
    'public.list_participant_evidence(uuid)',
    'public.list_admin_evidence(uuid,uuid,uuid)',
    'public.get_admin_evidence(uuid,uuid)'
]) function_name;

select ok(not has_table_privilege(role_name, table_name, privilege_name), role_name || ' denied ' || privilege_name || ' on ' || table_name)
from unnest(array['anon', 'authenticated', 'service_role']) role_name
cross join (values
    ('public.assessment_documents', 'INSERT'),
    ('public.evidence_verification_history', 'INSERT'),
    ('public.file_version_history', 'INSERT')
) permissions(table_name, privilege_name);

select is((select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects' and (qual::text like '%assessment-evidence%' or with_check::text like '%assessment-evidence%')), 0::bigint, 'no browser storage policy introduced');
select ok(exists(select 1 from pg_constraint where conname = 'file_version_history_document_fk' and contype = 'f'), 'file version relationship enforced');
select has_trigger('public', 'evidence_verification_history', 'evidence_verification_history_append_only', 'verification history append-only trigger exists');
select has_trigger('public', 'file_version_history', 'file_version_history_append_only', 'file version append-only trigger exists');
select has_trigger('public', 'assessment_documents', 'assessment_document_file_identity_immutable', 'document file identity trigger exists');
select col_not_null('public', 'assessment_documents', 'mime_type', 'document MIME required');
select col_not_null('public', 'assessment_documents', 'file_size_bytes', 'document size required');
select col_not_null('public', 'assessment_documents', 'checksum', 'document checksum required');
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
('a4000000-0000-4000-8000-000000000003','a3000000-0000-4000-8000-000000000003',1,'initial','1.0','in_progress','financial_data_collection','2026-01-01','2026-01-01');
insert into public.assessments(id,participant_id,assessment_session_id,assessment_number,assessment_version,hfos_version,assessment_date,currency_code,country_code,household_size,dependents,created_at) values
('a5000000-0000-4000-8000-000000000001','a3000000-0000-4000-8000-000000000001','a4000000-0000-4000-8000-000000000001',1,'1.0','phase-1-draft','2026-01-01','INR','IN',2,0,'2026-01-01'),
('a5000000-0000-4000-8000-000000000002','a3000000-0000-4000-8000-000000000002','a4000000-0000-4000-8000-000000000002',1,'1.0','phase-1-draft','2026-01-01','INR','IN',2,0,'2026-01-01'),
('a5000000-0000-4000-8000-000000000003','a3000000-0000-4000-8000-000000000003','a4000000-0000-4000-8000-000000000003',1,'1.0','phase-1-draft','2026-01-01','INR','IN',2,0,'2026-01-01');

-- Authorization and input integrity: 9 assertions (66-74).
select throws_ok($$select * from public.list_admin_evidence('a1000000-0000-4000-8000-000000000002',null,null)$$,'P1001','Actor is not authorized to access evidence.','non-admin list denied');
select throws_ok($$select * from public.get_admin_evidence(gen_random_uuid(),'a1000000-0000-4000-8000-000000000002')$$,'P1001','Actor is not authorized to access evidence.','non-admin detail denied');
select throws_ok($$select * from public.prepare_evidence_upload('a5000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000012','income','statement','Statement',null,'statement.pdf','application/pdf',100,repeat('a',64))$$,'P1001','Evidence upload is unavailable.','cross-participant prepare denied');
select throws_ok($$select * from public.prepare_evidence_upload('a5000000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000000013','income','statement','Statement',null,'statement.pdf','application/pdf',100,repeat('a',64))$$,'P1001','Evidence upload is unavailable.','soft-deleted participant prepare denied');
select throws_ok($$select * from public.prepare_evidence_upload('a5000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000011','income','statement','Statement',null,'statement.txt','text/plain',100,repeat('a',64))$$,'P1001','Evidence upload metadata is invalid.','disallowed MIME rejected');
select throws_ok($$select * from public.prepare_evidence_upload('a5000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000011','income','statement','Statement',null,'statement.pdf','application/pdf',10485761,repeat('a',64))$$,'P1001','Evidence upload metadata is invalid.','oversized evidence rejected');
select throws_ok($$select * from public.prepare_evidence_upload('a5000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000011','income','statement','Statement',null,'statement.pdf','application/pdf',100,'bad')$$,'P1001','Evidence upload metadata is invalid.','invalid SHA-256 rejected');
select throws_ok($$select * from public.prepare_evidence_upload('a5000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000011','income','statement','Statement',null,'../statement.pdf','application/pdf',100,repeat('a',64))$$,'P1001','Evidence upload metadata is invalid.','unsafe filename rejected');
select lives_ok($$select * from public.prepare_evidence_upload('a5000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000011','income','statement','Statement',null,'statement.pdf','application/pdf',100,repeat('a',64))$$,'valid prepare succeeds');

create temporary table evidence_prepared as
select * from public.prepare_evidence_upload(
    'a5000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000011',
    'income','bank_statement','Bank Statement','January statement',
    'statement.pdf','application/pdf',100,repeat('a',64)
);

-- Preparation and atomic finalization: 17 assertions (75-91).
select is((select count(*) from public.assessment_documents),0::bigint,'prepare creates no incomplete document row');
select is((select storage_bucket from evidence_prepared),'assessment-evidence','prepare returns private bucket');
select ok((select storage_path ~ '^a3000000-.*/a5000000-.*/[0-9a-f-]{36}/v1/[0-9a-f-]{36}\.pdf$' from evidence_prepared),'prepare returns immutable versioned path');
select is((select version_number from evidence_prepared),1,'prepare starts at version one');
select is((select sha256 from evidence_prepared),repeat('a',64),'prepare preserves computed SHA-256');
select ok(pg_get_function_result('public.list_participant_evidence(uuid)'::regprocedure) !~* '(storage_path|storage_bucket|sha256|checksum|verified_by|internal_notes)','participant projection excludes private fields');
select throws_ok($$select * from public.finalize_evidence_upload((select document_id from evidence_prepared),(select assessment_id from evidence_prepared),'a1000000-0000-4000-8000-000000000012','income','bank_statement','Bank Statement','January statement','statement.pdf',(select storage_bucket from evidence_prepared),(select storage_path from evidence_prepared),(select mime_type from evidence_prepared),(select file_size_bytes from evidence_prepared),(select sha256 from evidence_prepared))$$,'P1001','Evidence upload is unavailable.','cross-participant finalize denied');
select throws_ok($$select * from public.finalize_evidence_upload((select document_id from evidence_prepared),(select assessment_id from evidence_prepared),'a1000000-0000-4000-8000-000000000011','income','bank_statement','Bank Statement','January statement','statement.pdf',(select storage_bucket from evidence_prepared),'wrong/path.pdf',(select mime_type from evidence_prepared),(select file_size_bytes from evidence_prepared),(select sha256 from evidence_prepared))$$,'P1001','Evidence storage path is invalid.','fabricated storage path denied');
select lives_ok($$select * from public.finalize_evidence_upload((select document_id from evidence_prepared),(select assessment_id from evidence_prepared),'a1000000-0000-4000-8000-000000000011','income','bank_statement','Bank Statement','January statement','statement.pdf',(select storage_bucket from evidence_prepared),(select storage_path from evidence_prepared),(select mime_type from evidence_prepared),(select file_size_bytes from evidence_prepared),(select sha256 from evidence_prepared))$$,'valid evidence finalizes atomically');
select is((select count(*) from public.assessment_documents where id=(select document_id from evidence_prepared)),1::bigint,'document metadata persisted');
select is((select verification_status from public.assessment_documents where id=(select document_id from evidence_prepared)),'pending','canonical pending status persisted');
select is((select checksum from public.assessment_documents where id=(select document_id from evidence_prepared)),repeat('a',64),'document SHA-256 persisted');
select is((select count(*) from public.file_version_history where file_id=(select document_id from evidence_prepared)),1::bigint,'initial file version persisted');
select is((select version_number from public.file_version_history where file_id=(select document_id from evidence_prepared)),1,'file version one persisted');
select is((select count(*) from public.evidence_verification_history where assessment_document_id=(select document_id from evidence_prepared)),1::bigint,'submission history persisted');
select is((select verification_status from public.evidence_verification_history where assessment_document_id=(select document_id from evidence_prepared)),'pending','history uses canonical pending status');
select is((select count(*) from public.activity_timeline where entity_id=(select document_id from evidence_prepared) and event_type='evidence_submitted'),1::bigint,'evidence submission audited');

-- Read boundaries, immutability, soft deletion, and regressions: 17 assertions (92-108).
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
select throws_ok($$select * from public.finalize_evidence_upload((select document_id from evidence_prepared),(select assessment_id from evidence_prepared),'a1000000-0000-4000-8000-000000000011','income','bank_statement','Bank Statement','January statement','statement.pdf',(select storage_bucket from evidence_prepared),(select storage_path from evidence_prepared),(select mime_type from evidence_prepared),(select file_size_bytes from evidence_prepared),(select sha256 from evidence_prepared))$$,'P1001','Evidence upload was already finalized.','duplicate finalization denied');
update public.assessment_documents set deleted_at=transaction_timestamp(),updated_by='a1000000-0000-4000-8000-000000000011' where id=(select document_id from evidence_prepared);
select is((select count(*) from public.list_participant_evidence('a1000000-0000-4000-8000-000000000011')),0::bigint,'soft-deleted evidence excluded from participant list');
select is((select count(*) from public.list_admin_evidence('a1000000-0000-4000-8000-000000000001',null,null)),0::bigint,'soft-deleted evidence excluded from admin list');

select * from finish();
rollback;
