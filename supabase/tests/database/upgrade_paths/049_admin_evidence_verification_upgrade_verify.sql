begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(14);

select ok(to_regprocedure('public.list_admin_evidence_queue(uuid)') is not null,'queue RPC installed');
select ok(to_regprocedure('public.get_admin_evidence_detail(uuid,uuid)') is not null,'detail RPC installed');
select ok(to_regprocedure('public.transition_evidence_verification(uuid,uuid,text,text,text)') is not null,'transition RPC installed');
select ok(to_regprocedure('public.get_admin_evidence_download(uuid,uuid,integer)') is not null,'download RPC installed');
select is((select verification_status from public.assessment_documents where id='d6000000-0000-4000-8000-000000000001'),'verified','existing document status preserved');
select is((select verification_notes from public.assessment_documents where id='d6000000-0000-4000-8000-000000000001'),'Existing participant note.','existing participant note preserved');
select is((select checksum from public.assessment_documents where id='d6000000-0000-4000-8000-000000000001'),repeat('a',64),'existing checksum preserved');
select ok((select verified_at='2026-01-03' and verified_by='d1000000-0000-4000-8000-000000000001' from public.assessment_documents where id='d6000000-0000-4000-8000-000000000001'),'existing attribution preserved');
select is((select internal_notes from public.evidence_verification_history where id='d8000000-0000-4000-8000-000000000001'),'Existing internal note.','existing internal history preserved');
select is((select supporting_metadata from public.evidence_verification_history where id='d8000000-0000-4000-8000-000000000001'),'{"version_number":1,"legacy":true}'::jsonb,'existing event identity metadata preserved');
select is((select count(*) from public.file_version_history where id='d7000000-0000-4000-8000-000000000001' and checksum=repeat('a',64) and change_summary='Existing version'),1::bigint,'existing immutable version preserved');
select ok((select pg_get_constraintdef(oid) like '%internal_notes_saved%' from pg_constraint where conname='evidence_verification_history_verification_event_check'),'new internal note event accepted by canonical constraint');
select throws_ok($$insert into public.evidence_verification_history(assessment_document_id,verification_event,verification_status) values ('d6000000-0000-4000-8000-000000000001','approved','verified')$$,'23514',null,'noncanonical event remains rejected');
select ok(to_regclass('public.notifications_evidence_verification_event_unique') is not null,'notification idempotency index installed');

select * from finish();
rollback;
