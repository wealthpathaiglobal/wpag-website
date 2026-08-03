\set ON_ERROR_STOP on
begin;
do $$
begin
    if not exists (select 1 from public.assessment_documents where id='f4000000-0000-4000-8000-000000000001' and verification_status='rejected' and verification_notes='Replace the file.') then raise exception 'Existing evidence document changed.'; end if;
    if not exists (select 1 from public.file_version_history where id='f5000000-0000-4000-8000-000000000001' and version_number=1 and checksum=repeat('a',64)) then raise exception 'Existing file version changed.'; end if;
    if not exists (select 1 from public.evidence_verification_history where id='f6000000-0000-4000-8000-000000000001' and comments='Replace the file.' and internal_notes='Preserve this internal note.') then raise exception 'Existing verification history changed.'; end if;
    if not exists (select 1 from public.evidence_upload_reservations where id='f7000000-0000-4000-8000-000000000001' and version_number=1 and consumed_at is null) then raise exception 'Existing reservation changed.'; end if;
    if to_regprocedure('public.prepare_evidence_resubmission(uuid,uuid,text,text,bigint,text)') is null then raise exception 'Resubmission command missing.'; end if;
end;
$$;
insert into public.evidence_upload_reservations(participant_id,assessment_id,assessment_session_id,document_id,version_number,storage_bucket,storage_path,document_category,document_type,document_name,original_filename,declared_mime_type,expected_file_size_bytes,expected_sha256,prepared_by,expires_at)
values ('f1000000-0000-4000-8000-000000000001','f3000000-0000-4000-8000-000000000001','f2000000-0000-4000-8000-000000000001','f4000000-0000-4000-8000-000000000001',2,'assessment-evidence','legacy/reservation/v2.pdf','income','bank_statement','Version two','v2.pdf','application/pdf',101,repeat('c',64),'f9000000-0000-4000-8000-000000000001',transaction_timestamp()+interval '1 hour');
rollback;
