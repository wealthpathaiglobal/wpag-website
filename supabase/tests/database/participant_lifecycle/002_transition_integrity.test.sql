begin;

create extension if not exists pgtap with schema extensions;

set local search_path = public, extensions, pg_catalog;

select plan(62);

insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
)
values (
    '00000000-0000-0000-0000-000000000000'::uuid,
    '00000000-0000-4000-8000-000000000002'::uuid,
    'authenticated',
    'authenticated',
    'lifecycle-integrity-actor@wpag.test',
    '',
    '2026-01-01 00:00:00+00'::timestamptz,
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    '2026-01-01 00:00:00+00'::timestamptz,
    '2026-01-01 00:00:00+00'::timestamptz
);

insert into public.participants (
    id,
    participant_code,
    lifecycle_status,
    research_status,
    enrollment_date,
    completion_date,
    withdrawal_date,
    withdrawal_reason,
    created_at,
    updated_at,
    deleted_at,
    created_by,
    updated_by
)
values
    (
        '20000000-0000-4000-8000-000000000001',
        'WPAG-910001',
        'pending_enrollment',
        'not_enrolled',
        null,
        null,
        null,
        null,
        '2026-01-01 00:00:00+00',
        '2026-01-01 00:00:00+00',
        null,
        '00000000-0000-4000-8000-000000000002',
        null
    ),
    (
        '20000000-0000-4000-8000-000000000002',
        'WPAG-910002',
        'pending_enrollment',
        'not_enrolled',
        null,
        null,
        null,
        null,
        '2026-01-01 00:00:00+00',
        '2026-01-01 00:00:00+00',
        null,
        '00000000-0000-4000-8000-000000000002',
        null
    ),
    (
        '20000000-0000-4000-8000-000000000003',
        'WPAG-910003',
        'paused',
        'not_enrolled',
        '2025-01-03',
        null,
        null,
        null,
        '2026-01-01 00:00:00+00',
        '2026-01-01 00:00:00+00',
        null,
        '00000000-0000-4000-8000-000000000002',
        null
    ),
    (
        '20000000-0000-4000-8000-000000000004',
        'WPAG-910004',
        'active',
        'not_enrolled',
        '2025-02-04',
        null,
        null,
        null,
        '2026-01-01 00:00:00+00',
        '2026-01-01 00:00:00+00',
        null,
        '00000000-0000-4000-8000-000000000002',
        null
    ),
    (
        '20000000-0000-4000-8000-000000000005',
        'WPAG-910005',
        'active',
        'not_enrolled',
        '2025-03-05',
        null,
        null,
        null,
        '2026-01-01 00:00:00+00',
        '2026-01-01 00:00:00+00',
        null,
        '00000000-0000-4000-8000-000000000002',
        null
    ),
    (
        '20000000-0000-4000-8000-000000000006',
        'WPAG-910006',
        'completed',
        'not_enrolled',
        '2025-04-06',
        '2025-05-06',
        null,
        null,
        '2026-01-01 00:00:00+00',
        '2026-01-01 00:00:00+00',
        null,
        '00000000-0000-4000-8000-000000000002',
        null
    ),
    (
        '20000000-0000-4000-8000-000000000007',
        'WPAG-910007',
        'withdrawn',
        'not_enrolled',
        '2025-06-07',
        null,
        '2025-07-07',
        'Fixture withdrawal reason.',
        '2026-01-01 00:00:00+00',
        '2026-01-01 00:00:00+00',
        null,
        '00000000-0000-4000-8000-000000000002',
        null
    ),
    (
        '20000000-0000-4000-8000-000000000008',
        'WPAG-910008',
        'active',
        'not_enrolled',
        '2025-08-08',
        null,
        null,
        null,
        '2026-01-01 00:00:00+00',
        '2026-01-01 00:00:00+00',
        '2026-01-02 00:00:00+00',
        '00000000-0000-4000-8000-000000000002',
        null
    ),
    (
        '20000000-0000-4000-8000-000000000009',
        'WPAG-910009',
        'active',
        'not_enrolled',
        '2025-09-09',
        null,
        null,
        null,
        '2026-01-01 00:00:00+00',
        '2026-01-01 00:00:00+00',
        null,
        '00000000-0000-4000-8000-000000000002',
        null
    ),
    (
        '20000000-0000-4000-8000-000000000010',
        'WPAG-910010',
        'active',
        'not_enrolled',
        '2025-10-10',
        null,
        null,
        null,
        '2026-01-01 00:00:00+00',
        '2026-01-01 00:00:00+00',
        null,
        '00000000-0000-4000-8000-000000000002',
        null
    ),
    (
        '20000000-0000-4000-8000-000000000011',
        'WPAG-910011',
        'active',
        'not_enrolled',
        '2025-11-11',
        null,
        null,
        null,
        '2026-01-01 00:00:00+00',
        '2026-01-01 00:00:00+00',
        null,
        '00000000-0000-4000-8000-000000000002',
        null
    ),
    (
        '20000000-0000-4000-8000-000000000012',
        'WPAG-910012',
        'pending_enrollment',
        'not_enrolled',
        null,
        null,
        null,
        null,
        '2026-01-01 00:00:00+00',
        '2026-01-01 00:00:00+00',
        null,
        '00000000-0000-4000-8000-000000000002',
        null
    ),
    (
        '20000000-0000-4000-8000-000000000013',
        'WPAG-910013',
        'pending_enrollment',
        'not_enrolled',
        null,
        null,
        null,
        null,
        '2026-01-01 00:00:00+00',
        '2026-01-01 00:00:00+00',
        null,
        '00000000-0000-4000-8000-000000000002',
        null
    ),
    (
        '20000000-0000-4000-8000-000000000014',
        'WPAG-910014',
        'active',
        'not_enrolled',
        '2025-12-14',
        null,
        null,
        null,
        '2026-01-01 00:00:00+00',
        '2026-01-01 00:00:00+00',
        null,
        '00000000-0000-4000-8000-000000000002',
        null
    );

-- Scenario 1: successful transition history, metadata, and actor propagation.
set local role service_role;

select lives_ok(
    $statement$
    select public.transition_participant_lifecycle(
        '20000000-0000-4000-8000-000000000001'::uuid,
        'active'::text,
        '00000000-0000-4000-8000-000000000002'::uuid,
        '  Institutional enrollment approved.  '::text,
        '{"source":"integrity-test","approval":{"level":2},"tags":["lifecycle","audit"]}'::jsonb
    )
    $statement$,
    'successful transition: function call succeeds'
);

reset role;

select is(
    (
        select lifecycle_status
        from public.participants
        where id = '20000000-0000-4000-8000-000000000001'
    ),
    'active',
    'successful transition: participant status is updated'
);

select is(
    (
        select count(*)
        from public.participant_lifecycle_history
        where participant_id = '20000000-0000-4000-8000-000000000001'
    ),
    1::bigint,
    'successful transition: exactly one history row is inserted'
);

select is(
    (
        select participant_id::text
        from public.participant_lifecycle_history
        where participant_id = '20000000-0000-4000-8000-000000000001'
    ),
    '20000000-0000-4000-8000-000000000001',
    'successful transition: history participant ID is correct'
);

select is(
    (
        select from_status
        from public.participant_lifecycle_history
        where participant_id = '20000000-0000-4000-8000-000000000001'
    ),
    'pending_enrollment',
    'successful transition: history source status is correct'
);

select is(
    (
        select to_status
        from public.participant_lifecycle_history
        where participant_id = '20000000-0000-4000-8000-000000000001'
    ),
    'active',
    'successful transition: history target status is correct'
);

select is(
    (
        select changed_by::text
        from public.participant_lifecycle_history
        where participant_id = '20000000-0000-4000-8000-000000000001'
    ),
    '00000000-0000-4000-8000-000000000002',
    'successful transition: history actor is correct'
);

select ok(
    (
        select changed_at is not null
        from public.participant_lifecycle_history
        where participant_id = '20000000-0000-4000-8000-000000000001'
    ),
    'successful transition: history timestamp is populated'
);

select ok(
    (
        select changed_at >= transaction_timestamp()
            and changed_at <= clock_timestamp()
        from public.participant_lifecycle_history
        where participant_id = '20000000-0000-4000-8000-000000000001'
    ),
    'successful transition: history timestamp falls within the test transaction'
);

select is(
    (
        select transition_reason
        from public.participant_lifecycle_history
        where participant_id = '20000000-0000-4000-8000-000000000001'
    ),
    'Institutional enrollment approved.',
    'successful transition: history reason is trimmed'
);

select is(
    (
        select metadata
        from public.participant_lifecycle_history
        where participant_id = '20000000-0000-4000-8000-000000000001'
    ),
    '{"source":"integrity-test","approval":{"level":2},"tags":["lifecycle","audit"]}'::jsonb,
    'successful transition: history metadata is preserved exactly'
);

select is(
    (
        select updated_by::text
        from public.participants
        where id = '20000000-0000-4000-8000-000000000001'
    ),
    '00000000-0000-4000-8000-000000000002',
    'successful transition: participant updater is the actor'
);

-- Scenario 2: initial activation sets enrollment_date.
set local role service_role;

select lives_ok(
    $statement$
    select public.transition_participant_lifecycle(
        '20000000-0000-4000-8000-000000000002'::uuid,
        'active'::text,
        '00000000-0000-4000-8000-000000000002'::uuid,
        'Enrollment date test.'::text,
        '{}'::jsonb
    )
    $statement$,
    'initial activation: function call succeeds'
);

reset role;

select ok(
    (
        select enrollment_date is not null
        from public.participants
        where id = '20000000-0000-4000-8000-000000000002'
    ),
    'initial activation: enrollment date is populated'
);

select is(
    (
        select enrollment_date
        from public.participants
        where id = '20000000-0000-4000-8000-000000000002'
    ),
    current_date,
    'initial activation: enrollment date is set to the transition date'
);

-- Scenario 3: reactivation preserves the original enrollment_date.
set local role service_role;

select lives_ok(
    $statement$
    select public.transition_participant_lifecycle(
        '20000000-0000-4000-8000-000000000003'::uuid,
        'active'::text,
        '00000000-0000-4000-8000-000000000002'::uuid,
        'Resume participation.'::text,
        '{}'::jsonb
    )
    $statement$,
    'reactivation: function call succeeds'
);

reset role;

select is(
    (
        select lifecycle_status
        from public.participants
        where id = '20000000-0000-4000-8000-000000000003'
    ),
    'active',
    'reactivation: participant becomes active'
);

select is(
    (
        select enrollment_date
        from public.participants
        where id = '20000000-0000-4000-8000-000000000003'
    ),
    '2025-01-03'::date,
    'reactivation: original enrollment date is preserved'
);

-- Scenario 4: completion sets completion_date and preserves enrollment_date.
set local role service_role;

select lives_ok(
    $statement$
    select public.transition_participant_lifecycle(
        '20000000-0000-4000-8000-000000000004'::uuid,
        'completed'::text,
        '00000000-0000-4000-8000-000000000002'::uuid,
        'Participation completed.'::text,
        '{}'::jsonb
    )
    $statement$,
    'completion: function call succeeds'
);

reset role;

select is(
    (
        select lifecycle_status
        from public.participants
        where id = '20000000-0000-4000-8000-000000000004'
    ),
    'completed',
    'completion: participant becomes completed'
);

select ok(
    (
        select completion_date is not null
        from public.participants
        where id = '20000000-0000-4000-8000-000000000004'
    ),
    'completion: completion date is populated'
);

select is(
    (
        select enrollment_date
        from public.participants
        where id = '20000000-0000-4000-8000-000000000004'
    ),
    '2025-02-04'::date,
    'completion: enrollment date is preserved'
);

-- Scenario 5: withdrawal records its date and normalized reason.
set local role service_role;

select lives_ok(
    $statement$
    select public.transition_participant_lifecycle(
        '20000000-0000-4000-8000-000000000005'::uuid,
        'withdrawn'::text,
        '00000000-0000-4000-8000-000000000002'::uuid,
        '  Participant requested withdrawal.  '::text,
        '{}'::jsonb
    )
    $statement$,
    'withdrawal: function call succeeds'
);

reset role;

select is(
    (
        select lifecycle_status
        from public.participants
        where id = '20000000-0000-4000-8000-000000000005'
    ),
    'withdrawn',
    'withdrawal: participant becomes withdrawn'
);

select ok(
    (
        select withdrawal_date is not null
        from public.participants
        where id = '20000000-0000-4000-8000-000000000005'
    ),
    'withdrawal: withdrawal date is populated'
);

select is(
    (
        select withdrawal_reason
        from public.participants
        where id = '20000000-0000-4000-8000-000000000005'
    ),
    'Participant requested withdrawal.',
    'withdrawal: participant reason is trimmed'
);

select is(
    (
        select transition_reason
        from public.participant_lifecycle_history
        where participant_id = '20000000-0000-4000-8000-000000000005'
    ),
    'Participant requested withdrawal.',
    'withdrawal: history reason is trimmed'
);

select is(
    (
        select enrollment_date
        from public.participants
        where id = '20000000-0000-4000-8000-000000000005'
    ),
    '2025-03-05'::date,
    'withdrawal: enrollment date is preserved'
);

-- Scenario 6: completed participants retain dates when archived.
set local role service_role;

select lives_ok(
    $statement$
    select public.transition_participant_lifecycle(
        '20000000-0000-4000-8000-000000000006'::uuid,
        'archived'::text,
        '00000000-0000-4000-8000-000000000002'::uuid,
        'Archive completed participant.'::text,
        '{}'::jsonb
    )
    $statement$,
    'completed archive: function call succeeds'
);

reset role;

select is(
    (
        select lifecycle_status
        from public.participants
        where id = '20000000-0000-4000-8000-000000000006'
    ),
    'archived',
    'completed archive: participant becomes archived'
);

select is(
    (
        select completion_date
        from public.participants
        where id = '20000000-0000-4000-8000-000000000006'
    ),
    '2025-05-06'::date,
    'completed archive: completion date is preserved'
);

select is(
    (
        select enrollment_date
        from public.participants
        where id = '20000000-0000-4000-8000-000000000006'
    ),
    '2025-04-06'::date,
    'completed archive: enrollment date is preserved'
);

select is(
    (
        select count(*)
        from public.participant_lifecycle_history
        where participant_id = '20000000-0000-4000-8000-000000000006'
          and to_status = 'archived'
    ),
    1::bigint,
    'completed archive: exactly one archive history row is inserted'
);

-- Scenario 7: withdrawn participants retain dates when archived.
set local role service_role;

select lives_ok(
    $statement$
    select public.transition_participant_lifecycle(
        '20000000-0000-4000-8000-000000000007'::uuid,
        'archived'::text,
        '00000000-0000-4000-8000-000000000002'::uuid,
        'Archive withdrawn participant.'::text,
        '{}'::jsonb
    )
    $statement$,
    'withdrawn archive: function call succeeds'
);

reset role;

select is(
    (
        select lifecycle_status
        from public.participants
        where id = '20000000-0000-4000-8000-000000000007'
    ),
    'archived',
    'withdrawn archive: participant becomes archived'
);

select is(
    (
        select withdrawal_date
        from public.participants
        where id = '20000000-0000-4000-8000-000000000007'
    ),
    '2025-07-07'::date,
    'withdrawn archive: withdrawal date is preserved'
);

select is(
    (
        select enrollment_date
        from public.participants
        where id = '20000000-0000-4000-8000-000000000007'
    ),
    '2025-06-07'::date,
    'withdrawn archive: enrollment date is preserved'
);

select is(
    (
        select count(*)
        from public.participant_lifecycle_history
        where participant_id = '20000000-0000-4000-8000-000000000007'
          and to_status = 'archived'
    ),
    1::bigint,
    'withdrawn archive: exactly one archive history row is inserted'
);

-- Scenario 8: deleted participants cannot transition.
set local role service_role;

select throws_like(
    $statement$
    select public.transition_participant_lifecycle(
        '20000000-0000-4000-8000-000000000008'::uuid,
        'paused'::text,
        '00000000-0000-4000-8000-000000000002'::uuid,
        'Attempt deleted transition.'::text,
        '{}'::jsonb
    )
    $statement$,
    'Deleted participants cannot transition.',
    'deleted participant: correct lifecycle exception is raised'
);

reset role;

select is(
    (
        select lifecycle_status
        from public.participants
        where id = '20000000-0000-4000-8000-000000000008'
    ),
    'active',
    'deleted participant: status remains unchanged'
);

select is(
    (
        select count(*)
        from public.participant_lifecycle_history
        where participant_id = '20000000-0000-4000-8000-000000000008'
    ),
    0::bigint,
    'deleted participant: no history row is inserted'
);

-- Scenarios 9-11: null, empty, and whitespace-only withdrawal reasons fail.
set local role service_role;

select throws_like(
    $statement$
    select public.transition_participant_lifecycle(
        '20000000-0000-4000-8000-000000000009'::uuid,
        'withdrawn'::text,
        '00000000-0000-4000-8000-000000000002'::uuid,
        null::text,
        '{}'::jsonb
    )
    $statement$,
    'Withdrawal reason is required.',
    'null withdrawal reason: correct lifecycle exception is raised'
);

select throws_like(
    $statement$
    select public.transition_participant_lifecycle(
        '20000000-0000-4000-8000-000000000010'::uuid,
        'withdrawn'::text,
        '00000000-0000-4000-8000-000000000002'::uuid,
        ''::text,
        '{}'::jsonb
    )
    $statement$,
    'Withdrawal reason is required.',
    'empty withdrawal reason: correct lifecycle exception is raised'
);

select throws_like(
    $statement$
    select public.transition_participant_lifecycle(
        '20000000-0000-4000-8000-000000000011'::uuid,
        'withdrawn'::text,
        '00000000-0000-4000-8000-000000000002'::uuid,
        '   '::text,
        '{}'::jsonb
    )
    $statement$,
    'Withdrawal reason is required.',
    'whitespace withdrawal reason: correct lifecycle exception is raised'
);

reset role;

select is(
    (
        select lifecycle_status
        from public.participants
        where id = '20000000-0000-4000-8000-000000000009'
    ),
    'active',
    'null withdrawal reason: status remains unchanged'
);

select is(
    (
        select count(*)
        from public.participant_lifecycle_history
        where participant_id = '20000000-0000-4000-8000-000000000009'
    ),
    0::bigint,
    'null withdrawal reason: no history row is inserted'
);

select is(
    (
        select lifecycle_status
        from public.participants
        where id = '20000000-0000-4000-8000-000000000010'
    ),
    'active',
    'empty withdrawal reason: status remains unchanged'
);

select is(
    (
        select count(*)
        from public.participant_lifecycle_history
        where participant_id = '20000000-0000-4000-8000-000000000010'
    ),
    0::bigint,
    'empty withdrawal reason: no history row is inserted'
);

select is(
    (
        select lifecycle_status
        from public.participants
        where id = '20000000-0000-4000-8000-000000000011'
    ),
    'active',
    'whitespace withdrawal reason: status remains unchanged'
);

select is(
    (
        select count(*)
        from public.participant_lifecycle_history
        where participant_id = '20000000-0000-4000-8000-000000000011'
    ),
    0::bigint,
    'whitespace withdrawal reason: no history row is inserted'
);

-- Scenario 12: an invalid transition changes no lifecycle state.
set local role service_role;

select throws_like(
    $statement$
    select public.transition_participant_lifecycle(
        '20000000-0000-4000-8000-000000000012'::uuid,
        'archived'::text,
        '00000000-0000-4000-8000-000000000002'::uuid,
        'Attempt invalid archive.'::text,
        '{}'::jsonb
    )
    $statement$,
    'Invalid lifecycle transition:%',
    'invalid transition: correct lifecycle exception is raised'
);

reset role;

select is(
    (
        select lifecycle_status
        from public.participants
        where id = '20000000-0000-4000-8000-000000000012'
    ),
    'pending_enrollment',
    'invalid transition: status remains unchanged'
);

select is(
    (
        select jsonb_build_object(
            'enrollment_date', enrollment_date,
            'completion_date', completion_date,
            'withdrawal_date', withdrawal_date
        )
        from public.participants
        where id = '20000000-0000-4000-8000-000000000012'
    ),
    '{"enrollment_date":null,"completion_date":null,"withdrawal_date":null}'::jsonb,
    'invalid transition: lifecycle dates remain unchanged'
);

select is(
    (
        select count(*)
        from public.participant_lifecycle_history
        where participant_id = '20000000-0000-4000-8000-000000000012'
    ),
    0::bigint,
    'invalid transition: no history row is inserted'
);

-- Scenario 13: a forced history failure rolls back the participant update.
create function pg_temp.reject_lifecycle_history_insert()
returns trigger
language plpgsql
as $$
begin
    raise exception 'Forced lifecycle history failure.';
end;
$$;

create trigger trg_test_reject_lifecycle_history_insert
before insert on public.participant_lifecycle_history
for each row
execute function pg_temp.reject_lifecycle_history_insert();

set local role service_role;

select throws_like(
    $statement$
    select public.transition_participant_lifecycle(
        '20000000-0000-4000-8000-000000000013'::uuid,
        'active'::text,
        '00000000-0000-4000-8000-000000000002'::uuid,
        'Otherwise valid enrollment.'::text,
        '{}'::jsonb
    )
    $statement$,
    'Forced lifecycle history failure.',
    'forced history failure: deterministic trigger exception is raised'
);

reset role;

select is(
    (
        select lifecycle_status
        from public.participants
        where id = '20000000-0000-4000-8000-000000000013'
    ),
    'pending_enrollment',
    'forced history failure: participant status is rolled back'
);

select is(
    (
        select enrollment_date
        from public.participants
        where id = '20000000-0000-4000-8000-000000000013'
    ),
    null::date,
    'forced history failure: lifecycle date change is rolled back'
);

select is(
    (
        select updated_by::text
        from public.participants
        where id = '20000000-0000-4000-8000-000000000013'
    ),
    null::text,
    'forced history failure: participant updater is rolled back'
);

select is(
    (
        select count(*)
        from public.participant_lifecycle_history
        where participant_id = '20000000-0000-4000-8000-000000000013'
    ),
    0::bigint,
    'forced history failure: no history row is inserted'
);

drop trigger trg_test_reject_lifecycle_history_insert
on public.participant_lifecycle_history;

drop function pg_temp.reject_lifecycle_history_insert();

-- Scenario 14: a same-state rejection changes no participant fields.
create temporary table participant_integrity_snapshots (
    participant_id uuid primary key,
    participant_record jsonb not null
) on commit drop;

insert into participant_integrity_snapshots (
    participant_id,
    participant_record
)
select
    id,
    to_jsonb(participants)
from public.participants
where id = '20000000-0000-4000-8000-000000000014';

set local role service_role;

select throws_like(
    $statement$
    select public.transition_participant_lifecycle(
        '20000000-0000-4000-8000-000000000014'::uuid,
        'active'::text,
        '00000000-0000-4000-8000-000000000002'::uuid,
        'Attempt duplicate active state.'::text,
        '{}'::jsonb
    )
    $statement$,
    'Participant already has lifecycle status:%',
    'same-state transition: correct lifecycle exception is raised'
);

reset role;

select is(
    (
        select to_jsonb(participants)
        from public.participants
        where id = '20000000-0000-4000-8000-000000000014'
    ),
    (
        select participant_record
        from participant_integrity_snapshots
        where participant_id = '20000000-0000-4000-8000-000000000014'
    ),
    'same-state transition: no participant fields change'
);

select is(
    (
        select count(*)
        from public.participant_lifecycle_history
        where participant_id = '20000000-0000-4000-8000-000000000014'
    ),
    0::bigint,
    'same-state transition: no history row is inserted'
);

select * from finish();
rollback;
