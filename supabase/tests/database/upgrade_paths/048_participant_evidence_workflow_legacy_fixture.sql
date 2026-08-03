\set ON_ERROR_STOP on

-- Run after a local reset through migration 047.
insert into public.participants(id, participant_code, lifecycle_status)
values ('f1000000-0000-4000-8000-000000000001', 'WPAG-995001', 'active');
insert into public.assessment_sessions(id, participant_id, assessment_number, assessment_type, assessment_version, status, current_stage)
values ('f2000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 1, 'initial', '1.0', 'submitted', 'assessment_processing');
insert into public.assessments(id, participant_id, assessment_session_id, assessment_number, assessment_version, hfos_version, assessment_date, currency_code, country_code, household_size, dependents)
values ('f3000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000001', 1, '1.0', 'phase-1-draft', '2026-01-01', 'INR', 'IN', 1, 0);
insert into public.assessment_documents(id, assessment_id, document_category, document_type, document_name, original_filename, storage_bucket, storage_path, mime_type, file_size_bytes, checksum, verification_status, verified_at, verified_by, verification_notes, evidence_governance_version)
values ('f4000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', 'income', 'bank_statement', 'Legacy governed evidence', 'legacy.pdf', 'assessment-evidence', 'legacy/v1/object.pdf', 'application/pdf', 100, repeat('a', 64), 'rejected', '2026-02-01', 'f9000000-0000-4000-8000-000000000001', 'Replace the file.', 'evidence-v1');
insert into public.file_version_history(id, file_id, evidence_document_id, version_number, storage_path, file_name, file_size_bytes, mime_type, checksum, created_at)
values ('f5000000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 1, 'legacy/v1/object.pdf', 'legacy.pdf', 100, 'application/pdf', repeat('a', 64), '2026-02-01');
insert into public.evidence_verification_history(id, assessment_document_id, verification_event, verification_status, comments, internal_notes, created_at)
values ('f6000000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 'rejected', 'rejected', 'Replace the file.', 'Preserve this internal note.', '2026-02-02');
insert into public.evidence_upload_reservations(id, participant_id, assessment_id, assessment_session_id, document_id, version_number, storage_bucket, storage_path, document_category, document_type, document_name, original_filename, declared_mime_type, expected_file_size_bytes, expected_sha256, prepared_by, expires_at)
values ('f7000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000001', 'f8000000-0000-4000-8000-000000000001', 1, 'assessment-evidence', 'legacy/reservation/v1.pdf', 'income', 'bank_statement', 'Pending legacy reservation', 'pending.pdf', 'application/pdf', 100, repeat('b', 64), 'f9000000-0000-4000-8000-000000000001', transaction_timestamp() + interval '1 hour');
