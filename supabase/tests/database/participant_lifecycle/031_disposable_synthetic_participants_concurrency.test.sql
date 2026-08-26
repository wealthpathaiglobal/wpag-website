create extension if not exists pgtap with schema extensions;
create extension if not exists dblink with schema extensions;

-- A failed prior run may have committed setup before reaching teardown. Remove
-- only 031-owned identities and provenance before recreating the fixtures.
begin;
alter table public.staging_disposable_participant_reservation_events disable trigger staging_disposable_reservation_events_immutable;
alter table public.staging_disposable_participant_fixture_events disable trigger staging_disposable_fixture_events_immutable;
alter table public.staging_disposable_auth_orphan_events disable trigger staging_disposable_orphan_events_immutable;
alter table public.hfos_intrinsic_environment_configuration disable trigger hfos_intrinsic_environment_immutable;
delete from public.staging_disposable_participant_reservation_events as e where e.reservation_id in(select r.id from public.staging_disposable_participant_reservations as r where r.request_id in('e0310000-0000-4000-8000-000000000098','e0310000-0000-4000-8000-000000000099'));
delete from public.staging_disposable_participant_reservations as r where r.request_id in('e0310000-0000-4000-8000-000000000098','e0310000-0000-4000-8000-000000000099');
delete from public.staging_disposable_participant_fixture_events as e where e.fixture_id in(select f.id from public.staging_disposable_participant_fixtures as f where f.request_id in('e0310000-0000-4000-8000-000000000098','e0310000-0000-4000-8000-000000000099'));
delete from public.staging_disposable_participant_fixtures as f where f.request_id in('e0310000-0000-4000-8000-000000000098','e0310000-0000-4000-8000-000000000099');
delete from public.staging_disposable_auth_orphan_events as e where e.orphan_id in(select o.id from public.staging_disposable_auth_orphans as o where o.request_id in('e0310000-0000-4000-8000-000000000098','e0310000-0000-4000-8000-000000000099'));
delete from public.staging_disposable_auth_orphans as o where o.request_id in('e0310000-0000-4000-8000-000000000098','e0310000-0000-4000-8000-000000000099');
delete from public.participant_profiles as pp where pp.participant_id in(select p.id from public.participants as p where p.auth_user_id='e0310000-0000-4000-8000-000000000002');
delete from public.participants as p where p.auth_user_id='e0310000-0000-4000-8000-000000000002';
delete from public.staff_member_roles as smr where smr.staff_member_id='e0311000-0000-4000-8000-000000000001';
delete from public.staff_members as sm where sm.id='e0311000-0000-4000-8000-000000000001';
delete from public.hfos_intrinsic_environment_configuration as c where c.installed_by='e0310000-0000-4000-8000-000000000001';
delete from auth.users as u where u.id in('e0310000-0000-4000-8000-000000000001','e0310000-0000-4000-8000-000000000002');
alter table public.staging_disposable_participant_reservation_events enable trigger staging_disposable_reservation_events_immutable;
alter table public.staging_disposable_participant_fixture_events enable trigger staging_disposable_fixture_events_immutable;
alter table public.staging_disposable_auth_orphan_events enable trigger staging_disposable_orphan_events_immutable;
alter table public.hfos_intrinsic_environment_configuration enable trigger hfos_intrinsic_environment_immutable;
commit;

-- Committed setup is required because the two dblink sessions cannot see the
-- test runner's uncommitted rows. IDs are private to 031 and cleaned below.
begin;
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,banned_until,created_at,updated_at)
values('00000000-0000-0000-0000-000000000000','e0310000-0000-4000-8000-000000000001','authenticated','authenticated','disposable-031-admin@test.local','','2026-01-01','{}','{}',null,'2026-01-01','2026-01-01');
insert into public.staff_members(id,auth_user_id,staff_code,full_name,email,status,created_at)
values('e0311000-0000-4000-8000-000000000001','e0310000-0000-4000-8000-000000000001','WPAG-STF-993101','Disposable 031 Admin','disposable-031-admin@test.local','active','2026-01-01');
insert into public.staff_member_roles(staff_member_id,staff_role_id,is_active,assigned_at)
select 'e0311000-0000-4000-8000-000000000001',sr.id,true,'2026-01-01' from public.staff_roles as sr where sr.role_code='administrator';
insert into public.hfos_intrinsic_environment_configuration(environment,project_ref,release_gate,installed_by)
select 'STAGING','dllefpzhmelflbmopdas','BLOCKED','e0310000-0000-4000-8000-000000000001'
where not exists(select 1 from public.hfos_intrinsic_environment_configuration);
commit;

begin;
set local search_path=public,extensions,pg_catalog;
select plan(26);
create temporary table reserve_results(caller text,reservation_id uuid,request_id uuid,auth_user_id uuid,fixture_id uuid,participant_id uuid,participant_code text,synthetic_email text,reservation_status text,created_at timestamptz,auth_creation_authority boolean,auth_creation_claim_token uuid,auth_creation_claim_expires_at timestamptz) on commit drop;
select extensions.dblink_connect('reserve031a','host=host.docker.internal port=54322 dbname=postgres user=postgres password=postgres');
select extensions.dblink_connect('reserve031b','host=host.docker.internal port=54322 dbname=postgres user=postgres password=postgres');
select ok(extensions.dblink_send_query('reserve031a',$q$select * from public.reserve_staging_disposable_participant('e0310000-0000-4000-8000-000000000099','hfos-disposable-e2e-e0310000-0000-4000-8000-000000000099@synthetic.invalid','e0310000-0000-4000-8000-000000000001')$q$)=1,'first reservation caller starts');
select ok(extensions.dblink_send_query('reserve031b',$q$select * from public.reserve_staging_disposable_participant('e0310000-0000-4000-8000-000000000099','hfos-disposable-e2e-e0310000-0000-4000-8000-000000000099@synthetic.invalid','e0310000-0000-4000-8000-000000000001')$q$)=1,'competing reservation caller starts');
insert into reserve_results select 'first',r.* from extensions.dblink_get_result('reserve031a',false) as r(reservation_id uuid,request_id uuid,auth_user_id uuid,fixture_id uuid,participant_id uuid,participant_code text,synthetic_email text,reservation_status text,created_at timestamptz,auth_creation_authority boolean,auth_creation_claim_token uuid,auth_creation_claim_expires_at timestamptz);
insert into reserve_results select 'competitor',r.* from extensions.dblink_get_result('reserve031b',false) as r(reservation_id uuid,request_id uuid,auth_user_id uuid,fixture_id uuid,participant_id uuid,participant_code text,synthetic_email text,reservation_status text,created_at timestamptz,auth_creation_authority boolean,auth_creation_claim_token uuid,auth_creation_claim_expires_at timestamptz);
select is((select count(distinct rr.reservation_id) from reserve_results as rr),1::bigint,'competitor deterministically reuses the winner reservation');
select is((select count(*) from reserve_results as rr where rr.reservation_status='RESERVED'),2::bigint,'both callers terminate with RESERVED');
select is((select count(*) from reserve_results rr where rr.auth_creation_authority),1::bigint,'exactly one caller receives Auth-create authority');
select is((select count(*) from public.staging_disposable_participant_reservation_events e join public.staging_disposable_participant_reservations r on r.id=e.reservation_id where r.request_id='e0310000-0000-4000-8000-000000000099' and e.event_type='AUTH_CREATION_CLAIMED'),1::bigint,'one durable Auth-create claim event');
select is((select count(*) from public.staging_disposable_participant_reservations as r where r.request_id='e0310000-0000-4000-8000-000000000099'),1::bigint,'one durable request row');
select is((select count(*) from public.staging_disposable_participant_reservation_events as e join public.staging_disposable_participant_reservations as r on r.id=e.reservation_id where r.request_id='e0310000-0000-4000-8000-000000000099' and e.event_type='RESERVED'),1::bigint,'one durable reservation event');
select is(extensions.dblink_disconnect('reserve031a'),'OK','first reservation session disconnects');
select is(extensions.dblink_disconnect('reserve031b'),'OK','competing reservation session disconnects');
commit;

-- Build a committed ACTIVE fixture for the cleanup race.
begin;
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,banned_until,created_at,updated_at)
values('00000000-0000-0000-0000-000000000000','e0310000-0000-4000-8000-000000000002','authenticated','authenticated','hfos-disposable-e2e-e0310000-0000-4000-8000-000000000098@synthetic.invalid','','2026-01-01','{"hfos_environment":"STAGING","hfos_fixture":"DISPOSABLE_E2E_FIXTURE","hfos_fixture_request_id":"e0310000-0000-4000-8000-000000000098"}','{}','2099-01-01','2026-01-01','2026-01-01');
select * from public.reserve_staging_disposable_participant('e0310000-0000-4000-8000-000000000098','hfos-disposable-e2e-e0310000-0000-4000-8000-000000000098@synthetic.invalid','e0310000-0000-4000-8000-000000000001');
select public.bind_staging_disposable_reservation_auth((select r.id from public.staging_disposable_participant_reservations as r where r.request_id='e0310000-0000-4000-8000-000000000098'),'e0310000-0000-4000-8000-000000000002',(select r.auth_creation_claim_token from public.staging_disposable_participant_reservations r where r.request_id='e0310000-0000-4000-8000-000000000098'),'e0310000-0000-4000-8000-000000000001');
select * from public.register_staging_disposable_participant((select r.id from public.staging_disposable_participant_reservations as r where r.request_id='e0310000-0000-4000-8000-000000000098'),'e0310000-0000-4000-8000-000000000002','hfos-disposable-e2e-e0310000-0000-4000-8000-000000000098@synthetic.invalid','e0310000-0000-4000-8000-000000000001');
commit;

begin;
set local search_path=public,extensions,pg_catalog;
-- Authorizing the stale lease updates the cleanup target. Commit that update
-- before either asynchronous cleanup session starts, otherwise this runner
-- holds the reservation transaction lock while waiting in dblink_get_result.
create temporary table stale_activation_031(token uuid,request_id uuid) on commit preserve rows;
insert into stale_activation_031 select a.activation_claim_token,'e0318000-0000-4000-8000-000000000001' from public.authorize_staging_disposable_activation(
  (select r.id from public.staging_disposable_participant_reservations r where r.request_id='e0310000-0000-4000-8000-000000000098'),
  (select r.fixture_id from public.staging_disposable_participant_reservations r where r.request_id='e0310000-0000-4000-8000-000000000098'),
  'e0310000-0000-4000-8000-000000000002','e0318000-0000-4000-8000-000000000001','e0310000-0000-4000-8000-000000000001') a;
select ok((select token is not null from stale_activation_031),'initial activation/ACTIVE-retry shared unban path holds an exact pre-cleanup lease');
select is((select public.begin_staging_disposable_activation_unban(r.id,r.fixture_id,r.auth_user_id,(select request_id from stale_activation_031),(select token from stale_activation_031),'e0310000-0000-4000-8000-000000000001') from public.staging_disposable_participant_reservations r where r.request_id='e0310000-0000-4000-8000-000000000098'),true,'activation enters durable non-expiring external-op state before Auth unban');
select throws_ok(format($q$select * from public.begin_staging_disposable_cleanup(%L,'e0310000-0000-4000-8000-000000000001')$q$,(select f.id from public.staging_disposable_participant_fixtures f where f.request_id='e0310000-0000-4000-8000-000000000098')),'P1001','Disposable cleanup is blocked by an unresolved activation external operation.','cleanup cannot cross an in-flight external unban');
select is((select public.reconcile_staging_disposable_activation(r.id,r.fixture_id,r.auth_user_id,(select request_id from stale_activation_031),(select token from stale_activation_031),false,'e0310000-0000-4000-8000-000000000001') from public.staging_disposable_participant_reservations r where r.request_id='e0310000-0000-4000-8000-000000000098'),'AMBIGUOUS_REBAN_REQUIRED','lost or failed unban response becomes durable high-severity recovery');
select is((select public.record_staging_disposable_activation_reban(r.id,r.fixture_id,r.auth_user_id,(select request_id from stale_activation_031),true,'e0310000-0000-4000-8000-000000000001') from public.staging_disposable_participant_reservations r where r.request_id='e0310000-0000-4000-8000-000000000098'),'BLOCKED','exact verified corrective re-ban resolves the external-op fence');
commit;

begin;
set local search_path=public,extensions,pg_catalog;
create temporary table cleanup_results(caller text,auth_user_id uuid,participant_id uuid,participant_code text,synthetic_email text,request_id uuid,created_at timestamptz) on commit drop;
select extensions.dblink_connect('cleanup031a','host=host.docker.internal port=54322 dbname=postgres user=postgres password=postgres');
select extensions.dblink_connect('cleanup031b','host=host.docker.internal port=54322 dbname=postgres user=postgres password=postgres');
select ok(extensions.dblink_send_query('cleanup031a',format('select * from public.begin_staging_disposable_cleanup(%L,%L)',(select f.id from public.staging_disposable_participant_fixtures as f where f.request_id='e0310000-0000-4000-8000-000000000098'),'e0310000-0000-4000-8000-000000000001'))=1,'first cleanup caller starts');
select ok(extensions.dblink_send_query('cleanup031b',format('select * from public.begin_staging_disposable_cleanup(%L,%L)',(select f.id from public.staging_disposable_participant_fixtures as f where f.request_id='e0310000-0000-4000-8000-000000000098'),'e0310000-0000-4000-8000-000000000001'))=1,'competing cleanup caller starts');
insert into cleanup_results select 'first',r.* from extensions.dblink_get_result('cleanup031a',false) as r(auth_user_id uuid,participant_id uuid,participant_code text,synthetic_email text,request_id uuid,created_at timestamptz);
insert into cleanup_results select 'competitor',r.* from extensions.dblink_get_result('cleanup031b',false) as r(auth_user_id uuid,participant_id uuid,participant_code text,synthetic_email text,request_id uuid,created_at timestamptz);
select is((select count(distinct row(cr.auth_user_id,cr.participant_id,cr.participant_code,cr.synthetic_email,cr.request_id,cr.created_at)) from cleanup_results as cr),1::bigint,'competitor terminates with the same complete cleanup identity/result');
select is((select count(*) from cleanup_results),2::bigint,'both cleanup callers return deterministically');
select is((select r.reservation_status from public.staging_disposable_participant_reservations as r where r.request_id='e0310000-0000-4000-8000-000000000098'),'CLEANUP_PENDING','cleanup reaches one terminal pending transition');
select is((select r.activation_state from public.staging_disposable_participant_reservations as r where r.request_id='e0310000-0000-4000-8000-000000000098'),'BLOCKED','winning cleanup transaction supersedes the outstanding activation lease');
select is((select public.validate_staging_disposable_activation(r.id,r.fixture_id,r.auth_user_id,(select request_id from stale_activation_031),(select token from stale_activation_031),'e0310000-0000-4000-8000-000000000001') from public.staging_disposable_participant_reservations r where r.request_id='e0310000-0000-4000-8000-000000000098'),false,'stale initial/retry caller cannot validate after cleanup pending');
select * from public.begin_staging_disposable_cleanup((select f.id from public.staging_disposable_participant_fixtures f where f.request_id='e0310000-0000-4000-8000-000000000098'),'e0310000-0000-4000-8000-000000000001');
select is((select count(*) from public.staging_disposable_participant_reservation_events e join public.staging_disposable_participant_reservations r on r.id=e.reservation_id where r.request_id='e0310000-0000-4000-8000-000000000098' and e.event_type='ACTIVATION_INVALIDATED'),1::bigint,'cleanup contention and idempotent retry leave exactly one invalidation event');
select is((select count(*) from public.staging_disposable_participant_fixture_events as e join public.staging_disposable_participant_fixtures as f on f.id=e.fixture_id where f.request_id='e0310000-0000-4000-8000-000000000098' and e.event_type='REVOCATION_STARTED'),1::bigint,'one durable cleanup event');
select is(extensions.dblink_disconnect('cleanup031a'),'OK','first cleanup session disconnects');
select is(extensions.dblink_disconnect('cleanup031b'),'OK','competing cleanup session disconnects');
select * from finish();
commit;

-- Remove only 031-owned committed setup and restore trigger protections.
begin;
alter table public.staging_disposable_participant_reservation_events disable trigger staging_disposable_reservation_events_immutable;
alter table public.staging_disposable_participant_fixture_events disable trigger staging_disposable_fixture_events_immutable;
alter table public.staging_disposable_auth_orphan_events disable trigger staging_disposable_orphan_events_immutable;
alter table public.hfos_intrinsic_environment_configuration disable trigger hfos_intrinsic_environment_immutable;
delete from public.staging_disposable_participant_reservation_events as e where e.reservation_id in(select r.id from public.staging_disposable_participant_reservations as r where r.request_id in('e0310000-0000-4000-8000-000000000098','e0310000-0000-4000-8000-000000000099'));
delete from public.staging_disposable_participant_reservations as r where r.request_id in('e0310000-0000-4000-8000-000000000098','e0310000-0000-4000-8000-000000000099');
delete from public.staging_disposable_participant_fixture_events as e where e.fixture_id in(select f.id from public.staging_disposable_participant_fixtures as f where f.request_id='e0310000-0000-4000-8000-000000000098');
delete from public.staging_disposable_participant_fixtures as f where f.request_id='e0310000-0000-4000-8000-000000000098';
delete from public.staging_disposable_auth_orphan_events as e where e.orphan_id in(select o.id from public.staging_disposable_auth_orphans as o where o.request_id in('e0310000-0000-4000-8000-000000000098','e0310000-0000-4000-8000-000000000099'));
delete from public.staging_disposable_auth_orphans as o where o.request_id in('e0310000-0000-4000-8000-000000000098','e0310000-0000-4000-8000-000000000099');
delete from public.participant_profiles as pp where pp.participant_id in(select p.id from public.participants as p where p.auth_user_id='e0310000-0000-4000-8000-000000000002');
delete from public.participants as p where p.auth_user_id='e0310000-0000-4000-8000-000000000002';
delete from public.staff_member_roles as smr where smr.staff_member_id='e0311000-0000-4000-8000-000000000001';
delete from public.staff_members as sm where sm.id='e0311000-0000-4000-8000-000000000001';
delete from public.hfos_intrinsic_environment_configuration as c where c.installed_by='e0310000-0000-4000-8000-000000000001';
delete from auth.users as u where u.id in('e0310000-0000-4000-8000-000000000001','e0310000-0000-4000-8000-000000000002');
alter table public.staging_disposable_participant_reservation_events enable trigger staging_disposable_reservation_events_immutable;
alter table public.staging_disposable_participant_fixture_events enable trigger staging_disposable_fixture_events_immutable;
alter table public.staging_disposable_auth_orphan_events enable trigger staging_disposable_orphan_events_immutable;
alter table public.hfos_intrinsic_environment_configuration enable trigger hfos_intrinsic_environment_immutable;
commit;
