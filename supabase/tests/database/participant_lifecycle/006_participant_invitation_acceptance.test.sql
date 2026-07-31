begin;

create extension if not exists pgtap with schema extensions;

set local search_path = public, extensions, pg_catalog;

select plan(60);

insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
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
        ('a1000000-0000-4000-8000-000000000001'::uuid, 'accepted@invitation.test'),
        ('a1000000-0000-4000-8000-000000000002'::uuid, 'other@invitation.test'),
        ('a1000000-0000-4000-8000-000000000003'::uuid, 'linked@invitation.test'),
        ('a1000000-0000-4000-8000-000000000004'::uuid, 'invariant@invitation.test'),
        ('a1000000-0000-4000-8000-000000000005'::uuid, 'participant-failure@invitation.test'),
        ('a1000000-0000-4000-8000-000000000006'::uuid, 'invitation-failure@invitation.test')
) users(user_id, email);

insert into public.participants (
    id, participant_code, auth_user_id, lifecycle_status,
    research_status, created_at, deleted_at, updated_by
)
values
    ('b1000000-0000-4000-8000-000000000001', 'WPAG-940001', null, 'pending_enrollment', 'not_enrolled', '2026-01-01 00:00:00+00', null, null),
    ('b1000000-0000-4000-8000-000000000002', 'WPAG-940002', null, 'pending_enrollment', 'not_enrolled', '2026-01-01 00:00:00+00', null, null),
    ('b1000000-0000-4000-8000-000000000003', 'WPAG-940003', null, 'pending_enrollment', 'not_enrolled', '2026-01-01 00:00:00+00', null, null),
    ('b1000000-0000-4000-8000-000000000004', 'WPAG-940004', null, 'pending_enrollment', 'not_enrolled', '2026-01-01 00:00:00+00', null, null),
    ('b1000000-0000-4000-8000-000000000005', 'WPAG-940005', null, 'pending_enrollment', 'not_enrolled', '2026-01-01 00:00:00+00', null, null),
    ('b1000000-0000-4000-8000-000000000006', 'WPAG-940006', null, 'pending_enrollment', 'not_enrolled', '2026-01-01 00:00:00+00', null, null),
    ('b1000000-0000-4000-8000-000000000007', 'WPAG-940007', null, 'pending_enrollment', 'not_enrolled', '2026-01-01 00:00:00+00', null, null),
    ('b1000000-0000-4000-8000-000000000008', 'WPAG-940008', null, 'pending_enrollment', 'not_enrolled', '2026-01-01 00:00:00+00', null, null),
    ('b1000000-0000-4000-8000-000000000009', 'WPAG-940009', null, 'pending_enrollment', 'not_enrolled', '2026-01-01 00:00:00+00', '2026-02-01 00:00:00+00', null),
    ('b1000000-0000-4000-8000-000000000010', 'WPAG-940010', 'a1000000-0000-4000-8000-000000000003', 'pending_enrollment', 'not_enrolled', '2026-01-01 00:00:00+00', null, null),
    ('b1000000-0000-4000-8000-000000000011', 'WPAG-940011', null, 'pending_enrollment', 'not_enrolled', '2026-01-01 00:00:00+00', null, null),
    ('b1000000-0000-4000-8000-000000000013', 'WPAG-940013', null, 'pending_enrollment', 'not_enrolled', '2026-01-01 00:00:00+00', null, null),
    ('b1000000-0000-4000-8000-000000000014', 'WPAG-940014', 'a1000000-0000-4000-8000-000000000004', 'pending_enrollment', 'not_enrolled', '2026-01-01 00:00:00+00', null, 'a1000000-0000-4000-8000-000000000004'),
    ('b1000000-0000-4000-8000-000000000015', 'WPAG-940015', null, 'pending_enrollment', 'not_enrolled', '2026-01-01 00:00:00+00', null, null),
    ('b1000000-0000-4000-8000-000000000016', 'WPAG-940016', null, 'pending_enrollment', 'not_enrolled', '2026-01-01 00:00:00+00', null, null);

insert into public.participant_invitations (
    id, participant_id, email, auth_user_id, status, invited_at,
    accepted_at, revoked_at, expires_at, last_error, invited_by,
    created_at, updated_at
)
values
    ('c1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'accepted@invitation.test', 'a1000000-0000-4000-8000-000000000001', 'sent', '2026-07-01 00:00:00+00', null, null, '2026-08-31 00:00:00+00', 'old safe failure', null, '2026-07-01 00:00:00+00', '2026-07-01 00:00:00+00'),
    ('c1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000002', 'other@invitation.test', 'a1000000-0000-4000-8000-000000000002', 'pending', null, null, null, '2026-08-31 00:00:00+00', null, null, '2026-07-01 00:00:00+00', '2026-07-01 00:00:00+00'),
    ('c1000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000003', 'other@invitation.test', 'a1000000-0000-4000-8000-000000000002', 'revoked', '2026-07-01 00:00:00+00', null, '2026-07-02 00:00:00+00', '2026-08-31 00:00:00+00', null, null, '2026-07-01 00:00:00+00', '2026-07-02 00:00:00+00'),
    ('c1000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000004', 'other@invitation.test', 'a1000000-0000-4000-8000-000000000002', 'failed', '2026-07-01 00:00:00+00', null, null, '2026-08-31 00:00:00+00', 'safe failure', null, '2026-07-01 00:00:00+00', '2026-07-02 00:00:00+00'),
    ('c1000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000005', 'other@invitation.test', 'a1000000-0000-4000-8000-000000000002', 'expired', '2026-06-01 00:00:00+00', null, null, '2026-07-01 00:00:00+00', null, null, '2026-06-01 00:00:00+00', '2026-07-01 00:00:00+00'),
    ('c1000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000006', 'other@invitation.test', 'a1000000-0000-4000-8000-000000000002', 'sent', '2026-06-01 00:00:00+00', null, null, '2026-07-01 00:00:00+00', null, null, '2026-06-01 00:00:00+00', '2026-06-01 00:00:00+00'),
    ('c1000000-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000007', 'other@invitation.test', 'a1000000-0000-4000-8000-000000000002', 'sent', '2026-07-01 00:00:00+00', null, null, '2026-08-31 00:00:00+00', null, null, '2026-07-01 00:00:00+00', '2026-07-01 00:00:00+00'),
    ('c1000000-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000008', 'other@invitation.test', null, 'sent', '2026-07-01 00:00:00+00', null, null, '2026-08-31 00:00:00+00', null, null, '2026-07-01 00:00:00+00', '2026-07-01 00:00:00+00'),
    ('c1000000-0000-4000-8000-000000000009', 'b1000000-0000-4000-8000-000000000009', 'other@invitation.test', 'a1000000-0000-4000-8000-000000000002', 'sent', '2026-07-01 00:00:00+00', null, null, '2026-08-31 00:00:00+00', null, null, '2026-07-01 00:00:00+00', '2026-07-01 00:00:00+00'),
    ('c1000000-0000-4000-8000-000000000010', 'b1000000-0000-4000-8000-000000000010', 'other@invitation.test', 'a1000000-0000-4000-8000-000000000002', 'sent', '2026-07-01 00:00:00+00', null, null, '2026-08-31 00:00:00+00', null, null, '2026-07-01 00:00:00+00', '2026-07-01 00:00:00+00'),
    ('c1000000-0000-4000-8000-000000000011', 'b1000000-0000-4000-8000-000000000011', 'linked@invitation.test', 'a1000000-0000-4000-8000-000000000003', 'sent', '2026-07-01 00:00:00+00', null, null, '2026-08-31 00:00:00+00', null, null, '2026-07-01 00:00:00+00', '2026-07-01 00:00:00+00'),
    ('c1000000-0000-4000-8000-000000000013', 'b1000000-0000-4000-8000-000000000013', 'invariant@invitation.test', 'a1000000-0000-4000-8000-000000000004', 'accepted', '2026-07-01 00:00:00+00', '2026-07-02 00:00:00+00', null, '2026-08-31 00:00:00+00', null, null, '2026-07-01 00:00:00+00', '2026-07-02 00:00:00+00'),
    ('c1000000-0000-4000-8000-000000000014', 'b1000000-0000-4000-8000-000000000014', 'other@invitation.test', 'a1000000-0000-4000-8000-000000000002', 'accepted', '2026-07-01 00:00:00+00', '2026-07-02 00:00:00+00', null, '2026-08-31 00:00:00+00', null, null, '2026-07-01 00:00:00+00', '2026-07-02 00:00:00+00'),
    ('c1000000-0000-4000-8000-000000000015', 'b1000000-0000-4000-8000-000000000015', 'participant-failure@invitation.test', 'a1000000-0000-4000-8000-000000000005', 'sent', '2026-07-01 00:00:00+00', null, null, '2026-08-31 00:00:00+00', null, null, '2026-07-01 00:00:00+00', '2026-07-01 00:00:00+00'),
    ('c1000000-0000-4000-8000-000000000016', 'b1000000-0000-4000-8000-000000000016', 'invitation-failure@invitation.test', 'a1000000-0000-4000-8000-000000000006', 'sent', '2026-07-01 00:00:00+00', null, null, '2026-08-31 00:00:00+00', null, null, '2026-07-01 00:00:00+00', '2026-07-01 00:00:00+00');

-- Catalog and execution permissions: 9 assertions.
select is((select count(*) from pg_proc where oid = to_regprocedure('public.accept_participant_invitation(uuid,uuid)')), 1::bigint, 'acceptance RPC: exact signature exists once');
select is((select l.lanname from pg_proc p join pg_language l on l.oid = p.prolang where p.oid = to_regprocedure('public.accept_participant_invitation(uuid,uuid)')), 'plpgsql', 'acceptance RPC: language is PL/pgSQL');
select ok((select p.prosecdef from pg_proc p where p.oid = to_regprocedure('public.accept_participant_invitation(uuid,uuid)')), 'acceptance RPC: SECURITY DEFINER is enabled');
select is((select pg_get_userbyid(p.proowner) from pg_proc p where p.oid = to_regprocedure('public.accept_participant_invitation(uuid,uuid)')), 'postgres', 'acceptance RPC: owner is postgres');
select ok((select p.proconfig @> array['search_path=public, pg_catalog'] from pg_proc p where p.oid = to_regprocedure('public.accept_participant_invitation(uuid,uuid)')), 'acceptance RPC: controlled search path is present');
select ok(has_function_privilege('service_role', 'public.accept_participant_invitation(uuid,uuid)', 'EXECUTE'), 'acceptance RPC: service_role can execute');
select is((select exists(select 1 from pg_proc p cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl where p.oid = to_regprocedure('public.accept_participant_invitation(uuid,uuid)') and acl.grantee = 0 and acl.privilege_type = 'EXECUTE')), false, 'acceptance RPC: PUBLIC cannot execute');
select is(has_function_privilege('anon', 'public.accept_participant_invitation(uuid,uuid)', 'EXECUTE'), false, 'acceptance RPC: anon cannot execute');
select is(has_function_privilege('authenticated', 'public.accept_participant_invitation(uuid,uuid)', 'EXECUTE'), false, 'acceptance RPC: authenticated cannot execute');

-- Valid acceptance and attribution: 8 assertions.
set local role service_role;
select lives_ok($$select public.accept_participant_invitation('c1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001')$$, 'valid acceptance: service_role RPC succeeds');
reset role;
select is((select auth_user_id from public.participants where id = 'b1000000-0000-4000-8000-000000000001'), 'a1000000-0000-4000-8000-000000000001'::uuid, 'valid acceptance: participant Auth user is linked');
select is((select updated_by from public.participants where id = 'b1000000-0000-4000-8000-000000000001'), 'a1000000-0000-4000-8000-000000000001'::uuid, 'valid acceptance: participant attribution is the invited user');
select is((select status from public.participant_invitations where id = 'c1000000-0000-4000-8000-000000000001'), 'accepted', 'valid acceptance: invitation is accepted');
select ok((select accepted_at is not null from public.participant_invitations where id = 'c1000000-0000-4000-8000-000000000001'), 'valid acceptance: accepted_at is recorded');
select is((select auth_user_id from public.participant_invitations where id = 'c1000000-0000-4000-8000-000000000001'), 'a1000000-0000-4000-8000-000000000001'::uuid, 'valid acceptance: invitation Auth linkage is preserved');
select is((select last_error from public.participant_invitations where id = 'c1000000-0000-4000-8000-000000000001'), null::text, 'valid acceptance: prior safe error is cleared');
select is((select count(*) from public.participants p join public.participant_invitations i on i.participant_id = p.id where p.id = 'b1000000-0000-4000-8000-000000000001' and p.auth_user_id = i.auth_user_id and i.status = 'accepted'), 1::bigint, 'valid acceptance: participant and invitation changes are atomic');

create temporary table acceptance_snapshot as
select i.accepted_at, i.updated_at as invitation_updated_at, p.auth_user_id, p.updated_by
from public.participant_invitations i join public.participants p on p.id = i.participant_id
where i.id = 'c1000000-0000-4000-8000-000000000001';

-- Same-user idempotency: 5 assertions.
set local role service_role;
select lives_ok($$select public.accept_participant_invitation('c1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001')$$, 'idempotency: same-user retry succeeds');
reset role;
select is((select i.accepted_at from public.participant_invitations i where i.id = 'c1000000-0000-4000-8000-000000000001'), (select accepted_at from acceptance_snapshot), 'idempotency: accepted_at is unchanged');
select is((select p.auth_user_id from public.participants p where p.id = 'b1000000-0000-4000-8000-000000000001'), (select auth_user_id from acceptance_snapshot), 'idempotency: participant linkage is unchanged');
select is((select p.updated_by from public.participants p where p.id = 'b1000000-0000-4000-8000-000000000001'), (select updated_by from acceptance_snapshot), 'idempotency: participant attribution is unchanged');
select is((select i.updated_at from public.participant_invitations i where i.id = 'c1000000-0000-4000-8000-000000000001'), (select invitation_updated_at from acceptance_snapshot), 'idempotency: invitation updated_at is unchanged');

-- Input, status, expiry, and binding rejection: 10 assertions.
set local role service_role;
select throws_ok($$select public.accept_participant_invitation(null, 'a1000000-0000-4000-8000-000000000002')$$, 'P1001', 'Invitation ID is required.', 'validation: invitation ID is required');
select throws_ok($$select public.accept_participant_invitation('c1000000-0000-4000-8000-000000000002', null)$$, 'P1001', 'Authenticated user ID is required.', 'validation: Auth user ID is required');
select throws_ok($$select public.accept_participant_invitation('c1000000-0000-4000-8000-999999999999', 'a1000000-0000-4000-8000-000000000002')$$, 'P1001', 'Participant invitation not found.', 'validation: missing invitation is rejected');
select throws_ok($$select public.accept_participant_invitation('c1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002')$$, 'P1001', 'Participant invitation is not active.', 'status: pending invitation is rejected');
select throws_ok($$select public.accept_participant_invitation('c1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000002')$$, 'P1001', 'Participant invitation is not active.', 'status: revoked invitation is rejected');
select throws_ok($$select public.accept_participant_invitation('c1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000002')$$, 'P1001', 'Participant invitation is not active.', 'status: failed invitation is rejected');
select throws_ok($$select public.accept_participant_invitation('c1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000002')$$, 'P1001', 'Participant invitation has expired.', 'expiry: explicit expired invitation is rejected');
select throws_ok($$select public.accept_participant_invitation('c1000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000002')$$, 'P1001', 'Participant invitation has expired.', 'expiry: time-expired sent invitation is rejected');
select throws_ok($$select public.accept_participant_invitation('c1000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000001')$$, 'P1001', 'Authenticated user does not match the invitation.', 'binding: invitation bound to another user is rejected');
select throws_ok($$select public.accept_participant_invitation('c1000000-0000-4000-8000-000000000008', 'a1000000-0000-4000-8000-000000000002')$$, 'P1001', 'Authenticated user does not match the invitation.', 'binding: invitation without Auth binding is rejected');
reset role;

-- Participant and accepted-state invariants: 6 assertions.
select ok(
    (
        select regexp_replace(p.prosrc, '[[:space:]]+', ' ', 'g')
            like '%if not found or v_participant.deleted_at is not null then%message = ''Participant is unavailable for invitation acceptance.'';%'
        from pg_proc p
        where p.oid = to_regprocedure(
            'public.accept_participant_invitation(uuid,uuid)'
        )
    ),
    'participant invariant: function handles a missing participant with the safe unavailable message'
);
set local role service_role;
select throws_ok($$select public.accept_participant_invitation('c1000000-0000-4000-8000-000000000009', 'a1000000-0000-4000-8000-000000000002')$$, 'P1001', 'Participant is unavailable for invitation acceptance.', 'participant invariant: soft-deleted participant is rejected');
select throws_ok($$select public.accept_participant_invitation('c1000000-0000-4000-8000-000000000010', 'a1000000-0000-4000-8000-000000000002')$$, 'P1001', 'Participant is already linked to another authenticated user.', 'participant invariant: participant linked to another user is rejected');
select throws_ok($$select public.accept_participant_invitation('c1000000-0000-4000-8000-000000000011', 'a1000000-0000-4000-8000-000000000003')$$, 'P1001', 'Participant is already linked to another authenticated user.', 'participant invariant: Auth user linked to another participant is rejected');
select throws_ok($$select public.accept_participant_invitation('c1000000-0000-4000-8000-000000000013', 'a1000000-0000-4000-8000-000000000004')$$, 'P1001', 'Participant invitation acceptance state is inconsistent.', 'accepted invariant: participant linkage mismatch is rejected');
select throws_ok($$select public.accept_participant_invitation('c1000000-0000-4000-8000-000000000014', 'a1000000-0000-4000-8000-000000000004')$$, 'P1001', 'Participant invitation acceptance state is inconsistent.', 'accepted invariant: invitation-user mismatch is rejected');
reset role;

-- Lock-source checks: 2 assertions.
select ok((select regexp_replace(p.prosrc, '[[:space:]]+', ' ', 'g') like '%from public.participant_invitations as invitation where invitation.id = p_invitation_id for update%' from pg_proc p where p.oid = to_regprocedure('public.accept_participant_invitation(uuid,uuid)')), 'locking: invitation query explicitly uses FOR UPDATE');
select ok((select regexp_replace(p.prosrc, '[[:space:]]+', ' ', 'g') like '%from public.participants as participant where participant.id = v_invitation.participant_id for update%' from pg_proc p where p.oid = to_regprocedure('public.accept_participant_invitation(uuid,uuid)')), 'locking: participant query explicitly uses FOR UPDATE');

-- Forced participant-update rollback: 4 assertions.
create function pg_temp.reject_acceptance_participant_update() returns trigger language plpgsql as $$begin if new.id = 'b1000000-0000-4000-8000-000000000015' then raise exception 'raw participant trigger diagnostic'; end if; return new; end$$;
create trigger trg_test_reject_acceptance_participant before update on public.participants for each row execute function pg_temp.reject_acceptance_participant_update();
set local role service_role;
select throws_ok($$select public.accept_participant_invitation('c1000000-0000-4000-8000-000000000015', 'a1000000-0000-4000-8000-000000000005')$$, 'P1002', 'Participant invitation acceptance could not be completed.', 'atomicity: participant update failure is sanitized');
reset role;
select is((select auth_user_id from public.participants where id = 'b1000000-0000-4000-8000-000000000015'), null::uuid, 'atomicity: participant remains unchanged after participant failure');
select is((select status from public.participant_invitations where id = 'c1000000-0000-4000-8000-000000000015'), 'sent', 'atomicity: invitation remains sent after participant failure');
select is((select accepted_at from public.participant_invitations where id = 'c1000000-0000-4000-8000-000000000015'), null::timestamptz, 'atomicity: accepted_at remains null after participant failure');
drop trigger trg_test_reject_acceptance_participant on public.participants;

-- Forced invitation-update rollback: 5 assertions.
create function pg_temp.reject_acceptance_invitation_update() returns trigger language plpgsql as $$begin if new.id = 'c1000000-0000-4000-8000-000000000016' then raise exception 'raw invitation trigger diagnostic'; end if; return new; end$$;
create trigger trg_test_reject_acceptance_invitation before update on public.participant_invitations for each row execute function pg_temp.reject_acceptance_invitation_update();
set local role service_role;
select throws_ok($$select public.accept_participant_invitation('c1000000-0000-4000-8000-000000000016', 'a1000000-0000-4000-8000-000000000006')$$, 'P1002', 'Participant invitation acceptance could not be completed.', 'atomicity: invitation update failure is sanitized');
reset role;
select is((select auth_user_id from public.participants where id = 'b1000000-0000-4000-8000-000000000016'), null::uuid, 'atomicity: participant linkage rolls back after invitation failure');
select is((select updated_by from public.participants where id = 'b1000000-0000-4000-8000-000000000016'), null::uuid, 'atomicity: participant attribution rolls back after invitation failure');
select is((select status from public.participant_invitations where id = 'c1000000-0000-4000-8000-000000000016'), 'sent', 'atomicity: invitation remains sent after invitation failure');
select is((select accepted_at from public.participant_invitations where id = 'c1000000-0000-4000-8000-000000000016'), null::timestamptz, 'atomicity: accepted_at remains null after invitation failure');
drop trigger trg_test_reject_acceptance_invitation on public.participant_invitations;

-- Privilege and projection regressions: 11 assertions.
set local role service_role;
select throws_ok($$update public.participants set auth_user_id = null where false$$, '42501', 'permission denied for table participants', 'regression: direct participant UPDATE remains denied');
select throws_ok($$update public.participant_invitations set status = status where false$$, '42501', 'permission denied for table participant_invitations', 'regression: direct invitation UPDATE remains denied');
select lives_ok($$select id, participant_code, auth_user_id, application_id, lifecycle_status, research_status, enrollment_date, created_at, deleted_at from public.participants limit 0$$, 'regression: approved participant projection remains readable');
select throws_ok($$select updated_by from public.participants limit 0$$, '42501', 'permission denied for table participants', 'regression: excluded participant fields remain denied');
select lives_ok($$select id, participant_id, status, invited_at, expires_at, auth_user_id, created_at from public.participant_invitations limit 0$$, 'regression: approved invitation projection remains readable');
select throws_ok($$select last_error from public.participant_invitations limit 0$$, '42501', 'permission denied for table participant_invitations', 'regression: invitation last_error remains denied');
reset role;
set local role anon;
select throws_ok($$select id from public.participants limit 0$$, '42501', 'permission denied for table participants', 'regression: anon has no participant access');
reset role;
set local role authenticated;
select throws_ok($$select id from public.participants limit 0$$, '42501', 'permission denied for table participants', 'regression: authenticated has no participant access');
reset role;
select is((select count(*) from pg_attribute a cross join lateral aclexplode(a.attacl) acl where a.attrelid in ('public.participants'::regclass, 'public.participant_invitations'::regclass) and a.attnum > 0 and acl.grantee = 0 and acl.privilege_type in ('SELECT', 'UPDATE')), 0::bigint, 'regression: PUBLIC has no participant or invitation column access');
select ok(has_function_privilege('service_role', 'public.transition_participant_lifecycle(uuid,text,uuid,text,jsonb)', 'EXECUTE'), 'regression: lifecycle RPC service-role execution remains allowed');
select ok(has_function_privilege('service_role', 'public.create_participant_from_approved_application(uuid,uuid)', 'EXECUTE'), 'regression: atomic conversion RPC service-role execution remains allowed');

select * from finish();
rollback;
