\set ON_ERROR_STOP on

-- Run only after a local reset through migration 046. These deterministic rows
-- exercise the legacy states that migration 047 must preserve or canonicalize.
insert into public.participants(id, participant_code, lifecycle_status)
values ('c3000000-0000-4000-8000-000000000001', 'WPAG-998001', 'active');

insert into public.assessment_sessions(
    id, participant_id, assessment_number, assessment_type,
    assessment_version, status, current_stage
) values (
    'c4000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000001',
    1, 'initial', '1.0', 'submitted', 'assessment_processing'
);

insert into public.assessments(
    id, participant_id, assessment_session_id, assessment_number,
    assessment_version, hfos_version, assessment_date, currency_code,
    country_code, household_size, dependents
) values (
    'c5000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000001',
    'c4000000-0000-4000-8000-000000000001',
    1, '1.0', 'legacy', '2026-01-01', 'INR', 'IN', 1, 0
);

insert into public.assessment_documents(
    id, assessment_id, document_category, document_type, document_name,
    original_filename, storage_bucket, storage_path, mime_type,
    file_size_bytes, checksum, verification_status, verified_at, verified_by,
    verification_notes
) values
(
    'c6000000-0000-4000-8000-000000000001',
    'c5000000-0000-4000-8000-000000000001',
    'legacy', 'legacy', 'Legacy nullable', 'legacy-null',
    'legacy-bucket', 'legacy/null', null, null, null,
    'verified', '2026-02-01 10:00:00+00',
    'c9000000-0000-4000-8000-000000000001', 'Legacy document verification note.'
),
(
    'c6000000-0000-4000-8000-000000000002',
    'c5000000-0000-4000-8000-000000000001',
    'legacy', 'legacy', 'Legacy unsupported', 'legacy.txt',
    'legacy-bucket', 'legacy/text', 'text/plain', 0, 'legacy-checksum',
    'pending', null, null, null
);

insert into public.evidence_verification_history(
    id, assessment_document_id, verification_event, verification_status,
    verification_result, verified_by, verified_at, comments, internal_notes,
    supporting_metadata, created_at
) values (
    'c6100000-0000-4000-8000-000000000001',
    'c6000000-0000-4000-8000-000000000001',
    'verified', 'approved', 'legacy-approval-result',
    'c9000000-0000-4000-8000-000000000001',
    '2026-02-01 10:00:00+00',
    'Legacy participant-visible comment.',
    'Legacy internal note.',
    '{"source":"upgrade-fixture","sequence":7}'::jsonb,
    '2026-02-01 10:01:00+00'
);

insert into public.file_version_history(
    id, file_id, version_number, storage_path, file_name,
    file_size_bytes, mime_type, checksum
) values
(
    'c7000000-0000-4000-8000-000000000001',
    'c8000000-0000-4000-8000-000000000001',
    1, 'generic/orphan', 'generic.bin', 0, 'application/octet-stream', null
),
(
    'c7000000-0000-4000-8000-000000000002',
    'c6000000-0000-4000-8000-000000000001',
    1, 'legacy/version', 'legacy-null', 0, 'application/pdf', null
);
