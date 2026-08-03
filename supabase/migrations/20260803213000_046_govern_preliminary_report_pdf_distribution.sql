begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('preliminary-report-artifacts', 'preliminary-report-artifacts', false, 10485760, array['application/pdf'])
on conflict (id) do update
set public = false, file_size_limit = 10485760, allowed_mime_types = array['application/pdf'];

create table public.preliminary_report_artifacts (
    id uuid primary key default gen_random_uuid(),
    report_id uuid not null references public.preliminary_reports(id) on update cascade on delete restrict,
    report_version integer not null check (report_version > 0),
    artifact_type text not null default 'pdf' check (artifact_type = 'pdf'),
    status text not null default 'reserved' check (status in ('reserved', 'finalized')),
    storage_bucket text not null default 'preliminary-report-artifacts' check (storage_bucket = 'preliminary-report-artifacts'),
    storage_path text not null unique check (storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/v[1-9][0-9]*/[0-9a-f-]{36}\.pdf$'),
    original_filename text not null check (original_filename ~ '^WPAG_Preliminary_Research_Report_WPAG-PRR-[0-9]{6}_v[1-9][0-9]*\.pdf$'),
    mime_type text not null default 'application/pdf' check (mime_type = 'application/pdf'),
    byte_size bigint check (byte_size between 1 and 10485760),
    sha256 text check (sha256 ~ '^[0-9a-f]{64}$'),
    generated_by uuid not null,
    generated_at timestamptz,
    released_at timestamptz,
    created_at timestamptz not null default transaction_timestamp(),
    constraint preliminary_report_artifacts_finalized_check check (
        (status = 'reserved' and byte_size is null and sha256 is null and generated_at is null)
        or (status = 'finalized' and byte_size is not null and sha256 is not null and generated_at is not null)
    ),
    unique (report_id, report_version, artifact_type)
);

alter table public.preliminary_reports
    add column released_artifact_id uuid references public.preliminary_report_artifacts(id) on update restrict on delete restrict;

create index preliminary_report_artifacts_report_idx
    on public.preliminary_report_artifacts(report_id, report_version);

create unique index notifications_one_preliminary_report_release_idx
    on public.notifications ((metadata ->> 'report_id'), (metadata ->> 'report_version'))
    where notification_type = 'preliminary_report_available';

alter table public.preliminary_report_artifacts enable row level security;

create function public.is_active_preliminary_report_administrator(p_actor_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
    select p_actor_user_id is not null and exists (
        select 1
        from public.staff_members sm
        join public.staff_member_roles smr on smr.staff_member_id = sm.id
        join public.staff_roles sr on sr.id = smr.staff_role_id
        where sm.auth_user_id = p_actor_user_id
          and sm.status = 'active' and sm.deleted_at is null
          and sr.role_code = 'administrator' and sr.is_active
          and smr.is_active and (smr.expires_at is null or smr.expires_at > now())
    );
$$;

create function public.prevent_preliminary_report_artifact_mutation()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
    if tg_op = 'DELETE' then
        if old.status <> 'reserved' then
            raise exception using errcode = 'P1001', message = 'Finalized preliminary report artifacts are immutable.';
        end if;
        return old;
    end if;
    if old.report_id <> new.report_id or old.report_version <> new.report_version
       or old.artifact_type <> new.artifact_type or old.storage_bucket <> new.storage_bucket
       or old.storage_path <> new.storage_path or old.original_filename <> new.original_filename
       or old.mime_type <> new.mime_type or old.generated_by <> new.generated_by
       or old.created_at <> new.created_at then
        raise exception using errcode = 'P1001', message = 'Preliminary report artifact identity is immutable.';
    end if;
    if old.status = 'reserved' and new.status = 'finalized'
       and new.byte_size is not null and new.sha256 is not null and new.generated_at is not null then
        return new;
    end if;
    if old.status = 'finalized' and new.status = 'finalized'
       and old.byte_size = new.byte_size and old.sha256 = new.sha256
       and old.generated_at = new.generated_at and old.released_at is null and new.released_at is not null then
        return new;
    end if;
    raise exception using errcode = 'P1001', message = 'Finalized preliminary report artifacts are immutable.';
end;
$$;

create trigger protect_preliminary_report_artifacts
before update or delete on public.preliminary_report_artifacts
for each row execute function public.prevent_preliminary_report_artifact_mutation();

create function public.prepare_preliminary_report_artifact(p_report_id uuid, p_actor_user_id uuid)
returns table (
    artifact_id uuid, report_id uuid, report_version integer, storage_bucket text, storage_path text,
    original_filename text, report_number text, participant_code text, assessment_number integer,
    assessment_type text, prepared_at timestamptz, approved_at timestamptz,
    generation_timestamp timestamptz, content jsonb
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
    v_report public.preliminary_reports%rowtype;
    v_artifact public.preliminary_report_artifacts%rowtype;
    v_content jsonb;
    v_participant_code text;
    v_assessment_number integer;
    v_assessment_type text;
begin
    if not public.is_active_preliminary_report_administrator(p_actor_user_id) then
        raise exception using errcode = 'P1001', message = 'Actor is not authorized to manage preliminary report artifacts.';
    end if;
    if p_report_id is null then
        raise exception using errcode = 'P1001', message = 'Preliminary report ID is required.';
    end if;
    select pr.* into v_report from public.preliminary_reports pr
    join public.participants p on p.id = pr.participant_id and p.deleted_at is null
    where pr.id = p_report_id and pr.deleted_at is null for update of pr;
    if not found then
        raise exception using errcode = 'P1001', message = 'Preliminary report was not found.';
    end if;
    if v_report.status <> 'approved' then
        raise exception using errcode = 'P1001', message = 'Only an approved preliminary report can generate a PDF.';
    end if;
    if exists (select 1 from public.preliminary_report_artifacts a where a.report_id = v_report.id and a.report_version = v_report.current_version and a.artifact_type = 'pdf') then
        raise exception using errcode = 'P1001', message = 'A PDF artifact already exists for this report version.';
    end if;
    select rv.content into v_content from public.preliminary_report_versions rv
    where rv.report_id = v_report.id and rv.version_number = v_report.current_version;
    if v_content is null or not public.is_valid_preliminary_report_content(v_content, true) then
        raise exception using errcode = 'P1001', message = 'Approved preliminary report content is unavailable.';
    end if;
    select p.participant_code, s.assessment_number, s.assessment_type
      into v_participant_code, v_assessment_number, v_assessment_type
    from public.participants p
    join public.assessments a on a.id = v_report.assessment_id and a.deleted_at is null
    join public.assessment_sessions s on s.id = a.assessment_session_id and s.deleted_at is null
    where p.id = v_report.participant_id and p.deleted_at is null;
    insert into public.preliminary_report_artifacts(
        report_id, report_version, storage_path, original_filename, generated_by
    ) values (
        v_report.id, v_report.current_version,
        v_report.participant_id::text || '/' || v_report.id::text || '/v' || v_report.current_version::text || '/' || gen_random_uuid()::text || '.pdf',
        'WPAG_Preliminary_Research_Report_' || v_report.report_number || '_v' || v_report.current_version::text || '.pdf',
        p_actor_user_id
    ) returning * into v_artifact;
    insert into public.activity_timeline(entity_type, entity_id, actor_type, actor_id, event_type, event_title, event_description, event_timestamp, metadata)
    values ('preliminary_report', v_report.id, 'admin', p_actor_user_id, 'report_pdf_generation_started',
            'Preliminary report PDF generation started', 'An immutable PDF artifact reservation was created.', transaction_timestamp(),
            jsonb_build_object('artifact_id', v_artifact.id, 'version_number', v_report.current_version));
    return query select v_artifact.id, v_report.id, v_report.current_version, v_artifact.storage_bucket,
        v_artifact.storage_path, v_artifact.original_filename, v_report.report_number,
        v_participant_code, v_assessment_number, v_assessment_type, v_report.prepared_at,
        v_report.approved_at, v_artifact.created_at, v_content;
exception when sqlstate 'P1001' then raise;
when unique_violation then raise exception using errcode = 'P1001', message = 'A PDF artifact already exists for this report version.';
when others then raise exception using errcode = 'P1002', message = 'Preliminary report artifact reservation failed.';
end;
$$;

create function public.finalize_preliminary_report_artifact(
    p_artifact_id uuid, p_actor_user_id uuid, p_original_filename text,
    p_mime_type text, p_byte_size bigint, p_sha256 text
)
returns table (
    artifact_id uuid, report_id uuid, report_version integer, artifact_status text,
    storage_bucket text, storage_path text, original_filename text, mime_type text,
    byte_size bigint, sha256 text, generated_at timestamptz, released_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare v_artifact public.preliminary_report_artifacts%rowtype; v_report public.preliminary_reports%rowtype;
begin
    if not public.is_active_preliminary_report_administrator(p_actor_user_id) then
        raise exception using errcode = 'P1001', message = 'Actor is not authorized to manage preliminary report artifacts.';
    end if;
    select * into v_artifact from public.preliminary_report_artifacts where id = p_artifact_id for update;
    if not found then raise exception using errcode = 'P1001', message = 'Preliminary report artifact was not found.'; end if;
    select * into v_report from public.preliminary_reports where id = v_artifact.report_id and deleted_at is null for update;
    if not found then raise exception using errcode = 'P1001', message = 'Preliminary report was not found.'; end if;
    if v_artifact.status <> 'reserved' or v_report.status <> 'approved' or v_report.current_version <> v_artifact.report_version then
        raise exception using errcode = 'P1001', message = 'Preliminary report artifact no longer matches the approved report version.';
    end if;
    if p_original_filename <> v_artifact.original_filename or p_mime_type <> 'application/pdf'
       or p_byte_size not between 1 and 10485760 or p_sha256 !~ '^[0-9a-f]{64}$' then
        raise exception using errcode = 'P1001', message = 'Preliminary report artifact metadata is invalid.';
    end if;
    update public.preliminary_report_artifacts set status = 'finalized', mime_type = p_mime_type,
        byte_size = p_byte_size, sha256 = p_sha256, generated_at = transaction_timestamp()
    where id = p_artifact_id returning * into v_artifact;
    insert into public.activity_timeline(entity_type, entity_id, actor_type, actor_id, event_type, event_title, event_description, event_timestamp, metadata)
    values ('preliminary_report', v_report.id, 'admin', p_actor_user_id, 'report_pdf_generated',
            'Preliminary report PDF generated', 'The immutable PDF artifact was generated and verified.', transaction_timestamp(),
            jsonb_build_object('artifact_id', v_artifact.id, 'version_number', v_artifact.report_version,
                               'byte_size', v_artifact.byte_size, 'sha256', v_artifact.sha256));
    return query select v_artifact.id, v_artifact.report_id, v_artifact.report_version, v_artifact.status,
        v_artifact.storage_bucket, v_artifact.storage_path, v_artifact.original_filename, v_artifact.mime_type,
        v_artifact.byte_size, v_artifact.sha256, v_artifact.generated_at, v_artifact.released_at;
exception when sqlstate 'P1001' then raise;
when others then raise exception using errcode = 'P1002', message = 'Preliminary report artifact finalization failed.';
end;
$$;

create function public.discard_preliminary_report_artifact_reservation(p_artifact_id uuid, p_actor_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare v_artifact public.preliminary_report_artifacts%rowtype;
begin
    if not public.is_active_preliminary_report_administrator(p_actor_user_id) then
        raise exception using errcode = 'P1001', message = 'Actor is not authorized to manage preliminary report artifacts.';
    end if;
    select * into v_artifact from public.preliminary_report_artifacts where id = p_artifact_id for update;
    if not found or v_artifact.status <> 'reserved' then
        raise exception using errcode = 'P1001', message = 'Preliminary report artifact reservation was not found.';
    end if;
    delete from public.preliminary_report_artifacts where id = p_artifact_id;
    insert into public.activity_timeline(entity_type, entity_id, actor_type, actor_id, event_type, event_title, event_description, event_timestamp, metadata)
    values ('preliminary_report', v_artifact.report_id, 'admin', p_actor_user_id, 'report_pdf_generation_failed',
            'Preliminary report PDF generation failed', 'The incomplete PDF artifact reservation was safely discarded.', transaction_timestamp(),
            jsonb_build_object('artifact_id', v_artifact.id, 'version_number', v_artifact.report_version));
end;
$$;

create function public.get_preliminary_report_artifact_for_admin(p_report_id uuid, p_actor_user_id uuid)
returns table (
    artifact_id uuid, report_id uuid, report_version integer, artifact_status text,
    storage_bucket text, storage_path text, original_filename text, mime_type text,
    byte_size bigint, sha256 text, generated_at timestamptz, released_at timestamptz
)
language plpgsql stable security definer set search_path = public, pg_catalog
as $$
begin
    if not public.is_active_preliminary_report_administrator(p_actor_user_id) then
        raise exception using errcode = 'P1001', message = 'Actor is not authorized to manage preliminary report artifacts.';
    end if;
    return query select a.id, a.report_id, a.report_version, a.status, a.storage_bucket, a.storage_path,
        a.original_filename, a.mime_type, a.byte_size, a.sha256, a.generated_at, a.released_at
    from public.preliminary_report_artifacts a
    join public.preliminary_reports pr on pr.id = a.report_id and pr.deleted_at is null
    where a.report_id = p_report_id and a.status = 'finalized' and a.report_version = pr.current_version;
end;
$$;

create function public.get_current_participant_report_download(p_report_id uuid)
returns table (
    artifact_id uuid, report_id uuid, report_version integer, storage_bucket text,
    storage_path text, original_filename text, mime_type text, byte_size bigint, sha256 text, released_at timestamptz
)
language plpgsql stable security definer set search_path = public, pg_catalog
as $$
declare v_auth_user_id uuid := auth.uid(); v_participant_id uuid;
begin
    if v_auth_user_id is null then raise exception using errcode = 'P1001', message = 'Participant authentication is required.'; end if;
    select p.id into v_participant_id from public.participants p where p.auth_user_id = v_auth_user_id and p.deleted_at is null;
    if not found then raise exception using errcode = 'P1001', message = 'Participant report access is unavailable.'; end if;
    return query select a.id, pr.id, a.report_version, a.storage_bucket, a.storage_path,
        a.original_filename, a.mime_type, a.byte_size, a.sha256, pr.released_at
    from public.preliminary_reports pr
    join public.preliminary_report_artifacts a on a.id = pr.released_artifact_id
    where pr.id = p_report_id and pr.participant_id = v_participant_id and pr.status = 'released'
      and pr.released_at is not null and pr.deleted_at is null and a.status = 'finalized'
      and a.report_id = pr.id and a.report_version = pr.current_version and a.released_at is not null;
    if not found then raise exception using errcode = 'P1001', message = 'Released preliminary report PDF was not found.'; end if;
end;
$$;

create function public.bind_preliminary_report_release_artifact()
returns trigger language plpgsql set search_path = public, pg_catalog as $$
declare v_artifact_id uuid;
begin
    if old.status = 'approved' and new.status = 'released' then
        select a.id into v_artifact_id from public.preliminary_report_artifacts a
        where a.report_id = new.id and a.report_version = new.current_version and a.status = 'finalized' and a.released_at is null
        for update;
        if not found then raise exception using errcode = 'P1001', message = 'A finalized PDF artifact is required before release.'; end if;
        new.released_artifact_id := v_artifact_id;
    end if;
    return new;
end;
$$;

create trigger bind_release_artifact
before update on public.preliminary_reports
for each row execute function public.bind_preliminary_report_release_artifact();

create function public.finalize_preliminary_report_release()
returns trigger language plpgsql security definer set search_path = public, pg_catalog as $$
begin
    if old.status = 'approved' and new.status = 'released' then
        update public.preliminary_report_artifacts set released_at = new.released_at where id = new.released_artifact_id;
        insert into public.notifications(recipient_type, recipient_id, notification_type, title, message, priority, status, metadata)
        values ('participant', new.participant_id, 'preliminary_report_available',
                'Preliminary Research Report Available',
                'Your Preliminary Research Report is now available in your participant portal.',
                'normal', 'sent', jsonb_build_object('report_id', new.id, 'report_version', new.current_version,
                                                     'target', '/participant/reports/' || new.id::text))
        on conflict do nothing;
    end if;
    return new;
end;
$$;

create trigger finalize_release_artifact
after update on public.preliminary_reports
for each row execute function public.finalize_preliminary_report_release();

alter function public.is_active_preliminary_report_administrator(uuid) owner to postgres;
alter function public.prevent_preliminary_report_artifact_mutation() owner to postgres;
alter function public.prepare_preliminary_report_artifact(uuid, uuid) owner to postgres;
alter function public.finalize_preliminary_report_artifact(uuid, uuid, text, text, bigint, text) owner to postgres;
alter function public.discard_preliminary_report_artifact_reservation(uuid, uuid) owner to postgres;
alter function public.get_preliminary_report_artifact_for_admin(uuid, uuid) owner to postgres;
alter function public.get_current_participant_report_download(uuid) owner to postgres;
alter function public.bind_preliminary_report_release_artifact() owner to postgres;
alter function public.finalize_preliminary_report_release() owner to postgres;

revoke all on table public.preliminary_report_artifacts from public, anon, authenticated, service_role;
revoke all on function public.is_active_preliminary_report_administrator(uuid) from public, anon, authenticated, service_role;
revoke all on function public.prevent_preliminary_report_artifact_mutation() from public, anon, authenticated, service_role;
revoke all on function public.prepare_preliminary_report_artifact(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.finalize_preliminary_report_artifact(uuid, uuid, text, text, bigint, text) from public, anon, authenticated, service_role;
revoke all on function public.discard_preliminary_report_artifact_reservation(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.get_preliminary_report_artifact_for_admin(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.get_current_participant_report_download(uuid) from public, anon, authenticated, service_role;
revoke all on function public.bind_preliminary_report_release_artifact() from public, anon, authenticated, service_role;
revoke all on function public.finalize_preliminary_report_release() from public, anon, authenticated, service_role;

grant execute on function public.prepare_preliminary_report_artifact(uuid, uuid) to service_role;
grant execute on function public.finalize_preliminary_report_artifact(uuid, uuid, text, text, bigint, text) to service_role;
grant execute on function public.discard_preliminary_report_artifact_reservation(uuid, uuid) to service_role;
grant execute on function public.get_preliminary_report_artifact_for_admin(uuid, uuid) to service_role;
grant execute on function public.get_current_participant_report_download(uuid) to authenticated;

comment on table public.preliminary_report_artifacts is 'Immutable private PDF artifacts for governed preliminary research report versions; no formula, diagnosis, advice, Pilot, or Production authority.';
comment on function public.prepare_preliminary_report_artifact(uuid, uuid) is 'Reserves one immutable PDF artifact for the current approved report version and returns a participant-safe rendering projection.';
comment on function public.get_current_participant_report_download(uuid) is 'Returns private storage coordinates only for the authenticated participant owner of the exact released report artifact.';

commit;
