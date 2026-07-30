begin;

create extension if not exists pgtap with schema extensions;

set local search_path = public, extensions, pg_catalog;

select plan(125);

-- --------------------------------------------------------------------------
-- Participant projection: 23 assertions.
-- --------------------------------------------------------------------------

select is(
    has_column_privilege('service_role', 'public.participants', column_name, 'SELECT'),
    true,
    format('participants projection: service_role can SELECT %s', column_name)
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
        ('created_at'),
        ('deleted_at')
) approved(column_name);

select is(
    has_column_privilege('service_role', 'public.participants', column_name, 'SELECT'),
    false,
    format('participants projection: service_role cannot SELECT %s', column_name)
)
from (
    values
        ('completion_date'),
        ('withdrawal_date'),
        ('withdrawal_reason'),
        ('updated_at'),
        ('internal_notes'),
        ('created_by'),
        ('updated_by')
) excluded(column_name);

select is(
    has_table_privilege('service_role', 'public.participants', 'SELECT'),
    false,
    'participants projection: service_role has no table-level SELECT'
);

select is(
    has_table_privilege('service_role', 'public.participants', privilege_name),
    false,
    format('participants projection: service_role cannot %s', privilege_name)
)
from (values ('INSERT'), ('UPDATE'), ('DELETE')) privileges(privilege_name);

select is(
    has_table_privilege(role_name, 'public.participants', 'SELECT'),
    false,
    format('participants projection: %s has no table-level SELECT', role_name)
)
from (values ('anon'), ('authenticated')) roles(role_name);

select is(
    (
        select count(*)
        from pg_attribute a
        cross join lateral aclexplode(a.attacl) acl
        where a.attrelid = 'public.participants'::regclass
          and a.attnum > 0
          and not a.attisdropped
          and acl.grantee = 0
          and acl.privilege_type = 'SELECT'
    ),
    0::bigint,
    'participants projection: PUBLIC has no column-level SELECT'
);

-- --------------------------------------------------------------------------
-- Participant profile projection: 11 assertions.
-- --------------------------------------------------------------------------

select is(
    has_column_privilege('service_role', 'public.participant_profiles', column_name, 'SELECT'),
    true,
    format('participant profiles projection: service_role can SELECT %s', column_name)
)
from (
    values
        ('participant_id'),
        ('first_name'),
        ('middle_name'),
        ('last_name'),
        ('preferred_name'),
        ('email')
) approved(column_name);

select is(
    has_column_privilege('service_role', 'public.participant_profiles', 'date_of_birth', 'SELECT'),
    false,
    'participant profiles projection: date_of_birth remains excluded'
);

select is(
    has_table_privilege('service_role', 'public.participant_profiles', 'SELECT'),
    false,
    'participant profiles projection: service_role has no table-level SELECT'
);

select is(
    has_table_privilege('service_role', 'public.participant_profiles', privilege_name),
    false,
    format('participant profiles projection: service_role cannot %s', privilege_name)
)
from (values ('INSERT'), ('UPDATE'), ('DELETE')) privileges(privilege_name);

-- --------------------------------------------------------------------------
-- Application projection: 14 assertions.
-- --------------------------------------------------------------------------

select is(
    has_column_privilege('service_role', 'public.applications', column_name, 'SELECT'),
    true,
    format('applications projection: service_role can SELECT %s', column_name)
)
from (
    values
        ('id'),
        ('application_code'),
        ('full_name'),
        ('email'),
        ('phone_country_code'),
        ('phone_number'),
        ('country_code'),
        ('state_or_region'),
        ('city')
) approved(column_name);

select is(
    has_column_privilege('service_role', 'public.applications', 'internal_notes', 'SELECT'),
    false,
    'applications projection: internal_notes remains excluded'
);

select is(
    has_table_privilege('service_role', 'public.applications', 'SELECT'),
    false,
    'applications projection: service_role has no table-level SELECT'
);

select is(
    has_table_privilege('service_role', 'public.applications', privilege_name),
    false,
    format('applications projection: service_role cannot %s', privilege_name)
)
from (values ('INSERT'), ('UPDATE'), ('DELETE')) privileges(privilege_name);

-- --------------------------------------------------------------------------
-- Lifecycle-history projection: 12 assertions.
-- Every table column is intentionally part of this append-only read model.
-- --------------------------------------------------------------------------

select is(
    has_column_privilege(
        'service_role',
        'public.participant_lifecycle_history',
        column_name,
        'SELECT'
    ),
    true,
    format('lifecycle history projection: service_role can SELECT %s', column_name)
)
from (
    values
        ('id'),
        ('participant_id'),
        ('from_status'),
        ('to_status'),
        ('transition_reason'),
        ('changed_at'),
        ('changed_by'),
        ('metadata')
) approved(column_name);

select is(
    has_table_privilege(
        'service_role',
        'public.participant_lifecycle_history',
        'SELECT'
    ),
    false,
    'lifecycle history projection: service_role has no table-level SELECT'
);

select is(
    has_table_privilege(
        'service_role',
        'public.participant_lifecycle_history',
        privilege_name
    ),
    false,
    format('lifecycle history projection: service_role cannot %s', privilege_name)
)
from (values ('UPDATE'), ('DELETE')) privileges(privilege_name);

select is(
    (
        select count(*)
        from pg_trigger
        where tgrelid = 'public.participant_lifecycle_history'::regclass
          and tgname = 'trg_participant_lifecycle_history_immutable'
          and tgenabled = 'O'
          and not tgisinternal
    ),
    1::bigint,
    'lifecycle history projection: immutable-history trigger remains enabled'
);

-- --------------------------------------------------------------------------
-- Invitation projection: 12 assertions.
-- --------------------------------------------------------------------------

select is(
    has_column_privilege(
        'service_role',
        'public.participant_invitations',
        column_name,
        'SELECT'
    ),
    true,
    format('participant invitations projection: service_role can SELECT %s', column_name)
)
from (
    values
        ('id'),
        ('participant_id'),
        ('status'),
        ('invited_at'),
        ('expires_at'),
        ('auth_user_id'),
        ('created_at')
) approved(column_name);

select is(
    has_column_privilege(
        'service_role',
        'public.participant_invitations',
        'last_error',
        'SELECT'
    ),
    false,
    'participant invitations projection: last_error remains excluded'
);

select is(
    has_table_privilege('service_role', 'public.participant_invitations', 'SELECT'),
    false,
    'participant invitations projection: service_role has no table-level SELECT'
);

select is(
    has_table_privilege(
        'service_role',
        'public.participant_invitations',
        privilege_name
    ),
    false,
    format('participant invitations projection: service_role cannot %s', privilege_name)
)
from (values ('INSERT'), ('UPDATE'), ('DELETE')) privileges(privilege_name);

-- --------------------------------------------------------------------------
-- Related-table role isolation: 12 assertions.
-- --------------------------------------------------------------------------

select is(
    has_table_privilege(role_name, table_name, 'SELECT'),
    false,
    format('%s has no table-level SELECT on %s', role_name, table_name)
)
from (
    values
        ('anon', 'public.participant_profiles'),
        ('authenticated', 'public.participant_profiles'),
        ('anon', 'public.applications'),
        ('authenticated', 'public.applications'),
        ('anon', 'public.participant_lifecycle_history'),
        ('authenticated', 'public.participant_lifecycle_history'),
        ('anon', 'public.participant_invitations'),
        ('authenticated', 'public.participant_invitations')
) roles(role_name, table_name);

select is(
    (
        select count(*)
        from pg_attribute a
        cross join lateral aclexplode(a.attacl) acl
        where a.attrelid = table_name::regclass
          and a.attnum > 0
          and not a.attisdropped
          and acl.grantee = 0
          and acl.privilege_type = 'SELECT'
    ),
    0::bigint,
    format('PUBLIC has no column-level SELECT on %s', table_name)
)
from (
    values
        ('public.participant_profiles'),
        ('public.applications'),
        ('public.participant_lifecycle_history'),
        ('public.participant_invitations')
) tables(table_name);

-- --------------------------------------------------------------------------
-- RLS and policy posture: 10 assertions.
-- --------------------------------------------------------------------------

select is(
    (
        select relrowsecurity
        from pg_class
        where oid = table_name::regclass
    ),
    expected_rls,
    format('RLS posture remains unchanged for %s', table_name)
)
from (
    values
        ('public.participants', true),
        ('public.participant_profiles', false),
        ('public.applications', true),
        ('public.participant_lifecycle_history', true),
        ('public.participant_invitations', true)
) tables(table_name, expected_rls);

select is(
    (
        select count(*)
        from pg_policies
        where schemaname = 'public'
          and tablename = split_part(table_name, '.', 2)
    ),
    0::bigint,
    format('policy posture: no policies were added to %s', table_name)
)
from (
    values
        ('public.participants'),
        ('public.participant_profiles'),
        ('public.applications'),
        ('public.participant_lifecycle_history'),
        ('public.participant_invitations')
) tables(table_name);

-- --------------------------------------------------------------------------
-- Real role-switched access attempts: 31 assertions.
-- --------------------------------------------------------------------------

set local role service_role;

select lives_ok(
    $statement$
    select
        id,
        participant_code,
        auth_user_id,
        application_id,
        lifecycle_status,
        research_status,
        enrollment_date,
        created_at,
        deleted_at
    from public.participants
    limit 0
    $statement$,
    'participants runtime: approved projection is readable'
);

select throws_like(
    'select completion_date from public.participants limit 0',
    'permission denied for table participants',
    'participants runtime: excluded column is denied'
);

select throws_like(
    'select * from public.participants limit 0',
    'permission denied for table participants',
    'participants runtime: SELECT * is denied'
);

select throws_like(
    'insert into public.participants default values',
    'permission denied for table participants',
    'participants runtime: INSERT is denied'
);

select throws_like(
    'update public.participants set deleted_at = now() where false',
    'permission denied for table participants',
    'participants runtime: UPDATE is denied'
);

select throws_like(
    'delete from public.participants where false',
    'permission denied for table participants',
    'participants runtime: DELETE is denied'
);

select lives_ok(
    $statement$
    select
        participant_id,
        first_name,
        middle_name,
        last_name,
        preferred_name,
        email
    from public.participant_profiles
    limit 0
    $statement$,
    'participant profiles runtime: approved projection is readable'
);

select throws_like(
    'select date_of_birth from public.participant_profiles limit 0',
    'permission denied for table participant_profiles',
    'participant profiles runtime: excluded column is denied'
);

select throws_like(
    'select * from public.participant_profiles limit 0',
    'permission denied for table participant_profiles',
    'participant profiles runtime: SELECT * is denied'
);

select throws_like(
    'insert into public.participant_profiles default values',
    'permission denied for table participant_profiles',
    'participant profiles runtime: INSERT is denied'
);

select throws_like(
    'update public.participant_profiles set preferred_name = null where false',
    'permission denied for table participant_profiles',
    'participant profiles runtime: UPDATE is denied'
);

select throws_like(
    'delete from public.participant_profiles where false',
    'permission denied for table participant_profiles',
    'participant profiles runtime: DELETE is denied'
);

select lives_ok(
    $statement$
    select
        id,
        application_code,
        full_name,
        email,
        phone_country_code,
        phone_number,
        country_code,
        state_or_region,
        city
    from public.applications
    limit 0
    $statement$,
    'applications runtime: approved projection is readable'
);

select throws_like(
    'select internal_notes from public.applications limit 0',
    'permission denied for table applications',
    'applications runtime: excluded column is denied'
);

select throws_like(
    'select * from public.applications limit 0',
    'permission denied for table applications',
    'applications runtime: SELECT * is denied'
);

select throws_like(
    'insert into public.applications default values',
    'permission denied for table applications',
    'applications runtime: INSERT is denied'
);

select throws_like(
    'update public.applications set internal_notes = null where false',
    'permission denied for table applications',
    'applications runtime: UPDATE is denied'
);

select throws_like(
    'delete from public.applications where false',
    'permission denied for table applications',
    'applications runtime: DELETE is denied'
);

select lives_ok(
    'select * from public.participant_lifecycle_history limit 0',
    'lifecycle history runtime: complete approved projection is readable'
);

select throws_like(
    'update public.participant_lifecycle_history set transition_reason = null where false',
    'permission denied for table participant_lifecycle_history',
    'lifecycle history runtime: UPDATE is denied'
);

select throws_like(
    'delete from public.participant_lifecycle_history where false',
    'permission denied for table participant_lifecycle_history',
    'lifecycle history runtime: DELETE is denied'
);

select lives_ok(
    $statement$
    select
        id,
        participant_id,
        status,
        invited_at,
        expires_at,
        auth_user_id,
        created_at
    from public.participant_invitations
    limit 0
    $statement$,
    'participant invitations runtime: approved projection is readable'
);

select throws_like(
    'select last_error from public.participant_invitations limit 0',
    'permission denied for table participant_invitations',
    'participant invitations runtime: last_error is denied'
);

select throws_like(
    'select * from public.participant_invitations limit 0',
    'permission denied for table participant_invitations',
    'participant invitations runtime: SELECT * is denied'
);

select throws_like(
    'insert into public.participant_invitations default values',
    'permission denied for table participant_invitations',
    'participant invitations runtime: INSERT is denied'
);

select throws_like(
    'update public.participant_invitations set last_error = null where false',
    'permission denied for table participant_invitations',
    'participant invitations runtime: UPDATE is denied'
);

select throws_like(
    'delete from public.participant_invitations where false',
    'permission denied for table participant_invitations',
    'participant invitations runtime: DELETE is denied'
);

reset role;

set local role authenticated;

select throws_like(
    'select id from public.participants limit 0',
    'permission denied for table participants',
    'authenticated runtime: direct participant SELECT is denied'
);

select throws_like(
    'select participant_id from public.participant_profiles limit 0',
    'permission denied for table participant_profiles',
    'authenticated runtime: related-table SELECT is denied'
);

reset role;

set local role anon;

select throws_like(
    'select id from public.participants limit 0',
    'permission denied for table participants',
    'anon runtime: direct participant SELECT is denied'
);

select throws_like(
    'select participant_id from public.participant_invitations limit 0',
    'permission denied for table participant_invitations',
    'anon runtime: related-table SELECT is denied'
);

reset role;

select * from finish();
rollback;
