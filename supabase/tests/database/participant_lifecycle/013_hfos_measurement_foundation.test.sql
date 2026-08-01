begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;

select plan(237);

create temporary table phase_c4_test_state (
    key text primary key,
    value text not null
) on commit drop;
grant select on phase_c4_test_state to authenticated;

-- Catalog, constraints, triggers, functions, and privilege posture: 131 assertions.
select ok(to_regclass(table_name) is not null, table_name || ' exists')
from unnest(array[
    'public.hfos_measurement_runs',
    'public.hfos_measurement_inputs',
    'public.hfos_measurement_values',
    'public.hfos_current_measurement_runs',
    'public.hfos_measurement_audit_log'
]) table_name;

select has_column('public', 'hfos_measurement_runs', column_name, 'runs has ' || column_name)
from unnest(array[
    'participant_id', 'assessment_session_id', 'assessment_id', 'assessment_version',
    'hfos_version', 'measurement_engine_version', 'formula_set_version', 'execution_mode',
    'execution_reason', 'idempotency_key', 'status', 'input_hash', 'output_hash',
    'warning_count', 'missing_input_count', 'generated_by', 'supersedes_run_id'
]) column_name;

select has_column('public', 'hfos_measurement_inputs', column_name, 'inputs has ' || column_name)
from unnest(array[
    'measurement_run_id', 'source_answer_id', 'question_key', 'question_version',
    'response_order', 'value_type', 'is_answered', 'text_value', 'numeric_value',
    'boolean_value', 'date_value', 'json_value', 'unit', 'currency_code',
    'participant_provided', 'verified', 'source_updated_at'
]) column_name;

select has_column('public', 'hfos_measurement_values', column_name, 'values has ' || column_name)
from unnest(array[
    'measurement_run_id', 'measurement_key', 'measurement_version', 'value_type',
    'numeric_value', 'text_value', 'boolean_value', 'json_value'
]) column_name;

select has_column('public', 'hfos_current_measurement_runs', column_name, 'current pointer has ' || column_name)
from unnest(array['participant_id', 'measurement_run_id', 'updated_by', 'updated_at']) column_name;

select has_column('public', 'hfos_measurement_audit_log', column_name, 'audit has ' || column_name)
from unnest(array['measurement_run_id', 'participant_id', 'actor', 'event_type', 'metadata', 'created_at']) column_name;

select ok(to_regprocedure(function_name) is not null, function_name || ' exists')
from unnest(array[
    'public.create_hfos_measurement_run(uuid,uuid,text,text)',
    'public.get_admin_participant_measurement_summary(uuid)'
]) function_name;

select ok((select prosecdef from pg_proc where oid = to_regprocedure(function_name)), function_name || ' is security definer')
from unnest(array[
    'public.create_hfos_measurement_run(uuid,uuid,text,text)',
    'public.get_admin_participant_measurement_summary(uuid)'
]) function_name;

select is((select pg_get_userbyid(proowner) from pg_proc where oid = to_regprocedure(function_name)), 'postgres', function_name || ' owner is postgres')
from unnest(array[
    'public.create_hfos_measurement_run(uuid,uuid,text,text)',
    'public.get_admin_participant_measurement_summary(uuid)'
]) function_name;

select ok((select proconfig @> array['search_path=public, pg_catalog'] from pg_proc where oid = to_regprocedure(function_name)), function_name || ' search path controlled')
from unnest(array[
    'public.create_hfos_measurement_run(uuid,uuid,text,text)',
    'public.get_admin_participant_measurement_summary(uuid)'
]) function_name;

select is((select provolatile from pg_proc where oid = to_regprocedure(function_name)), expected, function_name || ' volatility correct')
from (values
    ('public.create_hfos_measurement_run(uuid,uuid,text,text)', 'v'::"char"),
    ('public.get_admin_participant_measurement_summary(uuid)', 's'::"char")
) checks(function_name, expected);

select ok(exists(select 1 from pg_constraint where conname = constraint_name), constraint_name || ' exists')
from unnest(array[
    'hfos_measurement_runs_idempotency_unique',
    'hfos_measurement_inputs_run_answer_unique',
    'hfos_measurement_inputs_run_question_unique',
    'hfos_measurement_inputs_typed_value_check',
    'hfos_measurement_runs_hash_check'
]) constraint_name;

select ok(exists(select 1 from pg_trigger where tgname = trigger_name and not tgisinternal), trigger_name || ' exists')
from unnest(array[
    'trg_hfos_measurement_runs_immutable',
    'trg_hfos_measurement_inputs_immutable',
    'trg_hfos_measurement_values_immutable',
    'trg_hfos_measurement_audit_immutable',
    'trg_hfos_current_measurement_run_valid'
]) trigger_name;

select ok(has_function_privilege('authenticated', function_name, 'EXECUTE'), function_name || ' authenticated boundary granted')
from unnest(array[
    'public.create_hfos_measurement_run(uuid,uuid,text,text)',
    'public.get_admin_participant_measurement_summary(uuid)'
]) function_name;

select ok(not has_function_privilege(role_name, function_name, 'EXECUTE'), role_name || ' denied ' || function_name)
from unnest(array['public', 'anon', 'service_role']) role_name
cross join unnest(array[
    'public.create_hfos_measurement_run(uuid,uuid,text,text)',
    'public.get_admin_participant_measurement_summary(uuid)'
]) function_name;

select ok(not has_table_privilege(role_name, table_name, privilege), role_name || ' denied ' || privilege || ' on ' || table_name)
from unnest(array['authenticated', 'service_role']) role_name
cross join unnest(array[
    'public.hfos_measurement_runs',
    'public.hfos_measurement_inputs',
    'public.hfos_measurement_values',
    'public.hfos_current_measurement_runs',
    'public.hfos_measurement_audit_log'
]) table_name
cross join unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE']) privilege;

-- The five tables must have RLS enabled and expose no policies.
select ok(c.relrowsecurity and not c.relforcerowsecurity, table_name || ' RLS enabled without FORCE')
from unnest(array[
    'hfos_measurement_runs', 'hfos_measurement_inputs', 'hfos_measurement_values',
    'hfos_current_measurement_runs', 'hfos_measurement_audit_log'
]) table_name
join pg_class c on c.oid = ('public.' || table_name)::regclass;

select is((select count(*) from pg_policies where schemaname = 'public' and tablename like 'hfos_measurement_%'), 0::bigint, 'measurement tables expose no RLS policies');

-- Build one valid assessment through the governed Phase C3 participant workflow.
insert into auth.users(instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
('00000000-0000-0000-0000-000000000000', 'd1000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'measurement.participant@test.local', '', '2026-01-01', '{"provider":"email","providers":["email"]}', '{}', '2026-01-01', '2026-01-01'),
('00000000-0000-0000-0000-000000000000', 'd1000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'measurement.admin@test.local', '', '2026-01-01', '{"provider":"email","providers":["email"]}', '{}', '2026-01-01', '2026-01-01'),
('00000000-0000-0000-0000-000000000000', 'd1000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'measurement.other@test.local', '', '2026-01-01', '{"provider":"email","providers":["email"]}', '{}', '2026-01-01', '2026-01-01');

insert into public.participants(id, participant_code, auth_user_id, lifecycle_status, created_at)
values ('d2000000-0000-4000-8000-000000000001', 'WPAG-993001', 'd1000000-0000-4000-8000-000000000001', 'active', '2026-01-01');

insert into public.participant_profiles(id, participant_id, auth_user_id, first_name, last_name, email, country_code, household_size, dependents, created_at)
values ('d3000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'Measurement', 'Owner', 'measurement.participant@test.local', 'IN', 2, 0, '2026-01-01');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000001', true);
select lives_ok($$select * from public.start_or_resume_current_assessment()$$, 'participant assessment starts');
select lives_ok($$select * from public.save_current_assessment_module('financial_profile', '{"financial_profile.age":35}'::jsonb)$$, 'first numeric revision saves');
reset role;
select lives_ok(
    format('select * from public.save_current_assessment_module(%L,%L::jsonb)', module_key, answers::text),
    module_key || ' required answers save succeeds'
)
from (
    select module_key, jsonb_object_agg(
        question_key,
        case value_type
            when 'number' then to_jsonb(minimum_value)
            when 'json' then jsonb_build_object(enum_values[1], true)
            else to_jsonb(coalesce(enum_values[1], 'Provided'))
        end
    ) answers
    from public.participant_assessment_question_registry
    where is_required
    group by module_key
) required_payloads;
select lives_ok($$select * from public.submit_current_assessment()$$, 'complete assessment submits');

insert into phase_c4_test_state values
('assessment_id', (select id::text from public.assessments where participant_id = 'd2000000-0000-4000-8000-000000000001')),
('session_id', (select id::text from public.assessment_sessions where participant_id = 'd2000000-0000-4000-8000-000000000001')),
('participant_lifecycle', (select lifecycle_status from public.participants where id = 'd2000000-0000-4000-8000-000000000001')),
('profile_updated_at', (select updated_at::text from public.participant_profiles where participant_id = 'd2000000-0000-4000-8000-000000000001')),
('assessment_updated_at', (select updated_at::text from public.assessments where participant_id = 'd2000000-0000-4000-8000-000000000001'));

insert into public.staff_members(id, staff_code, auth_user_id, full_name, email, status, created_at)
values ('d4000000-0000-4000-8000-000000000001', 'WPAG-STF-993001', 'd1000000-0000-4000-8000-000000000002', 'Measurement Admin', 'measurement.admin@test.local', 'active', '2026-01-01');

insert into public.staff_member_roles(staff_member_id, staff_role_id, assigned_at, is_active)
values ('d4000000-0000-4000-8000-000000000001', (select id from public.staff_roles where role_code = 'administrator'), '2026-01-01', true);

insert into public.participants(id, participant_code, lifecycle_status, created_at)
values ('d2000000-0000-4000-8000-000000000002', 'WPAG-993002', 'active', '2026-01-01');

-- Governed source setup, authorization, and eligibility: 23 assertions.
set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);
select throws_ok(
    format('select * from public.create_hfos_measurement_run(%L,%L,%L,%L)', 'd2000000-0000-4000-8000-000000000001', (select value from phase_c4_test_state where key = 'assessment_id'), 'Infrastructure capture', 'phase-c4-no-auth'),
    'P1001', 'Measurement authentication is required.', 'unauthenticated capture rejected'
);
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000001', true);
select throws_ok(
    format('select * from public.create_hfos_measurement_run(%L,%L,%L,%L)', 'd2000000-0000-4000-8000-000000000001', (select value from phase_c4_test_state where key = 'assessment_id'), 'Infrastructure capture', 'phase-c4-participant'),
    'P1001', 'Actor is not authorized to capture HFOS measurement inputs.', 'participant capture rejected'
);
select throws_ok(
    $$select * from public.get_admin_participant_measurement_summary('d2000000-0000-4000-8000-000000000001')$$,
    'P1001', 'Actor is not authorized to view HFOS measurement metadata.', 'participant summary rejected'
);
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000003', true);
select throws_ok(
    format('select * from public.create_hfos_measurement_run(%L,%L,%L,%L)', 'd2000000-0000-4000-8000-000000000001', (select value from phase_c4_test_state where key = 'assessment_id'), 'Infrastructure capture', 'phase-c4-non-admin'),
    'P1001', 'Actor is not authorized to capture HFOS measurement inputs.', 'non-admin capture rejected'
);
reset role;

update public.staff_members set status = 'inactive' where id = 'd4000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000002', true);
select throws_ok(
    format('select * from public.create_hfos_measurement_run(%L,%L,%L,%L)', 'd2000000-0000-4000-8000-000000000001', (select value from phase_c4_test_state where key = 'assessment_id'), 'Infrastructure capture', 'phase-c4-inactive-admin'),
    'P1001', 'Actor is not authorized to capture HFOS measurement inputs.', 'inactive administrator rejected'
);
reset role;
update public.staff_members set status = 'active' where id = 'd4000000-0000-4000-8000-000000000001';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000002', true);
select throws_ok(
    format('select * from public.create_hfos_measurement_run(%L,%L,%L,%L)', 'd2000000-0000-4000-8000-000000000002', (select value from phase_c4_test_state where key = 'assessment_id'), 'Infrastructure capture', 'phase-c4-ownership-mismatch'),
    'P1001', 'Submitted assessment was not found.', 'assessment ownership mismatch rejected'
);
reset role;

update public.assessment_sessions set status = 'draft', submitted_at = null where id = (select value::uuid from phase_c4_test_state where key = 'session_id');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000002', true);
select throws_ok(
    format('select * from public.create_hfos_measurement_run(%L,%L,%L,%L)', 'd2000000-0000-4000-8000-000000000001', (select value from phase_c4_test_state where key = 'assessment_id'), 'Infrastructure capture', 'phase-c4-draft'),
    'P1001', 'Only submitted assessments can be captured.', 'draft assessment rejected'
);
reset role;
update public.assessment_sessions set status = 'in_progress' where id = (select value::uuid from phase_c4_test_state where key = 'session_id');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000002', true);
select throws_ok(
    format('select * from public.create_hfos_measurement_run(%L,%L,%L,%L)', 'd2000000-0000-4000-8000-000000000001', (select value from phase_c4_test_state where key = 'assessment_id'), 'Infrastructure capture', 'phase-c4-in-progress'),
    'P1001', 'Only submitted assessments can be captured.', 'in-progress assessment rejected'
);
reset role;
update public.assessment_sessions set status = 'submitted', submitted_at = transaction_timestamp() where id = (select value::uuid from phase_c4_test_state where key = 'session_id');
update public.assessment_module_statuses set status = 'in_progress', completed_at = null where assessment_id = (select value::uuid from phase_c4_test_state where key = 'assessment_id') and module_key = 'goals_planning';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000002', true);
select throws_ok(
    format('select * from public.create_hfos_measurement_run(%L,%L,%L,%L)', 'd2000000-0000-4000-8000-000000000001', (select value from phase_c4_test_state where key = 'assessment_id'), 'Infrastructure capture', 'phase-c4-incomplete'),
    'P1001', 'Submitted assessment modules are incomplete.', 'incomplete modules rejected'
);
reset role;
update public.assessment_module_statuses set status = 'complete', completed_at = transaction_timestamp() where assessment_id = (select value::uuid from phase_c4_test_state where key = 'assessment_id') and module_key = 'goals_planning';
update public.participants set deleted_at = transaction_timestamp() where id = 'd2000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000002', true);
select throws_ok(
    format('select * from public.create_hfos_measurement_run(%L,%L,%L,%L)', 'd2000000-0000-4000-8000-000000000001', (select value from phase_c4_test_state where key = 'assessment_id'), 'Infrastructure capture', 'phase-c4-deleted-participant'),
    'P1001', 'Measurement participant is unavailable.', 'deleted participant rejected'
);
reset role;
update public.participants set deleted_at = null where id = 'd2000000-0000-4000-8000-000000000001';
update public.assessment_sessions set deleted_at = transaction_timestamp() where id = (select value::uuid from phase_c4_test_state where key = 'session_id');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000002', true);
select throws_ok(
    format('select * from public.create_hfos_measurement_run(%L,%L,%L,%L)', 'd2000000-0000-4000-8000-000000000001', (select value from phase_c4_test_state where key = 'assessment_id'), 'Infrastructure capture', 'phase-c4-deleted-session'),
    'P1001', 'Submitted assessment session is unavailable.', 'deleted session rejected'
);
reset role;
update public.assessment_sessions set deleted_at = null where id = (select value::uuid from phase_c4_test_state where key = 'session_id');
update public.assessments set deleted_at = transaction_timestamp() where id = (select value::uuid from phase_c4_test_state where key = 'assessment_id');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000002', true);
select throws_ok(
    format('select * from public.create_hfos_measurement_run(%L,%L,%L,%L)', 'd2000000-0000-4000-8000-000000000001', (select value from phase_c4_test_state where key = 'assessment_id'), 'Infrastructure capture', 'phase-c4-deleted-assessment'),
    'P1001', 'Submitted assessment is unavailable.', 'deleted assessment rejected'
);
reset role;
update public.assessments set deleted_at = null where id = (select value::uuid from phase_c4_test_state where key = 'assessment_id');

update public.assessment_answers
set deleted_at = transaction_timestamp()
where id = (
    select a.id
    from public.assessment_answers a
    join public.participant_assessment_question_registry q on q.question_key = a.question_code and q.is_required
    where a.assessment_id = (select value::uuid from phase_c4_test_state where key = 'assessment_id')
      and a.question_code <> 'financial_profile.age'
      and a.deleted_at is null
    order by a.question_code
    limit 1
);
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000002', true);
select throws_ok(
    format('select * from public.create_hfos_measurement_run(%L,%L,%L,%L)', 'd2000000-0000-4000-8000-000000000001', (select value from phase_c4_test_state where key = 'assessment_id'), 'Infrastructure capture', 'phase-c4-required-missing'),
    'P1001', 'Submitted assessment required inputs are unavailable.', 'missing required input rejected'
);
reset role;
update public.assessment_answers set deleted_at = null
where assessment_id = (select value::uuid from phase_c4_test_state where key = 'assessment_id')
  and deleted_at is not null;

insert into phase_c4_test_state values
('session_updated_at_before_capture', (select updated_at::text from public.assessment_sessions where id = (select value::uuid from phase_c4_test_state where key = 'session_id')));

set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000002', true);
select lives_ok(
    format('select * from public.create_hfos_measurement_run(%L,%L,%L,%L)', 'd2000000-0000-4000-8000-000000000001', (select value from phase_c4_test_state where key = 'assessment_id'), ' Initial infrastructure capture ', 'phase-c4-run-001'),
    'submitted complete assessment accepted'
);
reset role;

insert into phase_c4_test_state values
('first_run_id', (select id::text from public.hfos_measurement_runs where idempotency_key = 'phase-c4-run-001')),
('first_input_count', (select count(*)::text from public.hfos_measurement_inputs where measurement_run_id = (select id from public.hfos_measurement_runs where idempotency_key = 'phase-c4-run-001'))),
('first_audit_count', (select count(*)::text from public.hfos_measurement_audit_log)),
('first_input_hash', (select input_hash from public.hfos_measurement_runs where idempotency_key = 'phase-c4-run-001')),
('first_generated_at', (select generated_at::text from public.hfos_measurement_runs where idempotency_key = 'phase-c4-run-001'));

-- Frozen inputs, no outputs, safe provenance, hashing, and no domain side effects: 27 assertions.
select ok(result, description) from (values
    ((select status = 'captured' from public.hfos_measurement_runs where idempotency_key = 'phase-c4-run-001'), 'run status is captured'),
    ((select execution_reason = 'Initial infrastructure capture' from public.hfos_measurement_runs where idempotency_key = 'phase-c4-run-001'), 'execution reason normalized'),
    ((select measurement_engine_version = '0.1-infrastructure' from public.hfos_measurement_runs where idempotency_key = 'phase-c4-run-001'), 'engine version server controlled'),
    ((select formula_set_version = 'none' from public.hfos_measurement_runs where idempotency_key = 'phase-c4-run-001'), 'formula set remains none'),
    ((select output_hash is null from public.hfos_measurement_runs where idempotency_key = 'phase-c4-run-001'), 'output hash remains null'),
    ((select input_hash ~ '^[0-9a-f]{64}$' from public.hfos_measurement_runs where idempotency_key = 'phase-c4-run-001'), 'input hash is canonical sha256 hex'),
    ((select count(*) > 0 from public.hfos_measurement_inputs where measurement_run_id = (select value::uuid from phase_c4_test_state where key = 'first_run_id')), 'frozen inputs created'),
    ((select count(*) = count(distinct question_key) from public.hfos_measurement_inputs where measurement_run_id = (select value::uuid from phase_c4_test_state where key = 'first_run_id')), 'one frozen input per question'),
    ((select bool_and(source_answer_id is not null and response_order >= 1) from public.hfos_measurement_inputs where measurement_run_id = (select value::uuid from phase_c4_test_state where key = 'first_run_id')), 'source answer and revision provenance retained'),
    ((select bool_and(participant_provided and not verified) from public.hfos_measurement_inputs where measurement_run_id = (select value::uuid from phase_c4_test_state where key = 'first_run_id')), 'inputs marked participant provided and unverified'),
    ((select bool_and(i.question_version = a.question_version and i.response_order = a.response_order and i.source_updated_at = a.updated_at) from public.hfos_measurement_inputs i join public.assessment_answers a on a.id = i.source_answer_id where i.measurement_run_id = (select value::uuid from phase_c4_test_state where key = 'first_run_id')), 'question version revision and timestamp frozen'),
    ((select bool_and(i.value_type = a.answer_type and i.is_answered = a.is_answered and i.text_value is not distinct from a.answer_text and i.numeric_value is not distinct from a.answer_number and i.boolean_value is not distinct from a.answer_boolean and i.date_value is not distinct from a.answer_date and i.json_value is not distinct from a.answer_json) from public.hfos_measurement_inputs i join public.assessment_answers a on a.id = i.source_answer_id where i.measurement_run_id = (select value::uuid from phase_c4_test_state where key = 'first_run_id')), 'typed values frozen exactly'),
    ((select response_order = 2 from public.hfos_measurement_inputs where measurement_run_id = (select value::uuid from phase_c4_test_state where key = 'first_run_id') and question_key = 'financial_profile.age'), 'latest active revision captured'),
    ((select not exists(select 1 from public.hfos_measurement_inputs i join public.assessment_answers a on a.id = i.source_answer_id where i.measurement_run_id = (select value::uuid from phase_c4_test_state where key = 'first_run_id') and a.question_code = 'financial_profile.age' and a.response_order = 1)), 'earlier revision not captured'),
    ((select warning_count = missing_input_count and warning_count > 0 from public.hfos_measurement_runs where idempotency_key = 'phase-c4-run-001'), 'missing optional inputs produce warnings'),
    ((select not exists(select 1 from public.hfos_measurement_inputs i join public.participant_assessment_question_registry q on q.question_key = i.question_key where i.measurement_run_id = (select value::uuid from phase_c4_test_state where key = 'first_run_id') and not q.is_required and not i.is_answered and coalesce(i.numeric_value, 0) = 0)), 'missing optional values are not converted to numeric zero'),
    ((select count(*) = 0 from public.hfos_measurement_values), 'governed capture creates zero output rows'),
    ((select measurement_run_id = (select value::uuid from phase_c4_test_state where key = 'first_run_id') from public.hfos_current_measurement_runs where participant_id = 'd2000000-0000-4000-8000-000000000001'), 'current pointer targets first run'),
    ((select count(*) = 2 from public.hfos_measurement_audit_log), 'capture and pointer audit events created'),
    ((select not exists(select 1 from public.hfos_measurement_audit_log where metadata::text like '%Provided%' or metadata::text like '%financial_profile.age%')), 'audit metadata contains no answer values'),
    ((select lifecycle_status = (select value from phase_c4_test_state where key = 'participant_lifecycle') from public.participants where id = 'd2000000-0000-4000-8000-000000000001'), 'participant lifecycle unchanged'),
    ((select updated_at::text = (select value from phase_c4_test_state where key = 'profile_updated_at') from public.participant_profiles where participant_id = 'd2000000-0000-4000-8000-000000000001'), 'participant profile unchanged'),
    ((select updated_at::text = (select value from phase_c4_test_state where key = 'assessment_updated_at') from public.assessments where id = (select value::uuid from phase_c4_test_state where key = 'assessment_id')), 'source assessment unchanged'),
    ((select updated_at::text = (select value from phase_c4_test_state where key = 'session_updated_at_before_capture') from public.assessment_sessions where id = (select value::uuid from phase_c4_test_state where key = 'session_id')), 'source session unchanged'),
    ((select count(*) = 0 from public.assessment_documents), 'no report or document generated'),
    ((select lower(regexp_replace(prosrc, '[[:space:]]+', ' ', 'g')) like '%v_assessment.assessment_version%v_assessment.hfos_version%extensions.digest%' from pg_proc where oid = to_regprocedure('public.create_hfos_measurement_run(uuid,uuid,text,text)')), 'version context included in canonical hash'),
    ((select lower(regexp_replace(prosrc, '[[:space:]]+', ' ', 'g')) like '%string_agg(%order by l.question_code%' from pg_proc where oid = to_regprocedure('public.create_hfos_measurement_run(uuid,uuid,text,text)')), 'canonical hash orders questions deterministically')
) checks(result, description);

-- Idempotency, current-pointer supersession, and changed revision capture: 22 assertions.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000002', true);
select lives_ok(
    format('select * from public.create_hfos_measurement_run(%L,%L,%L,%L)', 'd2000000-0000-4000-8000-000000000001', (select value from phase_c4_test_state where key = 'assessment_id'), 'Retry ignored by idempotency', 'phase-c4-run-001'),
    'same idempotency key returns existing run'
);
reset role;
select is((select count(*) from public.hfos_measurement_runs), 1::bigint, 'idempotent retry creates no run');
select is((select count(*)::text from public.hfos_measurement_inputs), (select value from phase_c4_test_state where key = 'first_input_count'), 'idempotent retry creates no inputs');
select is((select count(*)::text from public.hfos_measurement_audit_log), (select value from phase_c4_test_state where key = 'first_audit_count'), 'idempotent retry creates no audit event');
select is((select generated_at::text from public.hfos_measurement_runs where idempotency_key = 'phase-c4-run-001'), (select value from phase_c4_test_state where key = 'first_generated_at'), 'idempotent retry preserves generated timestamp');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000002', true);
select throws_ok(
    format('select * from public.create_hfos_measurement_run(%L,%L,%L,%L)', 'd2000000-0000-4000-8000-000000000099', (select value from phase_c4_test_state where key = 'assessment_id'), 'Conflicting capture', 'phase-c4-run-001'),
    'P1001', 'Measurement idempotency key conflicts with another source.', 'conflicting idempotency key rejected'
);
select lives_ok(
    format('select * from public.create_hfos_measurement_run(%L,%L,%L,%L)', 'd2000000-0000-4000-8000-000000000001', (select value from phase_c4_test_state where key = 'assessment_id'), 'Second infrastructure capture', 'phase-c4-run-002'),
    'second key creates new immutable run'
);
reset role;

insert into phase_c4_test_state values ('second_run_id', (select id::text from public.hfos_measurement_runs where idempotency_key = 'phase-c4-run-002'));
select ok(result, description) from (values
    ((select count(*) = 2 from public.hfos_measurement_runs), 'historical run count increments'),
    ((select id = (select value::uuid from phase_c4_test_state where key = 'first_run_id') from public.hfos_measurement_runs where idempotency_key = 'phase-c4-run-001'), 'prior run preserved'),
    ((select input_hash = (select value from phase_c4_test_state where key = 'first_input_hash') from public.hfos_measurement_runs where idempotency_key = 'phase-c4-run-002'), 'unchanged source produces deterministic input hash'),
    ((select supersedes_run_id = (select value::uuid from phase_c4_test_state where key = 'first_run_id') from public.hfos_measurement_runs where idempotency_key = 'phase-c4-run-002'), 'second run links prior run'),
    ((select measurement_run_id = (select value::uuid from phase_c4_test_state where key = 'second_run_id') from public.hfos_current_measurement_runs where participant_id = 'd2000000-0000-4000-8000-000000000001'), 'current pointer advances atomically'),
    ((select count(*)::text = (select value from phase_c4_test_state where key = 'first_input_count') from public.hfos_measurement_inputs where measurement_run_id = (select value::uuid from phase_c4_test_state where key = 'first_run_id')), 'prior frozen inputs preserved'),
    ((select count(*) = 0 from public.hfos_measurement_values), 'second capture still creates zero outputs'),
    ((select count(*) = 1 from public.hfos_measurement_audit_log where event_type = 'measurement_run_superseded'), 'supersession audit event created'),
    ((select count(*) = 2 from public.hfos_measurement_audit_log where event_type = 'measurement_run_captured'), 'one capture event per run'),
    ((select count(*) = 2 from public.hfos_measurement_audit_log where event_type = 'measurement_current_pointer_updated'), 'one pointer event per run'),
    ((select historical_run_count = 2 from public.get_admin_participant_measurement_summary('d2000000-0000-4000-8000-000000000001')), 'admin summary reports history'),
    ((select current_run_id = (select value::uuid from phase_c4_test_state where key = 'second_run_id') from public.get_admin_participant_measurement_summary('d2000000-0000-4000-8000-000000000001')), 'admin summary returns current run')
) checks(result, description);

update public.assessment_answers
set deleted_at = transaction_timestamp()
where assessment_id = (select value::uuid from phase_c4_test_state where key = 'assessment_id')
  and question_code = 'financial_profile.age'
  and response_order = 2;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000002', true);
select lives_ok(
    format('select * from public.create_hfos_measurement_run(%L,%L,%L,%L)', 'd2000000-0000-4000-8000-000000000001', (select value from phase_c4_test_state where key = 'assessment_id'), 'Changed revision capture', 'phase-c4-run-003'),
    'changed current revision creates a new run'
);
reset role;
select is((select response_order from public.hfos_measurement_inputs where measurement_run_id = (select id from public.hfos_measurement_runs where idempotency_key = 'phase-c4-run-003') and question_key = 'financial_profile.age'), 1, 'soft-deleted latest revision is excluded');
select isnt((select input_hash from public.hfos_measurement_runs where idempotency_key = 'phase-c4-run-003'), (select value from phase_c4_test_state where key = 'first_input_hash'), 'changed current revision changes input hash');

-- Technical immutability and prior-boundary regressions: 34 assertions.
select throws_ok($$update public.hfos_measurement_runs set execution_reason = 'mutated' where idempotency_key = 'phase-c4-run-001'$$, 'P1001', 'HFOS measurement snapshots are immutable.', 'run update rejected');
select throws_ok(format('delete from public.hfos_measurement_runs where id = %L', (select value from phase_c4_test_state where key = 'first_run_id')), 'P1001', 'HFOS measurement snapshots are immutable.', 'run delete rejected');
select throws_ok(format('update public.hfos_measurement_inputs set verified = true where measurement_run_id = %L', (select value from phase_c4_test_state where key = 'first_run_id')), 'P1001', 'HFOS measurement snapshots are immutable.', 'input update rejected');
select throws_ok(format('delete from public.hfos_measurement_inputs where measurement_run_id = %L', (select value from phase_c4_test_state where key = 'first_run_id')), 'P1001', 'HFOS measurement snapshots are immutable.', 'input delete rejected');
select throws_ok($$update public.hfos_measurement_audit_log set metadata = '{}'::jsonb where event_type = 'measurement_run_captured'$$, 'P1001', 'HFOS measurement snapshots are immutable.', 'audit update rejected');
select throws_ok($$delete from public.hfos_measurement_audit_log where event_type = 'measurement_run_captured'$$, 'P1001', 'HFOS measurement snapshots are immutable.', 'audit delete rejected');

insert into public.hfos_measurement_values(measurement_run_id, measurement_key, measurement_version, value_type, text_value)
values ((select value::uuid from phase_c4_test_state where key = 'second_run_id'), 'reserved.test', 'test-only', 'text', 'reserved');
select throws_ok($$update public.hfos_measurement_values set text_value = 'mutated' where measurement_key = 'reserved.test'$$, 'P1001', 'HFOS measurement snapshots are immutable.', 'reserved value update rejected');
select throws_ok($$delete from public.hfos_measurement_values where measurement_key = 'reserved.test'$$, 'P1001', 'HFOS measurement snapshots are immutable.', 'reserved value delete rejected');

select ok(not has_table_privilege('authenticated', table_name, privilege), table_name || ' participant direct ' || privilege || ' denied')
from unnest(array[
    'public.hfos_measurement_runs', 'public.hfos_measurement_inputs',
    'public.hfos_measurement_values', 'public.hfos_current_measurement_runs',
    'public.hfos_measurement_audit_log'
]) table_name
cross join unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE']) privilege;

select ok(not has_function_privilege('anon', function_name, 'EXECUTE'), 'anon denial preserved for ' || function_name)
from unnest(array[
    'public.get_current_participant()',
    'public.get_current_participant_profile()',
    'public.get_current_participant_assessment()'
]) function_name;
select ok(has_function_privilege('authenticated', function_name, 'EXECUTE'), 'participant grant preserved for ' || function_name)
from unnest(array[
    'public.get_current_participant()',
    'public.get_current_participant_profile()',
    'public.get_current_participant_assessment()'
]) function_name;

select * from finish();
rollback;
