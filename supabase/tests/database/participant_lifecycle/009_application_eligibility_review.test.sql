begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(132);

-- Command/read function catalog and permissions: 18 assertions.
select ok(result, description) from (values
  (to_regprocedure('public.list_pending_application_reviews()') is not null,'queue RPC exists'),
  (to_regprocedure('public.get_application_review(uuid)') is not null,'detail RPC exists'),
  (to_regprocedure('public.transition_application_eligibility_review(uuid,uuid,text,text,text)') is not null,'transition RPC exists'),
  ((select prosecdef from pg_proc where oid=to_regprocedure('public.list_pending_application_reviews()')),'queue RPC is security definer'),
  ((select prosecdef from pg_proc where oid=to_regprocedure('public.get_application_review(uuid)')),'detail RPC is security definer'),
  ((select prosecdef from pg_proc where oid=to_regprocedure('public.transition_application_eligibility_review(uuid,uuid,text,text,text)')),'transition RPC is security definer'),
  ((select pg_get_userbyid(proowner)='postgres' from pg_proc where oid=to_regprocedure('public.list_pending_application_reviews()')),'queue owner is postgres'),
  ((select pg_get_userbyid(proowner)='postgres' from pg_proc where oid=to_regprocedure('public.get_application_review(uuid)')),'detail owner is postgres'),
  ((select pg_get_userbyid(proowner)='postgres' from pg_proc where oid=to_regprocedure('public.transition_application_eligibility_review(uuid,uuid,text,text,text)')),'transition owner is postgres'),
  ((select proconfig @> array['search_path=public, pg_catalog'] from pg_proc where oid=to_regprocedure('public.list_pending_application_reviews()')),'queue search path controlled'),
  ((select proconfig @> array['search_path=public, pg_catalog'] from pg_proc where oid=to_regprocedure('public.get_application_review(uuid)')),'detail search path controlled'),
  ((select proconfig @> array['search_path=public, pg_catalog'] from pg_proc where oid=to_regprocedure('public.transition_application_eligibility_review(uuid,uuid,text,text,text)')),'transition search path controlled'),
  (has_function_privilege('service_role','public.list_pending_application_reviews()','EXECUTE'),'service role executes queue RPC'),
  (has_function_privilege('service_role','public.get_application_review(uuid)','EXECUTE'),'service role executes detail RPC'),
  (has_function_privilege('service_role','public.transition_application_eligibility_review(uuid,uuid,text,text,text)','EXECUTE'),'service role executes transition RPC'),
  (not has_function_privilege('anon','public.transition_application_eligibility_review(uuid,uuid,text,text,text)','EXECUTE'),'anon transition denied'),
  (not has_function_privilege('authenticated','public.transition_application_eligibility_review(uuid,uuid,text,text,text)','EXECUTE'),'authenticated transition denied'),
  ((select not exists(select 1 from aclexplode(proacl) where grantee=0) from pg_proc where oid=to_regprocedure('public.transition_application_eligibility_review(uuid,uuid,text,text,text)')),'PUBLIC transition denied')
) checks(result,description);

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values ('00000000-0000-0000-0000-000000000000','91000000-0000-4000-8000-000000000001','authenticated','authenticated','review.admin@test.local','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01');
insert into public.staff_members(id,staff_code,auth_user_id,full_name,email,status,created_at)
values ('91100000-0000-4000-8000-000000000001','WPAG-STF-990001','91000000-0000-4000-8000-000000000001','Review Admin','review.admin@test.local','active','2026-01-01');
insert into public.staff_member_roles(staff_member_id,staff_role_id,assigned_at,is_active)
values ('91100000-0000-4000-8000-000000000001',(select id from public.staff_roles where role_code='administrator'),'2026-01-01',true);

insert into public.applications(id,application_code,full_name,email,phone_country_code,phone_number,country_code,application_reason,status,submitted_at,created_at)
select id,code,name,email,'+91',phone,'IN','A sufficiently durable application reason.',status,'2026-01-01','2026-01-01' from (values
 ('92000000-0000-4000-8000-000000000001'::uuid,'WPAG-APP-990001','Approve One','approve.one@test.local','9000000001','submitted'),
 ('92000000-0000-4000-8000-000000000002'::uuid,'WPAG-APP-990002','Reject One','reject.one@test.local','9000000002','submitted'),
 ('92000000-0000-4000-8000-000000000003'::uuid,'WPAG-APP-990003','Info One','info.one@test.local','9000000003','submitted'),
 ('92000000-0000-4000-8000-000000000004'::uuid,'WPAG-APP-990004','Info Approve','info.approve@test.local','9000000004','additional_information_required'),
 ('92000000-0000-4000-8000-000000000005'::uuid,'WPAG-APP-990005','Completed One','completed@test.local','9000000005','ineligible'),
 ('92000000-0000-4000-8000-000000000006'::uuid,'WPAG-APP-990006','Deleted One','deleted@test.local','9000000006','submitted'),
 ('92000000-0000-4000-8000-000000000007'::uuid,'WPAG-APP-990007','Atomic Failure','atomic.review@test.local','9000000007','submitted')
) f(id,code,name,email,phone,status);
update public.applications set deleted_at='2026-02-01' where id='92000000-0000-4000-8000-000000000006';
insert into public.eligibility_reviews(id,application_id,review_number,review_status,decision,additional_information_required,ineligibility_reason,started_at,completed_at,reviewed_by,created_at)
values
 ('93000000-0000-4000-8000-000000000001','92000000-0000-4000-8000-000000000001',1,'pending','pending',null,null,null,null,null,'2026-01-01'),
 ('93000000-0000-4000-8000-000000000002','92000000-0000-4000-8000-000000000002',1,'pending','pending',null,null,null,null,null,'2026-01-01'),
 ('93000000-0000-4000-8000-000000000003','92000000-0000-4000-8000-000000000003',1,'pending','pending',null,null,null,null,null,'2026-01-01'),
 ('93000000-0000-4000-8000-000000000004','92000000-0000-4000-8000-000000000004',1,'in_review','pending','Original requirement',null,'2026-01-01',null,null,'2026-01-01'),
 ('93000000-0000-4000-8000-000000000005','92000000-0000-4000-8000-000000000005',1,'completed','ineligible',null,'Eligibility criteria not met.','2026-01-01','2026-01-02','91000000-0000-4000-8000-000000000001','2026-01-01'),
 ('93000000-0000-4000-8000-000000000006','92000000-0000-4000-8000-000000000006',1,'pending','pending',null,null,null,null,null,'2026-01-01'),
 ('93000000-0000-4000-8000-000000000007','92000000-0000-4000-8000-000000000007',1,'pending','pending',null,null,null,null,null,'2026-01-01');

-- Administrator authorization variants: 14 assertions.
set local role service_role;
select throws_ok($$select * from public.transition_application_eligibility_review('92000000-0000-4000-8000-000000000001',null,'approve',null,null)$$,'P1001','Actor identity is required.','null actor denied');
select throws_ok($$select * from public.transition_application_eligibility_review('92000000-0000-4000-8000-000000000001','99900000-0000-4000-8000-000000000001','approve',null,null)$$,'P1001','Actor is not authorized to review applications.','unknown actor denied');
select throws_ok($$select * from public.transition_application_eligibility_review(null,'91000000-0000-4000-8000-000000000001','approve',null,null)$$,'P1001','Application ID is required.','null application denied');
select throws_ok($$select * from public.transition_application_eligibility_review('99900000-0000-4000-8000-000000000002','91000000-0000-4000-8000-000000000001','approve',null,null)$$,'P1001','Application was not found.','missing application denied');
select throws_ok($$select * from public.transition_application_eligibility_review('92000000-0000-4000-8000-000000000006','91000000-0000-4000-8000-000000000001','approve',null,null)$$,'P1001','Application is unavailable.','deleted application denied');
select throws_ok($$select * from public.transition_application_eligibility_review('92000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001','invalid',null,null)$$,'P1001','Eligibility decision is invalid.','invalid decision denied');
select throws_ok($$select * from public.transition_application_eligibility_review('92000000-0000-4000-8000-000000000002','91000000-0000-4000-8000-000000000001','reject',null,null)$$,'P1001','A rejection reason is required.','blank rejection reason denied');
select throws_ok($$select * from public.transition_application_eligibility_review('92000000-0000-4000-8000-000000000003','91000000-0000-4000-8000-000000000001','request_more_information',null,null)$$,'P1001','Additional information requirements are required.','blank information requirement denied');
reset role;
select ok(not has_function_privilege('anon','public.list_pending_application_reviews()','EXECUTE'),'anon queue denied');
select ok(not has_function_privilege('authenticated','public.list_pending_application_reviews()','EXECUTE'),'authenticated queue denied');
select ok(not has_function_privilege('anon','public.get_application_review(uuid)','EXECUTE'),'anon detail denied');
select ok(not has_function_privilege('authenticated','public.get_application_review(uuid)','EXECUTE'),'authenticated detail denied');
select ok(has_function_privilege('service_role','public.transition_application_eligibility_review(uuid,uuid,text,text,text)','EXECUTE'),'valid administrator boundary callable by service role');
select ok((select count(*)=1 from public.staff_members where auth_user_id='91000000-0000-4000-8000-000000000001' and status='active'),'active administrator fixture valid');

-- Row-lock/source invariants: 8 assertions.
select ok(result,description) from (select lower(regexp_replace(prosrc,'[[:space:]]+',' ','g')) source from pg_proc where oid=to_regprocedure('public.transition_application_eligibility_review(uuid,uuid,text,text,text)')) s cross join lateral (values
 (s.source like '%from public.applications a%for update%','application row lock present'),
 (s.source like '%from public.eligibility_reviews er%for update%','review row lock present'),
 (s.source like '%create_participant_from_approved_application%','governed conversion called'),
 (s.source like '%transaction_timestamp()%','transaction timestamp used'),
 (s.source like '%staff_members%staff_member_roles%staff_roles%','administrator joins present'),
 (s.source like '%application review operation could not be completed.%','unknown failures sanitized'),
 (s.source not like '%execute %','no dynamic SQL'),
 (s.source not like '%set role%','function cannot change role')
) c(result,description);

-- Execute representative supported transitions.
set local role service_role;
select lives_ok($$select * from public.transition_application_eligibility_review('92000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001','approve',' approved notes ',null)$$,'submitted approval succeeds');
select lives_ok($$select * from public.transition_application_eligibility_review('92000000-0000-4000-8000-000000000002','91000000-0000-4000-8000-000000000001','reject',' rejected notes ',' institutional reason ')$$,'submitted rejection succeeds');
select lives_ok($$select * from public.transition_application_eligibility_review('92000000-0000-4000-8000-000000000003','91000000-0000-4000-8000-000000000001','request_more_information',' info notes ',' provide evidence ')$$,'submitted information request succeeds');
select lives_ok($$select * from public.transition_application_eligibility_review('92000000-0000-4000-8000-000000000004','91000000-0000-4000-8000-000000000001','approve',' approved later ',null)$$,'in-review approval succeeds');
reset role;

-- Decision/state matrix: remaining 20 assertions (24 with the four lives_ok above).
select ok(result,description) from (values
 ((select status='converted' from public.applications where id='92000000-0000-4000-8000-000000000001'),'approved application converted'),
 ((select review_status='completed' from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000001'),'approved review completed'),
 ((select decision='eligible' from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000001'),'approved decision eligible'),
 ((select status='ineligible' from public.applications where id='92000000-0000-4000-8000-000000000002'),'rejected application ineligible'),
 ((select decision='ineligible' from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000002'),'rejected decision ineligible'),
 ((select review_status='completed' from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000002'),'rejected review completed'),
 ((select status='additional_information_required' from public.applications where id='92000000-0000-4000-8000-000000000003'),'information application state set'),
 ((select review_status='in_review' from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000003'),'information review in progress'),
 ((select decision='pending' from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000003'),'information decision pending'),
 ((select status='converted' from public.applications where id='92000000-0000-4000-8000-000000000004'),'in-review application approved and converted'),
 ((select decision='eligible' from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000004'),'in-review decision eligible'),
 ((select review_status='completed' from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000004'),'in-review review completed'),
 ((select count(*)=2 from public.participants where application_id in ('92000000-0000-4000-8000-000000000001','92000000-0000-4000-8000-000000000004')),'only approvals create participants'),
 ((select count(*)=0 from public.participants where application_id in ('92000000-0000-4000-8000-000000000002','92000000-0000-4000-8000-000000000003')),'nonapprovals create no participants'),
 ((select completed_at is null from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000003'),'information completion remains null'),
 ((select reviewed_at is null from public.applications where id='92000000-0000-4000-8000-000000000003'),'information reviewed timestamp remains null'),
 ((select completed_at is not null from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000001'),'approval completion timestamp set'),
 ((select completed_at is not null from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000002'),'rejection completion timestamp set'),
 ((select status='ineligible' from public.applications where id='92000000-0000-4000-8000-000000000005'),'completed application unchanged'),
 ((select decision='ineligible' from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000005'),'completed review unchanged')
) checks(result,description);

-- Attribution, notes and reasons: 16 assertions.
select ok(result,description) from (values
 ((select reviewed_by='91000000-0000-4000-8000-000000000001' from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000001'),'approval review actor'),
 ((select updated_by='91000000-0000-4000-8000-000000000001' from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000001'),'approval review updater'),
 ((select reviewed_by='91000000-0000-4000-8000-000000000001' from public.applications where id='92000000-0000-4000-8000-000000000001'),'approval application reviewer'),
 ((select updated_by='91000000-0000-4000-8000-000000000001' from public.applications where id='92000000-0000-4000-8000-000000000001'),'approval application updater'),
 ((select decision_summary='approved notes' from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000001'),'approval notes normalized'),
 ((select ineligibility_reason='institutional reason' from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000002'),'rejection reason normalized'),
 ((select decision_summary='rejected notes' from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000002'),'rejection notes normalized'),
 ((select additional_information_required='provide evidence' from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000003'),'information reason normalized'),
 ((select decision_summary='info notes' from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000003'),'information notes normalized'),
 ((select ineligibility_reason is null from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000003'),'information clears rejection reason'),
 ((select additional_information_required is null from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000002'),'rejection clears information reason'),
 ((select started_at is not null from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000001'),'approval started timestamp set'),
 ((select started_at is not null from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000002'),'rejection started timestamp set'),
 ((select started_at is not null from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000003'),'information started timestamp set'),
 ((select reviewed_by='91000000-0000-4000-8000-000000000001' from public.applications where id='92000000-0000-4000-8000-000000000003'),'information application reviewer'),
 ((select updated_by='91000000-0000-4000-8000-000000000001' from public.applications where id='92000000-0000-4000-8000-000000000003'),'information application updater')
) checks(result,description);

-- Approval conversion and idempotency: 20 assertions.
set local role service_role;
select lives_ok($$select * from public.transition_application_eligibility_review('92000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001','approve',' approved notes ',null)$$,'approval retry is idempotent');
reset role;
select ok(result,description) from (values
 ((select count(*)=1 from public.participants where application_id='92000000-0000-4000-8000-000000000001'),'approval creates one participant'),
 ((select count(*)=1 from public.participant_profiles pp join public.participants p on p.id=pp.participant_id where p.application_id='92000000-0000-4000-8000-000000000001'),'approval creates one profile'),
 ((select converted_at is not null from public.applications where id='92000000-0000-4000-8000-000000000001'),'conversion timestamp set'),
 ((select lifecycle_status='pending_enrollment' from public.participants where application_id='92000000-0000-4000-8000-000000000001'),'lifecycle default preserved'),
 ((select research_status='not_enrolled' from public.participants where application_id='92000000-0000-4000-8000-000000000001'),'research default preserved'),
 ((select created_by='91000000-0000-4000-8000-000000000001' from public.participants where application_id='92000000-0000-4000-8000-000000000001'),'participant creator attributed'),
 ((select updated_by='91000000-0000-4000-8000-000000000001' from public.participants where application_id='92000000-0000-4000-8000-000000000001'),'participant updater attributed'),
 ((select pp.created_by='91000000-0000-4000-8000-000000000001' from public.participant_profiles pp join public.participants p on p.id=pp.participant_id where p.application_id='92000000-0000-4000-8000-000000000001'),'profile creator attributed'),
 ((select pp.email='approve.one@test.local' from public.participant_profiles pp join public.participants p on p.id=pp.participant_id where p.application_id='92000000-0000-4000-8000-000000000001'),'profile email mapped'),
 ((select pp.first_name='Approve' from public.participant_profiles pp join public.participants p on p.id=pp.participant_id where p.application_id='92000000-0000-4000-8000-000000000001'),'profile first name mapped'),
 ((select pp.last_name='One' from public.participant_profiles pp join public.participants p on p.id=pp.participant_id where p.application_id='92000000-0000-4000-8000-000000000001'),'profile last name mapped'),
 ((select count(*)=1 from public.participants where application_id='92000000-0000-4000-8000-000000000001'),'retry creates no duplicate participant'),
 ((select count(*)=1 from public.participant_profiles pp join public.participants p on p.id=pp.participant_id where p.application_id='92000000-0000-4000-8000-000000000001'),'retry creates no duplicate profile'),
 ((select status='converted' from public.applications where id='92000000-0000-4000-8000-000000000001'),'retry preserves converted status'),
 ((select decision='eligible' from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000001'),'retry preserves eligible decision'),
 ((select review_status='completed' from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000001'),'retry preserves completed review'),
 ((select participant_code is not null from public.participants where application_id='92000000-0000-4000-8000-000000000001'),'participant code generated'),
 ((select application_id='92000000-0000-4000-8000-000000000001' from public.participants where application_id='92000000-0000-4000-8000-000000000001'),'participant links application'),
 ((select status='converted' and reviewed_at is not null and converted_at is not null from public.applications where id='92000000-0000-4000-8000-000000000001'),'conversion state complete')
) checks(result,description);

-- Forced conversion failure and atomicity: 12 assertions.
create function pg_temp.reject_review_conversion_profile() returns trigger language plpgsql as $$
begin
  if exists(select 1 from public.participants p where p.id=new.participant_id and p.application_id='92000000-0000-4000-8000-000000000007') then
    raise exception 'forced review conversion failure';
  end if;
  return new;
end$$;
create trigger trg_test_reject_review_conversion before insert on public.participant_profiles
for each row execute function pg_temp.reject_review_conversion_profile();
set local role service_role;
select throws_ok($$select * from public.transition_application_eligibility_review('92000000-0000-4000-8000-000000000007','91000000-0000-4000-8000-000000000001','approve','atomic notes',null)$$,'P1001','Participant conversion could not be completed.','conversion failure is sanitized');
reset role;
select ok(result,description) from (values
 ((select status='submitted' from public.applications where id='92000000-0000-4000-8000-000000000007'),'failed conversion rolls back application status'),
 ((select reviewed_at is null from public.applications where id='92000000-0000-4000-8000-000000000007'),'failed conversion rolls back reviewed timestamp'),
 ((select reviewed_by is null from public.applications where id='92000000-0000-4000-8000-000000000007'),'failed conversion rolls back application reviewer'),
 ((select converted_at is null from public.applications where id='92000000-0000-4000-8000-000000000007'),'failed conversion leaves conversion timestamp null'),
 ((select review_status='pending' from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000007'),'failed conversion rolls back review status'),
 ((select decision='pending' from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000007'),'failed conversion rolls back decision'),
 ((select completed_at is null from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000007'),'failed conversion rolls back completion timestamp'),
 ((select reviewed_by is null from public.eligibility_reviews where id='93000000-0000-4000-8000-000000000007'),'failed conversion rolls back reviewer'),
 ((select count(*)=0 from public.participants where application_id='92000000-0000-4000-8000-000000000007'),'failed conversion rolls back participant'),
 ((select count(*)=0 from public.participant_profiles pp join public.participants p on p.id=pp.participant_id where p.application_id='92000000-0000-4000-8000-000000000007'),'failed conversion rolls back profile'),
 ((select count(*)=1 from pg_trigger where tgname='trg_test_reject_review_conversion'),'temporary rejection trigger exists transactionally')
) checks(result,description);

-- Direct-DML, RLS, and prior-RPC regressions: 20 assertions.
select ok(result,description) from (values
 (not has_table_privilege('service_role','public.applications','INSERT'),'application insert remains denied'),
 (not has_table_privilege('service_role','public.applications','UPDATE'),'application update remains denied'),
 (not has_table_privilege('service_role','public.applications','DELETE'),'application delete remains denied'),
 (not has_table_privilege('service_role','public.eligibility_reviews','INSERT'),'review insert remains denied'),
 (not has_table_privilege('service_role','public.eligibility_reviews','UPDATE'),'review update remains denied'),
 (not has_table_privilege('service_role','public.eligibility_reviews','DELETE'),'review delete remains denied'),
 ((select relrowsecurity from pg_class where oid='public.applications'::regclass),'application RLS enabled'),
 ((select relrowsecurity from pg_class where oid='public.eligibility_reviews'::regclass),'review RLS enabled'),
 ((select count(*)=0 from pg_policies where schemaname='public' and tablename='applications'),'application policies unchanged'),
 ((select count(*)=0 from pg_policies where schemaname='public' and tablename='eligibility_reviews'),'review policies unchanged'),
 (has_function_privilege('service_role','public.submit_participant_application(text,text,text,text,text,text,text,text,text,text,text,text,text,inet,text,uuid)','EXECUTE'),'submission RPC preserved'),
 (has_function_privilege('service_role','public.create_participant_from_approved_application(uuid,uuid)','EXECUTE'),'conversion RPC preserved'),
 (has_function_privilege('service_role','public.accept_participant_invitation(uuid,uuid)','EXECUTE'),'acceptance RPC preserved'),
 (has_function_privilege('service_role','public.create_participant_invitation_attempt(uuid,uuid)','EXECUTE'),'invitation create RPC preserved'),
 (has_column_privilege('service_role','public.applications','application_code','SELECT'),'application code projection preserved'),
 (not has_column_privilege('service_role','public.applications','internal_notes','SELECT'),'application internal notes denied'),
 (not has_table_privilege('anon','public.applications','UPDATE'),'anon application update denied'),
 (not has_table_privilege('authenticated','public.applications','UPDATE'),'authenticated application update denied'),
 (not has_table_privilege('anon','public.eligibility_reviews','UPDATE'),'anon review update denied'),
 (not has_table_privilege('authenticated','public.eligibility_reviews','UPDATE'),'authenticated review update denied')
) checks(result,description);

select * from finish();
rollback;
