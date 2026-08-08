begin;

alter table public.evidence_verification_history
    drop constraint evidence_verification_history_verification_event_check,
    add constraint evidence_verification_history_verification_event_check check (
        verification_event in ('submitted','verification_started','internal_notes_saved','information_requested','resubmitted','verified','rejected','expired')
    );

create unique index notifications_evidence_verification_event_unique
    on public.notifications ((metadata ->> 'evidence_event_id'))
    where notification_type in ('evidence_information_required','evidence_verified','evidence_rejected');

create function public.list_admin_evidence_queue(p_actor_user_id uuid)
returns table (
    participant_id uuid, participant_code text, participant_name text, participant_email text,
    assessment_id uuid, assessment_number integer, document_id uuid, display_name text,
    document_category text, document_type text, original_filename text, current_version integer,
    verification_status text, submitted_at timestamptz, updated_at timestamptz,
    reviewed_by text, verification_at timestamptz, action_required boolean,
    latest_participant_event text, latest_participant_comment text
)
language plpgsql stable security definer set search_path = public, pg_catalog as $$
begin
    if not public.is_active_evidence_administrator(p_actor_user_id) then
        raise exception using errcode='P1001', message='Actor is not authorized to verify evidence.';
    end if;
    return query
    select p.id, p.participant_code,
        coalesce(nullif(btrim(concat_ws(' ',pp.first_name,pp.middle_name,pp.last_name)),''),app.full_name,p.participant_code),
        coalesce(pp.email::text,app.email::text), a.id, a.assessment_number, d.id, d.document_name,
        d.document_category, d.document_type, current_file.file_name, current_file.version_number,
        d.verification_status, current_file.created_at, d.updated_at, reviewer.full_name,
        latest_event.verified_at, coalesce(latest_event.verification_event='information_requested',false),
        latest_event.verification_event, latest_event.comments
    from public.assessment_documents d
    join public.assessments a on a.id=d.assessment_id and a.deleted_at is null
    join public.assessment_sessions s on s.id=a.assessment_session_id and s.deleted_at is null and s.status='submitted'
    join public.participants p on p.id=a.participant_id and p.deleted_at is null
    left join public.participant_profiles pp on pp.participant_id=p.id and pp.deleted_at is null
    left join public.applications app on app.id=p.application_id
    join lateral (
        select fv.file_name,fv.version_number,fv.created_at from public.file_version_history fv
        where fv.evidence_document_id=d.id order by fv.version_number desc limit 1
    ) current_file on true
    left join lateral (
        select h.verification_event,h.comments,h.verified_by,h.verified_at from public.evidence_verification_history h
        where h.assessment_document_id=d.id order by h.created_at desc,h.id desc limit 1
    ) latest_event on true
    left join public.staff_members reviewer on reviewer.auth_user_id=latest_event.verified_by
    where d.deleted_at is null and d.evidence_governance_version='evidence-v1'
    order by case d.verification_status when 'pending' then 1 when 'in_progress' then 2 when 'rejected' then 3 when 'verified' then 4 else 5 end,
        current_file.created_at, d.id;
end;
$$;

create function public.get_admin_evidence_detail(p_document_id uuid,p_actor_user_id uuid)
returns table (
    participant_id uuid, participant_code text, participant_name text, participant_email text,
    assessment_id uuid, assessment_number integer, assessment_status text, document_id uuid,
    display_name text, description text, document_category text, document_type text,
    original_filename text, mime_type text, file_size_bytes bigint, current_version integer,
    verification_status text, participant_comment text, internal_notes text, reviewed_by text,
    verification_at timestamptz, submitted_at timestamptz, updated_at timestamptz,
    versions jsonb, verification_history jsonb, activity_history jsonb,
    can_start_verification boolean, can_save_internal_notes boolean,
    can_request_information boolean, can_verify boolean, can_reject boolean, can_download boolean
)
language plpgsql stable security definer set search_path = public, pg_catalog as $$
begin
    if not public.is_active_evidence_administrator(p_actor_user_id) then
        raise exception using errcode='P1001', message='Actor is not authorized to verify evidence.';
    end if;
    return query
    select p.id,p.participant_code,
        coalesce(nullif(btrim(concat_ws(' ',pp.first_name,pp.middle_name,pp.last_name)),''),app.full_name,p.participant_code),
        coalesce(pp.email::text,app.email::text),a.id,a.assessment_number,s.status,d.id,d.document_name,d.description,
        d.document_category,d.document_type,current_file.file_name,current_file.mime_type,current_file.file_size_bytes,
        current_file.version_number,d.verification_status,d.verification_notes,latest_event.internal_notes,
        reviewer.full_name,latest_event.verified_at,current_file.created_at,d.updated_at,
        coalesce((select jsonb_agg(jsonb_build_object(
            'version_number',fv.version_number,'original_filename',fv.file_name,'mime_type',fv.mime_type,
            'file_size_bytes',fv.file_size_bytes,'submitted_at',fv.created_at,'change_summary',fv.change_summary
        ) order by fv.version_number desc) from public.file_version_history fv where fv.evidence_document_id=d.id),'[]'::jsonb),
        coalesce((select jsonb_agg(jsonb_build_object(
            'verification_event',h.verification_event,'verification_status',h.verification_status,
            'participant_comment',h.comments,'internal_notes',h.internal_notes,
            'reviewer_name',sm.full_name,'event_at',h.created_at
        ) order by h.created_at desc,h.id desc) from public.evidence_verification_history h
          left join public.staff_members sm on sm.auth_user_id=h.verified_by
          where h.assessment_document_id=d.id),'[]'::jsonb),
        coalesce((select jsonb_agg(jsonb_build_object(
            'event_type',t.event_type,'event_title',t.event_title,'event_description',t.event_description,'event_at',t.event_timestamp
        ) order by t.event_timestamp desc,t.id desc) from public.activity_timeline t
          where t.entity_type='assessment_document' and t.entity_id=d.id),'[]'::jsonb),
        d.verification_status='pending',
        d.verification_status='in_progress' and latest_event.verification_event is distinct from 'information_requested',
        d.verification_status='in_progress' and latest_event.verification_event is distinct from 'information_requested',
        d.verification_status='in_progress' and latest_event.verification_event is distinct from 'information_requested',
        d.verification_status='in_progress' and latest_event.verification_event is distinct from 'information_requested',true
    from public.assessment_documents d
    join public.assessments a on a.id=d.assessment_id and a.deleted_at is null
    join public.assessment_sessions s on s.id=a.assessment_session_id and s.deleted_at is null and s.status='submitted'
    join public.participants p on p.id=a.participant_id and p.deleted_at is null
    left join public.participant_profiles pp on pp.participant_id=p.id and pp.deleted_at is null
    left join public.applications app on app.id=p.application_id
    join lateral (select fv.file_name,fv.mime_type,fv.file_size_bytes,fv.version_number,fv.created_at
      from public.file_version_history fv where fv.evidence_document_id=d.id order by fv.version_number desc limit 1) current_file on true
    left join lateral (select h.verification_event,h.internal_notes,h.verified_by,h.verified_at
      from public.evidence_verification_history h where h.assessment_document_id=d.id order by h.created_at desc,h.id desc limit 1) latest_event on true
    left join public.staff_members reviewer on reviewer.auth_user_id=latest_event.verified_by
    where d.id=p_document_id and d.deleted_at is null and d.evidence_governance_version='evidence-v1';
end;
$$;

create function public.transition_evidence_verification(
    p_document_id uuid,p_actor_user_id uuid,p_command text,p_participant_comment text,p_internal_notes text
)
returns table (
    document_id uuid,verification_status text,participant_comment text,internal_notes text,
    reviewed_by text,verification_at timestamptz,can_start_verification boolean,
    can_save_internal_notes boolean,can_request_information boolean,can_verify boolean,can_reject boolean
)
language plpgsql security definer set search_path = public, pg_catalog as $$
declare
    v_document public.assessment_documents%rowtype;
    v_participant_id uuid; v_version integer; v_latest_event text; v_event_id uuid;
    v_comment text:=nullif(btrim(p_participant_comment),''); v_notes text:=nullif(btrim(p_internal_notes),'');
    v_status text; v_event text; v_title text; v_message text; v_notification_type text;
    v_now timestamptz:=clock_timestamp(); v_reviewer text;
begin
    if not public.is_active_evidence_administrator(p_actor_user_id) then
        raise exception using errcode='P1001', message='Actor is not authorized to verify evidence.';
    end if;
    if p_command not in ('start_verification','save_internal_notes','request_information','verify','reject') then
        raise exception using errcode='P1001', message='Evidence verification command is invalid.';
    end if;
    if coalesce(length(v_comment),0)>2000 or coalesce(length(v_notes),0)>5000 then
        raise exception using errcode='P1001', message='Evidence verification text is invalid.';
    end if;
    if p_command in ('request_information','reject') and v_comment is null then
        raise exception using errcode='P1001', message='Participant-visible evidence feedback is required.';
    end if;
    if p_command='save_internal_notes' and v_notes is null then
        raise exception using errcode='P1001', message='Internal evidence notes are required.';
    end if;

    select d.* into v_document
    from public.assessment_documents d join public.assessments a on a.id=d.assessment_id and a.deleted_at is null
    join public.assessment_sessions s on s.id=a.assessment_session_id and s.deleted_at is null and s.status='submitted'
    where d.id=p_document_id and d.deleted_at is null and d.evidence_governance_version='evidence-v1'
    for update of d;
    if not found then raise exception using errcode='P1001', message='Evidence was not found.'; end if;
    select a.participant_id into v_participant_id
    from public.assessments a
    where a.id=v_document.assessment_id;
    select max(fv.version_number) into v_version from public.file_version_history fv where fv.evidence_document_id=v_document.id;
    if v_version is null then raise exception using errcode='P1001', message='Evidence current version is unavailable.'; end if;
    select h.verification_event into v_latest_event from public.evidence_verification_history h
      where h.assessment_document_id=v_document.id order by h.created_at desc,h.id desc limit 1;

    if p_command='start_verification' then
        if v_document.verification_status<>'pending' then raise exception using errcode='P1001', message='Evidence verification transition is not allowed.'; end if;
        v_status:='in_progress'; v_event:='verification_started';
        update public.assessment_documents set verification_status=v_status,updated_at=v_now,updated_by=p_actor_user_id where id=v_document.id;
    elsif p_command='save_internal_notes' then
        if v_document.verification_status<>'in_progress' or v_latest_event='information_requested' then raise exception using errcode='P1001', message='Evidence verification transition is not allowed.'; end if;
        v_status:='in_progress'; v_event:='internal_notes_saved';
        update public.assessment_documents set updated_at=v_now,updated_by=p_actor_user_id where id=v_document.id;
    elsif p_command='request_information' then
        if v_document.verification_status<>'in_progress' or v_latest_event='information_requested' then raise exception using errcode='P1001', message='Evidence verification transition is not allowed.'; end if;
        v_status:='in_progress'; v_event:='information_requested'; v_notification_type:='evidence_information_required';
        v_title:='Evidence Information Required'; v_message:='Additional information is required for one of your evidence submissions. Please review the request in your participant portal.';
        update public.assessment_documents set verification_notes=v_comment,updated_at=v_now,updated_by=p_actor_user_id where id=v_document.id;
    elsif p_command='verify' then
        if v_document.verification_status<>'in_progress' or v_latest_event='information_requested' then raise exception using errcode='P1001', message='Evidence verification transition is not allowed.'; end if;
        v_status:='verified'; v_event:='verified'; v_notification_type:='evidence_verified';
        v_title:='Evidence Verified'; v_message:='One of your evidence submissions has been verified.';
        update public.assessment_documents set verification_status=v_status,verified_at=v_now,verified_by=p_actor_user_id,
          verification_notes=v_comment,updated_at=v_now,updated_by=p_actor_user_id where id=v_document.id;
    else
        if v_document.verification_status<>'in_progress' or v_latest_event='information_requested' then raise exception using errcode='P1001', message='Evidence verification transition is not allowed.'; end if;
        v_status:='rejected'; v_event:='rejected'; v_notification_type:='evidence_rejected';
        v_title:='Evidence Requires Resubmission'; v_message:='One of your evidence submissions was not accepted. Please review the feedback and submit a new version.';
        update public.assessment_documents set verification_status=v_status,verified_at=v_now,verified_by=p_actor_user_id,
          verification_notes=v_comment,updated_at=v_now,updated_by=p_actor_user_id where id=v_document.id;
    end if;

    insert into public.evidence_verification_history(assessment_document_id,verification_event,verification_status,
      verified_by,verified_at,comments,internal_notes,supporting_metadata,created_at)
    values(v_document.id,v_event,v_status,p_actor_user_id,v_now,v_comment,v_notes,jsonb_build_object('version_number',v_version),v_now)
    returning id into v_event_id;

    insert into public.activity_timeline(entity_type,entity_id,actor_type,actor_id,event_type,event_title,event_description,event_timestamp,metadata)
    values('assessment_document',v_document.id,'admin',p_actor_user_id,'evidence_'||p_command,'Evidence verification updated',
      'An administrator recorded a governed evidence verification event.',v_now,jsonb_build_object('version_number',v_version,'verification_event_id',v_event_id));

    if v_notification_type is not null then
        insert into public.notifications(recipient_type,recipient_id,notification_type,title,message,priority,status,metadata)
        values('participant',v_participant_id,v_notification_type,v_title,v_message,'normal','sent',
          jsonb_build_object('evidence_event_id',v_event_id,'document_id',v_document.id,'target','/participant/evidence/'||v_document.id::text))
        on conflict do nothing;
    end if;
    select sm.full_name into v_reviewer from public.staff_members sm where sm.auth_user_id=p_actor_user_id;
    return query select v_document.id,v_status,v_comment,v_notes,v_reviewer,v_now,
      false,v_status='in_progress' and v_event<>'information_requested',
      v_status='in_progress' and v_event<>'information_requested',
      v_status='in_progress' and v_event<>'information_requested',
      v_status='in_progress' and v_event<>'information_requested';
exception
    when sqlstate 'P1001' then raise;
    when others then raise exception using errcode='P1002', message='Evidence verification could not be persisted.';
end;
$$;

create function public.get_admin_evidence_download(p_document_id uuid,p_actor_user_id uuid,p_version_number integer)
returns table(document_id uuid,participant_id uuid,assessment_id uuid,version_number integer,storage_bucket text,storage_path text,original_filename text,mime_type text,file_size_bytes bigint,sha256 text)
language plpgsql stable security definer set search_path = public, pg_catalog as $$
begin
    if not public.is_active_evidence_administrator(p_actor_user_id) then
        raise exception using errcode='P1001', message='Actor is not authorized to verify evidence.';
    end if;
    if p_version_number is null or p_version_number<=0 then raise exception using errcode='P1001', message='Evidence download is unavailable.'; end if;
    return query select d.id,a.participant_id,a.id,fv.version_number,d.storage_bucket,fv.storage_path,fv.file_name,fv.mime_type,fv.file_size_bytes,fv.checksum
    from public.assessment_documents d join public.assessments a on a.id=d.assessment_id and a.deleted_at is null
    join public.assessment_sessions s on s.id=a.assessment_session_id and s.deleted_at is null and s.status='submitted'
    join public.file_version_history fv on fv.evidence_document_id=d.id and fv.version_number=p_version_number
    where d.id=p_document_id and d.deleted_at is null and d.evidence_governance_version='evidence-v1';
    if not found then raise exception using errcode='P1001', message='Evidence download is unavailable.'; end if;
end;
$$;

alter function public.list_admin_evidence_queue(uuid) owner to postgres;
alter function public.get_admin_evidence_detail(uuid,uuid) owner to postgres;
alter function public.transition_evidence_verification(uuid,uuid,text,text,text) owner to postgres;
alter function public.get_admin_evidence_download(uuid,uuid,integer) owner to postgres;
revoke all on function public.list_admin_evidence_queue(uuid) from public,anon,authenticated,service_role;
revoke all on function public.get_admin_evidence_detail(uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function public.transition_evidence_verification(uuid,uuid,text,text,text) from public,anon,authenticated,service_role;
revoke all on function public.get_admin_evidence_download(uuid,uuid,integer) from public,anon,authenticated,service_role;
grant execute on function public.list_admin_evidence_queue(uuid) to service_role;
grant execute on function public.get_admin_evidence_detail(uuid,uuid) to service_role;
grant execute on function public.transition_evidence_verification(uuid,uuid,text,text,text) to service_role;
grant execute on function public.get_admin_evidence_download(uuid,uuid,integer) to service_role;

commit;
