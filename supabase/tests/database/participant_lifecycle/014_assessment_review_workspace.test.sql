begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;

select plan(89);

-- Catalog and permission posture: 27 assertions.
select ok(to_regprocedure(name) is not null, name || ' exists')
from unnest(array[
    'public.list_assessment_reviews(uuid)',
    'public.get_assessment_review(uuid,uuid)',
    'public.transition_assessment_review(uuid,uuid,text,text,text)'
]) name;

select ok(
    (select prosecdef from pg_proc where oid = to_regprocedure(name)),
    name || ' is security definer'
)
from unnest(array[
    'public.list_assessment_reviews(uuid)',
    'public.get_assessment_review(uuid,uuid)',
    'public.transition_assessment_review(uuid,uuid,text,text,text)'
]) name;

select is(
    (select pg_get_userbyid(proowner) from pg_proc where oid = to_regprocedure(name)),
    'postgres',
    name || ' owner is postgres'
)
from unnest(array[
    'public.list_assessment_reviews(uuid)',
    'public.get_assessment_review(uuid,uuid)',
    'public.transition_assessment_review(uuid,uuid,text,text,text)'
]) name;

select ok(
    (select proconfig @> array['search_path=public, pg_catalog'] from pg_proc where oid = to_regprocedure(name)),
    name || ' search path controlled'
)
from unnest(array[
    'public.list_assessment_reviews(uuid)',
    'public.get_assessment_review(uuid,uuid)',
    'public.transition_assessment_review(uuid,uuid,text,text,text)'
]) name;

select ok(has_function_privilege('service_role', name, 'EXECUTE'), name || ' service role granted')
from unnest(array[
    'public.list_assessment_reviews(uuid)',
    'public.get_assessment_review(uuid,uuid)',
    'public.transition_assessment_review(uuid,uuid,text,text,text)'
]) name;

select ok(
    not has_function_privilege(role_name, function_name, 'EXECUTE'),
    role_name || ' denied ' || function_name
)
from unnest(array['public', 'anon', 'authenticated']) role_name
cross join unnest(array[
    'public.list_assessment_reviews(uuid)',
    'public.get_assessment_review(uuid,uuid)',
    'public.transition_assessment_review(uuid,uuid,text,text,text)'
]) function_name;

select ok(
    pg_get_function_result(to_regprocedure(name)) !~* '(formula|score|diagnosis)',
    name || ' exposes no formula, score, or diagnosis field'
)
from unnest(array[
    'public.list_assessment_reviews(uuid)',
    'public.get_assessment_review(uuid,uuid)',
    'public.transition_assessment_review(uuid,uuid,text,text,text)'
]) name;

-- Deterministic administrator and participant fixtures.
insert into auth.users(
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
    ('00000000-0000-0000-0000-000000000000', 'f1000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'review.admin@test.local', '', '2026-01-01', '{"provider":"email","providers":["email"]}', '{}', '2026-01-01', '2026-01-01'),
    ('00000000-0000-0000-0000-000000000000', 'f1000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'review.outsider@test.local', '', '2026-01-01', '{"provider":"email","providers":["email"]}', '{}', '2026-01-01', '2026-01-01'),
    ('00000000-0000-0000-0000-000000000000', 'f1000000-0000-4000-8000-000000000011', 'authenticated', 'authenticated', 'review.one@test.local', '', '2026-01-01', '{"provider":"email","providers":["email"]}', '{}', '2026-01-01', '2026-01-01'),
    ('00000000-0000-0000-0000-000000000000', 'f1000000-0000-4000-8000-000000000012', 'authenticated', 'authenticated', 'review.draft@test.local', '', '2026-01-01', '{"provider":"email","providers":["email"]}', '{}', '2026-01-01', '2026-01-01'),
    ('00000000-0000-0000-0000-000000000000', 'f1000000-0000-4000-8000-000000000013', 'authenticated', 'authenticated', 'review.info@test.local', '', '2026-01-01', '{"provider":"email","providers":["email"]}', '{}', '2026-01-01', '2026-01-01'),
    ('00000000-0000-0000-0000-000000000000', 'f1000000-0000-4000-8000-000000000014', 'authenticated', 'authenticated', 'review.reject@test.local', '', '2026-01-01', '{"provider":"email","providers":["email"]}', '{}', '2026-01-01', '2026-01-01'),
    ('00000000-0000-0000-0000-000000000000', 'f1000000-0000-4000-8000-000000000015', 'authenticated', 'authenticated', 'review.deleted@test.local', '', '2026-01-01', '{"provider":"email","providers":["email"]}', '{}', '2026-01-01', '2026-01-01');

insert into public.staff_members(id, staff_code, auth_user_id, full_name, email, status, created_at)
values (
    'f2000000-0000-4000-8000-000000000001',
    'WPAG-STF-990001',
    'f1000000-0000-4000-8000-000000000001',
    'Assessment Administrator',
    'review.admin@test.local',
    'active',
    '2026-01-01'
);

insert into public.staff_member_roles(id, staff_member_id, staff_role_id, assigned_by, created_at)
select
    'f2100000-0000-4000-8000-000000000001',
    'f2000000-0000-4000-8000-000000000001',
    id,
    'f1000000-0000-4000-8000-000000000001',
    '2026-01-01'
from public.staff_roles
where role_code = 'administrator';

insert into public.participants(
    id, participant_code, auth_user_id, lifecycle_status, created_at, deleted_at
)
values
    ('f3000000-0000-4000-8000-000000000001', 'WPAG-993001', 'f1000000-0000-4000-8000-000000000011', 'active', '2026-01-01', null),
    ('f3000000-0000-4000-8000-000000000002', 'WPAG-993002', 'f1000000-0000-4000-8000-000000000012', 'active', '2026-01-01', null),
    ('f3000000-0000-4000-8000-000000000003', 'WPAG-993003', 'f1000000-0000-4000-8000-000000000013', 'active', '2026-01-01', null),
    ('f3000000-0000-4000-8000-000000000004', 'WPAG-993004', 'f1000000-0000-4000-8000-000000000014', 'active', '2026-01-01', null),
    ('f3000000-0000-4000-8000-000000000005', 'WPAG-993005', 'f1000000-0000-4000-8000-000000000015', 'active', '2026-01-01', '2026-02-01');

insert into public.participant_profiles(
    id, participant_id, auth_user_id, first_name, last_name, email,
    country_code, household_size, dependents, created_at
)
values
    ('f4000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000011', 'Review', 'One', 'review.one@test.local', 'IN', 2, 0, '2026-01-01'),
    ('f4000000-0000-4000-8000-000000000002', 'f3000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000012', 'Draft', 'Participant', 'review.draft@test.local', 'IN', 2, 0, '2026-01-01'),
    ('f4000000-0000-4000-8000-000000000003', 'f3000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000013', 'Information', 'Participant', 'review.info@test.local', 'IN', 2, 0, '2026-01-01'),
    ('f4000000-0000-4000-8000-000000000004', 'f3000000-0000-4000-8000-000000000004', 'f1000000-0000-4000-8000-000000000014', 'Reject', 'Participant', 'review.reject@test.local', 'IN', 2, 0, '2026-01-01'),
    ('f4000000-0000-4000-8000-000000000005', 'f3000000-0000-4000-8000-000000000005', 'f1000000-0000-4000-8000-000000000015', 'Deleted', 'Participant', 'review.deleted@test.local', 'IN', 2, 0, '2026-01-01');

insert into public.assessment_sessions(
    id, participant_id, assessment_number, assessment_type, assessment_version,
    status, current_stage, started_at, submitted_at, created_at
)
values
    ('f5000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', 1, 'initial', '1.0', 'submitted', 'assessment_processing', '2026-01-02', '2026-01-03', '2026-01-02'),
    ('f5000000-0000-4000-8000-000000000002', 'f3000000-0000-4000-8000-000000000002', 1, 'initial', '1.0', 'draft', 'financial_data_collection', '2026-01-02', null, '2026-01-02'),
    ('f5000000-0000-4000-8000-000000000003', 'f3000000-0000-4000-8000-000000000003', 1, 'initial', '1.0', 'submitted', 'assessment_processing', '2026-01-02', '2026-01-04', '2026-01-02'),
    ('f5000000-0000-4000-8000-000000000004', 'f3000000-0000-4000-8000-000000000004', 1, 'initial', '1.0', 'submitted', 'assessment_processing', '2026-01-02', '2026-01-05', '2026-01-02'),
    ('f5000000-0000-4000-8000-000000000005', 'f3000000-0000-4000-8000-000000000005', 1, 'initial', '1.0', 'submitted', 'assessment_processing', '2026-01-02', '2026-01-06', '2026-01-02');

insert into public.assessments(
    id, participant_id, assessment_session_id, assessment_number,
    assessment_version, hfos_version, assessment_date, currency_code,
    country_code, household_size, dependents, created_at
)
values
    ('f6000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', 'f5000000-0000-4000-8000-000000000001', 1, '1.0', 'phase-1-draft', '2026-01-03', 'INR', 'IN', 2, 0, '2026-01-02'),
    ('f6000000-0000-4000-8000-000000000002', 'f3000000-0000-4000-8000-000000000002', 'f5000000-0000-4000-8000-000000000002', 1, '1.0', 'phase-1-draft', '2026-01-03', 'INR', 'IN', 2, 0, '2026-01-02'),
    ('f6000000-0000-4000-8000-000000000003', 'f3000000-0000-4000-8000-000000000003', 'f5000000-0000-4000-8000-000000000003', 1, '1.0', 'phase-1-draft', '2026-01-04', 'INR', 'IN', 2, 0, '2026-01-02'),
    ('f6000000-0000-4000-8000-000000000004', 'f3000000-0000-4000-8000-000000000004', 'f5000000-0000-4000-8000-000000000004', 1, '1.0', 'phase-1-draft', '2026-01-05', 'INR', 'IN', 2, 0, '2026-01-02'),
    ('f6000000-0000-4000-8000-000000000005', 'f3000000-0000-4000-8000-000000000005', 'f5000000-0000-4000-8000-000000000005', 1, '1.0', 'phase-1-draft', '2026-01-06', 'INR', 'IN', 2, 0, '2026-01-02');

insert into public.assessment_module_statuses(
    assessment_session_id, assessment_id, module_key, status,
    answered_required_count, required_count, completed_at
)
select
    'f5000000-0000-4000-8000-000000000001',
    'f6000000-0000-4000-8000-000000000001',
    module_key,
    'complete',
    1,
    1,
    '2026-01-03'
from unnest(array[
    'financial_profile', 'cash_flow', 'debt_obligations',
    'stability_margin', 'protection_risk', 'goals_planning'
]) module_key;

insert into public.assessment_answers(
    id, assessment_id, question_code, section_code, response_order,
    answer_type, answer_text, is_answered, source, created_at
)
values
    ('f7000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001', 'financial_profile.full_name', 'financial_profile', 1, 'text', 'Earlier Name', true, 'participant', '2026-01-02'),
    ('f7000000-0000-4000-8000-000000000002', 'f6000000-0000-4000-8000-000000000001', 'financial_profile.full_name', 'financial_profile', 2, 'text', 'Current Name', true, 'participant', '2026-01-03'),
    ('f7000000-0000-4000-8000-000000000003', 'f6000000-0000-4000-8000-000000000001', 'cash_flow.currency', 'cash_flow', 1, 'text', 'INR', true, 'participant', '2026-01-03');

insert into public.assessment_documents(
    id, assessment_id, document_category, document_type, document_name,
    original_filename, storage_bucket, storage_path, mime_type,
    file_size_bytes, checksum, verification_status, created_at
)
values (
    'f8000000-0000-4000-8000-000000000001',
    'f6000000-0000-4000-8000-000000000001',
    'income',
    'statement',
    'Income statement',
    'income.pdf',
    'private-assessment-evidence',
    'participants/private/income.pdf',
    'application/pdf',
    1024,
    repeat('a', 64),
    'pending',
    '2026-01-03'
);

-- Database-side authorization: 3 assertions.
select throws_ok(
    $$select * from public.list_assessment_reviews('f1000000-0000-4000-8000-000000000002')$$,
    'P1001',
    'Actor is not authorized to review assessments.',
    'unauthorized queue caller rejected'
);
select throws_ok(
    $$select * from public.get_assessment_review('f6000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000002')$$,
    'P1001',
    'Actor is not authorized to review assessments.',
    'unauthorized detail caller rejected'
);
select throws_ok(
    $$select * from public.transition_assessment_review('f6000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000002', 'start_review', null, null)$$,
    'P1001',
    'Actor is not authorized to review assessments.',
    'unauthorized transition caller rejected'
);

-- Queue projection and soft-delete filtering: 5 assertions.
select is(
    (select count(*) from public.list_assessment_reviews('f1000000-0000-4000-8000-000000000001')),
    3::bigint,
    'queue contains all and only submitted active assessments'
);
select ok(
    exists(select 1 from public.list_assessment_reviews('f1000000-0000-4000-8000-000000000001') where assessment_id = 'f6000000-0000-4000-8000-000000000001'),
    'submitted assessment listed'
);
select ok(
    not exists(select 1 from public.list_assessment_reviews('f1000000-0000-4000-8000-000000000001') where assessment_id = 'f6000000-0000-4000-8000-000000000002'),
    'non-submitted assessment excluded'
);
select ok(
    not exists(select 1 from public.list_assessment_reviews('f1000000-0000-4000-8000-000000000001') where assessment_id = 'f6000000-0000-4000-8000-000000000005'),
    'soft-deleted participant assessment excluded'
);
select ok(
    (select review_id is null and review_status is null from public.list_assessment_reviews('f1000000-0000-4000-8000-000000000001') where assessment_id = 'f6000000-0000-4000-8000-000000000001'),
    'assessment without review is projected without creating a review row'
);

-- Narrow detail projection: 7 assertions.
select is(
    (select participant_code from public.get_assessment_review('f6000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001')),
    'WPAG-993001',
    'detail includes participant identity'
);
select is(
    (select assessment_status from public.get_assessment_review('f6000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001')),
    'submitted',
    'detail is limited to submitted assessment'
);
select is(
    (select answers->'financial_profile'->'financial_profile.full_name'->>'value' from public.get_assessment_review('f6000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001')),
    'Current Name',
    'detail includes latest durable answer value'
);
select is(
    (select answers->'financial_profile'->'financial_profile.full_name'->>'response_order' from public.get_assessment_review('f6000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001')),
    '2',
    'detail excludes superseded answer revision'
);
select is(
    (select module_progress->'goals_planning'->>'status' from public.get_assessment_review('f6000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001')),
    'complete',
    'detail includes six-module progress'
);
select is(
    (select jsonb_array_length(documents) from public.get_assessment_review('f6000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001')),
    1,
    'detail includes safe assessment document metadata'
);
select ok(
    not (select documents from public.get_assessment_review('f6000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001'))::text ~* '(storage_bucket|storage_path|checksum)',
    'detail excludes private storage coordinates and checksum'
);

select throws_ok(
    $$select * from public.get_assessment_review('f6000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000001')$$,
    'P1001',
    'Only submitted assessments can be reviewed.',
    'non-submitted assessment detail rejected'
);
select throws_ok(
    $$select * from public.transition_assessment_review('f6000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000001', 'start_review', null, null)$$,
    'P1001',
    'Only submitted assessments can be reviewed.',
    'non-submitted assessment transition rejected'
);
select throws_ok(
    $$select * from public.get_assessment_review('f6000000-0000-4000-8000-000000000005', 'f1000000-0000-4000-8000-000000000001')$$,
    'P1001',
    'Assessment was not found.',
    'soft-deleted participant detail rejected'
);

-- Transition rules, attribution, idempotency protections, and audit: 40 assertions.
select throws_ok(
    $$select * from public.transition_assessment_review('f6000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000001', 'approve', null, null)$$,
    'P1001',
    'Assessment review has not been started.',
    'terminal transition requires started review'
);

select lives_ok(
    $$select * from public.transition_assessment_review('f6000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'start_review', null, null)$$,
    'start review succeeds'
);
select is((select review_status from public.assessment_reviews where assessment_id = 'f6000000-0000-4000-8000-000000000001'), 'in_review', 'start creates in-review state');
select is((select count(*) from public.assessment_reviews where assessment_id = 'f6000000-0000-4000-8000-000000000001' and deleted_at is null), 1::bigint, 'start creates exactly one active review');
select is((select reviewed_by from public.assessment_reviews where assessment_id = 'f6000000-0000-4000-8000-000000000001'), 'f1000000-0000-4000-8000-000000000001'::uuid, 'start preserves reviewer attribution');
select ok((select review_started_at is not null from public.assessment_reviews where assessment_id = 'f6000000-0000-4000-8000-000000000001'), 'start records review timestamp');
select is((select count(*) from public.assessment_audit_log where assessment_id = 'f6000000-0000-4000-8000-000000000001' and event_type = 'assessment_review_started'), 1::bigint, 'start writes audit event');
select throws_ok(
    $$select * from public.transition_assessment_review('f6000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'start_review', null, null)$$,
    'P1001',
    'Assessment review transition is not allowed.',
    'repeated start is rejected'
);

select throws_ok(
    $$select * from public.transition_assessment_review('f6000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'save_notes', '   ', null)$$,
    'P1001',
    'Reviewer notes are required.',
    'empty reviewer notes rejected'
);
select lives_ok(
    $$select * from public.transition_assessment_review('f6000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'save_notes', '  Evidence checked.  ', null)$$,
    'save notes succeeds'
);
select is((select review_notes from public.assessment_reviews where assessment_id = 'f6000000-0000-4000-8000-000000000001'), 'Evidence checked.', 'review notes normalized and persisted');
select is((select review_status from public.assessment_reviews where assessment_id = 'f6000000-0000-4000-8000-000000000001'), 'in_review', 'save notes preserves in-review state');
select is((select count(*) from public.assessment_audit_log where assessment_id = 'f6000000-0000-4000-8000-000000000001' and event_type = 'assessment_review_notes_saved'), 1::bigint, 'save notes writes audit event');

select lives_ok(
    $$select * from public.transition_assessment_review('f6000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000001', 'start_review', null, null)$$,
    'information-request review starts'
);
select throws_ok(
    $$select * from public.transition_assessment_review('f6000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000001', 'request_information', null, '  ')$$,
    'P1001',
    'Information request is required.',
    'request information requires content'
);
select lives_ok(
    $$select * from public.transition_assessment_review('f6000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000001', 'request_information', 'Awaiting support.', '  Upload the latest statement.  ')$$,
    'request information succeeds'
);
select is((select review_status from public.assessment_reviews where assessment_id = 'f6000000-0000-4000-8000-000000000003'), 'returned', 'information request returns assessment');
select is((select review_decision from public.assessment_reviews where assessment_id = 'f6000000-0000-4000-8000-000000000003'), 'needs_information', 'information request records canonical decision');
select is((select information_request from public.assessment_reviews where assessment_id = 'f6000000-0000-4000-8000-000000000003'), 'Upload the latest statement.', 'information request normalized and persisted');
select ok((select review_completed_at is not null from public.assessment_reviews where assessment_id = 'f6000000-0000-4000-8000-000000000003'), 'information request records completion timestamp');
select is((select reviewed_by from public.assessment_reviews where assessment_id = 'f6000000-0000-4000-8000-000000000003'), 'f1000000-0000-4000-8000-000000000001'::uuid, 'information request preserves reviewer attribution');
select is((select count(*) from public.assessment_audit_log where assessment_id = 'f6000000-0000-4000-8000-000000000003' and event_type = 'assessment_information_requested'), 1::bigint, 'information request writes audit event');

select lives_ok(
    $$select * from public.transition_assessment_review('f6000000-0000-4000-8000-000000000003', 'f1000000-0000-4000-8000-000000000001', 'start_review', null, null)$$,
    'returned review reopens'
);
select is((select review_status from public.assessment_reviews where assessment_id = 'f6000000-0000-4000-8000-000000000003'), 'in_review', 'reopened review returns to in-review state');
select is((select review_decision from public.assessment_reviews where assessment_id = 'f6000000-0000-4000-8000-000000000003'), null::text, 'reopened review clears decision');
select is((select review_completed_at from public.assessment_reviews where assessment_id = 'f6000000-0000-4000-8000-000000000003'), null::timestamptz, 'reopened review clears completion timestamp');
select is((select count(*) from public.assessment_reviews where assessment_id = 'f6000000-0000-4000-8000-000000000003' and deleted_at is null), 1::bigint, 'reopen preserves one active review');

select lives_ok(
    $$select * from public.transition_assessment_review('f6000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'approve', 'Assessment evidence is sufficient.', null)$$,
    'approve succeeds'
);
select is((select review_status from public.assessment_reviews where assessment_id = 'f6000000-0000-4000-8000-000000000001'), 'completed', 'approve completes review');
select is((select review_decision from public.assessment_reviews where assessment_id = 'f6000000-0000-4000-8000-000000000001'), 'approved', 'approve records canonical decision');
select ok((select review_completed_at is not null from public.assessment_reviews where assessment_id = 'f6000000-0000-4000-8000-000000000001'), 'approve records completion timestamp');
select is((select count(*) from public.assessment_audit_log where assessment_id = 'f6000000-0000-4000-8000-000000000001' and event_type = 'assessment_review_approved'), 1::bigint, 'approve writes audit event');
select throws_ok(
    $$select * from public.transition_assessment_review('f6000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001', 'approve', null, null)$$,
    'P1001',
    'Assessment review transition is not allowed.',
    'repeated terminal transition rejected'
);

select lives_ok(
    $$select * from public.transition_assessment_review('f6000000-0000-4000-8000-000000000004', 'f1000000-0000-4000-8000-000000000001', 'start_review', null, null)$$,
    'rejection review starts'
);
select throws_ok(
    $$select * from public.transition_assessment_review('f6000000-0000-4000-8000-000000000004', 'f1000000-0000-4000-8000-000000000001', 'reject', ' ', null)$$,
    'P1001',
    'A rejection rationale is required.',
    'reject requires meaningful rationale'
);
select lives_ok(
    $$select * from public.transition_assessment_review('f6000000-0000-4000-8000-000000000004', 'f1000000-0000-4000-8000-000000000001', 'reject', '  Submitted evidence is internally inconsistent.  ', null)$$,
    'reject succeeds'
);
select is((select review_status from public.assessment_reviews where assessment_id = 'f6000000-0000-4000-8000-000000000004'), 'completed', 'reject completes review');
select is((select review_decision from public.assessment_reviews where assessment_id = 'f6000000-0000-4000-8000-000000000004'), 'rejected', 'reject records canonical decision');
select is((select review_notes from public.assessment_reviews where assessment_id = 'f6000000-0000-4000-8000-000000000004'), 'Submitted evidence is internally inconsistent.', 'reject rationale normalized and persisted');
select is((select count(*) from public.assessment_audit_log where assessment_id = 'f6000000-0000-4000-8000-000000000004' and event_type = 'assessment_review_rejected'), 1::bigint, 'reject writes audit event');

select is(
    (select max(review_count) from (select assessment_id, count(*) review_count from public.assessment_reviews where deleted_at is null group by assessment_id) counts),
    1::bigint,
    'only one active review exists per assessment'
);

select ok(
    not has_table_privilege('service_role', 'public.assessment_reviews', privilege),
    'service role direct assessment review ' || privilege || ' denied'
)
from unnest(array['INSERT', 'UPDATE', 'DELETE']) privilege;

select * from finish();
rollback;
