begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,pg_catalog;
select no_plan();

-- Rollback restores any singleton installed by an earlier suite file.
alter table public.hfos_intrinsic_environment_configuration disable trigger hfos_intrinsic_environment_immutable;
delete from public.hfos_intrinsic_environment_configuration;
alter table public.hfos_intrinsic_environment_configuration enable trigger hfos_intrinsic_environment_immutable;

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,banned_until,created_at,updated_at) values
('00000000-0000-0000-0000-000000000000','e0300000-0000-4000-8000-000000000001','authenticated','authenticated','disposable-030-admin@test.local','','2026-01-01','{}','{}',null,'2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','e0300000-0000-4000-8000-000000000002','authenticated','authenticated','hfos-disposable-e2e-e0300000-0000-4000-8000-000000000099@synthetic.invalid','','2026-01-01','{"hfos_environment":"STAGING","hfos_fixture":"DISPOSABLE_E2E_FIXTURE","hfos_fixture_request_id":"e0300000-0000-4000-8000-000000000099"}','{}','2099-01-01','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','e0300000-0000-4000-8000-000000000003','authenticated','authenticated','disposable-030-expired@test.local','','2026-01-01','{}','{}',null,'2026-01-01','2026-01-01'),
    ('00000000-0000-0000-0000-000000000000','e0300000-0000-4000-8000-000000000004','authenticated','authenticated','hfos-disposable-e2e-e0300000-0000-4000-8000-000000000098@synthetic.invalid','','2026-01-01','{"hfos_environment":"STAGING","hfos_fixture":"DISPOSABLE_E2E_FIXTURE","hfos_fixture_request_id":"e0300000-0000-4000-8000-000000000098"}','{}','2099-01-01','2026-01-01','2026-01-01'),
    ('00000000-0000-0000-0000-000000000000','e0300000-0000-4000-8000-000000000005','authenticated','authenticated','hfos-disposable-e2e-e0300000-0000-4000-8000-000000000097@synthetic.invalid','','2026-01-01','{"hfos_environment":"STAGING","hfos_fixture":"DISPOSABLE_E2E_FIXTURE","hfos_fixture_request_id":"e0300000-0000-4000-8000-000000000097"}','{}','2099-01-01','2026-01-01','2026-01-01'),
    ('00000000-0000-0000-0000-000000000000','e0300000-0000-4000-8000-000000000006','authenticated','authenticated','unbound-candidate@synthetic.invalid','','2026-01-01','{}','{}','2099-01-01','2026-01-01','2026-01-01'),
    ('00000000-0000-0000-0000-000000000000','e0300000-0000-4000-8000-000000000007','authenticated','authenticated','hfos-disposable-e2e-e0300000-0000-4000-8000-000000000096@synthetic.invalid','','2026-01-01','{"hfos_environment":"STAGING","hfos_fixture":"DISPOSABLE_E2E_FIXTURE","hfos_fixture_request_id":"e0300000-0000-4000-8000-000000000096"}','{}','2099-01-01','2026-01-01','2026-01-01');
insert into public.staff_members(id,auth_user_id,staff_code,full_name,email,status,created_at) values
('e0301000-0000-4000-8000-000000000001','e0300000-0000-4000-8000-000000000001','WPAG-STF-993001','Disposable 030 Admin','disposable-030-admin@test.local','active','2026-01-01'),
('e0301000-0000-4000-8000-000000000003','e0300000-0000-4000-8000-000000000003','WPAG-STF-993003','Disposable 030 Expired','disposable-030-expired@test.local','active','2026-01-01');
insert into public.staff_member_roles(staff_member_id,staff_role_id,is_active,assigned_at,expires_at)
select 'e0301000-0000-4000-8000-000000000001',sr.id,true,'2026-01-01',null from public.staff_roles as sr where sr.role_code='administrator';
insert into public.staff_member_roles(staff_member_id,staff_role_id,is_active,assigned_at,expires_at)
select 'e0301000-0000-4000-8000-000000000003',sr.id,true,'2026-01-01','2026-01-02' from public.staff_roles as sr where sr.role_code='administrator';

select throws_ok($q$select * from public.reserve_staging_disposable_participant('e0300000-0000-4000-8000-000000000099','hfos-disposable-e2e-e0300000-0000-4000-8000-000000000099@synthetic.invalid','e0300000-0000-4000-8000-000000000001')$q$,'P1001','Intrinsic disposable fixture staging authority is absent or mismatched.','reservation fails closed without intrinsic config');
insert into public.hfos_intrinsic_environment_configuration(environment,project_ref,release_gate,installed_by) values('STAGING','dllefpzhmelflbmopdas','BLOCKED','e0300000-0000-4000-8000-000000000001');
select throws_ok($q$select * from public.list_staging_disposable_reservation_recovery('e0300000-0000-4000-8000-000000000003')$q$,'P1001','Disposable fixture administrator authorization is required.','expired administrator denied');

select lives_ok($q$select * from public.reserve_staging_disposable_participant('e0300000-0000-4000-8000-000000000099','hfos-disposable-e2e-e0300000-0000-4000-8000-000000000099@synthetic.invalid','e0300000-0000-4000-8000-000000000001')$q$,'reservation first');
select is((select r.reservation_status from public.staging_disposable_participant_reservations as r where r.request_id='e0300000-0000-4000-8000-000000000099'),'RESERVED','reservation is durable before Auth binding');
select lives_ok(format($q$select public.bind_staging_disposable_reservation_auth(%L,'e0300000-0000-4000-8000-000000000002',%L,'e0300000-0000-4000-8000-000000000001')$q$,(select r.id from public.staging_disposable_participant_reservations r where r.request_id='e0300000-0000-4000-8000-000000000099'),(select r.auth_creation_claim_token from public.staging_disposable_participant_reservations r where r.request_id='e0300000-0000-4000-8000-000000000099')),'bind exact blocked Auth');
select lives_ok(format($q$select public.bind_staging_disposable_reservation_auth(%L,'e0300000-0000-4000-8000-000000000002',null,'e0300000-0000-4000-8000-000000000001')$q$,(select r.id from public.staging_disposable_participant_reservations as r where r.request_id='e0300000-0000-4000-8000-000000000099')),'bind retry idempotent');
select lives_ok(format($q$select * from public.register_staging_disposable_participant(%L,'e0300000-0000-4000-8000-000000000002','hfos-disposable-e2e-e0300000-0000-4000-8000-000000000099@synthetic.invalid','e0300000-0000-4000-8000-000000000001')$q$,(select r.id from public.staging_disposable_participant_reservations as r where r.request_id='e0300000-0000-4000-8000-000000000099')),'reservation registers');
select is((select r.reservation_status from public.staging_disposable_participant_reservations as r where r.request_id='e0300000-0000-4000-8000-000000000099'),'ACTIVE','active only after binding');
select is((select count(*) from public.participant_research_identities),0::bigint,'no research authority');

create temporary table activation_030(token uuid,request_id uuid) on commit drop;
insert into activation_030 select a.activation_claim_token,'e0308000-0000-4000-8000-000000000001' from public.authorize_staging_disposable_activation(
  (select r.id from public.staging_disposable_participant_reservations r where r.request_id='e0300000-0000-4000-8000-000000000099'),
  (select r.fixture_id from public.staging_disposable_participant_reservations r where r.request_id='e0300000-0000-4000-8000-000000000099'),
  'e0300000-0000-4000-8000-000000000002','e0308000-0000-4000-8000-000000000001','e0300000-0000-4000-8000-000000000001') a;
select is((select count(*) from public.staging_disposable_participant_reservation_events e join public.staging_disposable_participant_reservations r on r.id=e.reservation_id where r.request_id='e0300000-0000-4000-8000-000000000099' and e.event_type='ACTIVATION_AUTHORIZED'),1::bigint,'activation authority emits exactly one event');

create temporary table stale_030_claim(token uuid) on commit drop;
select * from public.reserve_staging_disposable_participant('e0300000-0000-4000-8000-000000000097','hfos-disposable-e2e-e0300000-0000-4000-8000-000000000097@synthetic.invalid','e0300000-0000-4000-8000-000000000001');
insert into stale_030_claim select r.auth_creation_claim_token from public.staging_disposable_participant_reservations r where r.request_id='e0300000-0000-4000-8000-000000000097';
update public.staging_disposable_participant_reservations set auth_creation_claim_expires_at=clock_timestamp()-interval '1 second' where request_id='e0300000-0000-4000-8000-000000000097';
select * from public.reserve_staging_disposable_participant('e0300000-0000-4000-8000-000000000097','hfos-disposable-e2e-e0300000-0000-4000-8000-000000000097@synthetic.invalid','e0300000-0000-4000-8000-000000000001');
select public.bind_staging_disposable_reservation_auth((select id from public.staging_disposable_participant_reservations where request_id='e0300000-0000-4000-8000-000000000097'),'e0300000-0000-4000-8000-000000000005',(select auth_creation_claim_token from public.staging_disposable_participant_reservations where request_id='e0300000-0000-4000-8000-000000000097'),'e0300000-0000-4000-8000-000000000001');
select * from public.register_staging_disposable_participant((select id from public.staging_disposable_participant_reservations where request_id='e0300000-0000-4000-8000-000000000097'),'e0300000-0000-4000-8000-000000000005','hfos-disposable-e2e-e0300000-0000-4000-8000-000000000097@synthetic.invalid','e0300000-0000-4000-8000-000000000001');
select is((select compensation_decision from public.authorize_staging_disposable_auth_compensation((select id from public.staging_disposable_participant_reservations where request_id='e0300000-0000-4000-8000-000000000097'),'e0300000-0000-4000-8000-000000000005',(select token from stale_030_claim),'e0307000-0000-4000-8000-000000000001','e0300000-0000-4000-8000-000000000001')),'SHARED_OR_ADOPTED_DO_NOT_MUTATE','stale A cannot compensate the exact UUID adopted and activated by B');
select is((select count(*) from public.participants where auth_user_id='e0300000-0000-4000-8000-000000000005'),1::bigint,'successor participant remains consistent');
select is((select count(*) from public.participant_profiles pp join public.participants p on p.id=pp.participant_id where p.auth_user_id='e0300000-0000-4000-8000-000000000005'),1::bigint,'successor profile remains consistent');
select is((select count(*) from public.staging_disposable_participant_reservation_events e join public.staging_disposable_participant_reservations r on r.id=e.reservation_id where r.request_id='e0300000-0000-4000-8000-000000000097' and e.event_type in ('REGISTRATION_FAILED_RECOVERY','BLOCK_STATUS_UNVERIFIED_HIGH_SEVERITY')),0::bigint,'stale A writes no erroneous failure event');
select is((select compensation_decision from public.authorize_staging_disposable_auth_compensation((select id from public.staging_disposable_participant_reservations where request_id='e0300000-0000-4000-8000-000000000097'),'e0300000-0000-4000-8000-000000000006',(select token from stale_030_claim),'e0307000-0000-4000-8000-000000000002','e0300000-0000-4000-8000-000000000001')),'INCOMPATIBLE_HIGH_SEVERITY_DO_NOT_MUTATE','different stale candidate enters controlled high-severity recovery');
select is((select compensation_decision from public.authorize_staging_disposable_auth_compensation((select id from public.staging_disposable_participant_reservations where request_id='e0300000-0000-4000-8000-000000000097'),'e0300000-0000-4000-8000-000000000006',(select token from stale_030_claim),'e0307000-0000-4000-8000-000000000002','e0300000-0000-4000-8000-000000000001')),'INCOMPATIBLE_HIGH_SEVERITY_DO_NOT_MUTATE','compensation retry is idempotent');
select is((select count(*) from public.staging_disposable_participant_reservation_events e join public.staging_disposable_participant_reservations r on r.id=e.reservation_id where r.request_id='e0300000-0000-4000-8000-000000000097' and e.event_type='COMPENSATION_CONFLICT_HIGH_SEVERITY'),1::bigint,'one exact high-severity conflict event is durable');

-- Exact adversarial ordering: A's authority is consumed before successor B
-- attempts registration. The non-expiring external-operation marker wins.
select * from public.reserve_staging_disposable_participant('e0300000-0000-4000-8000-000000000096','hfos-disposable-e2e-e0300000-0000-4000-8000-000000000096@synthetic.invalid','e0300000-0000-4000-8000-000000000001');
create temporary table compensation_fence_030(auth_creation_token uuid,compensation_token uuid) on commit drop;
insert into compensation_fence_030(auth_creation_token) select r.auth_creation_claim_token from public.staging_disposable_participant_reservations r where r.request_id='e0300000-0000-4000-8000-000000000096';
select public.bind_staging_disposable_reservation_auth((select id from public.staging_disposable_participant_reservations where request_id='e0300000-0000-4000-8000-000000000096'),'e0300000-0000-4000-8000-000000000007',(select auth_creation_token from compensation_fence_030),'e0300000-0000-4000-8000-000000000001');
update compensation_fence_030 set compensation_token=(select a.compensation_claim_token from public.authorize_staging_disposable_auth_compensation((select id from public.staging_disposable_participant_reservations where request_id='e0300000-0000-4000-8000-000000000096'),'e0300000-0000-4000-8000-000000000007',(select auth_creation_token from compensation_fence_030),'e0307000-0000-4000-8000-000000000006','e0300000-0000-4000-8000-000000000001') a);
select is((select public.begin_staging_disposable_auth_compensation(r.id,r.auth_user_id,'e0307000-0000-4000-8000-000000000006',(select compensation_token from compensation_fence_030),'e0300000-0000-4000-8000-000000000001') from public.staging_disposable_participant_reservations r where r.request_id='e0300000-0000-4000-8000-000000000096'),'MUTATION_AUTHORIZED','A consumes exact compensation authority before the external mutation');
select throws_ok(format($q$select * from public.register_staging_disposable_participant(%L,'e0300000-0000-4000-8000-000000000007','hfos-disposable-e2e-e0300000-0000-4000-8000-000000000096@synthetic.invalid','e0300000-0000-4000-8000-000000000001')$q$,(select id from public.staging_disposable_participant_reservations where request_id='e0300000-0000-4000-8000-000000000096')),'P1001','Disposable registration is blocked by a compensation mutation in progress.','B cannot register across A consumed compensation authority');
select is((select count(*) from public.participants where auth_user_id='e0300000-0000-4000-8000-000000000007'),0::bigint,'compensation-fenced registration creates no participant');
select is((select count(*) from public.staging_disposable_participant_fixtures where request_id='e0300000-0000-4000-8000-000000000096'),0::bigint,'compensation-fenced registration creates no fixture');
select is((select reservation_status from public.staging_disposable_participant_reservations where request_id='e0300000-0000-4000-8000-000000000096'),'AUTH_BOUND_BLOCKED','A remains the only mutation authority while compensation is unresolved');
select * from public.record_staging_disposable_registration_failure((select id from public.staging_disposable_participant_reservations where request_id='e0300000-0000-4000-8000-000000000096'),'e0300000-0000-4000-8000-000000000007',false,true,'e0307000-0000-4000-8000-000000000006',(select compensation_token from compensation_fence_030),'e0300000-0000-4000-8000-000000000001');
select throws_ok(format($q$select * from public.register_staging_disposable_participant(%L,'e0300000-0000-4000-8000-000000000007','hfos-disposable-e2e-e0300000-0000-4000-8000-000000000096@synthetic.invalid','e0300000-0000-4000-8000-000000000001')$q$,(select id from public.staging_disposable_participant_reservations where request_id='e0300000-0000-4000-8000-000000000096')),'P1001','Disposable reservation is not registration-eligible.','resolved compensation is terminal recovery and cannot be reactivated');

select lives_ok(format($q$select * from public.begin_staging_disposable_cleanup(%L,'e0300000-0000-4000-8000-000000000001')$q$,(select f.id from public.staging_disposable_participant_fixtures f where f.request_id='e0300000-0000-4000-8000-000000000099')),'cleanup enters pending');
select is((select activation_state from public.staging_disposable_participant_reservations where request_id='e0300000-0000-4000-8000-000000000099'),'BLOCKED','cleanup atomically invalidates activation authority');
select is((select public.validate_staging_disposable_activation(r.id,r.fixture_id,r.auth_user_id,(select request_id from activation_030),(select token from activation_030),'e0300000-0000-4000-8000-000000000001') from public.staging_disposable_participant_reservations r where r.request_id='e0300000-0000-4000-8000-000000000099'),false,'stale activation token fails after cleanup pending');
select throws_ok(format($q$select * from public.authorize_staging_disposable_activation(%L,%L,'e0300000-0000-4000-8000-000000000002','e0308000-0000-4000-8000-000000000002','e0300000-0000-4000-8000-000000000001')$q$,(select r.id from public.staging_disposable_participant_reservations r where r.request_id='e0300000-0000-4000-8000-000000000099'),(select r.fixture_id from public.staging_disposable_participant_reservations r where r.request_id='e0300000-0000-4000-8000-000000000099')),'P1001','Disposable activation authority is unavailable.','cleanup-pending reservation receives no new activation authority');
update auth.users set banned_until=null where id='e0300000-0000-4000-8000-000000000002';
select throws_ok(format($q$select * from public.finalize_staging_disposable_cleanup(%L,'e0300000-0000-4000-8000-000000000001')$q$,(select f.id from public.staging_disposable_participant_fixtures f where f.request_id='e0300000-0000-4000-8000-000000000099')),'P1001','Disposable cleanup Auth ban and provenance are not verified.','privileged finalization without a ban fails closed');
update auth.users set banned_until='2099-01-01',raw_app_meta_data=jsonb_set(raw_app_meta_data,'{hfos_fixture}','"WRONG"') where id='e0300000-0000-4000-8000-000000000002';
select throws_ok(format($q$select * from public.finalize_staging_disposable_cleanup(%L,'e0300000-0000-4000-8000-000000000001')$q$,(select f.id from public.staging_disposable_participant_fixtures f where f.request_id='e0300000-0000-4000-8000-000000000099')),'P1001','Disposable cleanup Auth ban and provenance are not verified.','wrong Auth app metadata fails closed');
update auth.users set banned_until='2020-01-01',raw_app_meta_data=jsonb_set(raw_app_meta_data,'{hfos_fixture}','"DISPOSABLE_E2E_FIXTURE"') where id='e0300000-0000-4000-8000-000000000002';
select throws_ok(format($q$select * from public.finalize_staging_disposable_cleanup(%L,'e0300000-0000-4000-8000-000000000001')$q$,(select f.id from public.staging_disposable_participant_fixtures f where f.request_id='e0300000-0000-4000-8000-000000000099')),'P1001','Disposable cleanup Auth ban and provenance are not verified.','expired Auth ban fails closed');
update auth.users set banned_until='2099-01-01' where id='e0300000-0000-4000-8000-000000000002';
select lives_ok(format($q$select * from public.finalize_staging_disposable_cleanup(%L,'e0300000-0000-4000-8000-000000000001')$q$,(select f.id from public.staging_disposable_participant_fixtures f where f.request_id='e0300000-0000-4000-8000-000000000099')),'correctly banned exact Auth finalizes cleanup');
select is((select e.event_details->>'auth_access' from public.staging_disposable_participant_fixture_events e join public.staging_disposable_participant_fixtures f on f.id=e.fixture_id where f.request_id='e0300000-0000-4000-8000-000000000099' and e.event_type='REVOKED'),'BANNED','audit wording records only DB-verified ban');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"e0300000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select is((select count(*) from public.get_current_participant()),0::bigint,'cleaned Auth identity cannot self-resolve a soft-deleted participant');
select is((select count(*) from public.get_current_participant_profile()),0::bigint,'cleaned Auth identity cannot read its soft-deleted profile through governed self-service');
select ok(not has_table_privilege('authenticated','public.participant_profiles','SELECT'),'authenticated direct profile table read remains denied');
reset role;

select lives_ok($q$select * from public.reserve_staging_disposable_participant('e0300000-0000-4000-8000-000000000098','hfos-disposable-e2e-e0300000-0000-4000-8000-000000000098@synthetic.invalid','e0300000-0000-4000-8000-000000000001')$q$,'failure request reserves');
select * from public.authorize_staging_disposable_auth_compensation((select r.id from public.staging_disposable_participant_reservations r where r.request_id='e0300000-0000-4000-8000-000000000098'),'e0300000-0000-4000-8000-000000000004',(select r.auth_creation_claim_token from public.staging_disposable_participant_reservations r where r.request_id='e0300000-0000-4000-8000-000000000098'),'e0307000-0000-4000-8000-000000000003','e0300000-0000-4000-8000-000000000001');
select throws_ok(format($q$select * from public.authorize_staging_disposable_auth_compensation(%L,'e0300000-0000-4000-8000-000000000006',%L,'e0307000-0000-4000-8000-000000000004','e0300000-0000-4000-8000-000000000001')$q$,(select r.id from public.staging_disposable_participant_reservations r where r.request_id='e0300000-0000-4000-8000-000000000098'),(select r.auth_creation_claim_token from public.staging_disposable_participant_reservations r where r.request_id='e0300000-0000-4000-8000-000000000098')),'P1001','Disposable compensation authority collision or rebinding was refused.','unexpired compensation request rejects request/UUID rebinding');
select is((select count(*) from public.staging_disposable_participant_reservation_events e join public.staging_disposable_participant_reservations r on r.id=e.reservation_id where r.request_id='e0300000-0000-4000-8000-000000000098' and e.event_type='COMPENSATION_CONFLICT_HIGH_SEVERITY'),0::bigint,'rejected compensation collision creates no duplicate or misleading event');
select is((select public.begin_staging_disposable_auth_compensation(r.id,'e0300000-0000-4000-8000-000000000004','e0307000-0000-4000-8000-000000000003',r.compensation_claim_token,'e0300000-0000-4000-8000-000000000001') from public.staging_disposable_participant_reservations r where r.request_id='e0300000-0000-4000-8000-000000000098'),'MUTATION_AUTHORIZED','exact compensation token is freshly consumed immediately before mutation');
select lives_ok(format($q$select * from public.record_staging_disposable_registration_failure(%L,'e0300000-0000-4000-8000-000000000004',false,false,'e0307000-0000-4000-8000-000000000003',%L,'e0300000-0000-4000-8000-000000000001')$q$,(select r.id from public.staging_disposable_participant_reservations as r where r.request_id='e0300000-0000-4000-8000-000000000098'),(select r.compensation_claim_token from public.staging_disposable_participant_reservations r where r.request_id='e0300000-0000-4000-8000-000000000098')),'bind failure durably claims exact UUID');
select is((select r.auth_user_id from public.staging_disposable_participant_reservations as r where r.request_id='e0300000-0000-4000-8000-000000000098'),'e0300000-0000-4000-8000-000000000004'::uuid,'exact UUID retained');
select is((select r.reservation_status from public.staging_disposable_participant_reservations as r where r.request_id='e0300000-0000-4000-8000-000000000098'),'BLOCK_STATUS_UNVERIFIED_HIGH_SEVERITY','unverified block is high severity');
select throws_ok(format($q$select * from public.register_staging_disposable_participant(%L,'e0300000-0000-4000-8000-000000000004','hfos-disposable-e2e-e0300000-0000-4000-8000-000000000098@synthetic.invalid','e0300000-0000-4000-8000-000000000001')$q$,(select r.id from public.staging_disposable_participant_reservations as r where r.request_id='e0300000-0000-4000-8000-000000000098')),'P1001','Disposable reservation is not registration-eligible.','recovery state cannot activate');
delete from auth.users as u where u.id='e0300000-0000-4000-8000-000000000004';
select lives_ok(format($q$select public.mark_staging_disposable_reservation_auth_deleted(%L,'e0300000-0000-4000-8000-000000000004','e0300000-0000-4000-8000-000000000001')$q$,(select r.id from public.staging_disposable_participant_reservations as r where r.request_id='e0300000-0000-4000-8000-000000000098')),'verified absence marks deleted');
select is((select r.reservation_status from public.staging_disposable_participant_reservations as r where r.request_id='e0300000-0000-4000-8000-000000000098'),'AUTH_DELETED','deleted is terminal');

select ok(not has_function_privilege('authenticated','public.register_staging_disposable_participant(uuid,uuid,text,uuid)','EXECUTE'),'browser cannot provision');
select ok(has_function_privilege('service_role','public.register_staging_disposable_participant(uuid,uuid,text,uuid)','EXECUTE'),'service role governed execute');
select ok(not has_function_privilege('authenticated','public.authorize_staging_disposable_auth_compensation(uuid,uuid,uuid,uuid,uuid)','EXECUTE'),'browser cannot claim compensation authority');
select ok(has_function_privilege('service_role','public.authorize_staging_disposable_auth_compensation(uuid,uuid,uuid,uuid,uuid)','EXECUTE'),'service role alone receives governed compensation execute');
select ok(not has_table_privilege('service_role','public.hfos_intrinsic_environment_configuration','INSERT'),'service role cannot install intrinsic config');
select ok((select c.relrowsecurity and c.relforcerowsecurity from pg_class as c where c.oid='public.staging_disposable_participant_reservations'::regclass),'FORCE RLS');
create table public.disposable_fk_name_probe(id uuid primary key,subject_id uuid references public.participants(id));
select is((select count(*) from pg_constraint con join unnest(con.conkey) k(attnum) on true join pg_attribute a on a.attrelid=con.conrelid and a.attnum=k.attnum where con.contype='f' and con.conrelid='public.disposable_fk_name_probe'::regclass and con.confrelid='public.participants'::regclass and a.attname='subject_id'),1::bigint,'referenced-relation discovery detects a differently named subject_id FK');
drop table public.disposable_fk_name_probe;
select is_empty($q$
  with actual as (
    select con.conrelid root_table,con.conname constraint_name,a.attname::name link_column,con.confrelid referenced_table
    from pg_constraint con join unnest(con.conkey) k(attnum) on true join pg_attribute a on a.attrelid=con.conrelid and a.attnum=k.attnum
    where con.contype='f' and con.confrelid in ('public.participants'::regclass,'auth.users'::regclass)
  ), declared as (select root_table,constraint_name,link_column,referenced_table from public.disposable_cleanup_governed_roots)
  (select * from actual except select * from declared) union all (select * from declared except select * from actual)
$q$,'every participant/Auth foreign key has exactly one explicit cleanup classification');
select is_empty($q$
  with runtime_blockers(root_table,link_column) as (values
    ('public.applications'::regclass,'auth_user_id'::name),
    ('public.assessment_sessions'::regclass,'participant_id'::name),
    ('public.assessments'::regclass,'participant_id'::name),
    ('public.consents'::regclass,'participant_id'::name),
    ('public.evidence_upload_reservations'::regclass,'participant_id'::name),
    ('public.hfos_current_measurement_runs'::regclass,'participant_id'::name),
    ('public.hfos_measurement_audit_log'::regclass,'participant_id'::name),
    ('public.hfos_measurement_runs'::regclass,'participant_id'::name),
    ('public.participant_invitations'::regclass,'auth_user_id'::name),
    ('public.participant_invitations'::regclass,'participant_id'::name),
    ('public.participant_lifecycle_history'::regclass,'participant_id'::name),
    ('public.participant_research_identities'::regclass,'participant_id'::name),
    ('public.preliminary_reports'::regclass,'participant_id'::name),
    ('public.staff_members'::regclass,'auth_user_id'::name)
  ), classified_blockers as (
    select root_table,link_column from public.disposable_cleanup_governed_roots where cleanup_disposition='BLOCKER_ROOT'
  ), admissibility_definition as (
    select pg_get_functiondef('public.assert_disposable_cleanup_admissible(uuid,uuid)'::regprocedure) function_sql
  )
  (select * from runtime_blockers except select * from classified_blockers)
  union all
  (select * from classified_blockers except select * from runtime_blockers)
  union all
  (select r.* from runtime_blockers r cross join admissibility_definition d
   where strpos(d.function_sql,r.root_table::text)=0 or strpos(d.function_sql,r.link_column::text)=0)
$q$,'BLOCKER_ROOT classifications exactly match cleanup admissibility runtime guards');
select * from finish();
rollback;
