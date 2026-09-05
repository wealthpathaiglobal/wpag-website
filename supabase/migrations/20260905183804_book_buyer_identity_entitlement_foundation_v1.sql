-- Additive book foundation. Apply ONLY this file after review; never replay research 031–049.
-- No provider, checkout, real entitlement, full content, or Auth signup is installed.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
create schema book_private;
revoke all on schema book_private from public, anon, authenticated;
grant usage on schema book_private to service_role;

create function book_private.access_expiry(p_start timestamptz) returns timestamptz
language sql immutable strict set search_path = '' as $$
 select ((p_start at time zone 'UTC') + interval '24 months') at time zone 'UTC';
$$;

create table public.book_reader_profiles (
 user_id uuid primary key references auth.users(id) on delete restrict,
 created_at timestamptz not null default clock_timestamp()
);
create table public.book_products (
 slug text primary key check (slug = 'hfos-phase-1-stability'),
 title text not null check (title = 'HFOS Phase 1 — Stability'),
 price_minor integer not null check (price_minor = 19900),
 currency text not null check (currency = 'INR'),
 access_months integer not null check (access_months = 24),
 max_sessions integer not null check (max_sessions = 2),
 delivery text not null check (delivery = 'WEB_READER_ONLY'),
 full_pdf_download boolean not null check (not full_pdf_download),
 auto_renew boolean not null check (not auto_renew),
 created_at timestamptz not null default clock_timestamp()
);
create table public.book_orders (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.book_reader_profiles(user_id) on delete restrict,
 product_slug text not null references public.book_products(slug) on delete restrict,
 price_minor integer not null check (price_minor = 19900),
 currency text not null check (currency = 'INR'),
 access_months integer not null check (access_months = 24),
 max_sessions integer not null check (max_sessions = 2),
 delivery text not null check (delivery = 'WEB_READER_ONLY'),
 full_pdf_download boolean not null check (not full_pdf_download),
 auto_renew boolean not null check (not auto_renew),
 status text not null default 'PENDING' check (status in ('PENDING','PAID','CANCELLED','REFUNDED')),
 idempotency_key text not null check (length(idempotency_key) between 8 and 200),
 provider_order_reference text unique,
 fulfillment_reference text unique,
 created_at timestamptz not null default clock_timestamp(),
 updated_at timestamptz not null default clock_timestamp(),
 unique(user_id,idempotency_key),
 unique(id,user_id,product_slug),
 check (status not in ('PAID','REFUNDED') or fulfillment_reference is not null)
);
create table public.book_entitlements (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.book_reader_profiles(user_id) on delete restrict,
 product_slug text not null references public.book_products(slug) on delete restrict,
 source_order_id uuid not null unique,
 status text not null default 'PENDING' check (status in ('PENDING','ACTIVE','EXPIRED','REVOKED','REFUNDED')),
 starts_at timestamptz,
 expires_at timestamptz,
 created_at timestamptz not null default clock_timestamp(),
 updated_at timestamptz not null default clock_timestamp(),
 unique(id,user_id),
 foreign key (source_order_id,user_id,product_slug) references public.book_orders(id,user_id,product_slug) on delete restrict,
 check ((starts_at is null and expires_at is null) or (starts_at is not null and expires_at is not null and expires_at = book_private.access_expiry(starts_at))),
 check (status not in ('ACTIVE','EXPIRED','REFUNDED') or starts_at is not null),
 check (status <> 'PENDING' or starts_at is null)
);
create unique index book_one_open_entitlement on public.book_entitlements(user_id,product_slug)
 where status in ('PENDING','ACTIVE');
create index book_entitlements_owner_history on public.book_entitlements(user_id,product_slug,created_at desc);
create table public.book_reader_sessions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.book_reader_profiles(user_id) on delete restrict,
 entitlement_id uuid not null,
 -- Retained for audit after logout; admission checks the live auth.sessions row.
 auth_session_id uuid not null,
 created_at timestamptz not null default clock_timestamp(),
 last_seen_at timestamptz not null default clock_timestamp(),
 lease_expires_at timestamptz not null,
 ended_at timestamptz,
 foreign key (entitlement_id,user_id) references public.book_entitlements(id,user_id) on delete restrict,
 unique(entitlement_id,auth_session_id),
 check (lease_expires_at >= last_seen_at)
);
create index book_reader_live_leases on public.book_reader_sessions(entitlement_id,lease_expires_at) where ended_at is null;
create index book_reader_sessions_owner on public.book_reader_sessions(user_id);
create table public.book_audit_events (
 id bigint generated always as identity primary key,
 actor_id uuid,
 actor_kind text not null check (actor_kind in ('USER','SERVICE')),
 action text not null,
 occurred_at timestamptz not null default clock_timestamp(),
 reason text not null check (length(reason) between 1 and 500),
 reference text not null,
 context jsonb not null default '{}' check (jsonb_typeof(context)='object')
);
create index book_audit_reference_time on public.book_audit_events(reference,occurred_at);

-- Secure at creation, in the same transaction, including inherited Supabase defaults.
do $$ declare t text; cols text; privilege text; begin
 foreach t in array array['book_reader_profiles','book_products','book_orders','book_entitlements','book_reader_sessions','book_audit_events'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated,service_role',t);
  select string_agg(quote_ident(attname),',') into cols from pg_attribute where attrelid=format('public.%I',t)::regclass and attnum>0 and not attisdropped;
  foreach privilege in array array['select','insert','update','references'] loop
   execute format('revoke %s (%s) on public.%I from public,anon,authenticated,service_role',privilege,cols,t);
  end loop;
  execute format('grant select on public.%I to service_role',t);
 end loop;
end $$;
revoke all on sequence public.book_audit_events_id_seq from public,anon,authenticated,service_role;
create policy book_profile_own_read on public.book_reader_profiles for select to authenticated using ((select auth.uid())=user_id);
create policy book_product_read on public.book_products for select to authenticated using (true);
create policy book_order_own_read on public.book_orders for select to authenticated using ((select auth.uid())=user_id);
create policy book_entitlement_own_read on public.book_entitlements for select to authenticated using ((select auth.uid())=user_id);
create policy book_session_own_read on public.book_reader_sessions for select to authenticated using ((select auth.uid())=user_id);
grant select(user_id,created_at) on public.book_reader_profiles to authenticated;
grant select on public.book_products to authenticated;
grant select(id,user_id,product_slug,price_minor,currency,access_months,max_sessions,delivery,full_pdf_download,auto_renew,status,created_at,updated_at) on public.book_orders to authenticated;
grant select(id,user_id,product_slug,status,starts_at,expires_at,created_at,updated_at) on public.book_entitlements to authenticated;
grant select(id,user_id,entitlement_id,created_at,last_seen_at,lease_expires_at,ended_at) on public.book_reader_sessions to authenticated;

create function book_private.audit_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare doc jsonb:=to_jsonb(new); begin
 -- last_seen_at is the heartbeat record; audit lease admission/end, not every pulse.
 if tg_table_name='book_reader_sessions' and tg_op='UPDATE' and to_jsonb(old)->>'ended_at' is null and doc->>'ended_at' is null then return new; end if;
 insert into public.book_audit_events(actor_id,actor_kind,action,reason,reference,context)
 values(nullif(current_setting('book.actor_id',true),'')::uuid,
 coalesce(nullif(current_setting('book.actor_kind',true),''),'SERVICE'),
 tg_table_name||'.'||lower(tg_op),coalesce(nullif(current_setting('book.reason',true),''),'book foundation lifecycle'),
 coalesce(doc->>'id',doc->>'user_id',doc->>'slug'),
 jsonb_build_object('old_status',case when tg_op='UPDATE' then to_jsonb(old)->>'status' else null end,'new_status',doc->>'status'));
 return new;
end $$;
create function book_private.audit_immutable() returns trigger
language plpgsql set search_path = '' as $$ begin raise exception 'BOOK_AUDIT_APPEND_ONLY'; end $$;
create trigger book_audit_immutable before update or delete on public.book_audit_events for each row execute function book_private.audit_immutable();
create trigger book_audit_no_truncate before truncate on public.book_audit_events for each statement execute function book_private.audit_immutable();
do $$ declare t text; begin
 foreach t in array array['book_reader_profiles','book_products','book_orders','book_entitlements','book_reader_sessions'] loop
 execute format('create trigger book_audit after insert or update on public.%I for each row execute function book_private.audit_change()',t);
 end loop;
end $$;
create function book_private.guard_order() returns trigger
language plpgsql set search_path = '' as $$ begin
 if (to_jsonb(new)-array['status','updated_at','provider_order_reference','fulfillment_reference']) is distinct from
    (to_jsonb(old)-array['status','updated_at','provider_order_reference','fulfillment_reference']) then raise exception 'BOOK_ORDER_SNAPSHOT_IMMUTABLE'; end if;
 if old.fulfillment_reference is not null and new.fulfillment_reference is distinct from old.fulfillment_reference then raise exception 'BOOK_FULFILLMENT_IMMUTABLE'; end if;
 if old.provider_order_reference is not null and new.provider_order_reference is distinct from old.provider_order_reference then raise exception 'BOOK_PROVIDER_REFERENCE_IMMUTABLE'; end if;
 if new.status<>old.status and not ((old.status='PENDING' and new.status in ('PAID','CANCELLED')) or (old.status='PAID' and new.status='REFUNDED')) then raise exception 'BOOK_ORDER_TRANSITION_DENIED'; end if;
 new.updated_at:=clock_timestamp(); return new;
end $$;
create trigger book_order_guard before update on public.book_orders for each row execute function book_private.guard_order();
create function book_private.guard_entitlement() returns trigger
language plpgsql security definer set search_path = '' as $$ begin
 if (new.id,new.user_id,new.product_slug,new.source_order_id,new.created_at) is distinct from (old.id,old.user_id,old.product_slug,old.source_order_id,old.created_at) then raise exception 'BOOK_ENTITLEMENT_IDENTITY_IMMUTABLE'; end if;
 if old.starts_at is not null and (new.starts_at,new.expires_at) is distinct from (old.starts_at,old.expires_at) then raise exception 'BOOK_ACCESS_CLOCK_IMMUTABLE'; end if;
 if old.starts_at is null and new.starts_at is not null and not (old.status='PENDING' and new.status='ACTIVE') then raise exception 'BOOK_ACTIVATION_REQUIRED'; end if;
 if new.status<>old.status and not (
  (old.status='PENDING' and new.status in ('ACTIVE','REVOKED')) or
  (old.status='ACTIVE' and new.status in ('EXPIRED','REVOKED','REFUNDED')) or
  (old.status='REVOKED' and new.status='ACTIVE' and old.starts_at is not null and old.expires_at>clock_timestamp()) or
  (old.status in ('REVOKED','EXPIRED') and new.status='REFUNDED' and old.starts_at is not null)
 ) then raise exception 'BOOK_ENTITLEMENT_TRANSITION_DENIED'; end if;
 if new.status='ACTIVE' and (new.starts_at is null or new.expires_at<=clock_timestamp()) then raise exception 'BOOK_ACCESS_EXPIRED'; end if;
 if new.status<>'ACTIVE' then update public.book_reader_sessions set ended_at=clock_timestamp() where entitlement_id=old.id and ended_at is null; end if;
 new.updated_at:=clock_timestamp(); return new;
end $$;
create trigger book_entitlement_guard before update on public.book_entitlements for each row execute function book_private.guard_entitlement();

insert into public.book_products(slug,title,price_minor,currency,access_months,max_sessions,delivery,full_pdf_download,auto_renew)
 values('hfos-phase-1-stability','HFOS Phase 1 — Stability',19900,'INR',24,2,'WEB_READER_ONLY',false,false);

create function book_private.set_actor(p_actor uuid,p_kind text,p_reason text) returns void
language plpgsql set search_path = '' as $$ begin
 if p_reason is null or length(btrim(p_reason)) not between 1 and 500 then raise exception 'BOOK_REASON_REQUIRED'; end if;
 perform set_config('book.actor_id',coalesce(p_actor::text,''),true);
 perform set_config('book.actor_kind',p_kind,true);
 perform set_config('book.reason',p_reason,true);
end $$;
create function book_private.ensure_reader(p_user uuid) returns uuid
language plpgsql security definer set search_path = '' as $$ begin
 if not exists(select 1 from auth.users where id=p_user and not is_anonymous and deleted_at is null and email_confirmed_at is not null) then raise exception 'BOOK_VERIFIED_AUTH_REQUIRED'; end if;
 perform book_private.set_actor(p_user,'USER','Book reader profile bootstrap');
 insert into public.book_reader_profiles(user_id) values(p_user) on conflict(user_id) do nothing;
 return p_user;
end $$;
create function book_private.create_order(p_user uuid,p_product text,p_key text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare o public.book_orders; p public.book_products; begin
 perform 1 from public.book_reader_profiles where user_id=p_user for update;
 if not found then raise exception 'BOOK_PROFILE_REQUIRED'; end if;
 if p_key is null or length(p_key) not between 8 and 200 then raise exception 'BOOK_IDEMPOTENCY_REQUIRED'; end if;
 select * into o from public.book_orders where user_id=p_user and idempotency_key=p_key;
 if found then
  if o.product_slug<>p_product then raise exception 'BOOK_IDEMPOTENCY_CONFLICT'; end if;
  return o.id;
 end if;
 select * into p from public.book_products where slug=p_product;
 if not found then raise exception 'BOOK_PRODUCT_NOT_FOUND'; end if;
 perform book_private.set_actor(p_user,'USER','Server-snapshotted pending book order; payments disabled');
 update public.book_entitlements set status='EXPIRED' where user_id=p_user and product_slug=p_product and status='ACTIVE' and expires_at<=clock_timestamp();
 if exists(select 1 from public.book_entitlements where user_id=p_user and product_slug=p_product and status in ('ACTIVE','PENDING')) then raise exception 'BOOK_ORDER_ALREADY_EXISTS'; end if;
 insert into public.book_orders(user_id,product_slug,price_minor,currency,access_months,max_sessions,delivery,full_pdf_download,auto_renew,idempotency_key)
 values(p_user,p.slug,p.price_minor,p.currency,p.access_months,p.max_sessions,p.delivery,p.full_pdf_download,p.auto_renew,p_key) returning * into o;
 insert into public.book_entitlements(user_id,product_slug,source_order_id) values(p_user,p.slug,o.id);
 return o.id;
end $$;
-- Restricted future fulfillment primitive, exercised ONLY with synthetic local fixtures in V1.
-- No app route calls this. A future verified-payment adapter must establish the payment fact first.
create function book_private.record_fulfillment(p_order uuid,p_reference text,p_actor uuid,p_reason text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare o public.book_orders; e public.book_entitlements; owner_id uuid; activated timestamptz; begin
 select user_id into owner_id from public.book_orders where id=p_order;
 perform 1 from public.book_reader_profiles where user_id=owner_id for update;
 select * into o from public.book_orders where id=p_order for update;
 if not found then raise exception 'BOOK_ORDER_NOT_FOUND'; end if;
 if p_reference is null or length(btrim(p_reference)) not between 8 and 200 then raise exception 'BOOK_FULFILLMENT_REFERENCE_REQUIRED'; end if;
 select * into e from public.book_entitlements where source_order_id=p_order for update;
 if not found then raise exception 'BOOK_ENTITLEMENT_RECONCILIATION_REQUIRED'; end if;
 if o.fulfillment_reference is not null then
  if o.fulfillment_reference<>p_reference then raise exception 'BOOK_DUPLICATE_PAYMENT_REVIEW_REQUIRED'; end if;
  return e.id; -- Retry never restores/restarts an existing grant, including REFUNDED.
 end if;
 if o.status<>'PENDING' or e.status<>'PENDING' then raise exception 'BOOK_FULFILLMENT_STATE_DENIED'; end if;
 perform book_private.set_actor(p_actor,'SERVICE',p_reason);
 update public.book_orders set status='PAID',fulfillment_reference=p_reference where id=o.id;
 activated:=clock_timestamp();
 update public.book_entitlements set status='ACTIVE',starts_at=activated,expires_at=book_private.access_expiry(activated) where id=e.id;
 return e.id;
end $$;
create function book_private.transition_entitlement(p_entitlement uuid,p_state text,p_actor uuid,p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare e public.book_entitlements; owner_id uuid; begin
 select user_id into owner_id from public.book_entitlements where id=p_entitlement;
 perform 1 from public.book_reader_profiles where user_id=owner_id for update;
 select * into e from public.book_entitlements where id=p_entitlement for update;
 if not found then raise exception 'BOOK_ENTITLEMENT_NOT_FOUND'; end if;
 if p_state is null or p_state not in ('REVOKED','REFUNDED','ACTIVE','EXPIRED') then raise exception 'BOOK_ENTITLEMENT_TRANSITION_DENIED'; end if;
 if p_state='ACTIVE' and e.status not in ('REVOKED','ACTIVE') then raise exception 'BOOK_ENTITLEMENT_TRANSITION_DENIED'; end if;
 if p_state='EXPIRED' and (e.expires_at is null or e.expires_at>clock_timestamp()) then raise exception 'BOOK_ACCESS_NOT_EXPIRED'; end if;
 perform book_private.set_actor(p_actor,'SERVICE',p_reason);
 update public.book_entitlements set status=p_state where id=e.id;
 if p_state='REFUNDED' then update public.book_orders set status='REFUNDED' where id=e.source_order_id; end if;
end $$;
create function book_private.authorize_reader(p_user uuid,p_session uuid,p_product text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare e public.book_entitlements; lease public.book_reader_sessions; checked_at timestamptz; begin
 perform 1 from auth.sessions s join auth.users u on u.id=s.user_id where s.id=p_session and s.user_id=p_user and (s.not_after is null or s.not_after>clock_timestamp()) and not u.is_anonymous and u.deleted_at is null and u.email_confirmed_at is not null for share of s;
 if not found then return jsonb_build_object('status','AUTH_REQUIRED'); end if;
 if not exists(select 1 from public.book_reader_profiles where user_id=p_user) then return jsonb_build_object('status','PROFILE_REQUIRED'); end if;
 select * into e from public.book_entitlements where user_id=p_user and product_slug=p_product order by (status in ('ACTIVE','PENDING')) desc,created_at desc limit 1 for update;
 if not found then return jsonb_build_object('status','NO_ENTITLEMENT'); end if;
 checked_at:=clock_timestamp();
 perform book_private.set_actor(p_user,'USER','Paid reader lease admission/heartbeat');
 if e.status='ACTIVE' and e.expires_at<=checked_at then
  update public.book_entitlements set status='EXPIRED' where id=e.id;
  return jsonb_build_object('status','EXPIRED');
 end if;
 if e.status<>'ACTIVE' then return jsonb_build_object('status',e.status); end if;
 -- Parent entitlement lock serializes admission with every grant transition.
 update public.book_reader_sessions l set ended_at=checked_at where l.entitlement_id=e.id and l.ended_at is null and
 (l.lease_expires_at<=checked_at or not exists(select 1 from auth.sessions s where s.id=l.auth_session_id and s.user_id=p_user and (s.not_after is null or s.not_after>checked_at)));
 select * into lease from public.book_reader_sessions where entitlement_id=e.id and auth_session_id=p_session and ended_at is null;
 if not found and (select count(*) from public.book_reader_sessions where entitlement_id=e.id and ended_at is null and lease_expires_at>checked_at)>=2 then return jsonb_build_object('status','SESSION_LIMIT'); end if;
 insert into public.book_reader_sessions(user_id,entitlement_id,auth_session_id,last_seen_at,lease_expires_at)
 values(p_user,e.id,p_session,checked_at,least(checked_at+interval '2 minutes',e.expires_at))
 on conflict(entitlement_id,auth_session_id) do update set last_seen_at=excluded.last_seen_at,lease_expires_at=excluded.lease_expires_at,ended_at=null
 returning * into lease;
 return jsonb_build_object('status','ALLOWED','lease_id',lease.id,'lease_expires_at',lease.lease_expires_at);
end $$;
create function book_private.end_reader_session(p_user uuid,p_session uuid,p_entitlement uuid) returns void
language plpgsql security definer set search_path = '' as $$ begin
 perform 1 from public.book_entitlements where id=p_entitlement and user_id=p_user for update;
 if not found then raise exception 'BOOK_ENTITLEMENT_NOT_FOUND'; end if;
 perform book_private.set_actor(p_user,'USER','End owned reader session');
 update public.book_reader_sessions set ended_at=clock_timestamp() where entitlement_id=p_entitlement and user_id=p_user and auth_session_id=p_session and ended_at is null;
end $$;
create function book_private.record_recovery_event(p_actor uuid,p_action text,p_reference text,p_reason text,p_context jsonb) returns void
language plpgsql security definer set search_path = '' as $$ begin
 if p_action is null or p_action not in ('PAID_WITHOUT_ENTITLEMENT','DUPLICATE_PAYMENT','DUPLICATE_ENTITLEMENT','REFUND_REVIEW','REVOCATION_REVIEW','ACCOUNT_MISMATCH') or p_reference is null or length(p_reference) not between 1 and 200 or p_context is null or jsonb_typeof(p_context)<>'object' or octet_length(p_context::text)>4096 then raise exception 'BOOK_RECOVERY_EVENT_INVALID'; end if;
 perform book_private.set_actor(p_actor,'SERVICE',p_reason);
 insert into public.book_audit_events(actor_id,actor_kind,action,reason,reference,context) values(p_actor,'SERVICE',p_action,p_reason,p_reference,p_context);
end $$;

-- PostgREST-facing wrappers are INVOKER and executable only by the trusted server.
create function public.book_ensure_reader(p_user uuid) returns uuid language sql security invoker set search_path = '' as $$ select book_private.ensure_reader(p_user); $$;
create function public.book_create_order(p_user uuid,p_product text,p_key text) returns uuid language sql security invoker set search_path = '' as $$ select book_private.create_order(p_user,p_product,p_key); $$;
create function public.book_record_fulfillment(p_order uuid,p_reference text,p_actor uuid,p_reason text) returns uuid language sql security invoker set search_path = '' as $$ select book_private.record_fulfillment(p_order,p_reference,p_actor,p_reason); $$;
create function public.book_transition_entitlement(p_entitlement uuid,p_state text,p_actor uuid,p_reason text) returns void language sql security invoker set search_path = '' as $$ select book_private.transition_entitlement(p_entitlement,p_state,p_actor,p_reason); $$;
create function public.book_authorize_reader(p_user uuid,p_session uuid,p_product text) returns jsonb language sql security invoker set search_path = '' as $$ select book_private.authorize_reader(p_user,p_session,p_product); $$;
create function public.book_end_reader_session(p_user uuid,p_session uuid,p_entitlement uuid) returns void language sql security invoker set search_path = '' as $$ select book_private.end_reader_session(p_user,p_session,p_entitlement); $$;
create function public.book_record_recovery_event(p_actor uuid,p_action text,p_reference text,p_reason text,p_context jsonb) returns void language sql security invoker set search_path = '' as $$ select book_private.record_recovery_event(p_actor,p_action,p_reference,p_reason,p_context); $$;
revoke all on all functions in schema book_private from public,anon,authenticated,service_role;
-- Private mutation entry points only. Trigger/clock/actor helpers stay owner-only.
grant execute on function book_private.ensure_reader(uuid),book_private.create_order(uuid,text,text),book_private.record_fulfillment(uuid,text,uuid,text),book_private.transition_entitlement(uuid,text,uuid,text),book_private.authorize_reader(uuid,uuid,text),book_private.end_reader_session(uuid,uuid,uuid),book_private.record_recovery_event(uuid,text,text,text,jsonb) to service_role;
do $$ declare f regprocedure; begin
 for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('book_ensure_reader','book_create_order','book_record_fulfillment','book_transition_entitlement','book_authorize_reader','book_end_reader_session','book_record_recovery_event') loop
 execute format('revoke all on function %s from public,anon,authenticated,service_role',f);
 execute format('grant execute on function %s to service_role',f);
 end loop;
end $$;
commit;
