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
select
    '00000000-0000-0000-0000-000000000000'::uuid,
    user_id,
    'authenticated',
    'authenticated',
    email,
    '',
    '2026-01-01 00:00:00+00'::timestamptz,
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    '2026-01-01 00:00:00+00'::timestamptz,
    '2026-01-01 00:00:00+00'::timestamptz
from (
    values
        ('10000000-0000-4000-8000-000000000001'::uuid, 'admin@atomic.test'),
        ('10000000-0000-4000-8000-000000000002'::uuid, 'inactive@atomic.test'),
        ('10000000-0000-4000-8000-000000000003'::uuid, 'deleted@atomic.test'),
        ('10000000-0000-4000-8000-000000000004'::uuid, 'support@atomic.test'),
        ('10000000-0000-4000-8000-000000000005'::uuid, 'inactive-role@atomic.test'),
        ('10000000-0000-4000-8000-000000000006'::uuid, 'expired-role@atomic.test'),
        ('10000000-0000-4000-8000-000000000007'::uuid, 'unknown@atomic.test'),
        ('10000000-0000-4000-8000-000000000008'::uuid, 'participant@atomic.test'),
        ('10000000-0000-4000-8000-000000000009'::uuid, 'conflict@atomic.test')
) users(user_id, email);

insert into public.staff_members (
    id,
    staff_code,
    auth_user_id,
    full_name,
    email,
    status,
    created_at,
    deleted_at
)
values
    (
        '11000000-0000-4000-8000-000000000001',
        'WPAG-STF-910001',
        '10000000-0000-4000-8000-000000000001',
        'Active Administrator',
        'admin@atomic.test',
        'active',
        '2026-01-01 00:00:00+00',
        null
    ),
    (
        '11000000-0000-4000-8000-000000000002',
        'WPAG-STF-910002',
        '10000000-0000-4000-8000-000000000002',
        'Inactive Administrator',
        'inactive@atomic.test',
        'inactive',
        '2026-01-01 00:00:00+00',
        null
    ),
    (
        '11000000-0000-4000-8000-000000000003',
        'WPAG-STF-910003',
        '10000000-0000-4000-8000-000000000003',
        'Deleted Administrator',
        'deleted@atomic.test',
        'active',
        '2026-01-01 00:00:00+00',
        '2026-02-01 00:00:00+00'
    ),
    (
        '11000000-0000-4000-8000-000000000004',
        'WPAG-STF-910004',
        '10000000-0000-4000-8000-000000000004',
        'Support Operator',
        'support@atomic.test',
        'active',
        '2026-01-01 00:00:00+00',
        null
    ),
    (
        '11000000-0000-4000-8000-000000000005',
        'WPAG-STF-910005',
        '10000000-0000-4000-8000-000000000005',
        'Inactive Role Administrator',
        'inactive-role@atomic.test',
        'active',
        '2026-01-01 00:00:00+00',
        null
    ),
    (
        '11000000-0000-4000-8000-000000000006',
        'WPAG-STF-910006',
        '10000000-0000-4000-8000-000000000006',
        'Expired Role Administrator',
        'expired-role@atomic.test',
        'active',
        '2026-01-01 00:00:00+00',
        null
    );

insert into public.staff_member_roles (
    staff_member_id,
    staff_role_id,
    assigned_at,
    expires_at,
    is_active
)
values
    (
        '11000000-0000-4000-8000-000000000001',
        (select id from public.staff_roles where role_code = 'administrator'),
        '2026-01-01 00:00:00+00',
        null,
        true
    ),
    (
        '11000000-0000-4000-8000-000000000002',
        (select id from public.staff_roles where role_code = 'administrator'),
        '2026-01-01 00:00:00+00',
        null,
        true
    ),
    (
        '11000000-0000-4000-8000-000000000003',
        (select id from public.staff_roles where role_code = 'administrator'),
        '2026-01-01 00:00:00+00',
        null,
        true
    ),
    (
        '11000000-0000-4000-8000-000000000004',
        (select id from public.staff_roles where role_code = 'support'),
        '2026-01-01 00:00:00+00',
        null,
        true
    ),
    (
        '11000000-0000-4000-8000-000000000005',
        (select id from public.staff_roles where role_code = 'administrator'),
        '2026-01-01 00:00:00+00',
        null,
        false
    ),
    (
        '11000000-0000-4000-8000-000000000006',
        (select id from public.staff_roles where role_code = 'administrator'),
        '2025-01-01 00:00:00+00',
        '2025-06-01 00:00:00+00',
        true
    );

insert into public.applications (
    id,
    application_code,
    auth_user_id,
    full_name,
    email,
    phone_country_code,
    phone_number,
    country_code,
    state_or_region,
    city,
    employment_status,
    application_reason,
    status,
    submitted_at,
    reviewed_at,
    converted_at,
    created_at,
    deleted_at,
    updated_by
)
values
    (
        '20000000-0000-4000-8000-000000000001',
        'WPAG-APP-910001',
        '10000000-0000-4000-8000-000000000008',
        '  Ada   Lovelace Byron  ',
        'participant@atomic.test',
        '+91',
        '9876543210',
        'IN',
        'Karnataka',
        'Bengaluru',
        'employed',
        'Atomic conversion test.',
        'eligible',
        '2026-01-01 00:00:00+00',
        '2026-01-02 00:00:00+00',
        null,
        '2026-01-01 00:00:00+00'::timestamptz,
        null,
        null
    ),
    (
        '20000000-0000-4000-8000-000000000002',
        'WPAG-APP-910002',
        null,
        'Deleted Application',
        'deleted-application@atomic.test',
        '+91',
        '9876543211',
        'IN',
        null,
        null,
        null,
        'Deleted fixture.',
        'eligible',
        '2026-01-01 00:00:00+00',
        '2026-01-02 00:00:00+00',
        null,
        '2026-01-01 00:00:00+00'::timestamptz,
        '2026-02-01 00:00:00+00',
        null
    ),
    (
        '20000000-0000-4000-8000-000000000003',
        'WPAG-APP-910003',
        null,
        'Ineligible Application',
        'ineligible@atomic.test',
        '+91',
        '9876543212',
        'IN',
        null,
        null,
        null,
        'Ineligible fixture.',
        'submitted',
        '2026-01-01 00:00:00+00',
        null,
        null,
        '2026-01-01 00:00:00+00'::timestamptz,
        null,
        null
    ),
    (
        '20000000-0000-4000-8000-000000000004',
        'WPAG-APP-910004',
        null,
        'Incomplete Conversion',
        'converted-without-participant@atomic.test',
        '+91',
        '9876543213',
        'IN',
        null,
        null,
        null,
        'Converted fixture.',
        'converted',
        '2026-01-01 00:00:00+00',
        '2026-01-02 00:00:00+00',
        '2026-01-03 00:00:00+00',
        '2026-01-01 00:00:00+00'::timestamptz,
        null,
        null
    ),
    (
        '20000000-0000-4000-8000-000000000005',
        'WPAG-APP-910005',
        null,
        'Deleted Participant Conflict',
        'deleted-participant@atomic.test',
        '+91',
        '9876543214',
        'IN',
        null,
        null,
        null,
        'Deleted participant fixture.',
        'eligible',
        '2026-01-01 00:00:00+00',
        '2026-01-02 00:00:00+00',
        null,
        '2026-01-01 00:00:00+00'::timestamptz,
        null,
        null
    ),
    (
        '20000000-0000-4000-8000-000000000006',
        'WPAG-APP-910006',
        '10000000-0000-4000-8000-000000000009',
        'Auth Link Conflict',
        'auth-conflict@atomic.test',
        '+91',
        '9876543215',
        'IN',
        null,
        null,
        null,
        'Auth conflict fixture.',
        'eligible',
        '2026-01-01 00:00:00+00',
        '2026-01-02 00:00:00+00',
        null,
        '2026-01-01 00:00:00+00'::timestamptz,
        null,
        null
    ),
    (
        '20000000-0000-4000-8000-000000000007',
        'WPAG-APP-910007',
        null,
        'Existing Participant No Profile',
        'missing-profile@atomic.test',
        '+91',
        '9876543216',
        'IN',
        null,
        null,
        null,
        'Missing profile fixture.',
        'eligible',
        '2026-01-01 00:00:00+00',
        '2026-01-02 00:00:00+00',
        null,
        '2026-01-01 00:00:00+00'::timestamptz,
        null,
        null
    ),
    (
        '20000000-0000-4000-8000-000000000008',
        'WPAG-APP-910008',
        null,
        'Atomic Rollback',
        'rollback@atomic.test',
        '+91',
        '9876543217',
        'IN',
        null,
        null,
        null,
        'Rollback fixture.',
        'eligible',
        '2026-01-01 00:00:00+00',
        '2026-01-02 00:00:00+00',
        null,
        '2026-01-01 00:00:00+00'::timestamptz,
        null,
        null
    );

insert into public.participants (
    id,
    participant_code,
    auth_user_id,
    application_id,
    lifecycle_status,
    research_status,
    created_at,
    deleted_at
)
values
    (
        '30000000-0000-4000-8000-000000000001',
        'WPAG-930001',
        null,
        '20000000-0000-4000-8000-000000000005',
        'pending_enrollment',
        'not_enrolled',
        '2026-01-01 00:00:00+00',
        '2026-02-01 00:00:00+00'
    ),
    (
        '30000000-0000-4000-8000-000000000002',
        'WPAG-930002',
        '10000000-0000-4000-8000-000000000009',
        null,
        'pending_enrollment',
        'not_enrolled',
        '2026-01-01 00:00:00+00',
        null
    ),
    (
        '30000000-0000-4000-8000-000000000003',
        'WPAG-930003',
        null,
        '20000000-0000-4000-8000-000000000007',
        'pending_enrollment',
        'not_enrolled',
        '2026-01-01 00:00:00+00',
        null
    );

-- --------------------------------------------------------------------------
-- Catalog and execution boundary: 11 assertions.
-- --------------------------------------------------------------------------

select is(
    (
        select count(*)
        from pg_proc
        where oid = to_regprocedure(
            'public.create_participant_from_approved_application(uuid,uuid)'
        )
    ),
    1::bigint,
    'conversion RPC: exact function signature exists once'
);

select is(
    (
        select count(*)
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname = 'create_participant_from_approved_application'
    ),
    1::bigint,
    'conversion RPC: no ambiguous overload exists'
);

select is(
    (
        select l.lanname
        from pg_proc p
        join pg_language l on l.oid = p.prolang
        where p.oid = to_regprocedure(
            'public.create_participant_from_approved_application(uuid,uuid)'
        )
    ),
    'plpgsql',
    'conversion RPC: language is PL/pgSQL'
);

select ok(
    (
        select p.prosecdef
        from pg_proc p
        where p.oid = to_regprocedure(
            'public.create_participant_from_approved_application(uuid,uuid)'
        )
    ),
    'conversion RPC: SECURITY DEFINER is enabled'
);

select is(
    (
        select pg_get_userbyid(p.proowner)
        from pg_proc p
        where p.oid = to_regprocedure(
            'public.create_participant_from_approved_application(uuid,uuid)'
        )
    ),
    'postgres',
    'conversion RPC: owner is postgres'
);

select ok(
    (
        select p.proconfig @> array['search_path=public, pg_catalog']
        from pg_proc p
        where p.oid = to_regprocedure(
            'public.create_participant_from_approved_application(uuid,uuid)'
        )
    ),
    'conversion RPC: controlled search path is present'
);

select is(
    (
        select pg_get_function_result(p.oid)
        from pg_proc p
        where p.oid = to_regprocedure(
            'public.create_participant_from_approved_application(uuid,uuid)'
        )
    ),
    'TABLE(id uuid, participant_code text, application_id uuid, lifecycle_status text, research_status text)',
    'conversion RPC: return projection is exact'
);

select ok(
    has_function_privilege(
        'service_role',
        'public.create_participant_from_approved_application(uuid,uuid)',
        'EXECUTE'
    ),
    'conversion RPC: service_role can execute'
);

select is(
    has_function_privilege(
        role_name,
        'public.create_participant_from_approved_application(uuid,uuid)',
        'EXECUTE'
    ),
    false,
    format('conversion RPC: %s cannot execute', role_name)
)
from (values ('anon'), ('authenticated')) roles(role_name);

select is(
    (
        select exists (
            select 1
            from pg_proc p
            cross join lateral aclexplode(
                coalesce(
                    p.proacl,
                    acldefault('f', p.proowner)
                )
            ) acl
            where p.oid = to_regprocedure(
                'public.create_participant_from_approved_application(uuid,uuid)'
            )
              and acl.grantee = 0
              and acl.privilege_type = 'EXECUTE'
        )
    ),
    false,
    'conversion RPC: PUBLIC cannot execute'
);

-- --------------------------------------------------------------------------
-- Successful conversion and stored mapping: 16 assertions.
-- --------------------------------------------------------------------------

set local role service_role;

select lives_ok(
    $statement$
    select *
    from public.create_participant_from_approved_application(
        '20000000-0000-4000-8000-000000000001',
        '10000000-0000-4000-8000-000000000001'
    )
    $statement$,
    'successful conversion: service_role execution succeeds'
);

reset role;

select is(
    (
        select count(*)
        from public.participants
        where application_id = '20000000-0000-4000-8000-000000000001'
    ),
    1::bigint,
    'successful conversion: one participant is created'
);

select ok(
    (
        select participant_code ~ '^WPAG-[0-9]{6,}$'
        from public.participants
        where application_id = '20000000-0000-4000-8000-000000000001'
    ),
    'successful conversion: participant code default is applied'
);

select is(
    (
        select lifecycle_status
        from public.participants
        where application_id = '20000000-0000-4000-8000-000000000001'
    ),
    'pending_enrollment',
    'successful conversion: lifecycle default is pending enrollment'
);

select is(
    (
        select research_status
        from public.participants
        where application_id = '20000000-0000-4000-8000-000000000001'
    ),
    'not_enrolled',
    'successful conversion: research default is not enrolled'
);

select is(
    (
        select auth_user_id
        from public.participants
        where application_id = '20000000-0000-4000-8000-000000000001'
    ),
    '10000000-0000-4000-8000-000000000008'::uuid,
    'successful conversion: participant Auth linkage is preserved'
);

select is(
    (
        select count(*)
        from public.participant_profiles pp
        join public.participants p on p.id = pp.participant_id
        where p.application_id = '20000000-0000-4000-8000-000000000001'
    ),
    1::bigint,
    'successful conversion: one participant profile is created'
);

select is(
    (
        select first_name
        from public.participant_profiles pp
        join public.participants p on p.id = pp.participant_id
        where p.application_id = '20000000-0000-4000-8000-000000000001'
    ),
    'Ada',
    'successful conversion: normalized first name is mapped'
);

select is(
    (
        select last_name
        from public.participant_profiles pp
        join public.participants p on p.id = pp.participant_id
        where p.application_id = '20000000-0000-4000-8000-000000000001'
    ),
    'Lovelace Byron',
    'successful conversion: normalized remaining name is mapped'
);

select is(
    (
        select jsonb_build_object(
            'email', pp.email,
            'phone_country_code', pp.phone_country_code,
            'phone_number', pp.phone_number,
            'country_code', pp.country_code,
            'state', pp.state,
            'city', pp.city,
            'employment_status', pp.employment_status,
            'profile_completed', pp.profile_completed
        )
        from public.participant_profiles pp
        join public.participants p on p.id = pp.participant_id
        where p.application_id = '20000000-0000-4000-8000-000000000001'
    ),
    '{
        "email":"participant@atomic.test",
        "phone_country_code":"+91",
        "phone_number":"9876543210",
        "country_code":"IN",
        "state":"Karnataka",
        "city":"Bengaluru",
        "employment_status":"employed",
        "profile_completed":false
    }'::jsonb,
    'successful conversion: profile source fields are mapped'
);

select is(
    (
        select pp.auth_user_id
        from public.participant_profiles pp
        join public.participants p on p.id = pp.participant_id
        where p.application_id = '20000000-0000-4000-8000-000000000001'
    ),
    '10000000-0000-4000-8000-000000000008'::uuid,
    'successful conversion: profile Auth linkage is preserved'
);

select is(
    (
        select status
        from public.applications
        where id = '20000000-0000-4000-8000-000000000001'
    ),
    'converted',
    'successful conversion: application is converted'
);

select ok(
    (
        select converted_at is not null
        from public.applications
        where id = '20000000-0000-4000-8000-000000000001'
    ),
    'successful conversion: conversion timestamp is set'
);

select is(
    (
        select count(*)
        from public.participants p
        join public.participant_profiles pp on pp.participant_id = p.id
        join public.applications a on a.id = p.application_id
        where a.id = '20000000-0000-4000-8000-000000000001'
          and p.created_by = '10000000-0000-4000-8000-000000000001'
          and p.updated_by = '10000000-0000-4000-8000-000000000001'
          and pp.created_by = '10000000-0000-4000-8000-000000000001'
          and pp.updated_by = '10000000-0000-4000-8000-000000000001'
          and a.updated_by = '10000000-0000-4000-8000-000000000001'
    ),
    1::bigint,
    'successful conversion: actor attribution is preserved across all records'
);

create temporary table atomic_conversion_snapshot on commit drop as
select converted_at, updated_by
from public.applications
where id = '20000000-0000-4000-8000-000000000001';

select is(
    (
        select jsonb_build_object(
            'id', result.id,
            'participant_code', result.participant_code,
            'application_id', result.application_id,
            'lifecycle_status', result.lifecycle_status,
            'research_status', result.research_status
        )
        from public.create_participant_from_approved_application(
            '20000000-0000-4000-8000-000000000001',
            '10000000-0000-4000-8000-000000000001'
        ) result
    ),
    (
        select jsonb_build_object(
            'id', p.id,
            'participant_code', p.participant_code,
            'application_id', p.application_id,
            'lifecycle_status', p.lifecycle_status,
            'research_status', p.research_status
        )
        from public.participants p
        where p.application_id = '20000000-0000-4000-8000-000000000001'
    ),
    'successful conversion: narrow returned result matches stored participant'
);

select is(
    (
        select count(*)
        from public.participant_profiles
        where middle_name is null
          and preferred_name is null
          and participant_id = (
              select id
              from public.participants
              where application_id = '20000000-0000-4000-8000-000000000001'
          )
    ),
    1::bigint,
    'successful conversion: no middle or preferred name is invented'
);

-- --------------------------------------------------------------------------
-- Idempotency: 4 assertions.
-- --------------------------------------------------------------------------

select is(
    (
        select count(*)
        from public.participants
        where application_id = '20000000-0000-4000-8000-000000000001'
    ),
    1::bigint,
    'idempotency: participant count remains one'
);

select is(
    (
        select count(*)
        from public.participant_profiles pp
        join public.participants p on p.id = pp.participant_id
        where p.application_id = '20000000-0000-4000-8000-000000000001'
    ),
    1::bigint,
    'idempotency: profile count remains one'
);

select is(
    (
        select converted_at
        from public.applications
        where id = '20000000-0000-4000-8000-000000000001'
    ),
    (
        select converted_at
        from atomic_conversion_snapshot
    ),
    'idempotency: conversion timestamp remains unchanged'
);

select is(
    (
        select updated_by
        from public.applications
        where id = '20000000-0000-4000-8000-000000000001'
    ),
    (
        select updated_by
        from atomic_conversion_snapshot
    ),
    'idempotency: application actor attribution remains unchanged'
);

-- --------------------------------------------------------------------------
-- Authorization failures: 7 assertions.
-- --------------------------------------------------------------------------

select throws_like(
    $statement$
    select * from public.create_participant_from_approved_application(
        '20000000-0000-4000-8000-000000000008',
        null
    )
    $statement$,
    'Actor identity is required.',
    'authorization: null actor is rejected'
);

select throws_like(
    $statement$
    select * from public.create_participant_from_approved_application(
        '20000000-0000-4000-8000-000000000008',
        '10000000-0000-4000-8000-000000000007'
    )
    $statement$,
    'Actor is not authorized to convert applications.',
    'authorization: unknown actor is rejected'
);

select throws_like(
    $statement$
    select * from public.create_participant_from_approved_application(
        '20000000-0000-4000-8000-000000000008',
        '10000000-0000-4000-8000-000000000002'
    )
    $statement$,
    'Actor is not authorized to convert applications.',
    'authorization: inactive staff is rejected'
);

select throws_like(
    $statement$
    select * from public.create_participant_from_approved_application(
        '20000000-0000-4000-8000-000000000008',
        '10000000-0000-4000-8000-000000000003'
    )
    $statement$,
    'Actor is not authorized to convert applications.',
    'authorization: soft-deleted staff is rejected'
);

select throws_like(
    $statement$
    select * from public.create_participant_from_approved_application(
        '20000000-0000-4000-8000-000000000008',
        '10000000-0000-4000-8000-000000000004'
    )
    $statement$,
    'Actor is not authorized to convert applications.',
    'authorization: non-admin staff is rejected'
);

select throws_like(
    $statement$
    select * from public.create_participant_from_approved_application(
        '20000000-0000-4000-8000-000000000008',
        '10000000-0000-4000-8000-000000000005'
    )
    $statement$,
    'Actor is not authorized to convert applications.',
    'authorization: inactive role assignment is rejected'
);

select throws_like(
    $statement$
    select * from public.create_participant_from_approved_application(
        '20000000-0000-4000-8000-000000000008',
        '10000000-0000-4000-8000-000000000006'
    )
    $statement$,
    'Actor is not authorized to convert applications.',
    'authorization: expired role assignment is rejected'
);

-- --------------------------------------------------------------------------
-- Application-state and invariant failures: 8 assertions.
-- --------------------------------------------------------------------------

select throws_like(
    $statement$
    select * from public.create_participant_from_approved_application(
        null,
        '10000000-0000-4000-8000-000000000001'
    )
    $statement$,
    'Application ID is required.',
    'application state: null application ID is rejected'
);

select throws_like(
    $statement$
    select * from public.create_participant_from_approved_application(
        '29999999-0000-4000-8000-000000000099',
        '10000000-0000-4000-8000-000000000001'
    )
    $statement$,
    'Application not found.',
    'application state: missing application is rejected'
);

select throws_like(
    $statement$
    select * from public.create_participant_from_approved_application(
        '20000000-0000-4000-8000-000000000002',
        '10000000-0000-4000-8000-000000000001'
    )
    $statement$,
    'Deleted applications cannot be converted.',
    'application state: deleted application is rejected'
);

select throws_like(
    $statement$
    select * from public.create_participant_from_approved_application(
        '20000000-0000-4000-8000-000000000003',
        '10000000-0000-4000-8000-000000000001'
    )
    $statement$,
    'Application is not eligible for participant conversion.',
    'application state: non-eligible application is rejected'
);

select throws_like(
    $statement$
    select * from public.create_participant_from_approved_application(
        '20000000-0000-4000-8000-000000000004',
        '10000000-0000-4000-8000-000000000001'
    )
    $statement$,
    'Participant conversion could not be completed.',
    'application state: converted application without participant is rejected safely'
);

select throws_like(
    $statement$
    select * from public.create_participant_from_approved_application(
        '20000000-0000-4000-8000-000000000005',
        '10000000-0000-4000-8000-000000000001'
    )
    $statement$,
    'Application is already linked to a deleted participant.',
    'application state: deleted participant conflict is rejected'
);

select throws_like(
    $statement$
    select * from public.create_participant_from_approved_application(
        '20000000-0000-4000-8000-000000000006',
        '10000000-0000-4000-8000-000000000001'
    )
    $statement$,
    'Application account is already linked to another participant.',
    'application state: Auth linkage conflict is rejected'
);

select throws_like(
    $statement$
    select * from public.create_participant_from_approved_application(
        '20000000-0000-4000-8000-000000000007',
        '10000000-0000-4000-8000-000000000001'
    )
    $statement$,
    'Existing participant conversion is incomplete.',
    'application state: existing participant without profile is rejected'
);

-- --------------------------------------------------------------------------
-- Atomic rollback under forced profile failure: 6 assertions.
-- --------------------------------------------------------------------------

create function pg_temp.reject_atomic_profile_insert()
returns trigger
language plpgsql
as $$
begin
    raise exception 'Forced profile persistence failure.';
end;
$$;

create trigger trg_test_reject_atomic_profile_insert
before insert on public.participant_profiles
for each row
execute function pg_temp.reject_atomic_profile_insert();

select throws_like(
    $statement$
    select * from public.create_participant_from_approved_application(
        '20000000-0000-4000-8000-000000000008',
        '10000000-0000-4000-8000-000000000001'
    )
    $statement$,
    'Participant conversion could not be completed.',
    'atomic rollback: profile insertion failure is sanitized'
);

select is(
    (
        select count(*)
        from public.participants
        where application_id = '20000000-0000-4000-8000-000000000008'
    ),
    0::bigint,
    'atomic rollback: participant does not persist'
);

select is(
    (
        select status
        from public.applications
        where id = '20000000-0000-4000-8000-000000000008'
    ),
    'eligible',
    'atomic rollback: application remains eligible'
);

select is(
    (
        select converted_at
        from public.applications
        where id = '20000000-0000-4000-8000-000000000008'
    ),
    null::timestamptz,
    'atomic rollback: conversion timestamp remains null'
);

select is(
    (
        select updated_by
        from public.applications
        where id = '20000000-0000-4000-8000-000000000008'
    ),
    null::uuid,
    'atomic rollback: application actor attribution remains unchanged'
);

select is(
    (
        select count(*)
        from public.participant_profiles pp
        join public.participants p on p.id = pp.participant_id
        where p.application_id = '20000000-0000-4000-8000-000000000008'
    ),
    0::bigint,
    'atomic rollback: no profile persists'
);

-- --------------------------------------------------------------------------
-- Direct-write denial and Phase A projection: 10 assertions.
-- --------------------------------------------------------------------------

select is(
    has_table_privilege('service_role', 'public.participants', 'INSERT'),
    false,
    'write posture: service_role cannot directly INSERT participants'
);

select is(
    has_table_privilege('service_role', 'public.participants', 'DELETE'),
    false,
    'write posture: service_role cannot directly DELETE participants'
);

select is(
    has_column_privilege(
        'service_role',
        'public.participants',
        column_name,
        'SELECT'
    ),
    true,
    format('Phase A projection remains readable: %s', column_name)
)
from (
    values
        ('id'),
        ('participant_code'),
        ('auth_user_id'),
        ('application_id'),
        ('lifecycle_status'),
        ('research_status'),
        ('enrollment_date'),
        ('created_at')
) approved(column_name);

select * from finish();
rollback;
