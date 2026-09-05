-- Empty-foundation rollback ONLY. Refuses meaningful commerce/audit data.
-- Production usage requires a separately reviewed forward recovery plan instead.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $$ begin
 if exists(select 1 from public.book_reader_profiles) or exists(select 1 from public.book_orders)
 or exists(select 1 from public.book_entitlements) or exists(select 1 from public.book_reader_sessions)
 or (select count(*) from public.book_audit_events)>1 then
 raise exception 'BOOK_ROLLBACK_REFUSED_NONEMPTY_FOUNDATION';
 end if;
end $$;
drop function public.book_ensure_reader(uuid);
drop function public.book_create_order(uuid,text,text);
drop function public.book_record_fulfillment(uuid,text,uuid,text);
drop function public.book_transition_entitlement(uuid,text,uuid,text);
drop function public.book_authorize_reader(uuid,uuid,text);
drop function public.book_end_reader_session(uuid,uuid,uuid);
drop function public.book_record_recovery_event(uuid,text,text,text,jsonb);
drop table public.book_reader_sessions;
drop table public.book_entitlements;
drop table public.book_orders;
drop table public.book_products;
drop table public.book_reader_profiles;
drop table public.book_audit_events;
drop function book_private.access_expiry(timestamptz);
drop function book_private.audit_change();
drop function book_private.audit_immutable();
drop function book_private.guard_order();
drop function book_private.guard_entitlement();
drop function book_private.set_actor(uuid,text,text);
drop function book_private.ensure_reader(uuid);
drop function book_private.create_order(uuid,text,text);
drop function book_private.record_fulfillment(uuid,text,uuid,text);
drop function book_private.transition_entitlement(uuid,text,uuid,text);
drop function book_private.authorize_reader(uuid,uuid,text);
drop function book_private.end_reader_session(uuid,uuid,uuid);
drop function book_private.record_recovery_event(uuid,text,text,text,jsonb);
drop schema book_private;
commit;
