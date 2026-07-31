begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(96);

-- Function catalog and execution boundary: 14 assertions.
select ok(result, description) from (values
    (to_regprocedure('public.submit_participant_application(text,text,text,text,text,text,text,text,text,text,text,text,text,inet,text,uuid)') is not null, 'submission RPC exists'),
    ((select count(*) = 1 from pg_proc where oid = to_regprocedure('public.submit_participant_application(text,text,text,text,text,text,text,text,text,text,text,text,text,inet,text,uuid)')), 'submission RPC exists once'),
    ((select p.pronargs = 16 from pg_proc p where p.oid = to_regprocedure('public.submit_participant_application(text,text,text,text,text,text,text,text,text,text,text,text,text,inet,text,uuid)')), 'submission RPC has exact argument count'),
    ((select p.proretset from pg_proc p where p.oid = to_regprocedure('public.submit_participant_application(text,text,text,text,text,text,text,text,text,text,text,text,text,inet,text,uuid)')), 'submission RPC returns a set'),
    ((select pg_get_function_result(p.oid) = 'TABLE(application_id uuid, application_code text, application_status text, submitted_at timestamp with time zone, application_created_at timestamp with time zone, eligibility_review_id uuid, review_number integer, review_status text, decision text, review_created_at timestamp with time zone)' from pg_proc p where p.oid = to_regprocedure('public.submit_participant_application(text,text,text,text,text,text,text,text,text,text,text,text,text,inet,text,uuid)')), 'submission return projection is exact'),
    ((select l.lanname = 'plpgsql' from pg_proc p join pg_language l on l.oid = p.prolang where p.oid = to_regprocedure('public.submit_participant_application(text,text,text,text,text,text,text,text,text,text,text,text,text,inet,text,uuid)')), 'submission RPC uses plpgsql'),
    ((select p.prosecdef from pg_proc p where p.oid = to_regprocedure('public.submit_participant_application(text,text,text,text,text,text,text,text,text,text,text,text,text,inet,text,uuid)')), 'submission RPC is security definer'),
    ((select pg_get_userbyid(p.proowner) = 'postgres' from pg_proc p where p.oid = to_regprocedure('public.submit_participant_application(text,text,text,text,text,text,text,text,text,text,text,text,text,inet,text,uuid)')), 'submission RPC owner is postgres'),
    ((select p.proconfig @> array['search_path=public, pg_catalog'] from pg_proc p where p.oid = to_regprocedure('public.submit_participant_application(text,text,text,text,text,text,text,text,text,text,text,text,text,inet,text,uuid)')), 'submission RPC has controlled search path'),
    (has_function_privilege('service_role', 'public.submit_participant_application(text,text,text,text,text,text,text,text,text,text,text,text,text,inet,text,uuid)', 'EXECUTE'), 'service role can execute submission RPC'),
    (not has_function_privilege('anon', 'public.submit_participant_application(text,text,text,text,text,text,text,text,text,text,text,text,text,inet,text,uuid)', 'EXECUTE'), 'anon cannot execute submission RPC'),
    (not has_function_privilege('authenticated', 'public.submit_participant_application(text,text,text,text,text,text,text,text,text,text,text,text,text,inet,text,uuid)', 'EXECUTE'), 'authenticated cannot execute submission RPC'),
    ((select not exists (select 1 from aclexplode(p.proacl) acl where acl.grantee = 0 and acl.privilege_type = 'EXECUTE') from pg_proc p where p.oid = to_regprocedure('public.submit_participant_application(text,text,text,text,text,text,text,text,text,text,text,text,text,inet,text,uuid)')), 'PUBLIC cannot execute submission RPC'),
    ((select obj_description(to_regprocedure('public.submit_participant_application(text,text,text,text,text,text,text,text,text,text,text,text,text,inet,text,uuid)'), 'pg_proc') is not null), 'submission RPC is documented')
) checks(result, description);

set local role service_role;
select lives_ok(
    $$select * from public.submit_participant_application(
        '  Ada   Lovelace  ', ' SUBMIT.ONE@EXAMPLE.COM ', ' +91 ', '9876543210', ' in ',
        '  Karnataka  ', '  Bengaluru  ', '25_34', 'employed',
        '  Build   durable financial capability.  ', '  Long-term   planning  ',
        '  Institutional   guidance  ', '  Community  ', '203.0.113.10'::inet,
        '  WPAG Test Agent  ', null
    )$$,
    'valid anonymous submission succeeds'
);
reset role;

-- Valid atomic application and review creation: 22 assertions including lives_ok above.
select is((select count(*)::integer from public.applications where email = 'submit.one@example.com'), 1, 'one application created');
select is((select count(*)::integer from public.eligibility_reviews er join public.applications a on a.id=er.application_id where a.email='submit.one@example.com'), 1, 'one review created');
select ok((select er.application_id=a.id from public.eligibility_reviews er join public.applications a on a.id=er.application_id where a.email='submit.one@example.com'), 'review links to application');
select is((select status from public.applications where email='submit.one@example.com'), 'submitted', 'application status submitted');
select is((select er.review_status from public.eligibility_reviews er join public.applications a on a.id=er.application_id where a.email='submit.one@example.com'), 'pending', 'review status pending');
select is((select er.decision from public.eligibility_reviews er join public.applications a on a.id=er.application_id where a.email='submit.one@example.com'), 'pending', 'decision pending');
select is((select er.review_number from public.eligibility_reviews er join public.applications a on a.id=er.application_id where a.email='submit.one@example.com'), 1, 'review number one');
select ok((select submitted_at is not null from public.applications where email='submit.one@example.com'), 'submitted timestamp set');
select ok((select created_at is not null from public.applications where email='submit.one@example.com'), 'application created timestamp set');
select ok((select er.created_at is not null from public.eligibility_reviews er join public.applications a on a.id=er.application_id where a.email='submit.one@example.com'), 'review created timestamp set');
select ok((select auth_user_id is null from public.applications where email='submit.one@example.com'), 'anonymous auth identity preserved');
select ok((select created_by is null and updated_by is null from public.applications where email='submit.one@example.com'), 'anonymous application audit identity preserved');
select ok((select er.created_by is null and er.updated_by is null from public.eligibility_reviews er join public.applications a on a.id=er.application_id where a.email='submit.one@example.com'), 'anonymous review audit identity preserved');
select is((select source_ip::text from public.applications where email='submit.one@example.com'), '203.0.113.10/32', 'source IP persisted');
select is((select user_agent from public.applications where email='submit.one@example.com'), 'WPAG Test Agent', 'user agent persisted');
select ok((select submitted_at=created_at from public.applications where email='submit.one@example.com'), 'application timestamps are transactionally consistent');
select ok((select er.created_at=a.created_at from public.eligibility_reviews er join public.applications a on a.id=er.application_id where a.email='submit.one@example.com'), 'application and review timestamps match');
select ok((select application_code is not null from public.applications where email='submit.one@example.com'), 'application code returned by database');
select ok((select application_code from public.applications where email='submit.one@example.com') like 'WPAG-APP-%', 'application code has institutional prefix');
select ok((select application_code ~ '^WPAG-APP-[0-9]{6,}$' from public.applications where email='submit.one@example.com'), 'application code format is valid');
select ok((select deleted_at is null from public.applications where email='submit.one@example.com'), 'application is not deleted');

-- Normalization and generated data: 12 assertions.
select is((select full_name from public.applications where email='submit.one@example.com'), 'Ada Lovelace', 'full name normalized');
select is((select email::text from public.applications where email='submit.one@example.com'), 'submit.one@example.com', 'email normalized');
select is((select phone_country_code from public.applications where email='submit.one@example.com'), '+91', 'phone country code trimmed');
select is((select country_code from public.applications where email='submit.one@example.com'), 'IN', 'country code normalized');
select is((select state_or_region from public.applications where email='submit.one@example.com'), 'Karnataka', 'state normalized');
select is((select city from public.applications where email='submit.one@example.com'), 'Bengaluru', 'city normalized');
select is((select application_reason from public.applications where email='submit.one@example.com'), 'Build durable financial capability.', 'application narrative normalized');
select is((select financial_challenges from public.applications where email='submit.one@example.com'), 'Long-term planning', 'financial narrative normalized');
select is((select expectations from public.applications where email='submit.one@example.com'), 'Institutional guidance', 'expectations normalized');
select is((select referral_source from public.applications where email='submit.one@example.com'), 'Community', 'referral source normalized');
select is((select age_group from public.applications where email='submit.one@example.com'), '25_34', 'age group preserved');
select is((select employment_status from public.applications where email='submit.one@example.com'), 'employed', 'employment status preserved');

-- Active duplicate protection and terminal reapplication exclusions: 8 assertions.
set local role service_role;
select throws_ok($$select * from public.submit_participant_application('Duplicate','submit.one@example.com','+91','9876543211','IN',null,null,null,null,'A sufficiently long reason.',null,null,null,null,null,null)$$, 'P1001', 'An active application already exists.', 'submitted duplicate rejected safely');
reset role;
insert into public.applications (application_code,full_name,email,phone_country_code,phone_number,country_code,application_reason,status,submitted_at,created_at) values
('WPAG-APP-979001','Active One','active.review@example.com','+91','9876543215','IN','Active fixture reason.','under_review','2026-01-01','2026-01-01'),
('WPAG-APP-979002','Active Two','active.info@example.com','+91','9876543216','IN','Active fixture reason.','additional_information_required','2026-01-01','2026-01-01'),
('WPAG-APP-979003','Active Three','active.eligible@example.com','+91','9876543217','IN','Active fixture reason.','eligible','2026-01-01','2026-01-01'),
('WPAG-APP-980001','Terminal One','terminal.ineligible@example.com','+91','9876543221','IN','Terminal fixture reason.','ineligible','2026-01-01','2026-01-01'),
('WPAG-APP-980002','Terminal Two','terminal.withdrawn@example.com','+91','9876543222','IN','Terminal fixture reason.','withdrawn','2026-01-01','2026-01-01'),
('WPAG-APP-980003','Terminal Three','terminal.converted@example.com','+91','9876543223','IN','Terminal fixture reason.','converted','2026-01-01','2026-01-01'),
('WPAG-APP-980004','Terminal Four','terminal.archived@example.com','+91','9876543224','IN','Terminal fixture reason.','archived','2026-01-01','2026-01-01');
set local role service_role;
select throws_ok($$select * from public.submit_participant_application('Duplicate','active.review@example.com','+91','9876543241','IN',null,null,null,null,'A sufficiently long reason.',null,null,null,null,null,null)$$, 'P1001', 'An active application already exists.', 'under-review duplicate rejected safely');
select throws_ok($$select * from public.submit_participant_application('Duplicate','active.info@example.com','+91','9876543242','IN',null,null,null,null,'A sufficiently long reason.',null,null,null,null,null,null)$$, 'P1001', 'An active application already exists.', 'additional-information duplicate rejected safely');
select throws_ok($$select * from public.submit_participant_application('Duplicate','active.eligible@example.com','+91','9876543243','IN',null,null,null,null,'A sufficiently long reason.',null,null,null,null,null,null)$$, 'P1001', 'An active application already exists.', 'eligible duplicate rejected safely');
select lives_ok($$select * from public.submit_participant_application('New One','terminal.ineligible@example.com','+91','9876543231','IN',null,null,null,null,'A sufficiently long reason.',null,null,null,null,null,null)$$, 'ineligible permits reapplication');
select lives_ok($$select * from public.submit_participant_application('New Two','terminal.withdrawn@example.com','+91','9876543232','IN',null,null,null,null,'A sufficiently long reason.',null,null,null,null,null,null)$$, 'withdrawn permits reapplication');
select lives_ok($$select * from public.submit_participant_application('New Three','terminal.converted@example.com','+91','9876543233','IN',null,null,null,null,'A sufficiently long reason.',null,null,null,null,null,null)$$, 'converted permits reapplication');
select lives_ok($$select * from public.submit_participant_application('New Four','terminal.archived@example.com','+91','9876543234','IN',null,null,null,null,'A sufficiently long reason.',null,null,null,null,null,null)$$, 'archived permits reapplication');
reset role;

-- Defensive invalid-data validation: 16 assertions.
set local role service_role;
select throws_ok($$select * from public.submit_participant_application(null,'a@example.com','+91','9876543210','IN',null,null,null,null,'A sufficiently long reason.',null,null,null,null,null,null)$$,'P1001','Application data is invalid.','null name rejected');
select throws_ok($$select * from public.submit_participant_application(' ','a@example.com','+91','9876543210','IN',null,null,null,null,'A sufficiently long reason.',null,null,null,null,null,null)$$,'P1001','Application data is invalid.','blank name rejected');
select throws_ok($$select * from public.submit_participant_application('Valid Name',null,'+91','9876543210','IN',null,null,null,null,'A sufficiently long reason.',null,null,null,null,null,null)$$,'P1001','Application data is invalid.','null email rejected');
select throws_ok($$select * from public.submit_participant_application('Valid Name','invalid','+91','9876543210','IN',null,null,null,null,'A sufficiently long reason.',null,null,null,null,null,null)$$,'P1001','Application data is invalid.','invalid email rejected');
select throws_ok($$select * from public.submit_participant_application('Valid Name','a1@example.com','91','9876543210','IN',null,null,null,null,'A sufficiently long reason.',null,null,null,null,null,null)$$,'P1001','Application data is invalid.','invalid phone code rejected');
select throws_ok($$select * from public.submit_participant_application('Valid Name','a2@example.com','+91','abc','IN',null,null,null,null,'A sufficiently long reason.',null,null,null,null,null,null)$$,'P1001','Application data is invalid.','invalid phone rejected');
select throws_ok($$select * from public.submit_participant_application('Valid Name','a3@example.com','+91','9876543210','IND',null,null,null,null,'A sufficiently long reason.',null,null,null,null,null,null)$$,'P1001','Application data is invalid.','invalid country rejected');
select throws_ok($$select * from public.submit_participant_application('Valid Name','a4@example.com','+91','9876543210','IN',null,null,'invalid',null,'A sufficiently long reason.',null,null,null,null,null,null)$$,'P1001','Application data is invalid.','invalid age group rejected');
select throws_ok($$select * from public.submit_participant_application('Valid Name','a5@example.com','+91','9876543210','IN',null,null,null,'invalid','A sufficiently long reason.',null,null,null,null,null,null)$$,'P1001','Application data is invalid.','invalid employment rejected');
select throws_ok($$select * from public.submit_participant_application('Valid Name','a6@example.com','+91','9876543210','IN',null,null,null,null,'short',null,null,null,null,null,null)$$,'P1001','Application data is invalid.','short reason rejected');
select throws_ok($$select * from public.submit_participant_application(repeat('x',151),'a7@example.com','+91','9876543210','IN',null,null,null,null,'A sufficiently long reason.',null,null,null,null,null,null)$$,'P1001','Application data is invalid.','long name rejected');
select throws_ok($$select * from public.submit_participant_application('Valid Name',repeat('x',250)||'@e.com','+91','9876543210','IN',null,null,null,null,'A sufficiently long reason.',null,null,null,null,null,null)$$,'P1001','Application data is invalid.','long email rejected');
select throws_ok($$select * from public.submit_participant_application('Valid Name','a8@example.com','+91','9876543210','IN',repeat('x',101),null,null,null,'A sufficiently long reason.',null,null,null,null,null,null)$$,'P1001','Application data is invalid.','long state rejected');
select throws_ok($$select * from public.submit_participant_application('Valid Name','a9@example.com','+91','9876543210','IN',null,repeat('x',101),null,null,'A sufficiently long reason.',null,null,null,null,null,null)$$,'P1001','Application data is invalid.','long city rejected');
select throws_ok($$select * from public.submit_participant_application('Valid Name','a10@example.com','+91','9876543210','IN',null,null,null,null,repeat('x',2001),null,null,null,null,null,null)$$,'P1001','Application data is invalid.','long reason rejected');
select throws_ok($$select * from public.submit_participant_application('Valid Name','a11@example.com','+91','9876543210','IN',null,null,null,null,'A sufficiently long reason.',null,null,repeat('x',151),null,null,null)$$,'P1001','Application data is invalid.','long referral source rejected');
reset role;

-- Forced review failure proves atomic rollback: 8 assertions.
create function pg_temp.reject_submission_review() returns trigger language plpgsql as $$begin if exists (select 1 from public.applications where id=new.application_id and email='atomic.failure@example.com') then raise exception 'forced test failure'; end if; return new; end$$;
create trigger trg_test_reject_submission_review before insert on public.eligibility_reviews for each row execute function pg_temp.reject_submission_review();
set local role service_role;
select throws_ok($$select * from public.submit_participant_application('Atomic Failure','atomic.failure@example.com','+91','9876543299','IN',null,null,null,null,'A sufficiently long reason.',null,null,null,null,null,null)$$,'P1002','Participant application submission could not be completed.','review failure is sanitized');
reset role;
select is((select count(*)::integer from public.applications where email='atomic.failure@example.com'),0,'failed submission leaves no application');
select is((select count(*)::integer from public.eligibility_reviews er join public.applications a on a.id=er.application_id where a.email='atomic.failure@example.com'),0,'failed submission leaves no review');
select ok(not exists(select 1 from public.applications where email='atomic.failure@example.com'), 'failed submission exposes no application code');
select ok((select count(*)=1 from pg_trigger where tgname='trg_test_reject_submission_review'), 'test rejection trigger executed in transaction scope');
select ok(not has_table_privilege('service_role','public.applications','INSERT'), 'application insert remains denied after failure');
select ok(not has_table_privilege('service_role','public.eligibility_reviews','INSERT'), 'review insert remains denied after failure');
select ok((select count(*)=1 from public.applications where email='submit.one@example.com'), 'prior committed-in-test fixture remains consistent');

-- Direct-DML, RLS, and policy posture: 16 assertions.
select ok(not has_table_privilege('service_role','public.applications','INSERT'),'service application insert denied');
select ok(not has_table_privilege('service_role','public.applications','UPDATE'),'service application update denied');
select ok(not has_table_privilege('service_role','public.applications','DELETE'),'service application delete denied');
select ok(not has_table_privilege('service_role','public.eligibility_reviews','INSERT'),'service review insert denied');
select ok(not has_table_privilege('service_role','public.eligibility_reviews','UPDATE'),'service review update denied');
select ok(not has_table_privilege('service_role','public.eligibility_reviews','DELETE'),'service review delete denied');
select ok((select relrowsecurity from pg_class where oid='public.applications'::regclass),'applications RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.eligibility_reviews'::regclass),'reviews RLS enabled');
select is((select count(*)::integer from pg_policies where schemaname='public' and tablename='applications'),0,'no application policies added');
select is((select count(*)::integer from pg_policies where schemaname='public' and tablename='eligibility_reviews'),0,'no review policies added');
select ok(not has_table_privilege('anon','public.applications','INSERT'),'anon application insert denied');
select ok(not has_table_privilege('authenticated','public.applications','INSERT'),'authenticated application insert denied');
select ok(not has_table_privilege('anon','public.eligibility_reviews','INSERT'),'anon review insert denied');
select ok(not has_table_privilege('authenticated','public.eligibility_reviews','INSERT'),'authenticated review insert denied');
select ok(has_column_privilege('service_role','public.applications','application_code','SELECT'),'migration 034 application code projection preserved');
select ok(not has_column_privilege('service_role','public.applications','internal_notes','SELECT'),'migration 034 excluded application column remains denied');

select * from finish();
rollback;
