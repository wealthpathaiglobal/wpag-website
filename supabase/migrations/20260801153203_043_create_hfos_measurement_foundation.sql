begin;

create table public.hfos_measurement_runs (
    id uuid primary key default gen_random_uuid(),
    participant_id uuid not null references public.participants(id) on delete restrict,
    assessment_session_id uuid not null references public.assessment_sessions(id) on delete restrict,
    assessment_id uuid not null references public.assessments(id) on delete restrict,
    assessment_version text not null,
    hfos_version text not null,
    measurement_engine_version text not null default '0.1-infrastructure',
    formula_set_version text not null default 'none',
    execution_mode text not null default 'admin_capture',
    execution_reason text not null,
    idempotency_key text not null,
    status text not null default 'captured',
    input_hash text not null,
    output_hash text,
    warning_count integer not null default 0,
    missing_input_count integer not null default 0,
    warnings jsonb not null default '[]'::jsonb,
    generated_by uuid not null,
    generated_at timestamptz not null default transaction_timestamp(),
    supersedes_run_id uuid references public.hfos_measurement_runs(id) on delete restrict,
    created_at timestamptz not null default transaction_timestamp(),
    constraint hfos_measurement_runs_idempotency_unique unique (idempotency_key),
    constraint hfos_measurement_runs_source_unique unique (id, participant_id, assessment_session_id, assessment_id),
    constraint hfos_measurement_runs_versions_check check (
        btrim(assessment_version) <> '' and btrim(hfos_version) <> ''
        and measurement_engine_version = '0.1-infrastructure'
        and formula_set_version = 'none'
    ),
    constraint hfos_measurement_runs_execution_check check (
        execution_mode = 'admin_capture'
        and btrim(execution_reason) <> '' and char_length(execution_reason) <= 500
        and btrim(idempotency_key) <> '' and char_length(idempotency_key) <= 128
    ),
    constraint hfos_measurement_runs_status_check check (status in ('captured', 'superseded', 'failed')),
    constraint hfos_measurement_runs_hash_check check (
        input_hash ~ '^[0-9a-f]{64}$' and output_hash is null
    ),
    constraint hfos_measurement_runs_counts_check check (
        warning_count >= 0 and missing_input_count >= 0
        and warning_count = missing_input_count
        and jsonb_typeof(warnings) = 'array'
        and jsonb_array_length(warnings) = warning_count
    ),
    constraint hfos_measurement_runs_supersession_check check (supersedes_run_id is null or supersedes_run_id <> id)
);

create index hfos_measurement_runs_participant_idx on public.hfos_measurement_runs(participant_id, generated_at desc);
create index hfos_measurement_runs_assessment_idx on public.hfos_measurement_runs(assessment_id);
create index hfos_measurement_runs_supersedes_idx on public.hfos_measurement_runs(supersedes_run_id) where supersedes_run_id is not null;

create table public.hfos_measurement_inputs (
    id uuid primary key default gen_random_uuid(),
    measurement_run_id uuid not null references public.hfos_measurement_runs(id) on delete restrict,
    source_answer_id uuid not null references public.assessment_answers(id) on delete restrict,
    question_key text not null,
    question_version text not null,
    response_order integer not null,
    value_type text not null,
    is_answered boolean not null,
    text_value text,
    numeric_value numeric(18,2),
    boolean_value boolean,
    date_value date,
    json_value jsonb,
    unit text,
    currency_code text,
    participant_provided boolean not null default true,
    verified boolean not null default false,
    source_updated_at timestamptz not null,
    created_at timestamptz not null default transaction_timestamp(),
    constraint hfos_measurement_inputs_run_answer_unique unique (measurement_run_id, source_answer_id, response_order),
    constraint hfos_measurement_inputs_run_question_unique unique (measurement_run_id, question_key),
    constraint hfos_measurement_inputs_question_check check (btrim(question_key) <> '' and btrim(question_version) <> ''),
    constraint hfos_measurement_inputs_order_check check (response_order >= 1),
    constraint hfos_measurement_inputs_type_check check (value_type in ('text', 'number', 'boolean', 'date', 'json')),
    constraint hfos_measurement_inputs_typed_value_check check (
        (not is_answered and num_nonnulls(text_value, numeric_value, boolean_value, date_value, json_value) = 0)
        or
        (is_answered and num_nonnulls(text_value, numeric_value, boolean_value, date_value, json_value) = 1
            and ((value_type = 'text' and text_value is not null)
              or (value_type = 'number' and numeric_value is not null)
              or (value_type = 'boolean' and boolean_value is not null)
              or (value_type = 'date' and date_value is not null)
              or (value_type = 'json' and json_value is not null)))
    ),
    constraint hfos_measurement_inputs_source_check check (participant_provided and not verified),
    constraint hfos_measurement_inputs_unit_check check (unit is null or btrim(unit) <> ''),
    constraint hfos_measurement_inputs_currency_check check (currency_code is null or currency_code ~ '^[A-Z]{3}$')
);

create index hfos_measurement_inputs_run_idx on public.hfos_measurement_inputs(measurement_run_id, question_key);
create index hfos_measurement_inputs_source_idx on public.hfos_measurement_inputs(source_answer_id);

create table public.hfos_measurement_values (
    id uuid primary key default gen_random_uuid(),
    measurement_run_id uuid not null references public.hfos_measurement_runs(id) on delete restrict,
    measurement_key text not null,
    measurement_version text not null,
    value_type text not null,
    numeric_value numeric(18,6),
    text_value text,
    boolean_value boolean,
    json_value jsonb,
    unit text,
    warning_code text,
    created_at timestamptz not null default transaction_timestamp(),
    constraint hfos_measurement_values_run_key_unique unique (measurement_run_id, measurement_key),
    constraint hfos_measurement_values_identity_check check (btrim(measurement_key) <> '' and btrim(measurement_version) <> ''),
    constraint hfos_measurement_values_type_check check (value_type in ('number', 'text', 'boolean', 'json')),
    constraint hfos_measurement_values_typed_value_check check (
        num_nonnulls(numeric_value, text_value, boolean_value, json_value) = 1
        and ((value_type = 'number' and numeric_value is not null)
          or (value_type = 'text' and text_value is not null)
          or (value_type = 'boolean' and boolean_value is not null)
          or (value_type = 'json' and json_value is not null))
    ),
    constraint hfos_measurement_values_unit_check check (unit is null or btrim(unit) <> ''),
    constraint hfos_measurement_values_warning_check check (warning_code is null or btrim(warning_code) <> '')
);

create index hfos_measurement_values_run_idx on public.hfos_measurement_values(measurement_run_id);

create table public.hfos_current_measurement_runs (
    participant_id uuid primary key references public.participants(id) on delete restrict,
    measurement_run_id uuid not null unique references public.hfos_measurement_runs(id) on delete restrict,
    updated_by uuid not null,
    updated_at timestamptz not null default transaction_timestamp()
);

create table public.hfos_measurement_audit_log (
    id uuid primary key default gen_random_uuid(),
    measurement_run_id uuid not null references public.hfos_measurement_runs(id) on delete restrict,
    participant_id uuid not null references public.participants(id) on delete restrict,
    actor uuid not null,
    event_type text not null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default transaction_timestamp(),
    constraint hfos_measurement_audit_event_check check (event_type in (
        'measurement_run_captured', 'measurement_run_superseded',
        'measurement_current_pointer_updated', 'measurement_run_failed'
    )),
    constraint hfos_measurement_audit_metadata_check check (jsonb_typeof(metadata) = 'object')
);

create index hfos_measurement_audit_run_idx on public.hfos_measurement_audit_log(measurement_run_id, created_at);
create index hfos_measurement_audit_participant_idx on public.hfos_measurement_audit_log(participant_id, created_at);

create function public.prevent_hfos_measurement_mutation()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
    raise exception using errcode = 'P1001', message = 'HFOS measurement snapshots are immutable.';
end;
$$;

create trigger trg_hfos_measurement_runs_immutable before update or delete on public.hfos_measurement_runs for each row execute function public.prevent_hfos_measurement_mutation();
create trigger trg_hfos_measurement_inputs_immutable before update or delete on public.hfos_measurement_inputs for each row execute function public.prevent_hfos_measurement_mutation();
create trigger trg_hfos_measurement_values_immutable before update or delete on public.hfos_measurement_values for each row execute function public.prevent_hfos_measurement_mutation();
create trigger trg_hfos_measurement_audit_immutable before update or delete on public.hfos_measurement_audit_log for each row execute function public.prevent_hfos_measurement_mutation();

create function public.validate_hfos_current_measurement_run()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
    if not exists (
        select 1 from public.hfos_measurement_runs r
        where r.id = new.measurement_run_id
          and r.participant_id = new.participant_id
          and r.status = 'captured'
    ) then
        raise exception using errcode = 'P1001', message = 'HFOS measurement current pointer is invalid.';
    end if;
    return new;
end;
$$;

create trigger trg_hfos_current_measurement_run_valid before insert or update on public.hfos_current_measurement_runs for each row execute function public.validate_hfos_current_measurement_run();

create function public.create_hfos_measurement_run(
    p_participant_id uuid,
    p_assessment_id uuid,
    p_execution_reason text,
    p_idempotency_key text
)
returns table (
    run_id uuid,
    participant_id uuid,
    assessment_id uuid,
    assessment_session_id uuid,
    status text,
    assessment_version text,
    hfos_version text,
    measurement_engine_version text,
    formula_set_version text,
    input_hash text,
    input_count integer,
    warning_count integer,
    generated_at timestamptz,
    supersedes_run_id uuid,
    is_current boolean
)
language plpgsql
volatile
security definer
set search_path = public, pg_catalog
as $$
declare
    v_actor uuid := auth.uid();
    v_participant public.participants%rowtype;
    v_assessment public.assessments%rowtype;
    v_session public.assessment_sessions%rowtype;
    v_existing public.hfos_measurement_runs%rowtype;
    v_prior_run_id uuid;
    v_run public.hfos_measurement_runs%rowtype;
    v_reason text := btrim(p_execution_reason);
    v_key text := btrim(p_idempotency_key);
    v_input_hash text;
    v_input_count integer;
    v_missing_count integer;
    v_warnings jsonb;
begin
    if v_actor is null then
        raise exception using errcode = 'P1001', message = 'Measurement authentication is required.';
    end if;
    if not exists (
        select 1 from public.staff_members sm
        join public.staff_member_roles smr on smr.staff_member_id = sm.id
        join public.staff_roles sr on sr.id = smr.staff_role_id
        where sm.auth_user_id = v_actor and sm.status = 'active' and sm.deleted_at is null
          and sr.role_code = 'administrator' and sr.is_active and smr.is_active
          and (smr.expires_at is null or smr.expires_at > transaction_timestamp())
    ) then
        raise exception using errcode = 'P1001', message = 'Actor is not authorized to capture HFOS measurement inputs.';
    end if;
    if p_participant_id is null or p_assessment_id is null then
        raise exception using errcode = 'P1001', message = 'Measurement source identity is required.';
    end if;
    if v_reason is null or v_reason = '' or char_length(v_reason) > 500 then
        raise exception using errcode = 'P1001', message = 'Measurement execution reason is invalid.';
    end if;
    if v_key is null or v_key = '' or char_length(v_key) > 128 or v_key !~ '^[A-Za-z0-9._:-]+$' then
        raise exception using errcode = 'P1001', message = 'Measurement idempotency key is invalid.';
    end if;

    perform pg_advisory_xact_lock(hashtextextended(v_key, 0));

    select r.* into v_existing from public.hfos_measurement_runs r where r.idempotency_key = v_key;
    if found then
        if v_existing.participant_id is distinct from p_participant_id or v_existing.assessment_id is distinct from p_assessment_id then
            raise exception using errcode = 'P1001', message = 'Measurement idempotency key conflicts with another source.';
        end if;
        return query select v_existing.id, v_existing.participant_id, v_existing.assessment_id,
            v_existing.assessment_session_id, v_existing.status, v_existing.assessment_version,
            v_existing.hfos_version, v_existing.measurement_engine_version,
            v_existing.formula_set_version, v_existing.input_hash,
            (select count(*)::integer from public.hfos_measurement_inputs i where i.measurement_run_id = v_existing.id),
            v_existing.warning_count, v_existing.generated_at, v_existing.supersedes_run_id,
            exists(select 1 from public.hfos_current_measurement_runs c where c.participant_id = v_existing.participant_id and c.measurement_run_id = v_existing.id);
        return;
    end if;

    select p.* into v_participant from public.participants p where p.id = p_participant_id for update;
    if not found then raise exception using errcode = 'P1001', message = 'Measurement participant was not found.'; end if;
    if v_participant.deleted_at is not null then raise exception using errcode = 'P1001', message = 'Measurement participant is unavailable.'; end if;

    select a.* into v_assessment from public.assessments a
    where a.id = p_assessment_id and a.participant_id = p_participant_id for update;
    if not found then raise exception using errcode = 'P1001', message = 'Submitted assessment was not found.'; end if;
    if v_assessment.deleted_at is not null then raise exception using errcode = 'P1001', message = 'Submitted assessment is unavailable.'; end if;

    select s.* into v_session from public.assessment_sessions s
    where s.id = v_assessment.assessment_session_id and s.participant_id = p_participant_id for update;
    if not found or v_session.deleted_at is not null then raise exception using errcode = 'P1001', message = 'Submitted assessment session is unavailable.'; end if;
    if v_session.status <> 'submitted' or v_session.submitted_at is null then raise exception using errcode = 'P1001', message = 'Only submitted assessments can be captured.'; end if;
    if v_assessment.assessment_version is null or btrim(v_assessment.assessment_version) = ''
       or v_assessment.hfos_version is null or btrim(v_assessment.hfos_version) = '' then
        raise exception using errcode = 'P1001', message = 'Submitted assessment versions are unavailable.';
    end if;
    if (select count(*) from public.assessment_module_statuses m where m.assessment_id = v_assessment.id and m.assessment_session_id = v_session.id and m.status = 'complete') <> 6 then
        raise exception using errcode = 'P1001', message = 'Submitted assessment modules are incomplete.';
    end if;

    with latest as (
        select distinct on (a.question_code) a.*
        from public.assessment_answers a
        join public.participant_assessment_question_registry q on q.question_key = a.question_code
        where a.assessment_id = v_assessment.id and a.deleted_at is null
        order by a.question_code, a.response_order desc, a.id desc
    )
    select count(*)::integer,
           encode(extensions.digest((v_assessment.assessment_version || '|' || v_assessment.hfos_version || '|' || coalesce(string_agg(
               jsonb_build_object(
                   'question_key', l.question_code, 'question_version', l.question_version,
                   'response_order', l.response_order, 'value_type', l.answer_type,
                   'is_answered', l.is_answered, 'text_value', l.answer_text,
                   'numeric_value', l.answer_number, 'boolean_value', l.answer_boolean,
                   'date_value', l.answer_date, 'json_value', l.answer_json,
                   'unit', l.answer_unit, 'currency_code', l.answer_currency,
                   'source_updated_at', l.updated_at
               )::text, '|' order by l.question_code
           ), ''))::text, 'sha256'), 'hex')
    into v_input_count, v_input_hash from latest l;

    if v_input_count = 0 then raise exception using errcode = 'P1001', message = 'Submitted assessment inputs are unavailable.'; end if;
    if exists (
        with latest as (
            select distinct on (a.question_code) a.* from public.assessment_answers a
            where a.assessment_id = v_assessment.id and a.deleted_at is null
            order by a.question_code, a.response_order desc, a.id desc
        )
        select 1 from public.participant_assessment_question_registry q
        left join latest l on l.question_code = q.question_key
        where q.is_required and (l.id is null or not l.is_answered)
    ) then raise exception using errcode = 'P1001', message = 'Submitted assessment required inputs are unavailable.'; end if;
    if exists (
        with latest as (
            select distinct on (a.question_code) a.* from public.assessment_answers a
            where a.assessment_id = v_assessment.id and a.deleted_at is null
            order by a.question_code, a.response_order desc, a.id desc
        ) select 1 from latest l where l.source <> 'participant'
    ) then raise exception using errcode = 'P1001', message = 'Submitted assessment input provenance is invalid.'; end if;

    with latest as (
        select distinct on (a.question_code) a.* from public.assessment_answers a
        where a.assessment_id = v_assessment.id and a.deleted_at is null
        order by a.question_code, a.response_order desc, a.id desc
    ), missing as (
        select q.question_key from public.participant_assessment_question_registry q
        left join latest l on l.question_code = q.question_key
        where not q.is_required and (l.id is null or not l.is_answered)
        order by q.question_key
    )
    select count(*)::integer,
           coalesce(jsonb_agg(jsonb_build_object('code', 'optional_input_missing', 'question_key', question_key) order by question_key), '[]'::jsonb)
    into v_missing_count, v_warnings from missing;

    select c.measurement_run_id into v_prior_run_id from public.hfos_current_measurement_runs c
    where c.participant_id = p_participant_id for update;

    insert into public.hfos_measurement_runs (
        participant_id, assessment_session_id, assessment_id, assessment_version, hfos_version,
        measurement_engine_version, formula_set_version, execution_mode, execution_reason,
        idempotency_key, status, input_hash, output_hash, warning_count, missing_input_count,
        warnings, generated_by, supersedes_run_id
    ) values (
        p_participant_id, v_session.id, v_assessment.id, v_assessment.assessment_version, v_assessment.hfos_version,
        '0.1-infrastructure', 'none', 'admin_capture', v_reason, v_key, 'captured', v_input_hash,
        null, v_missing_count, v_missing_count, v_warnings, v_actor, v_prior_run_id
    ) returning * into strict v_run;

    insert into public.hfos_measurement_inputs (
        measurement_run_id, source_answer_id, question_key, question_version, response_order,
        value_type, is_answered, text_value, numeric_value, boolean_value, date_value, json_value,
        unit, currency_code, participant_provided, verified, source_updated_at
    )
    select v_run.id, l.id, l.question_code, l.question_version, l.response_order,
        l.answer_type, l.is_answered, l.answer_text, l.answer_number, l.answer_boolean,
        l.answer_date, l.answer_json, l.answer_unit, l.answer_currency, true, false, l.updated_at
    from (
        select distinct on (a.question_code) a.*
        from public.assessment_answers a
        join public.participant_assessment_question_registry q on q.question_key = a.question_code
        where a.assessment_id = v_assessment.id and a.deleted_at is null
        order by a.question_code, a.response_order desc, a.id desc
    ) l order by l.question_code;

    insert into public.hfos_current_measurement_runs(participant_id, measurement_run_id, updated_by, updated_at)
    values(p_participant_id, v_run.id, v_actor, transaction_timestamp())
    on conflict on constraint hfos_current_measurement_runs_pkey do update set measurement_run_id = excluded.measurement_run_id,
        updated_by = excluded.updated_by, updated_at = excluded.updated_at;

    insert into public.hfos_measurement_audit_log(measurement_run_id, participant_id, actor, event_type, metadata)
    values(v_run.id, p_participant_id, v_actor, 'measurement_run_captured', jsonb_build_object(
        'assessment_id', v_assessment.id, 'assessment_session_id', v_session.id,
        'assessment_version', v_assessment.assessment_version, 'hfos_version', v_assessment.hfos_version,
        'input_count', v_input_count, 'warning_count', v_missing_count
    ));
    if v_prior_run_id is not null then
        insert into public.hfos_measurement_audit_log(measurement_run_id, participant_id, actor, event_type, metadata)
        values(v_prior_run_id, p_participant_id, v_actor, 'measurement_run_superseded', jsonb_build_object('superseded_by_run_id', v_run.id));
    end if;
    insert into public.hfos_measurement_audit_log(measurement_run_id, participant_id, actor, event_type, metadata)
    values(v_run.id, p_participant_id, v_actor, 'measurement_current_pointer_updated', jsonb_build_object('previous_run_id', v_prior_run_id));

    return query select v_run.id, v_run.participant_id, v_run.assessment_id, v_run.assessment_session_id,
        v_run.status, v_run.assessment_version, v_run.hfos_version, v_run.measurement_engine_version,
        v_run.formula_set_version, v_run.input_hash,
        (select count(*)::integer from public.hfos_measurement_inputs i where i.measurement_run_id = v_run.id),
        v_run.warning_count, v_run.generated_at, v_run.supersedes_run_id, true;
exception
    when sqlstate 'P1001' then raise;
    when others then raise exception using errcode = 'P1002', message = 'HFOS measurement snapshot could not be captured.';
end;
$$;

create function public.get_admin_participant_measurement_summary(p_participant_id uuid)
returns table (
    participant_id uuid,
    current_run_id uuid,
    assessment_id uuid,
    assessment_session_id uuid,
    assessment_version text,
    hfos_version text,
    measurement_engine_version text,
    formula_set_version text,
    run_status text,
    input_count integer,
    warning_count integer,
    input_hash text,
    generated_at timestamptz,
    supersedes_run_id uuid,
    historical_run_count integer
)
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
    v_actor uuid := auth.uid();
begin
    if v_actor is null then raise exception using errcode = 'P1001', message = 'Measurement authentication is required.'; end if;
    if not exists (
        select 1 from public.staff_members sm
        join public.staff_member_roles smr on smr.staff_member_id = sm.id
        join public.staff_roles sr on sr.id = smr.staff_role_id
        where sm.auth_user_id = v_actor and sm.status = 'active' and sm.deleted_at is null
          and sr.role_code = 'administrator' and sr.is_active and smr.is_active
          and (smr.expires_at is null or smr.expires_at > transaction_timestamp())
    ) then raise exception using errcode = 'P1001', message = 'Actor is not authorized to view HFOS measurement metadata.'; end if;
    if p_participant_id is null then raise exception using errcode = 'P1001', message = 'Participant ID is required.'; end if;

    return query
    select r.participant_id, r.id, r.assessment_id, r.assessment_session_id,
        r.assessment_version, r.hfos_version, r.measurement_engine_version,
        r.formula_set_version, r.status,
        (select count(*)::integer from public.hfos_measurement_inputs i where i.measurement_run_id = r.id),
        r.warning_count, r.input_hash, r.generated_at, r.supersedes_run_id,
        (select count(*)::integer from public.hfos_measurement_runs history where history.participant_id = r.participant_id)
    from public.hfos_current_measurement_runs c
    join public.hfos_measurement_runs r on r.id = c.measurement_run_id and r.participant_id = c.participant_id
    where c.participant_id = p_participant_id;
exception
    when sqlstate 'P1001' then raise;
    when others then raise exception using errcode = 'P1002', message = 'HFOS measurement metadata could not be loaded.';
end;
$$;

alter function public.prevent_hfos_measurement_mutation() owner to postgres;
alter function public.validate_hfos_current_measurement_run() owner to postgres;
alter function public.create_hfos_measurement_run(uuid, uuid, text, text) owner to postgres;
alter function public.get_admin_participant_measurement_summary(uuid) owner to postgres;

alter table public.hfos_measurement_runs enable row level security;
alter table public.hfos_measurement_inputs enable row level security;
alter table public.hfos_measurement_values enable row level security;
alter table public.hfos_current_measurement_runs enable row level security;
alter table public.hfos_measurement_audit_log enable row level security;

revoke all on table public.hfos_measurement_runs, public.hfos_measurement_inputs,
    public.hfos_measurement_values, public.hfos_current_measurement_runs,
    public.hfos_measurement_audit_log from public, anon, authenticated, service_role;
revoke all on function public.prevent_hfos_measurement_mutation(),
    public.validate_hfos_current_measurement_run(),
    public.create_hfos_measurement_run(uuid, uuid, text, text),
    public.get_admin_participant_measurement_summary(uuid)
    from public, anon, authenticated, service_role;
grant execute on function public.create_hfos_measurement_run(uuid, uuid, text, text),
    public.get_admin_participant_measurement_summary(uuid) to authenticated;

comment on table public.hfos_measurement_runs is 'Immutable infrastructure-only HFOS measurement run metadata. No formula, score, diagnosis, or classification is produced in Phase C4.';
comment on table public.hfos_measurement_inputs is 'Immutable frozen typed copies of participant-provided, unverified submitted-assessment answers with source revision provenance.';
comment on table public.hfos_measurement_values is 'Reserved immutable measurement output foundation. Phase C4 governed commands insert no rows.';
comment on table public.hfos_current_measurement_runs is 'Governed mutable pointer to the current immutable HFOS measurement infrastructure snapshot for a participant.';
comment on table public.hfos_measurement_audit_log is 'Immutable technical audit history for HFOS measurement infrastructure commands; answer values are excluded.';
comment on function public.create_hfos_measurement_run(uuid, uuid, text, text) is 'Captures an idempotent frozen input snapshot from a complete submitted assessment without calculating HFOS outputs.';
comment on function public.get_admin_participant_measurement_summary(uuid) is 'Returns narrow administrator-only HFOS measurement infrastructure metadata without frozen answer values.';

commit;
