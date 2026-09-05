"""Local-only concurrency checks; clones an EMPTY foundation database and drops its clone.
Usage: python3 supabase/tests/database/book_foundation/concurrency.py
Requires the existing local Docker Postgres container; never connects to a remote host.
"""
import concurrent.futures,json,subprocess,uuid
from pathlib import Path
CONTAINER='supabase_db_wpag-website-v1'
TEMPLATE='wpag_book_foundation_v1'
db='wpag_book_concurrency_'+uuid.uuid4().hex[:8]
checks=[]
def command(*args):
 return subprocess.run(['docker','exec',CONTAINER,*args],text=True,capture_output=True,check=True).stdout.strip()
def sql(query):
 p=subprocess.run(['docker','exec','-i',CONTAINER,'psql','-U','postgres','-d',db,'-XAtq','-v','ON_ERROR_STOP=1'],input=query,text=True,capture_output=True)
 if p.returncode: raise RuntimeError(p.stderr)
 return p.stdout.strip()
def check(name,condition):
 checks.append({'check':name,'pass':bool(condition)})
 if not condition: raise AssertionError(name)
def run_parallel(queries):
 with concurrent.futures.ThreadPoolExecutor(max_workers=12) as executor: return list(executor.map(sql,queries))
# Avoid cloning any real or earlier test buyer records.
assert command('psql','-U','postgres','-d',TEMPLATE,'-XAtqc','select count(*) from public.book_reader_profiles')=='0'
command('createdb','-U','postgres','--template',TEMPLATE,db)
try:
 owner='51000000-0000-4000-8000-000000000001'
 sql(f"insert into auth.users(id,email,email_confirmed_at,is_anonymous) values('{owner}','concurrency@test.invalid',now(),false);")
 profile_query=f"set role service_role; select public.book_ensure_reader('{owner}');"
 check('concurrent bootstrap reuses one UUID',set(run_parallel([profile_query]*12))=={owner})
 check('exactly one profile',sql('select count(*) from public.book_reader_profiles')=='1')
 order_query=f"set role service_role; select public.book_create_order('{owner}','hfos-phase-1-stability','same-concurrent-key');"
 orders=run_parallel([order_query]*12); check('idempotent concurrent order requests',len(set(orders))==1)
 order=orders[0]
 fulfill=f"set role service_role; select public.book_record_fulfillment('{order}','synthetic-concurrent-fulfillment',null,'Synthetic concurrency test');"
 grants=run_parallel([fulfill]*12);check('exact-once concurrent fulfillment identity',len(set(grants))==1)
 ent=grants[0]
 check('only one activation audit event',sql("select count(*) from public.book_audit_events where action='book_entitlements.update' and context->>'new_status'='ACTIVE'")=='1')
 check('only one paid order event',sql("select count(*) from public.book_audit_events where action='book_orders.update' and context->>'new_status'='PAID'")=='1')
 sessions=[str(uuid.uuid4()) for _ in range(20)]
 sql('insert into auth.sessions(id,user_id,not_after) values '+','.join(f"('{s}','{owner}',now()+interval '1 day')" for s in sessions)+';')
 def admission(s):return f"set role service_role; select public.book_authorize_reader('{owner}','{s}','hfos-phase-1-stability');"
 outcomes=[json.loads(x) for x in run_parallel([admission(s) for s in sessions])]
 check('20 simultaneous sessions admit exactly two',sum(x['status']=='ALLOWED' for x in outcomes)==2)
 check('remaining 18 sessions denied',sum(x['status']=='SESSION_LIMIT' for x in outcomes)==18)
 check('database contains at most two live slots',sql('select count(*) from public.book_reader_sessions where ended_at is null and lease_expires_at>now()')=='2')
 admitted=sessions[next(i for i,x in enumerate(outcomes) if x['status']=='ALLOWED')]
 check('parallel tabs share admitted Auth session',all(json.loads(x)['status']=='ALLOWED' for x in run_parallel([admission(admitted)]*12)))
 check('tabs did not create more leases',sql('select count(*) from public.book_reader_sessions where ended_at is null')=='2')
 sql("update public.book_reader_sessions set last_seen_at=now()-interval '5 minutes',lease_expires_at=now()-interval '3 minutes';")
 outcomes=[json.loads(x) for x in run_parallel([admission(s) for s in sessions])]
 check('stale-slot recovery remains concurrency-safe',sum(x['status']=='ALLOWED' for x in outcomes)==2)
 clock=sql(f"select starts_at::text||'/'||expires_at::text from public.book_entitlements where id='{ent}'")
 sql(f"set role service_role; select public.book_transition_entitlement('{ent}','REVOKED',null,'Synthetic mistaken revocation'); select public.book_transition_entitlement('{ent}','ACTIVE',null,'Synthetic restoration');")
 check('restoration preserves exact clock',clock==sql(f"select starts_at::text||'/'||expires_at::text from public.book_entitlements where id='{ent}'"))
 # Any admissions serialized before refund may succeed; after its commit every request must deny.
 run_parallel([admission(s) for s in sessions]+[f"set role service_role; select public.book_transition_entitlement('{ent}','REFUNDED',null,'Synthetic refund race');"])
 check('refund race leaves zero live leases',sql('select count(*) from public.book_reader_sessions where ended_at is null')=='0')
 check('all requests after refund denied',all(json.loads(x)['status']=='REFUNDED' for x in run_parallel([admission(s) for s in sessions])))
 run_parallel([fulfill]*8)
 check('late concurrent fulfillment cannot reactivate refunded entitlement',sql(f"select status from public.book_entitlements where id='{ent}'")=='REFUNDED')
 # Refuse a destructive empty-foundation rollback once records/audit history exist.
 rollback=Path(__file__).resolve().parents[4]/'docs/books/buyer-foundation-v1/rollback-empty.sql'
 try:sql(rollback.read_text());refused=False
 except RuntimeError as error:refused='BOOK_ROLLBACK_REFUSED_NONEMPTY_FOUNDATION' in str(error)
 check('rollback refuses a nonempty foundation',refused)
finally:
 command('dropdb','-U','postgres',db)
print(json.dumps({'checks':len(checks),'passed':sum(x['pass'] for x in checks),'results':checks,'isolated_clone_removed':True},indent=2))
