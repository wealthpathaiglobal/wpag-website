begin;

create extension if not exists pgtap with schema extensions;

set local search_path = public, extensions, pg_catalog;

select plan(135);

-- One deterministic actor satisfies lifecycle-history and participant audit
-- foreign keys without introducing staff or application-domain fixtures.
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
    '00000000-0000-4000-8000-000000000001'::uuid,
    'authenticated',
    'authenticated',
    'lifecycle-matrix-actor@wpag.test',
    '',
    '2026-01-01 00:00:00+00'::timestamptz,
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    '2026-01-01 00:00:00+00'::timestamptz,
    '2026-01-01 00:00:00+00'::timestamptz
);

-- The service role owns the temporary test objects so calls exercise the
-- function through its repository-defined execution boundary without grants.
set local role service_role;

create temporary table transition_cases (
    case_number integer primary key,
    participant_id uuid not null unique,
    participant_code text not null unique,
    from_status text not null,
    to_status text not null,
    allowed boolean not null,
    reason text not null,
    expected_error_pattern text
) on commit drop;

create temporary table transition_results (
    case_number integer primary key,
    returned_status text not null
) on commit drop;

reset role;

-- Nine allowed transitions followed by the complete 27-case prohibited matrix.
insert into transition_cases (
    case_number,
    participant_id,
    participant_code,
    from_status,
    to_status,
    allowed,
    reason,
    expected_error_pattern
)
values
    (1,  '10000000-0000-4000-8000-000000000001', 'WPAG-900001', 'pending_enrollment', 'active',     true,  'Matrix transition reason.', null),
    (2,  '10000000-0000-4000-8000-000000000002', 'WPAG-900002', 'pending_enrollment', 'withdrawn', true,  'Matrix withdrawal reason.', null),
    (3,  '10000000-0000-4000-8000-000000000003', 'WPAG-900003', 'active',             'paused',    true,  'Matrix transition reason.', null),
    (4,  '10000000-0000-4000-8000-000000000004', 'WPAG-900004', 'active',             'completed', true,  'Matrix transition reason.', null),
    (5,  '10000000-0000-4000-8000-000000000005', 'WPAG-900005', 'active',             'withdrawn', true,  'Matrix withdrawal reason.', null),
    (6,  '10000000-0000-4000-8000-000000000006', 'WPAG-900006', 'paused',             'active',     true,  'Matrix transition reason.', null),
    (7,  '10000000-0000-4000-8000-000000000007', 'WPAG-900007', 'paused',             'withdrawn', true,  'Matrix withdrawal reason.', null),
    (8,  '10000000-0000-4000-8000-000000000008', 'WPAG-900008', 'completed',          'archived',  true,  'Matrix transition reason.', null),
    (9,  '10000000-0000-4000-8000-000000000009', 'WPAG-900009', 'withdrawn',          'archived',  true,  'Matrix transition reason.', null),

    (10, '10000000-0000-4000-8000-000000000010', 'WPAG-900010', 'pending_enrollment', 'pending_enrollment', false, 'Matrix prohibited reason.', 'Participant already has lifecycle status:%'),
    (11, '10000000-0000-4000-8000-000000000011', 'WPAG-900011', 'pending_enrollment', 'paused',             false, 'Matrix prohibited reason.', 'Invalid lifecycle transition:%'),
    (12, '10000000-0000-4000-8000-000000000012', 'WPAG-900012', 'pending_enrollment', 'completed',          false, 'Matrix prohibited reason.', 'Invalid lifecycle transition:%'),
    (13, '10000000-0000-4000-8000-000000000013', 'WPAG-900013', 'pending_enrollment', 'archived',           false, 'Matrix prohibited reason.', 'Invalid lifecycle transition:%'),

    (14, '10000000-0000-4000-8000-000000000014', 'WPAG-900014', 'active', 'pending_enrollment', false, 'Matrix prohibited reason.', 'Invalid lifecycle transition:%'),
    (15, '10000000-0000-4000-8000-000000000015', 'WPAG-900015', 'active', 'active',             false, 'Matrix prohibited reason.', 'Participant already has lifecycle status:%'),
    (16, '10000000-0000-4000-8000-000000000016', 'WPAG-900016', 'active', 'archived',           false, 'Matrix prohibited reason.', 'Invalid lifecycle transition:%'),

    (17, '10000000-0000-4000-8000-000000000017', 'WPAG-900017', 'paused', 'pending_enrollment', false, 'Matrix prohibited reason.', 'Invalid lifecycle transition:%'),
    (18, '10000000-0000-4000-8000-000000000018', 'WPAG-900018', 'paused', 'paused',             false, 'Matrix prohibited reason.', 'Participant already has lifecycle status:%'),
    (19, '10000000-0000-4000-8000-000000000019', 'WPAG-900019', 'paused', 'completed',          false, 'Matrix prohibited reason.', 'Invalid lifecycle transition:%'),
    (20, '10000000-0000-4000-8000-000000000020', 'WPAG-900020', 'paused', 'archived',           false, 'Matrix prohibited reason.', 'Invalid lifecycle transition:%'),

    (21, '10000000-0000-4000-8000-000000000021', 'WPAG-900021', 'completed', 'pending_enrollment', false, 'Matrix prohibited reason.', 'Invalid lifecycle transition:%'),
    (22, '10000000-0000-4000-8000-000000000022', 'WPAG-900022', 'completed', 'active',             false, 'Matrix prohibited reason.', 'Invalid lifecycle transition:%'),
    (23, '10000000-0000-4000-8000-000000000023', 'WPAG-900023', 'completed', 'paused',             false, 'Matrix prohibited reason.', 'Invalid lifecycle transition:%'),
    (24, '10000000-0000-4000-8000-000000000024', 'WPAG-900024', 'completed', 'completed',          false, 'Matrix prohibited reason.', 'Participant already has lifecycle status:%'),
    (25, '10000000-0000-4000-8000-000000000025', 'WPAG-900025', 'completed', 'withdrawn',          false, 'Matrix withdrawal reason.', 'Invalid lifecycle transition:%'),

    (26, '10000000-0000-4000-8000-000000000026', 'WPAG-900026', 'withdrawn', 'pending_enrollment', false, 'Matrix prohibited reason.', 'Invalid lifecycle transition:%'),
    (27, '10000000-0000-4000-8000-000000000027', 'WPAG-900027', 'withdrawn', 'active',             false, 'Matrix prohibited reason.', 'Invalid lifecycle transition:%'),
    (28, '10000000-0000-4000-8000-000000000028', 'WPAG-900028', 'withdrawn', 'paused',             false, 'Matrix prohibited reason.', 'Invalid lifecycle transition:%'),
    (29, '10000000-0000-4000-8000-000000000029', 'WPAG-900029', 'withdrawn', 'completed',          false, 'Matrix prohibited reason.', 'Invalid lifecycle transition:%'),
    (30, '10000000-0000-4000-8000-000000000030', 'WPAG-900030', 'withdrawn', 'withdrawn',          false, 'Matrix prohibited reason.', 'Participant already has lifecycle status:%'),

    (31, '10000000-0000-4000-8000-000000000031', 'WPAG-900031', 'archived', 'pending_enrollment', false, 'Matrix prohibited reason.', 'Invalid lifecycle transition:%'),
    (32, '10000000-0000-4000-8000-000000000032', 'WPAG-900032', 'archived', 'active',             false, 'Matrix prohibited reason.', 'Invalid lifecycle transition:%'),
    (33, '10000000-0000-4000-8000-000000000033', 'WPAG-900033', 'archived', 'paused',             false, 'Matrix prohibited reason.', 'Invalid lifecycle transition:%'),
    (34, '10000000-0000-4000-8000-000000000034', 'WPAG-900034', 'archived', 'completed',          false, 'Matrix prohibited reason.', 'Invalid lifecycle transition:%'),
    (35, '10000000-0000-4000-8000-000000000035', 'WPAG-900035', 'archived', 'withdrawn',          false, 'Matrix withdrawal reason.', 'Invalid lifecycle transition:%'),
    (36, '10000000-0000-4000-8000-000000000036', 'WPAG-900036', 'archived', 'archived',           false, 'Matrix prohibited reason.', 'Participant already has lifecycle status:%');

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
    created_by,
    updated_by
)
select
    participant_id,
    participant_code,
    from_status,
    'not_enrolled',
    case
        when from_status in ('active', 'paused', 'completed', 'withdrawn', 'archived')
            then '2026-01-01'::date
        else null
    end,
    case
        when from_status in ('completed', 'archived')
            then '2026-01-02'::date
        else null
    end,
    case
        when from_status = 'withdrawn'
            then '2026-01-02'::date
        else null
    end,
    case
        when from_status = 'withdrawn'
            then 'Fixture withdrawal reason.'
        else null
    end,
    '2026-01-01 00:00:00+00'::timestamptz,
    '2026-01-01 00:00:00+00'::timestamptz,
    '00000000-0000-4000-8000-000000000001'::uuid,
    '00000000-0000-4000-8000-000000000001'::uuid
from transition_cases
order by case_number;

-- Allowed transitions: six assertions per case (9 * 6 = 54).
set local role service_role;

select lives_ok(
    format(
        $statement$
        insert into transition_results (case_number, returned_status)
        select %s, (
            public.transition_participant_lifecycle(
                %L::uuid,
                %L::text,
                %L::uuid,
                %L::text,
                %L::jsonb
            )
        ).lifecycle_status
        $statement$,
        case_number,
        participant_id,
        to_status,
        '00000000-0000-4000-8000-000000000001',
        reason,
        jsonb_build_object('test_case', case_number)::text
    ),
    format(
        'allowed %s -> %s: function call succeeds',
        from_status,
        to_status
    )
)
from transition_cases
where allowed
order by case_number;

reset role;

select is(
    (
        select returned_status
        from transition_results
        where transition_results.case_number = transition_cases.case_number
    ),
    to_status,
    format(
        'allowed %s -> %s: returned status is target',
        from_status,
        to_status
    )
)
from transition_cases
where allowed
order by case_number;

select is(
    (
        select lifecycle_status
        from public.participants
        where participants.id = transition_cases.participant_id
    ),
    to_status,
    format(
        'allowed %s -> %s: stored status is target',
        from_status,
        to_status
    )
)
from transition_cases
where allowed
order by case_number;

select is(
    (
        select count(*)
        from public.participant_lifecycle_history
        where participant_id = transition_cases.participant_id
    ),
    1::bigint,
    format(
        'allowed %s -> %s: exactly one history row is created',
        from_status,
        to_status
    )
)
from transition_cases
where allowed
order by case_number;

select is(
    (
        select from_status
        from public.participant_lifecycle_history
        where participant_id = transition_cases.participant_id
    ),
    from_status,
    format(
        'allowed %s -> %s: history source status is recorded',
        from_status,
        to_status
    )
)
from transition_cases
where allowed
order by case_number;

select is(
    (
        select to_status
        from public.participant_lifecycle_history
        where participant_id = transition_cases.participant_id
    ),
    to_status,
    format(
        'allowed %s -> %s: history target status is recorded',
        from_status,
        to_status
    )
)
from transition_cases
where allowed
order by case_number;

-- Prohibited transitions: three assertions per case (27 * 3 = 81).
set local role service_role;

select throws_like(
    format(
        $statement$
        select public.transition_participant_lifecycle(
            %L::uuid,
            %L::text,
            %L::uuid,
            %L::text,
            %L::jsonb
        )
        $statement$,
        participant_id,
        to_status,
        '00000000-0000-4000-8000-000000000001',
        reason,
        jsonb_build_object('test_case', case_number)::text
    ),
    expected_error_pattern,
    format(
        'prohibited %s -> %s: correct lifecycle exception is raised',
        from_status,
        to_status
    )
)
from transition_cases
where not allowed
order by case_number;

reset role;

select is(
    (
        select lifecycle_status
        from public.participants
        where participants.id = transition_cases.participant_id
    ),
    from_status,
    format(
        'prohibited %s -> %s: stored status remains unchanged',
        from_status,
        to_status
    )
)
from transition_cases
where not allowed
order by case_number;

select is(
    (
        select count(*)
        from public.participant_lifecycle_history
        where participant_id = transition_cases.participant_id
    ),
    0::bigint,
    format(
        'prohibited %s -> %s: no history row is created',
        from_status,
        to_status
    )
)
from transition_cases
where not allowed
order by case_number;

select * from finish();
rollback;
