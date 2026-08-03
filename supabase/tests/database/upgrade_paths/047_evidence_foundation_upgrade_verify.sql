\set ON_ERROR_STOP on

-- Run immediately after applying migration 047 to the companion legacy fixture.
begin;

do $$
declare
    v_constraint_definition text;
begin
    if not exists (
        select 1
        from public.evidence_verification_history h
        where h.id = 'c6100000-0000-4000-8000-000000000001'
          and h.assessment_document_id = 'c6000000-0000-4000-8000-000000000001'
          and h.verification_event = 'verified'
          and h.verification_status = 'verified'
          and h.verification_result = 'legacy-approval-result'
          and h.verified_by = 'c9000000-0000-4000-8000-000000000001'
          and h.verified_at = '2026-02-01 10:00:00+00'::timestamptz
          and h.comments = 'Legacy participant-visible comment.'
          and h.internal_notes = 'Legacy internal note.'
          and h.supporting_metadata = '{"source":"upgrade-fixture","sequence":7}'::jsonb
          and h.created_at = '2026-02-01 10:01:00+00'::timestamptz
    ) then
        raise exception 'Legacy approved verification history was not canonicalized losslessly.';
    end if;

    if (select count(*) from public.assessment_documents where evidence_governance_version is null) <> 2
       or not exists (
           select 1 from public.assessment_documents
           where id = 'c6000000-0000-4000-8000-000000000001'
             and mime_type is null and file_size_bytes is null and checksum is null
       )
       or not exists (
           select 1 from public.assessment_documents
           where id = 'c6000000-0000-4000-8000-000000000002'
             and mime_type = 'text/plain' and file_size_bytes = 0
             and checksum = 'legacy-checksum'
       ) then
        raise exception 'Legacy assessment document compatibility was not preserved.';
    end if;

    if (select count(*) from public.file_version_history where evidence_document_id is null) <> 2 then
        raise exception 'Generic or orphan file-version rows were reinterpreted.';
    end if;

    select pg_get_constraintdef(oid) into v_constraint_definition
    from pg_constraint
        where conname = 'evidence_verification_history_verification_status_check'
          and conrelid = 'public.evidence_verification_history'::regclass;
    if v_constraint_definition is null
       or v_constraint_definition like '%approved%'
       or v_constraint_definition not like '%pending%'
       or v_constraint_definition not like '%in_progress%'
       or v_constraint_definition not like '%verified%'
       or v_constraint_definition not like '%rejected%'
       or v_constraint_definition not like '%expired%' then
        raise exception 'Final evidence verification status constraint is not canonical.';
    end if;
end;
$$;

do $$
begin
    begin
        insert into public.evidence_verification_history(
            assessment_document_id, verification_event, verification_status
        ) values (
            'c6000000-0000-4000-8000-000000000001', 'verified', 'approved'
        );
        raise exception 'Legacy approved status unexpectedly passed the final constraint.';
    exception
        when check_violation then null;
    end;

    insert into public.evidence_verification_history(
        assessment_document_id, verification_event, verification_status
    ) values (
        'c6000000-0000-4000-8000-000000000001', 'verified', 'verified'
    );
end;
$$;

rollback;
