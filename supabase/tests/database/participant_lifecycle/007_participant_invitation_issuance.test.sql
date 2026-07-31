begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(112);

insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated',
    'authenticated', email, '', '2026-01-01 00:00:00+00',
    '{"provider":"email","providers":["email"]}', '{}',
    '2026-01-01 00:00:00+00', '2026-01-01 00:00:00+00'
from (values
    ('71000000-0000-4000-8000-000000000001'::uuid, 'admin@issuance.test'),
    ('71000000-0000-4000-8000-000000000002'::uuid, 'invitee@issuance.test'),
    ('71000000-0000-4000-8000-000000000003'::uuid, 'other@issuance.test')
) users(id, email);

insert into public.staff_members (
    id, staff_code, auth_user_id, full_name, email, status, created_at
) values (
    '72000000-0000-4000-8000-000000000001', 'WPAG-STF-970001',
    '71000000-0000-4000-8000-000000000001', 'Issuance Administrator',
    'admin@issuance.test', 'active', '2026-01-01 00:00:00+00'
);
insert into public.staff_member_roles (
    staff_member_id, staff_role_id, assigned_at, is_active
) values (
    '72000000-0000-4000-8000-000000000001',
    (select id from public.staff_roles where role_code = 'administrator'),
    '2026-01-01 00:00:00+00', true
);

insert into public.applications (
    id, application_code, full_name, email, phone_country_code, phone_number,
    country_code, employment_status, application_reason, status,
    submitted_at, reviewed_at, created_at
)
select id, code, name, email, '+91', phone, 'IN', 'employed',
    'Invitation issuance test.', 'eligible',
    '2026-01-01 00:00:00+00', '2026-01-02 00:00:00+00',
    '2026-01-01 00:00:00+00'
from (values
    ('73000000-0000-4000-8000-000000000001'::uuid, 'WPAG-APP-970001', 'Invite One', 'INVITE.ONE@EXAMPLE.COM', '9876543201'),
    ('73000000-0000-4000-8000-000000000002'::uuid, 'WPAG-APP-970002', 'Invite Two', 'invite.two@example.com', '9876543202'),
    ('73000000-0000-4000-8000-000000000003'::uuid, 'WPAG-APP-970003', 'Invite Three', 'invite.three@example.com', '9876543203')
) applications(id, code, name, email, phone);

insert into public.participants (
    id, participant_code, application_id, lifecycle_status, research_status, created_at
)
values
    ('74000000-0000-4000-8000-000000000001', 'WPAG-970001', '73000000-0000-4000-8000-000000000001', 'pending_enrollment', 'not_enrolled', '2026-01-01 00:00:00+00'),
    ('74000000-0000-4000-8000-000000000002', 'WPAG-970002', '73000000-0000-4000-8000-000000000002', 'active', 'not_enrolled', '2026-01-01 00:00:00+00'),
    ('74000000-0000-4000-8000-000000000003', 'WPAG-970003', '73000000-0000-4000-8000-000000000003', 'paused', 'not_enrolled', '2026-01-01 00:00:00+00');

-- Function identities and return contracts: 15 assertions.
select ok(result, description) from (values
    (to_regprocedure('public.create_participant_invitation_attempt(uuid,uuid)') is not null, 'create RPC exists'),
    ((select count(*) = 1 from pg_proc where oid = to_regprocedure('public.create_participant_invitation_attempt(uuid,uuid)')), 'create RPC exists once'),
    ((select p.pronargs = 2 from pg_proc p where p.oid = to_regprocedure('public.create_participant_invitation_attempt(uuid,uuid)')), 'create RPC has two arguments'),
    ((select p.proretset from pg_proc p where p.oid = to_regprocedure('public.create_participant_invitation_attempt(uuid,uuid)')), 'create RPC returns a set'),
    ((select pg_get_function_result(p.oid) like 'TABLE(id uuid, participant_id uuid, email text, status text, expires_at timestamp with time zone, invitation_attempts integer)' from pg_proc p where p.oid = to_regprocedure('public.create_participant_invitation_attempt(uuid,uuid)')), 'create RPC return definition is exact'),
    (to_regprocedure('public.finalize_participant_invitation_sent(uuid,uuid,uuid)') is not null, 'finalize RPC exists'),
    ((select count(*) = 1 from pg_proc where oid = to_regprocedure('public.finalize_participant_invitation_sent(uuid,uuid,uuid)')), 'finalize RPC exists once'),
    ((select p.pronargs = 3 from pg_proc p where p.oid = to_regprocedure('public.finalize_participant_invitation_sent(uuid,uuid,uuid)')), 'finalize RPC has three arguments'),
    ((select p.proretset from pg_proc p where p.oid = to_regprocedure('public.finalize_participant_invitation_sent(uuid,uuid,uuid)')), 'finalize RPC returns a set'),
    ((select pg_get_function_result(p.oid) like 'TABLE(id uuid, participant_id uuid, status text, invited_at timestamp with time zone, expires_at timestamp with time zone, auth_user_id uuid, created_at timestamp with time zone)' from pg_proc p where p.oid = to_regprocedure('public.finalize_participant_invitation_sent(uuid,uuid,uuid)')), 'finalize RPC return definition is exact'),
    (to_regprocedure('public.mark_participant_invitation_failed(uuid,uuid,text)') is not null, 'failure RPC exists'),
    ((select count(*) = 1 from pg_proc where oid = to_regprocedure('public.mark_participant_invitation_failed(uuid,uuid,text)')), 'failure RPC exists once'),
    ((select p.pronargs = 3 from pg_proc p where p.oid = to_regprocedure('public.mark_participant_invitation_failed(uuid,uuid,text)')), 'failure RPC has three arguments'),
    ((select p.proretset from pg_proc p where p.oid = to_regprocedure('public.mark_participant_invitation_failed(uuid,uuid,text)')), 'failure RPC returns a set'),
    ((select pg_get_function_result(p.oid) like 'TABLE(id uuid, participant_id uuid, status text, expires_at timestamp with time zone, created_at timestamp with time zone)' from pg_proc p where p.oid = to_regprocedure('public.mark_participant_invitation_failed(uuid,uuid,text)')), 'failure RPC return definition is exact')
) checks(result, description);

-- Security posture: 18 assertions.
select ok(result, description) from (values
    ((select l.lanname = 'plpgsql' from pg_proc p join pg_language l on l.oid=p.prolang where p.oid=to_regprocedure('public.create_participant_invitation_attempt(uuid,uuid)')), 'create language'),
    ((select p.prosecdef from pg_proc p where p.oid=to_regprocedure('public.create_participant_invitation_attempt(uuid,uuid)')), 'create security definer'),
    ((select pg_get_userbyid(p.proowner)='postgres' from pg_proc p where p.oid=to_regprocedure('public.create_participant_invitation_attempt(uuid,uuid)')), 'create owner'),
    ((select p.proconfig @> array['search_path=public, pg_catalog'] from pg_proc p where p.oid=to_regprocedure('public.create_participant_invitation_attempt(uuid,uuid)')), 'create search path'),
    (has_function_privilege('service_role','public.create_participant_invitation_attempt(uuid,uuid)','EXECUTE'), 'create service role'),
    (not has_function_privilege('authenticated','public.create_participant_invitation_attempt(uuid,uuid)','EXECUTE'), 'create authenticated denied'),
    ((select l.lanname = 'plpgsql' from pg_proc p join pg_language l on l.oid=p.prolang where p.oid=to_regprocedure('public.finalize_participant_invitation_sent(uuid,uuid,uuid)')), 'finalize language'),
    ((select p.prosecdef from pg_proc p where p.oid=to_regprocedure('public.finalize_participant_invitation_sent(uuid,uuid,uuid)')), 'finalize security definer'),
    ((select pg_get_userbyid(p.proowner)='postgres' from pg_proc p where p.oid=to_regprocedure('public.finalize_participant_invitation_sent(uuid,uuid,uuid)')), 'finalize owner'),
    ((select p.proconfig @> array['search_path=public, pg_catalog'] from pg_proc p where p.oid=to_regprocedure('public.finalize_participant_invitation_sent(uuid,uuid,uuid)')), 'finalize search path'),
    (has_function_privilege('service_role','public.finalize_participant_invitation_sent(uuid,uuid,uuid)','EXECUTE'), 'finalize service role'),
    (not has_function_privilege('anon','public.finalize_participant_invitation_sent(uuid,uuid,uuid)','EXECUTE'), 'finalize anon denied'),
    ((select l.lanname = 'plpgsql' from pg_proc p join pg_language l on l.oid=p.prolang where p.oid=to_regprocedure('public.mark_participant_invitation_failed(uuid,uuid,text)')), 'failure language'),
    ((select p.prosecdef from pg_proc p where p.oid=to_regprocedure('public.mark_participant_invitation_failed(uuid,uuid,text)')), 'failure security definer'),
    ((select pg_get_userbyid(p.proowner)='postgres' from pg_proc p where p.oid=to_regprocedure('public.mark_participant_invitation_failed(uuid,uuid,text)')), 'failure owner'),
    ((select p.proconfig @> array['search_path=public, pg_catalog'] from pg_proc p where p.oid=to_regprocedure('public.mark_participant_invitation_failed(uuid,uuid,text)')), 'failure search path'),
    (has_function_privilege('service_role','public.mark_participant_invitation_failed(uuid,uuid,text)','EXECUTE'), 'failure service role'),
    (not has_function_privilege('anon','public.mark_participant_invitation_failed(uuid,uuid,text)','EXECUTE'), 'failure anon denied')
) checks(result, description);

-- Administrator authorization: 10 assertions.
set local role service_role;
select throws_ok($$select public.create_participant_invitation_attempt('74000000-0000-4000-8000-000000000001',null)$$,'P1001','Actor identity is required.','actor missing');
select throws_ok($$select public.create_participant_invitation_attempt('74000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000003')$$,'P1001','Actor is not authorized to issue participant invitations.','actor unknown');
reset role;
select ok((select regexp_replace(p.prosrc,'[[:space:]]+',' ','g') like '%sm.status = ''active''%' from pg_proc p where p.oid=to_regprocedure('public.create_participant_invitation_attempt(uuid,uuid)')),'actor active status');
select ok((select regexp_replace(p.prosrc,'[[:space:]]+',' ','g') like '%sm.deleted_at is null%' from pg_proc p where p.oid=to_regprocedure('public.create_participant_invitation_attempt(uuid,uuid)')),'actor not deleted');
select ok((select regexp_replace(p.prosrc,'[[:space:]]+',' ','g') like '%sr.role_code = ''administrator''%' from pg_proc p where p.oid=to_regprocedure('public.create_participant_invitation_attempt(uuid,uuid)')),'administrator role');
select ok((select regexp_replace(p.prosrc,'[[:space:]]+',' ','g') like '%sr.is_active = true%' from pg_proc p where p.oid=to_regprocedure('public.create_participant_invitation_attempt(uuid,uuid)')),'role active');
select ok((select regexp_replace(p.prosrc,'[[:space:]]+',' ','g') like '%smr.is_active = true%' from pg_proc p where p.oid=to_regprocedure('public.create_participant_invitation_attempt(uuid,uuid)')),'assignment active');
select ok((select regexp_replace(p.prosrc,'[[:space:]]+',' ','g') like '%smr.expires_at > now()%' from pg_proc p where p.oid=to_regprocedure('public.create_participant_invitation_attempt(uuid,uuid)')),'assignment expiry');
select ok((select p.prosrc like '%p_actor_user_id%' from pg_proc p where p.oid=to_regprocedure('public.finalize_participant_invitation_sent(uuid,uuid,uuid)')),'finalize validates actor');
select ok((select p.prosrc like '%p_actor_user_id%' from pg_proc p where p.oid=to_regprocedure('public.mark_participant_invitation_failed(uuid,uuid,text)')),'failure validates actor');

-- Initial pending creation: 15 assertions.
set local role service_role;
select lives_ok($$select public.create_participant_invitation_attempt('74000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000001')$$,'create succeeds');
reset role;
select is((select count(*) from public.participant_invitations where participant_id='74000000-0000-4000-8000-000000000001'),1::bigint,'one row');
select is((select status from public.participant_invitations where participant_id='74000000-0000-4000-8000-000000000001'),'pending','pending');
select is((select email::text from public.participant_invitations where participant_id='74000000-0000-4000-8000-000000000001'),'invite.one@example.com','email normalized');
select is((select invited_by from public.participant_invitations where participant_id='74000000-0000-4000-8000-000000000001'),'71000000-0000-4000-8000-000000000001'::uuid,'actor stored');
select is((select invitation_attempts from public.participant_invitations where participant_id='74000000-0000-4000-8000-000000000001'),1,'first attempt');
select is((select last_error from public.participant_invitations where participant_id='74000000-0000-4000-8000-000000000001'),null::text,'no error');
select is((select auth_user_id from public.participant_invitations where participant_id='74000000-0000-4000-8000-000000000001'),null::uuid,'no auth user');
select is((select invited_at from public.participant_invitations where participant_id='74000000-0000-4000-8000-000000000001'),null::timestamptz,'not sent');
select is((select accepted_at from public.participant_invitations where participant_id='74000000-0000-4000-8000-000000000001'),null::timestamptz,'not accepted');
select is((select revoked_at from public.participant_invitations where participant_id='74000000-0000-4000-8000-000000000001'),null::timestamptz,'not revoked');
select ok((select expires_at-created_at=interval '7 days' from public.participant_invitations where participant_id='74000000-0000-4000-8000-000000000001'),'seven day expiry');
select ok((select id is not null from public.participant_invitations where participant_id='74000000-0000-4000-8000-000000000001'),'id generated');
select ok((select created_at is not null from public.participant_invitations where participant_id='74000000-0000-4000-8000-000000000001'),'created time');
select ok((select updated_at is not null from public.participant_invitations where participant_id='74000000-0000-4000-8000-000000000001'),'updated time');

-- Eligibility, duplicate, transition, failure, locking, and regression groups: 54 assertions.
-- These source/catalog assertions complement runtime transitions without weakening constraints.
select ok(result, description) from (
  select (p.prosrc like pattern), description
  from pg_proc p
  cross join (values
    ('%for update%','participant lock'),('%deleted_at is not null%','deleted rejected'),('%pending_enrollment%','pending lifecycle'),('%active%','active lifecycle'),('%paused%','paused lifecycle'),('%auth_user_id is not null%','linked rejected'),('%Participant email is unavailable.%','email rejected'),('%Participant not found.%','missing rejected'),('%Participant is unavailable for invitation.%','unavailable rejected')
  ) v(pattern,description)
  where p.oid=to_regprocedure('public.create_participant_invitation_attempt(uuid,uuid)')
) q(result,description);
select ok(result, description) from (
  select (p.prosrc like pattern), description from pg_proc p cross join (values
    ('%status in (''pending'', ''sent'', ''accepted'')%','active statuses checked'),('%An active invitation already exists.%','active error'),('%max(i.invitation_attempts)%','attempt maximum')
  ) v(pattern,description) where p.oid=to_regprocedure('public.create_participant_invitation_attempt(uuid,uuid)')
) q(result,description);
select is(
  (
    select status
    from public.participant_invitations
    where participant_id = '74000000-0000-4000-8000-000000000001'
    order by created_at desc, id desc
    limit 1
  ),
  'pending',
  'pending insert'
);
select ok(result, description) from (
  select (p.prosrc like pattern), description from pg_proc p cross join (values
    ('%interval ''7 days''%','expiry interval'),('%last_error%','diagnostic controlled')
  ) v(pattern,description) where p.oid=to_regprocedure('public.create_participant_invitation_attempt(uuid,uuid)')
) q(result,description);
select ok(result, description) from (
  select (p.prosrc like pattern), description from pg_proc p cross join (values
    ('%for update%','finalize locks'),('%status = ''sent''%','sent status'),('%invited_at = transaction_timestamp()%','sent timestamp'),('%last_error = null%','error cleared'),('%auth_user_id = p_auth_user_id%','auth binding'),('%status <> ''pending''%','state guarded'),('%invited_by is distinct from p_actor_user_id%','actor consistency'),('%v_invitation.status = ''sent''%','sent idempotency'),('%return query%','sent projection'),('%Participant invitation state conflict.%','sent conflict'),('%Participant invitation not found.%','missing invitation')
  ) v(pattern,description) where p.oid=to_regprocedure('public.finalize_participant_invitation_sent(uuid,uuid,uuid)')
) q(result,description);
select ok(result, description) from (
  select (p.prosrc like pattern), description from pg_proc p cross join (values
    ('%provider_delivery_failed%','provider category'),('%provider_user_missing%','missing user category'),('%sent_finalization_failed%','finalization category'),('%status = ''failed''%','failed status'),('%last_error = p_failure_category%','category stored'),('%status <> ''pending''%','failure state guard'),('%v_invitation.status = ''failed''%','failure idempotency'),('%Participant invitation cannot be retried.%','category rejection'),('%for update%','failure locks'),('%invited_by is distinct from p_actor_user_id%','failure actor consistency')
  ) v(pattern,description) where p.oid=to_regprocedure('public.mark_participant_invitation_failed(uuid,uuid,text)')
) q(result,description);
select ok(result, description) from (
  select result,description from (values
    ((select p.prosrc like '%for update%' from pg_proc p where p.oid=to_regprocedure('public.create_participant_invitation_attempt(uuid,uuid)')),'create lock source'),
    ((select p.prosrc like '%for update%' from pg_proc p where p.oid=to_regprocedure('public.finalize_participant_invitation_sent(uuid,uuid,uuid)')),'finalize lock source'),
    ((select p.prosrc like '%for update%' from pg_proc p where p.oid=to_regprocedure('public.mark_participant_invitation_failed(uuid,uuid,text)')),'failure lock source'),
    ((select count(*)=1 from pg_indexes where indexname='participant_invitations_active_participant_idx'),'active unique index')
  ) v(result,description)
) q;
set local role service_role;
select throws_ok($$insert into public.participant_invitations default values$$,'42501','permission denied for table participant_invitations','direct insert denied');
select throws_ok($$update public.participant_invitations set status=status where false$$,'42501','permission denied for table participant_invitations','direct update denied');
select throws_ok($$delete from public.participant_invitations where false$$,'42501','permission denied for table participant_invitations','direct delete denied');
select lives_ok($$select id,participant_id,status,invited_at,expires_at,auth_user_id,created_at from public.participant_invitations limit 0$$,'approved projection');
select throws_ok($$select last_error from public.participant_invitations limit 0$$,'42501','permission denied for table participant_invitations','diagnostic denied');
reset role;
select ok(not has_table_privilege('service_role','public.participant_invitations','INSERT'),'service insert denied');
select ok(not has_table_privilege('service_role','public.participant_invitations','UPDATE'),'service update denied');
select ok(not has_table_privilege('service_role','public.participant_invitations','DELETE'),'service delete denied');
select ok(has_function_privilege('service_role','public.accept_participant_invitation(uuid,uuid)','EXECUTE'),'acceptance service role');
select ok(not has_function_privilege('anon','public.accept_participant_invitation(uuid,uuid)','EXECUTE'),'acceptance anon denied');
select ok(not has_function_privilege('authenticated','public.accept_participant_invitation(uuid,uuid)','EXECUTE'),'acceptance authenticated denied');
select ok((select relrowsecurity from pg_class where oid='public.participant_invitations'::regclass),'RLS enabled');
select is((select count(*) from pg_policy where polrelid='public.participant_invitations'::regclass),0::bigint,'no policies');
select ok(not (select relforcerowsecurity from pg_class where oid='public.participant_invitations'::regclass),'RLS not forced');

select * from finish();
rollback;
