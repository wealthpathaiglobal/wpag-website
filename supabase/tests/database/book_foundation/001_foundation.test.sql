-- Synthetic fixtures, rolled back. Run ONLY in an isolated local/staging database.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public,extensions,pg_catalog;
select no_plan();
-- The schema-only local Auth fixture needs the normal Auth helper usage grants.
grant usage on schema auth,extensions to anon,authenticated,service_role;
insert into auth.users(id,email,email_confirmed_at,is_anonymous) values
 ('10000000-0000-4000-8000-000000000001','buyer@test.invalid',now(),false),
 ('10000000-0000-4000-8000-000000000002','participant@test.invalid',now(),false),
 ('10000000-0000-4000-8000-000000000003','dual@test.invalid',now(),false),
 ('10000000-0000-4000-8000-000000000004','other@test.invalid',now(),false),
 ('10000000-0000-4000-8000-000000000005','unconfirmed@test.invalid',null,false);
insert into auth.sessions(id,user_id,not_after)
 select ('20000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'10000000-0000-4000-8000-000000000001',now()+interval '1 day' from generate_series(1,4) n;
insert into public.participants(participant_code,auth_user_id,lifecycle_status,research_status) values('WPAG-777772','10000000-0000-4000-8000-000000000002','active','enrolled');
-- Snapshot all research relations before commerce operations, including participants.
create temp table research_before as select 'participants'::text name,count(*) n from public.participants;
select is(public.book_ensure_reader('10000000-0000-4000-8000-000000000001'),'10000000-0000-4000-8000-000000000001'::uuid,'buyer bootstrap uses Auth UUID');
select is(public.book_ensure_reader('10000000-0000-4000-8000-000000000001'),'10000000-0000-4000-8000-000000000001'::uuid,'existing email/identity bootstrap reuses profile');
select is((select count(*) from public.book_reader_profiles),1::bigint,'one profile, no duplicate Auth identity');
select is((select count(*) from auth.users where email='buyer@test.invalid'),1::bigint,'existing email identity remains singular');
select is((select count(*) from public.participants),(select n from research_before),'buyer does not create participant status');
select throws_ok($$select public.book_ensure_reader('10000000-0000-4000-8000-000000000005')$$,'P0001','BOOK_VERIFIED_AUTH_REQUIRED','unconfirmed email cannot bootstrap');
select is((select count(*) from public.book_reader_profiles where user_id='10000000-0000-4000-8000-000000000002'),0::bigint,'participant identity alone is not a buyer');
-- A participant relationship is created only by the separate synthetic research fixture below.
insert into public.participants(participant_code,auth_user_id,lifecycle_status,research_status)
 values('WPAG-777773','10000000-0000-4000-8000-000000000003','active','enrolled');
create temp table dual_before as select to_jsonb(p) doc from public.participants p where auth_user_id='10000000-0000-4000-8000-000000000003';
select lives_ok($$select public.book_ensure_reader('10000000-0000-4000-8000-000000000003')$$,'same Auth UUID can have both independent relationships');
select is((select to_jsonb(p) from public.participants p where auth_user_id='10000000-0000-4000-8000-000000000003'),(select doc from dual_before),'dual bootstrap does not alter research state');
create temp table fixture_order as select public.book_create_order('10000000-0000-4000-8000-000000000001','hfos-phase-1-stability','order-idempotency-1') id;
create temp table fixture_entitlement as select id from public.book_entitlements where source_order_id=(select id from fixture_order);
select is((select price_minor from public.book_orders where id=(select id from fixture_order)),19900,'server price snapshot ₹199');
select is((select currency from public.book_orders where id=(select id from fixture_order)),'INR','server currency snapshot');
select is((select access_months from public.book_orders where id=(select id from fixture_order)),24,'24 month snapshot');
select is((select max_sessions from public.book_orders where id=(select id from fixture_order)),2,'two session snapshot');
select ok((select delivery='WEB_READER_ONLY' and not auto_renew and not full_pdf_download from public.book_orders where id=(select id from fixture_order)),'delivery/download/renewal terms locked');
select is(public.book_create_order('10000000-0000-4000-8000-000000000001','hfos-phase-1-stability','order-idempotency-1'),(select id from fixture_order),'order retry returns same order');
select throws_ok($$select public.book_create_order('10000000-0000-4000-8000-000000000001','hfos-phase-1-stability','order-idempotency-2')$$,'P0001','BOOK_ORDER_ALREADY_EXISTS','new key cannot duplicate a pending entitlement');
select throws_ok($$select public.book_create_order('10000000-0000-4000-8000-000000000001','other','order-idempotency-1')$$,'P0001','BOOK_IDEMPOTENCY_CONFLICT','idempotency payload mismatch denied');
select is((select status from public.book_entitlements where id=(select id from fixture_entitlement)),'PENDING','pending entitlement grants no access');
select ok((select starts_at is null and expires_at is null from public.book_entitlements where id=(select id from fixture_entitlement)),'pending does not start the clock');
select is(public.book_authorize_reader('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','hfos-phase-1-stability')->>'status','PENDING','pending reader denied');
select throws_ok($$update public.book_orders set price_minor=1 where id=(select id from fixture_order)$$,'P0001','BOOK_ORDER_SNAPSHOT_IMMUTABLE','client/server cannot rewrite original price snapshot');
select is(book_private.access_expiry('2024-02-29 13:45:10+00'),'2026-02-28 13:45:10+00'::timestamptz,'24 calendar months clamps leap day');
set local timezone='America/New_York';
select is(book_private.access_expiry('2025-01-31 23:59:59+00'),'2027-01-31 23:59:59+00'::timestamptz,'calendar expiry independent of session timezone/DST');
set local timezone='UTC';
select is(public.book_record_fulfillment((select id from fixture_order),'synthetic-verified-payment-1',null,'Synthetic local fulfillment'),(select id from fixture_entitlement),'privileged fulfillment activates');
create temp table clock_before as select starts_at,expires_at from public.book_entitlements where id=(select id from fixture_entitlement);
select is((select status from public.book_entitlements where id=(select id from fixture_entitlement)),'ACTIVE','active after privileged fixture path');
select is((select expires_at from clock_before),book_private.access_expiry((select starts_at from clock_before)),'activation exact 24-calendar-month expiry');
select lives_ok($$select public.book_record_fulfillment((select id from fixture_order),'synthetic-verified-payment-1',null,'Retry')$$,'fulfillment retry succeeds');
select is((select starts_at from public.book_entitlements where id=(select id from fixture_entitlement)),(select starts_at from clock_before),'retry preserves original start');
select throws_ok($$select public.book_record_fulfillment((select id from fixture_order),'different-payment',null,'Duplicate payment')$$,'P0001','BOOK_DUPLICATE_PAYMENT_REVIEW_REQUIRED','different payment reference requires recovery review');
select throws_ok($$update public.book_entitlements set starts_at=starts_at+interval '1 day',expires_at=expires_at+interval '1 day' where id=(select id from fixture_entitlement)$$,'P0001','BOOK_ACCESS_CLOCK_IMMUTABLE','clock cannot be extended');
select is(public.book_authorize_reader('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','hfos-phase-1-stability')->>'status','ALLOWED','session one admitted');
create temp table heartbeat_audit_before as select count(*) n from public.book_audit_events;
select is(public.book_authorize_reader('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','hfos-phase-1-stability')->>'status','ALLOWED','same Auth session shares tab slot/heartbeat');
select is((select count(*) from public.book_audit_events),(select n from heartbeat_audit_before),'routine heartbeats do not amplify immutable audit history');
select is((select count(*) from public.book_reader_sessions where ended_at is null),1::bigint,'tabs consume one slot');
select is(public.book_authorize_reader('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','hfos-phase-1-stability')->>'status','ALLOWED','session two admitted');
select is(public.book_authorize_reader('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','hfos-phase-1-stability')->>'status','SESSION_LIMIT','third session denied');
select is(public.book_authorize_reader('10000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000001','hfos-phase-1-stability')->>'status','AUTH_REQUIRED','another user cannot spoof session ownership');
-- Test-only time fixture change; clients/service have no direct lease write privileges.
update public.book_reader_sessions set last_seen_at=now()-interval '4 minutes',lease_expires_at=now()-interval '2 minutes' where auth_session_id='20000000-0000-4000-8000-000000000001';
select is(public.book_authorize_reader('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','hfos-phase-1-stability')->>'status','ALLOWED','stale slot recovered');
select lives_ok($$select public.book_end_reader_session('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002',(select id from fixture_entitlement))$$,'owned slot explicitly ends');
select is(public.book_authorize_reader('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000004','hfos-phase-1-stability')->>'status','ALLOWED','ended slot recovered');
delete from auth.sessions where id='20000000-0000-4000-8000-000000000004';
select is(public.book_authorize_reader('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000004','hfos-phase-1-stability')->>'status','AUTH_REQUIRED','logout invalidates paid reader despite unexpired lease');
select lives_ok($$select public.book_transition_entitlement((select id from fixture_entitlement),'REVOKED',null,'Operator revocation')$$,'revoke allowed');
select is((select count(*) from public.book_reader_sessions where ended_at is null),0::bigint,'revocation invalidates every lease');
select is(public.book_authorize_reader('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','hfos-phase-1-stability')->>'status','REVOKED','revoked reader denied');
select lives_ok($$select public.book_transition_entitlement((select id from fixture_entitlement),'ACTIVE',null,'Correct mistaken revocation')$$,'unexpired mistaken revocation can be restored');
select is((select expires_at from public.book_entitlements where id=(select id from fixture_entitlement)),(select expires_at from clock_before),'restoration keeps original expiry');
select is(public.book_authorize_reader('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','hfos-phase-1-stability')->>'status','ALLOWED','restored entitlement can obtain fresh lease');
select lives_ok($$select public.book_transition_entitlement((select id from fixture_entitlement),'REFUNDED',null,'Synthetic refund')$$,'refund allowed');
select is((select count(*) from public.book_reader_sessions where ended_at is null),0::bigint,'refund invalidates all leases');
select is(public.book_authorize_reader('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','hfos-phase-1-stability')->>'status','REFUNDED','refunded reader denied');
select throws_ok($$select public.book_transition_entitlement((select id from fixture_entitlement),'ACTIVE',null,'Invalid restoration')$$,'P0001','BOOK_ENTITLEMENT_TRANSITION_DENIED','REFUNDED cannot restore to ACTIVE');
select lives_ok($$select public.book_record_fulfillment((select id from fixture_order),'synthetic-verified-payment-1',null,'Late retry')$$,'late retry remains idempotent');
select is((select status from public.book_entitlements where id=(select id from fixture_entitlement)),'REFUNDED','late retry does not reactivate refunded grant');
select lives_ok($$select public.book_record_recovery_event(null,'ACCOUNT_MISMATCH','synthetic-case','Operator investigation','{"order":"synthetic"}')$$,'append-only recovery event supported');
select throws_ok($$update public.book_audit_events set reason='rewrite'$$,'P0001','BOOK_AUDIT_APPEND_ONLY','audit updates forbidden');
select throws_ok($$delete from public.book_audit_events$$,'P0001','BOOK_AUDIT_APPEND_ONLY','audit deletes forbidden');
select throws_ok($$truncate public.book_audit_events$$,'P0001','BOOK_AUDIT_APPEND_ONLY','audit truncation forbidden');
select ok((select count(*)>0 from public.book_audit_events where reason='Operator investigation'),'recovery reason persisted');
-- A synthetic historical ACTIVE row tests effective expiry without changing an original clock.
select public.book_ensure_reader('10000000-0000-4000-8000-000000000004');
insert into auth.sessions(id,user_id) values('20000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000004');
insert into public.book_orders(id,user_id,product_slug,price_minor,currency,access_months,max_sessions,delivery,full_pdf_download,auto_renew,idempotency_key)
 values('30000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000004','hfos-phase-1-stability',19900,'INR',24,2,'WEB_READER_ONLY',false,false,'historical-order');
insert into public.book_entitlements(id,user_id,product_slug,source_order_id,status,starts_at,expires_at)
 values('40000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000004','hfos-phase-1-stability','30000000-0000-4000-8000-000000000004','ACTIVE','2020-01-31Z','2022-01-31Z');
select is(public.book_authorize_reader('10000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000005','hfos-phase-1-stability')->>'status','EXPIRED','effective expiry denies and persists EXPIRED');
select throws_ok($$select public.book_transition_entitlement('40000000-0000-4000-8000-000000000004','ACTIVE',null,'Cannot extend expiry')$$,'P0001','BOOK_ENTITLEMENT_TRANSITION_DENIED','expired grant cannot be restarted');
select lives_ok($$select public.book_create_order('10000000-0000-4000-8000-000000000003','hfos-phase-1-stability','dual-ready-order')$$,'participant may prepare a book order independently');
select is((select to_jsonb(p) from public.participants p where auth_user_id='10000000-0000-4000-8000-000000000003'),(select doc from dual_before),'purchase-readiness leaves participant state unchanged');
select throws_ok($$insert into public.book_entitlements(user_id,product_slug,source_order_id,status) values('10000000-0000-4000-8000-000000000004','hfos-phase-1-stability',(select id from fixture_order),'PENDING')$$,'23505',null,'one entitlement per source order enforced');
select ok((select bool_and(relrowsecurity) from pg_class where oid in ('public.book_reader_profiles'::regclass,'public.book_products'::regclass,'public.book_orders'::regclass,'public.book_entitlements'::regclass,'public.book_reader_sessions'::regclass,'public.book_audit_events'::regclass)),'all commerce tables use RLS');
insert into public.book_orders(id,user_id,product_slug,price_minor,currency,access_months,max_sessions,delivery,full_pdf_download,auto_renew,idempotency_key) values
 ('30000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000003','hfos-phase-1-stability',19900,'INR',24,2,'WEB_READER_ONLY',false,false,'constraint-fixture-6'),
 ('30000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-000000000004','hfos-phase-1-stability',19900,'INR',24,2,'WEB_READER_ONLY',false,false,'constraint-fixture-7');
select throws_ok($$insert into public.book_entitlements(user_id,product_slug,source_order_id,status,starts_at,expires_at) values('10000000-0000-4000-8000-000000000003','hfos-phase-1-stability','30000000-0000-4000-8000-000000000006','ACTIVE',now(),book_private.access_expiry(now()))$$,'23505',null,'partial unique index protects ACTIVE/PENDING across distinct source orders');
select throws_ok($$insert into public.book_entitlements(user_id,product_slug,source_order_id,status,starts_at,expires_at) values('10000000-0000-4000-8000-000000000004','hfos-phase-1-stability','30000000-0000-4000-8000-000000000007','ACTIVE',now(),null)$$,'23514',null,'non-null start requires exact non-null expiry');
select throws_ok($$insert into public.book_entitlements(user_id,product_slug,source_order_id) values('10000000-0000-4000-8000-000000000001','hfos-phase-1-stability','30000000-0000-4000-8000-000000000007')$$,'23503',null,'composite FK prevents cross-account order assignment');
select throws_ok($$select public.book_record_fulfillment((select id from public.book_orders where idempotency_key='dual-ready-order'),'synthetic-verified-payment-1',null,'Duplicate across accounts')$$,'23505',null,'one fulfillment reference cannot be attached to a different order/account');
select ok(not has_schema_privilege('anon','book_private','USAGE') and not has_schema_privilege('authenticated','book_private','USAGE'),'private implementation schema unavailable to clients');
insert into auth.sessions(id,user_id) values('20000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000002');
select is(public.book_authorize_reader('10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000006','hfos-phase-1-stability')->>'status','PROFILE_REQUIRED','participant Auth session alone consumes no reader slot');

-- Effective privilege checks cover every table/column, including non-DML rights.
select ok(not has_table_privilege(r,t,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') and not has_any_column_privilege(r,t,'INSERT,UPDATE,REFERENCES'),r||' cannot directly mutate '||t)
 from unnest(array['anon','authenticated','service_role']) r cross join unnest(array['public.book_reader_profiles','public.book_products','public.book_orders','public.book_entitlements','public.book_reader_sessions','public.book_audit_events']) t;
select ok(not has_function_privilege(r,p.oid,'EXECUTE'),r||' cannot call '||p.proname)
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace cross join unnest(array['anon','authenticated']) r where n.nspname='public' and p.proname like 'book_%';
grant select on fixture_order,fixture_entitlement to anon,authenticated,service_role;
set local role anon;
select throws_ok($$select user_id from public.book_reader_profiles$$,'42501',null,'anon profiles denied');
select throws_ok($$select slug from public.book_products$$,'42501',null,'anon commerce products denied; public preview is static');
select throws_ok($$select id from public.book_orders$$,'42501',null,'anon orders denied');
select throws_ok($$select id from public.book_entitlements$$,'42501',null,'anon entitlements denied');
select throws_ok($$select id from public.book_reader_sessions$$,'42501',null,'anon sessions denied');
select throws_ok($$select id from public.book_audit_events$$,'42501',null,'anon audit denied');
select throws_ok($$select public.book_ensure_reader('10000000-0000-4000-8000-000000000001')$$,'42501',null,'anon bootstrap denied');
reset role;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated","user_metadata":{"account_type":"staff","has_access":true}}',true);
set local role authenticated;
select is((select count(user_id) from public.book_reader_profiles),1::bigint,'owner only sees own profile');
select is((select count(id) from public.book_orders),1::bigint,'owner only sees own order safe projection');
select is((select count(id) from public.book_entitlements),1::bigint,'owner only sees own entitlement safe projection');
select is((select count(id) from public.book_orders where user_id='10000000-0000-4000-8000-000000000004'),0::bigint,'unrelated buyer records hidden');
select throws_ok($$select fulfillment_reference from public.book_orders$$,'42501',null,'payment reference excluded from safe projection');
select ok((select count(id)>0 from public.book_reader_sessions),'owner can read safe session projection');
select throws_ok($$select auth_session_id from public.book_reader_sessions$$,'42501',null,'raw Auth session IDs excluded from buyer reads');
select throws_ok($$update public.book_entitlements set status='ACTIVE'$$,'42501',null,'buyer cannot grant entitlement');
select throws_ok($$update public.book_orders set status='PAID'$$,'42501',null,'buyer cannot mark paid');
select throws_ok($$select public.book_record_fulfillment((select id from fixture_order),'forged-client-payment',null,'forged')$$,'42501',null,'buyer cannot execute fulfillment');
select throws_ok($$select id from public.participants limit 0$$,'42501',null,'buyer/forged metadata cannot acquire research authorization');
reset role;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select is((select count(id) from public.book_orders),0::bigint,'participant-only identity sees no buyer order');
select is((select count(user_id) from public.book_reader_profiles),0::bigint,'participant-only identity sees no reader profile');
reset role;
set local role service_role;
select lives_ok($$select public.book_ensure_reader('10000000-0000-4000-8000-000000000002')$$,'restricted service routine can bootstrap existing Auth identity');
select is(public.book_authorize_reader('10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000006','hfos-phase-1-stability')->>'status','NO_ENTITLEMENT','book profile alone grants no paid access');
select lives_ok($$select public.book_record_recovery_event(null,'DUPLICATE_PAYMENT','test-ref','Test recovery note','{}')$$,'service can append recovery event');
select throws_ok($$update public.book_audit_events set reason='rewrite'$$,'42501',null,'service cannot bypass append-only audit through direct writes');
reset role;
select * from finish();
rollback;
