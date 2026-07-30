begin;

create extension if not exists pgtap with schema extensions;

set local search_path = public, extensions, pg_catalog;

select plan(101);

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
    '00000000-0000-4000-8000-000000000003'::uuid,
    'authenticated',
    'authenticated',
    'lifecycle-permissions-actor@wpag.test',
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
    internal_notes,
    created_at,
    updated_at,
    created_by,
    updated_by
)
values
    (
        '30000000-0000-4000-8000-000000000001',
        'WPAG-920001',
        'pending_enrollment',
        'not_enrolled',
        null,
        null,
        null,
        null,
        null,
        '2026-01-01 00:00:00+00',
        '2026-01-01 00:00:00+00',
        '00000000-0000-4000-8000-000000000003',
        null
    ),
    (
        '30000000-0000-4000-8000-000000000002',
        'WPAG-920002',
        'pending_enrollment',
        'not_enrolled',
        null,
        null,
        null,
        null,
        null,
        '2026-01-01 00:00:00+00',
        '2026-01-01 00:00:00+00',
        '00000000-0000-4000-8000-000000000003',
        null
    ),
    (
        '30000000-0000-4000-8000-000000000003',
        'WPAG-920003',
        'pending_enrollment',
        'not_enrolled',
        null,
        null,
        null,
        null,
        null,
        '2026-01-01 00:00:00+00',
        '2026-01-01 00:00:00+00',
        '00000000-0000-4000-8000-000000000003',
        null
    ),
    (
        '30000000-0000-4000-8000-000000000004',
        'WPAG-920004',
        'pending_enrollment',
        'not_enrolled',
        null,
        null,
        null,
        null,
        null,
        '2026-01-01 00:00:00+00',
        '2026-01-01 00:00:00+00',
        '00000000-0000-4000-8000-000000000003',
        null
    ),
    (
        '30000000-0000-4000-8000-000000000005',
        'WPAG-920005',
        'pending_enrollment',
        'not_enrolled',
        null,
        null,
        null,
        null,
        null,
        '2026-01-01 00:00:00+00',
        '2026-01-01 00:00:00+00',
        '00000000-0000-4000-8000-000000000003',
        null
    ),
    (
        '30000000-0000-4000-8000-000000000006',
        'WPAG-920006',
        'pending_enrollment',
        'not_enrolled',
        null,
        null,
        null,
        null,
        null,
        '2026-01-01 00:00:00+00',
        '2026-01-01 00:00:00+00',
        '00000000-0000-4000-8000-000000000003',
        null
    ),
    (
        '30000000-0000-4000-8000-000000000007',
        'WPAG-920007',
        'pending_enrollment',
        'not_enrolled',
        null,
        null,
        null,
        null,
        null,
        '2026-01-01 00:00:00+00',
        '2026-01-01 00:00:00+00',
        '00000000-0000-4000-8000-000000000003',
        null
    );

-- --------------------------------------------------------------------------
-- Transition RPC catalog identity: 8 assertions.
-- --------------------------------------------------------------------------

select is(
    (
        select count(*)
        from pg_proc
        where oid = to_regprocedure(
            'public.transition_participant_lifecycle(uuid,text,uuid,text,jsonb)'
        )
    ),
    1::bigint,
    'transition RPC: exact five-argument function identity exists once'
);

select is(
    (
        select count(*)
        from pg_proc p
        join pg_namespace n
          on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname = 'transition_participant_lifecycle'
    ),
    1::bigint,
    'transition RPC: no ambiguous overload exists'
);

select is(
    (
        select l.lanname
        from pg_proc p
        join pg_language l
          on l.oid = p.prolang
        where p.oid = to_regprocedure(
            'public.transition_participant_lifecycle(uuid,text,uuid,text,jsonb)'
        )
    ),
    'plpgsql',
    'transition RPC: language is PL/pgSQL'
);

select ok(
    (
        select p.prosecdef
        from pg_proc p
        where p.oid = to_regprocedure(
            'public.transition_participant_lifecycle(uuid,text,uuid,text,jsonb)'
        )
    ),
    'transition RPC: function is SECURITY DEFINER'
);

select is(
    (
        select p.provolatile::text
        from pg_proc p
        where p.oid = to_regprocedure(
            'public.transition_participant_lifecycle(uuid,text,uuid,text,jsonb)'
        )
    ),
    'v',
    'transition RPC: volatility is VOLATILE'
);

select ok(
    (
        select p.proconfig @> array['search_path=public, pg_catalog']
        from pg_proc p
        where p.oid = to_regprocedure(
            'public.transition_participant_lifecycle(uuid,text,uuid,text,jsonb)'
        )
    ),
    'transition RPC: controlled search path contains public and pg_catalog'
);

select is(
    (
        select r.rolname
        from pg_proc p
        join pg_roles r
          on r.oid = p.proowner
        where p.oid = to_regprocedure(
            'public.transition_participant_lifecycle(uuid,text,uuid,text,jsonb)'
        )
    ),
    'postgres',
    'transition RPC: function owner is postgres'
);

select ok(
    (
        select p.prorettype = 'public.participants'::regtype
        from pg_proc p
        where p.oid = to_regprocedure(
            'public.transition_participant_lifecycle(uuid,text,uuid,text,jsonb)'
        )
    ),
    'transition RPC: return type is public.participants'
);

-- --------------------------------------------------------------------------
-- Transition RPC effective privileges: 6 assertions.
-- --------------------------------------------------------------------------

select ok(
    has_function_privilege(
        'service_role',
        'public.transition_participant_lifecycle(uuid,text,uuid,text,jsonb)',
        'EXECUTE'
    ),
    'transition RPC privileges: service_role can execute'
);

select ok(
    not has_function_privilege(
        'authenticated',
        'public.transition_participant_lifecycle(uuid,text,uuid,text,jsonb)',
        'EXECUTE'
    ),
    'transition RPC privileges: authenticated cannot execute'
);

select ok(
    not has_function_privilege(
        'anon',
        'public.transition_participant_lifecycle(uuid,text,uuid,text,jsonb)',
        'EXECUTE'
    ),
    'transition RPC privileges: anon cannot execute'
);

select is(
    (
        select count(*)
        from pg_proc p
        cross join lateral aclexplode(
            coalesce(
                p.proacl,
                acldefault('f', p.proowner)
            )
        ) privilege
        where p.oid = to_regprocedure(
            'public.transition_participant_lifecycle(uuid,text,uuid,text,jsonb)'
        )
          and privilege.grantee = 0
          and privilege.privilege_type = 'EXECUTE'
    ),
    0::bigint,
    'transition RPC privileges: PUBLIC cannot execute'
);

set local role authenticated;

select throws_like(
    $statement$
    select public.transition_participant_lifecycle(
        '30000000-0000-4000-8000-000000000007'::uuid,
        'active'::text,
        '00000000-0000-4000-8000-000000000003'::uuid,
        'Unauthorized authenticated attempt.'::text,
        '{}'::jsonb
    )
    $statement$,
    'permission denied for function transition_participant_lifecycle',
    'transition RPC execution: authenticated receives permission denied'
);

reset role;

set local role anon;

select throws_like(
    $statement$
    select public.transition_participant_lifecycle(
        '30000000-0000-4000-8000-000000000007'::uuid,
        'active'::text,
        '00000000-0000-4000-8000-000000000003'::uuid,
        'Unauthorized anonymous attempt.'::text,
        '{}'::jsonb
    )
    $statement$,
    'permission denied for function transition_participant_lifecycle',
    'transition RPC execution: anon receives permission denied'
);

reset role;

-- --------------------------------------------------------------------------
-- Participant protection trigger and function catalog: 11 assertions.
-- --------------------------------------------------------------------------

select is(
    (
        select count(*)
        from pg_trigger t
        join pg_class c
          on c.oid = t.tgrelid
        join pg_namespace n
          on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname = 'participants'
          and t.tgname = 'trg_participants_protect_lifecycle_status'
          and not t.tgisinternal
    ),
    1::bigint,
    'participant protection trigger: exact trigger exists once on participants'
);

select is(
    (
        select t.tgenabled::text
        from pg_trigger t
        where t.tgrelid = 'public.participants'::regclass
          and t.tgname = 'trg_participants_protect_lifecycle_status'
    ),
    'O',
    'participant protection trigger: trigger is enabled'
);

select ok(
    (
        select (t.tgtype::integer & 1) = 1
        from pg_trigger t
        where t.tgrelid = 'public.participants'::regclass
          and t.tgname = 'trg_participants_protect_lifecycle_status'
    ),
    'participant protection trigger: trigger is row-level'
);

select ok(
    (
        select (t.tgtype::integer & 2) = 2
        from pg_trigger t
        where t.tgrelid = 'public.participants'::regclass
          and t.tgname = 'trg_participants_protect_lifecycle_status'
    ),
    'participant protection trigger: trigger runs BEFORE'
);

select is(
    (
        select t.tgtype::integer & 60
        from pg_trigger t
        where t.tgrelid = 'public.participants'::regclass
          and t.tgname = 'trg_participants_protect_lifecycle_status'
    ),
    16,
    'participant protection trigger: trigger runs for UPDATE only'
);

select is(
    (
        select array_agg(a.attname order by a.attname)
        from pg_trigger t
        cross join lateral unnest(
            t.tgattr::smallint[]
        ) protected_attribute_number
        join pg_attribute a
          on a.attrelid = t.tgrelid
         and a.attnum = protected_attribute_number
        where t.tgrelid = 'public.participants'::regclass
          and t.tgname = 'trg_participants_protect_lifecycle_status'
    ),
    array[
        'completion_date',
        'enrollment_date',
        'lifecycle_status',
        'withdrawal_date',
        'withdrawal_reason'
    ]::name[],
    'participant protection trigger: exactly five lifecycle fields are monitored'
);

select ok(
    (
        select t.tgfoid = to_regprocedure(
            'public.protect_participant_lifecycle_status()'
        )
        from pg_trigger t
        where t.tgrelid = 'public.participants'::regclass
          and t.tgname = 'trg_participants_protect_lifecycle_status'
    ),
    'participant protection trigger: expected protection function is invoked'
);

select is(
    (
        select count(*)
        from pg_proc p
        where p.oid = to_regprocedure(
            'public.protect_participant_lifecycle_status()'
        )
    ),
    1::bigint,
    'participant protection function: exact function exists'
);

select is(
    (
        select l.lanname
        from pg_proc p
        join pg_language l
          on l.oid = p.prolang
        where p.oid = to_regprocedure(
            'public.protect_participant_lifecycle_status()'
        )
    ),
    'plpgsql',
    'participant protection function: language is PL/pgSQL'
);

select ok(
    (
        select p.proconfig @> array['search_path=public, pg_catalog']
        from pg_proc p
        where p.oid = to_regprocedure(
            'public.protect_participant_lifecycle_status()'
        )
    ),
    'participant protection function: controlled search path is present'
);

select ok(
    (
        select position(
            'Participant lifecycle-controlled fields must be changed through transition_participant_lifecycle().'
            in pg_get_functiondef(p.oid)
        ) > 0
        from pg_proc p
        where p.oid = to_regprocedure(
            'public.protect_participant_lifecycle_status()'
        )
    ),
    'participant protection function: governed exception contract is present'
);

-- --------------------------------------------------------------------------
-- Five direct lifecycle-field rejections: 20 assertions.
-- --------------------------------------------------------------------------

select throws_like(
    $statement$
    update public.participants
       set lifecycle_status = 'active'
     where id = '30000000-0000-4000-8000-000000000001'
    $statement$,
    'Participant lifecycle-controlled fields must be changed through transition_participant_lifecycle().',
    'direct lifecycle_status update: governed exception is raised'
);

select is(
    (
        select lifecycle_status
        from public.participants
        where id = '30000000-0000-4000-8000-000000000001'
    ),
    'pending_enrollment',
    'direct lifecycle_status update: protected field remains unchanged'
);

select is(
    (
        select lifecycle_status
        from public.participants
        where id = '30000000-0000-4000-8000-000000000001'
    ),
    'pending_enrollment',
    'direct lifecycle_status update: lifecycle status remains unchanged'
);

select is(
    (
        select count(*)
        from public.participant_lifecycle_history
        where participant_id = '30000000-0000-4000-8000-000000000001'
    ),
    0::bigint,
    'direct lifecycle_status update: no history row is inserted'
);

select throws_like(
    $statement$
    update public.participants
       set enrollment_date = '2026-02-01'::date
     where id = '30000000-0000-4000-8000-000000000002'
    $statement$,
    'Participant lifecycle-controlled fields must be changed through transition_participant_lifecycle().',
    'direct enrollment_date update: governed exception is raised'
);

select is(
    (
        select enrollment_date
        from public.participants
        where id = '30000000-0000-4000-8000-000000000002'
    ),
    null::date,
    'direct enrollment_date update: protected field remains unchanged'
);

select is(
    (
        select lifecycle_status
        from public.participants
        where id = '30000000-0000-4000-8000-000000000002'
    ),
    'pending_enrollment',
    'direct enrollment_date update: lifecycle status remains unchanged'
);

select is(
    (
        select count(*)
        from public.participant_lifecycle_history
        where participant_id = '30000000-0000-4000-8000-000000000002'
    ),
    0::bigint,
    'direct enrollment_date update: no history row is inserted'
);

select throws_like(
    $statement$
    update public.participants
       set completion_date = '2026-02-02'::date
     where id = '30000000-0000-4000-8000-000000000003'
    $statement$,
    'Participant lifecycle-controlled fields must be changed through transition_participant_lifecycle().',
    'direct completion_date update: governed exception is raised'
);

select is(
    (
        select completion_date
        from public.participants
        where id = '30000000-0000-4000-8000-000000000003'
    ),
    null::date,
    'direct completion_date update: protected field remains unchanged'
);

select is(
    (
        select lifecycle_status
        from public.participants
        where id = '30000000-0000-4000-8000-000000000003'
    ),
    'pending_enrollment',
    'direct completion_date update: lifecycle status remains unchanged'
);

select is(
    (
        select count(*)
        from public.participant_lifecycle_history
        where participant_id = '30000000-0000-4000-8000-000000000003'
    ),
    0::bigint,
    'direct completion_date update: no history row is inserted'
);

select throws_like(
    $statement$
    update public.participants
       set withdrawal_date = '2026-02-03'::date
     where id = '30000000-0000-4000-8000-000000000004'
    $statement$,
    'Participant lifecycle-controlled fields must be changed through transition_participant_lifecycle().',
    'direct withdrawal_date update: governed exception is raised'
);

select is(
    (
        select withdrawal_date
        from public.participants
        where id = '30000000-0000-4000-8000-000000000004'
    ),
    null::date,
    'direct withdrawal_date update: protected field remains unchanged'
);

select is(
    (
        select lifecycle_status
        from public.participants
        where id = '30000000-0000-4000-8000-000000000004'
    ),
    'pending_enrollment',
    'direct withdrawal_date update: lifecycle status remains unchanged'
);

select is(
    (
        select count(*)
        from public.participant_lifecycle_history
        where participant_id = '30000000-0000-4000-8000-000000000004'
    ),
    0::bigint,
    'direct withdrawal_date update: no history row is inserted'
);

select throws_like(
    $statement$
    update public.participants
       set withdrawal_reason = 'Unauthorized reason mutation.'
     where id = '30000000-0000-4000-8000-000000000005'
    $statement$,
    'Participant lifecycle-controlled fields must be changed through transition_participant_lifecycle().',
    'direct withdrawal_reason update: governed exception is raised'
);

select is(
    (
        select withdrawal_reason
        from public.participants
        where id = '30000000-0000-4000-8000-000000000005'
    ),
    null::text,
    'direct withdrawal_reason update: protected field remains unchanged'
);

select is(
    (
        select lifecycle_status
        from public.participants
        where id = '30000000-0000-4000-8000-000000000005'
    ),
    'pending_enrollment',
    'direct withdrawal_reason update: lifecycle status remains unchanged'
);

select is(
    (
        select count(*)
        from public.participant_lifecycle_history
        where participant_id = '30000000-0000-4000-8000-000000000005'
    ),
    0::bigint,
    'direct withdrawal_reason update: no history row is inserted'
);

-- --------------------------------------------------------------------------
-- Non-lifecycle participant update compatibility: 4 assertions.
-- --------------------------------------------------------------------------

select lives_ok(
    $statement$
    update public.participants
       set internal_notes = 'Governed administrative note.'
     where id = '30000000-0000-4000-8000-000000000006'
    $statement$,
    'non-lifecycle update: internal notes update succeeds'
);

select is(
    (
        select internal_notes
        from public.participants
        where id = '30000000-0000-4000-8000-000000000006'
    ),
    'Governed administrative note.',
    'non-lifecycle update: internal notes value is stored'
);

select is(
    (
        select jsonb_build_object(
            'lifecycle_status', lifecycle_status,
            'enrollment_date', enrollment_date,
            'completion_date', completion_date,
            'withdrawal_date', withdrawal_date,
            'withdrawal_reason', withdrawal_reason
        )
        from public.participants
        where id = '30000000-0000-4000-8000-000000000006'
    ),
    '{
        "lifecycle_status":"pending_enrollment",
        "enrollment_date":null,
        "completion_date":null,
        "withdrawal_date":null,
        "withdrawal_reason":null
    }'::jsonb,
    'non-lifecycle update: all protected lifecycle fields remain unchanged'
);

select is(
    (
        select count(*)
        from public.participant_lifecycle_history
        where participant_id = '30000000-0000-4000-8000-000000000006'
    ),
    0::bigint,
    'non-lifecycle update: no lifecycle history row is inserted'
);

-- --------------------------------------------------------------------------
-- Approved service-role lifecycle path: 4 assertions.
-- --------------------------------------------------------------------------

set local role service_role;

select lives_ok(
    $statement$
    select public.transition_participant_lifecycle(
        '30000000-0000-4000-8000-000000000007'::uuid,
        'active'::text,
        '00000000-0000-4000-8000-000000000003'::uuid,
        'Permission test transition.'::text,
        '{"source":"permissions-and-protection-test"}'::jsonb
    )
    $statement$,
    'approved transition: service_role RPC call succeeds'
);

reset role;

select is(
    (
        select lifecycle_status
        from public.participants
        where id = '30000000-0000-4000-8000-000000000007'
    ),
    'active',
    'approved transition: participant status becomes active'
);

select ok(
    (
        select enrollment_date is not null
        from public.participants
        where id = '30000000-0000-4000-8000-000000000007'
    ),
    'approved transition: enrollment date is set'
);

select is(
    (
        select count(*)
        from public.participant_lifecycle_history
        where participant_id = '30000000-0000-4000-8000-000000000007'
    ),
    1::bigint,
    'approved transition: exactly one history row is appended'
);

-- --------------------------------------------------------------------------
-- Lifecycle-history immutability trigger and function catalog: 10 assertions.
-- --------------------------------------------------------------------------

select is(
    (
        select count(*)
        from pg_trigger t
        join pg_class c
          on c.oid = t.tgrelid
        join pg_namespace n
          on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname = 'participant_lifecycle_history'
          and t.tgname = 'trg_participant_lifecycle_history_immutable'
          and not t.tgisinternal
    ),
    1::bigint,
    'history immutability trigger: exact trigger exists once on lifecycle history'
);

select is(
    (
        select t.tgenabled::text
        from pg_trigger t
        where t.tgrelid = 'public.participant_lifecycle_history'::regclass
          and t.tgname = 'trg_participant_lifecycle_history_immutable'
    ),
    'O',
    'history immutability trigger: trigger is enabled'
);

select ok(
    (
        select (t.tgtype::integer & 1) = 1
        from pg_trigger t
        where t.tgrelid = 'public.participant_lifecycle_history'::regclass
          and t.tgname = 'trg_participant_lifecycle_history_immutable'
    ),
    'history immutability trigger: trigger is row-level'
);

select ok(
    (
        select (t.tgtype::integer & 2) = 2
        from pg_trigger t
        where t.tgrelid = 'public.participant_lifecycle_history'::regclass
          and t.tgname = 'trg_participant_lifecycle_history_immutable'
    ),
    'history immutability trigger: trigger runs BEFORE'
);

select is(
    (
        select t.tgtype::integer & 60
        from pg_trigger t
        where t.tgrelid = 'public.participant_lifecycle_history'::regclass
          and t.tgname = 'trg_participant_lifecycle_history_immutable'
    ),
    24,
    'history immutability trigger: trigger runs for UPDATE OR DELETE only'
);

select ok(
    (
        select t.tgfoid = to_regprocedure(
            'public.prevent_participant_lifecycle_history_mutation()'
        )
        from pg_trigger t
        where t.tgrelid = 'public.participant_lifecycle_history'::regclass
          and t.tgname = 'trg_participant_lifecycle_history_immutable'
    ),
    'history immutability trigger: expected rejection function is invoked'
);

select is(
    (
        select count(*)
        from pg_proc p
        where p.oid = to_regprocedure(
            'public.prevent_participant_lifecycle_history_mutation()'
        )
    ),
    1::bigint,
    'history immutability function: exact function exists'
);

select is(
    (
        select l.lanname
        from pg_proc p
        join pg_language l
          on l.oid = p.prolang
        where p.oid = to_regprocedure(
            'public.prevent_participant_lifecycle_history_mutation()'
        )
    ),
    'plpgsql',
    'history immutability function: language is PL/pgSQL'
);

select ok(
    (
        select p.proconfig @> array['search_path=public, pg_catalog']
        from pg_proc p
        where p.oid = to_regprocedure(
            'public.prevent_participant_lifecycle_history_mutation()'
        )
    ),
    'history immutability function: controlled search path is present'
);

select ok(
    (
        select position(
            'Participant lifecycle history is immutable.'
            in pg_get_functiondef(p.oid)
        ) > 0
        from pg_proc p
        where p.oid = to_regprocedure(
            'public.prevent_participant_lifecycle_history_mutation()'
        )
    ),
    'history immutability function: institutional exception contract is present'
);

-- --------------------------------------------------------------------------
-- Lifecycle-history UPDATE and DELETE rejection: 4 assertions.
-- --------------------------------------------------------------------------

select throws_like(
    $statement$
    update public.participant_lifecycle_history
       set transition_reason = 'Unauthorized history mutation.'
     where participant_id = '30000000-0000-4000-8000-000000000007'
    $statement$,
    'Participant lifecycle history is immutable.',
    'history immutability: direct UPDATE is rejected'
);

select is(
    (
        select transition_reason
        from public.participant_lifecycle_history
        where participant_id = '30000000-0000-4000-8000-000000000007'
    ),
    'Permission test transition.',
    'history immutability: history row remains unchanged after UPDATE'
);

select throws_like(
    $statement$
    delete from public.participant_lifecycle_history
     where participant_id = '30000000-0000-4000-8000-000000000007'
    $statement$,
    'Participant lifecycle history is immutable.',
    'history immutability: direct DELETE is rejected'
);

select is(
    (
        select count(*)
        from public.participant_lifecycle_history
        where participant_id = '30000000-0000-4000-8000-000000000007'
    ),
    1::bigint,
    'history immutability: appended history row still exists after DELETE'
);

-- --------------------------------------------------------------------------
-- RLS posture: 2 assertions.
-- --------------------------------------------------------------------------

select ok(
    (
        select c.relrowsecurity
        from pg_class c
        where c.oid = 'public.participants'::regclass
    ),
    'RLS posture: participants has row-level security enabled'
);

select ok(
    (
        select c.relrowsecurity
        from pg_class c
        where c.oid = 'public.participant_lifecycle_history'::regclass
    ),
    'RLS posture: participant lifecycle history has row-level security enabled'
);

-- --------------------------------------------------------------------------
-- Named-role table CRUD privileges: 24 assertions.
-- --------------------------------------------------------------------------

select is(
    has_table_privilege(
        role_name,
        table_name,
        'SELECT'
    ),
    false,
    format(
        'table privileges: %s cannot SELECT from %s',
        role_name,
        table_name
    )
)
from (
    values
        ('anon', 'public.participants'),
        ('authenticated', 'public.participants'),
        ('service_role', 'public.participants'),
        ('anon', 'public.participant_lifecycle_history'),
        ('authenticated', 'public.participant_lifecycle_history'),
        ('service_role', 'public.participant_lifecycle_history')
) privileges(role_name, table_name);

select is(
    has_table_privilege(
        role_name,
        table_name,
        'INSERT'
    ),
    false,
    format(
        'table privileges: %s cannot INSERT into %s',
        role_name,
        table_name
    )
)
from (
    values
        ('anon', 'public.participants'),
        ('authenticated', 'public.participants'),
        ('service_role', 'public.participants'),
        ('anon', 'public.participant_lifecycle_history'),
        ('authenticated', 'public.participant_lifecycle_history'),
        ('service_role', 'public.participant_lifecycle_history')
) privileges(role_name, table_name);

select is(
    has_table_privilege(
        role_name,
        table_name,
        'UPDATE'
    ),
    false,
    format(
        'table privileges: %s cannot UPDATE %s',
        role_name,
        table_name
    )
)
from (
    values
        ('anon', 'public.participants'),
        ('authenticated', 'public.participants'),
        ('service_role', 'public.participants'),
        ('anon', 'public.participant_lifecycle_history'),
        ('authenticated', 'public.participant_lifecycle_history'),
        ('service_role', 'public.participant_lifecycle_history')
) privileges(role_name, table_name);

select is(
    has_table_privilege(
        role_name,
        table_name,
        'DELETE'
    ),
    false,
    format(
        'table privileges: %s cannot DELETE from %s',
        role_name,
        table_name
    )
)
from (
    values
        ('anon', 'public.participants'),
        ('authenticated', 'public.participants'),
        ('service_role', 'public.participants'),
        ('anon', 'public.participant_lifecycle_history'),
        ('authenticated', 'public.participant_lifecycle_history'),
        ('service_role', 'public.participant_lifecycle_history')
) privileges(role_name, table_name);

-- --------------------------------------------------------------------------
-- PUBLIC table CRUD privileges from relation ACLs: 8 assertions.
-- --------------------------------------------------------------------------

select is(
    (
        select exists (
            select 1
            from pg_class c
            cross join lateral aclexplode(
                coalesce(
                    c.relacl,
                    acldefault('r', c.relowner)
                )
            ) privilege
            where c.oid = table_name::regclass
              and privilege.grantee = 0
              and privilege.privilege_type = privilege_name
        )
    ),
    false,
    format(
        'table privileges: PUBLIC cannot %s %s',
        privilege_name,
        table_name
    )
)
from (
    values
        ('public.participants', 'SELECT'),
        ('public.participants', 'INSERT'),
        ('public.participants', 'UPDATE'),
        ('public.participants', 'DELETE'),
        ('public.participant_lifecycle_history', 'SELECT'),
        ('public.participant_lifecycle_history', 'INSERT'),
        ('public.participant_lifecycle_history', 'UPDATE'),
        ('public.participant_lifecycle_history', 'DELETE')
) public_privileges(table_name, privilege_name);

select * from finish();
rollback;
