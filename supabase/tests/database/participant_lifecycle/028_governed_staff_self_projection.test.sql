begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,pg_catalog;
select no_plan();

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('00000000-0000-0000-0000-000000000000','f3000000-0000-4000-8000-000000000001','authenticated','authenticated','staff-self-a@example.invalid','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01'),
('00000000-0000-0000-0000-000000000000','f3000000-0000-4000-8000-000000000002','authenticated','authenticated','staff-self-b@example.invalid','','2026-01-01','{"provider":"email","providers":["email"]}','{}','2026-01-01','2026-01-01');

insert into public.staff_members(auth_user_id,full_name,email,status,internal_notes) values
('f3000000-0000-4000-8000-000000000001','Staff Self A','staff-self-a@example.invalid','active','must remain private'),
('f3000000-0000-4000-8000-000000000002','Staff Self B','staff-self-b@example.invalid','active','must remain private');

select ok(has_column_privilege('authenticated','public.staff_members','id','SELECT'),
  'authenticated can read the governed self-projection identity');
select ok(has_column_privilege('authenticated','public.staff_members','status','SELECT'),
  'authenticated can read the governed self-projection status');
select ok(not has_column_privilege('authenticated','public.staff_members','internal_notes','SELECT'),
  'authenticated cannot read internal staff notes');
select ok(not has_column_privilege('anon','public.staff_members','id','SELECT'),
  'anonymous callers cannot read staff identities');
select ok(not has_table_privilege('authenticated','public.staff_members','UPDATE'),
  'authenticated callers have no direct staff mutation authority');

select set_config('request.jwt.claim.sub','f3000000-0000-4000-8000-000000000001',true);
set local role authenticated;

select is((select count(*) from public.staff_members),1::bigint,
  'RLS exposes only the authenticated staff identity');
select is((select auth_user_id from public.staff_members),
  'f3000000-0000-4000-8000-000000000001'::uuid,
  'the governed self projection resolves the current authenticated staff actor');
select is((select count(*) from public.staff_members where auth_user_id='f3000000-0000-4000-8000-000000000002'),0::bigint,
  'one staff actor cannot read another staff identity');

reset role;
select * from finish();
rollback;
