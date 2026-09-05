# Book Buyer Identity + Entitlement Foundation V1

Local/staging foundation only. No production application, public signup, provider, checkout, real-user entitlement, or manuscript release is authorized by this change.

## Isolated data model

The only dependency on existing infrastructure is Supabase Auth (`auth.users`, `auth.sessions`) and ordinary PostgreSQL/Supabase roles. Research migrations 031–049 and research RPCs are not dependencies. Do not use a blanket database push: production has an intentionally unresolved research migration backlog.

Six new public tables:

| Table | Identity and purpose |
| --- | --- |
| `book_reader_profiles` | Auth UUID primary key; creation timestamp only. No participant status, email duplication, or research trigger. |
| `book_products` | Fixed product slug `hfos-phase-1-stability`; HFOS Phase 1 — Stability; 19900 INR; 24 months; two sessions; web-only; no full PDF or automatic renewal. |
| `book_orders` | UUID, owner/profile FK, product FK, immutable server snapshot, status, owner-scoped idempotency key, optional reserved provider-order reference, unique fulfillment reference, timestamps. |
| `book_entitlements` | UUID, owner/product, composite source-order ownership FK, one grant per order, explicit state, immutable activation clock. Unique partial index permits at most one ACTIVE/PENDING grant per owner/product. |
| `book_reader_sessions` | Owned entitlement, Auth session UUID, short lease, heartbeat timestamp and ended timestamp; unique entitlement/Auth-session pair. No fingerprint or IP/device data. |
| `book_audit_events` | Append-only actor/kind/action/time/reason/reference/context. Service reads only; triggers reject update/delete/truncate. |

The `book_private` schema contains restricted transactional implementation functions and trigger helpers. Its schema is unavailable to anon/authenticated roles. Public RPC wrappers are SECURITY INVOKER and executable only by service_role. Private SECURITY DEFINER entry points have an empty search_path and explicit execution grants; helper functions remain owner-only. Service-role table access is SELECT only, with mutation performed through the restricted routines.

All six tables have RLS enabled inside the creation transaction. PUBLIC/anon/authenticated/service_role default table and column privileges are explicitly removed before the intended grants are applied. Audit sequence privileges are also removed. Authenticated buyers receive ownership-filtered column SELECT grants, not direct write privileges:

- Profile: own UUID and creation time.
- Product: authenticated catalog read; its public page remains the existing static public page.
- Orders: own identifiers, price/access/delivery snapshot, status and timestamps; no idempotency/provider/payment reference.
- Entitlements: own identifiers, status, start/expiry and timestamps; no internal fulfillment facts.
- Sessions: own lease identifiers and lifecycle timestamps; no raw Auth session UUID.
- Audit: no buyer access.

Book profile/commerce ownership FKs use RESTRICT on deletion: once a reader profile exists, deleting its Auth user requires a separately governed retention/account-closure plan. No account deletion or identity migration is introduced here.

No views or policies are added to existing research tables. No authorization decision uses editable user metadata. Existing participants can explicitly bootstrap a reader profile for the same Auth UUID. A buyer cannot acquire participant access through these routines.

## Mutation contracts

All public functions below require service_role; no application route exposes the order, fulfillment, transition or recovery mutation routines in V1.

- `book_ensure_reader(p_user)` validates a confirmed, non-anonymous existing Auth user and idempotently creates only its reader profile. It does not create/invite an Auth user.
- `book_create_order(p_user,p_product,p_key)` locks the owner profile, snapshots the database product, creates a PENDING order and PENDING entitlement atomically, and returns the same order for the same key. A different key while ACTIVE/PENDING exists is rejected. A stale ACTIVE grant is expired before a new order is considered. No client price/access argument exists.
- `book_record_fulfillment(p_order,p_reference,p_actor,p_reason)` is a restricted future fulfillment primitive, currently exercised **only by synthetic local SQL tests**. There is no HTTP handler, payment adapter, signature verification or webhook. Future payment work must independently verify a payment fact before invoking it. It links a unique reference, marks the order paid and activates once in a transaction. Retries return the same grant without restoration or a new clock. A different reference requires duplicate-payment review; a missing grant requires reconciliation.
- `book_transition_entitlement(...)` supports controlled revocation, refund, elapsed expiry and correction of mistaken revocation. Restoration requires an originally activated, unexpired REVOKED grant. REFUNDED and EXPIRED cannot become ACTIVE. Reasons are required. Non-ACTIVE transitions invalidate leases atomically.
- `book_authorize_reader(p_user,p_session,p_product)` implements Auth → profile → effective entitlement → lease. It checks and locks the matching live Auth session, including ownership and `not_after`, then serializes on the entitlement row. It returns ALLOWED only with an admitted lease; all other states fail closed.
- `book_end_reader_session(...)` ends only the verified owner's matching Auth-session lease.
- `book_record_recovery_event(...)` appends governed review events for paid-without-entitlement, duplicate payment/grant, refund/revocation review and account mismatch. It does not silently repair identity, money or authorization records.

`starts_at` is assigned from the database clock on first activation; `expires_at` is exactly `(starts_at AT TIME ZONE 'UTC' + interval '24 months') AT TIME ZONE 'UTC'`. This is calendar arithmetic, including leap-day clamping, not a fixed number of days. Triggers prevent clock changes after first activation. Source order, owner and product cannot be reassigned.

Leases last at most two minutes, bounded by entitlement expiry. A future reader should heartbeat within 60 seconds by invoking the same admission routine through a verified server handler. Tabs sharing one Auth session share a lease. A third live session is denied; V1 does not offer replacement UI. Expired leases and deleted/elapsed Auth sessions stop consuming slots. Logout is checked through the live Auth session row on every admission, not merely JWT expiry. Admission/end/restoration is audited; ordinary heartbeat timestamp updates are not separate audit events.

## Application boundary and auth routes

Default: `BOOK_READER_FOUNDATION_ENABLED` is unset/false. All new pages and handlers return 404. No public navigation or sitemap points to them, and no signup mechanism exists.

With an explicitly enabled local/staging foundation:

- `/book-reader/login`: sign into an existing Auth identity only; never falls back to signup or invitation.
- `/book-reader/account`: requires verified identity; explicitly offers profile bootstrap, without research side effects or purchase UI.
- `/book-reader/recover`, `/book-reader/update-password`, `/book-reader/callback`: reuse Supabase password mechanics with buyer-specific copy and destinations. Recovery explains that the password belongs to the shared WPAG account. The separate buyer callback does not accept research invitations.
- `/api/book-reader/profile`: same-origin POST; ignores client owner/email/metadata; bootstraps the verified UUID.
- `/api/book-reader/session`: same-origin POST to end a verified owned session slot. No client Auth-session override.
- `/api/book-reader/synthetic`: same-origin POST through the complete boundary. It additionally requires `BOOK_READER_SYNTHETIC_ENABLED=true`, and is hard-disabled when NODE_ENV or VERCEL_ENV is production. Returns one synthetic fixture sentence only. No real full-reader content route is added.

Server identity uses `getUser()` plus verified `getClaims()` with matching subject and a valid session UUID. The database validates the live session for paid access. Server-only imports prevent the privileged module entering client bundles. Responses use private/no-store caching and sanitized failures. Successful authenticated callback/recovery paths are covered by unit tests; no real user's reset email/password or session was exercised.

Existing `/auth/*` participant behavior, Homepage/Books/Product/Preview/Reader v3, all legal pages, pricing and payment modules are unchanged. `/api/books/orders` remains an unconditional 503 `PAYMENTS_DISABLED` response, regardless of foundation flags. Product records are not a payment provider integration.

## Validation and application instructions

Candidate: `supabase/migrations/20260905183804_book_buyer_identity_entitlement_foundation_v1.sql` (filename generated with Supabase CLI). Read the exact candidate before any production approval. It is additive and must be applied alone after explicit approval; **do not run database push, 031–049, or research recovery as part of this foundation**.

Local isolated database `wpag_book_foundation_v1` was built from schema-only Auth support, repository research migrations through 030 and the already approved containment SQL. It contains no production data and excludes 031–049. The candidate was applied there. The schema-only Auth fixture receives normal helper-schema usage grants within the rolled-back SQL tests; these are not part of the production migration.

Run:

```sh
npm test
npm run lint
npm run build
docker exec -i supabase_db_wpag-website-v1 psql -U postgres -d wpag_book_foundation_v1 -v ON_ERROR_STOP=1 < supabase/tests/database/book_foundation/001_foundation.test.sql
python3 supabase/tests/database/book_foundation/concurrency.py
```

The SQL suite rolls back every synthetic identity, participant fixture, order, grant and lease. The concurrency harness asserts an empty template, creates an isolated local clone, tests concurrent callers and removes the clone even on failure. It has no remote connection path. Do not point these synthetic fixture scripts at production.

The empty-foundation rollback in `rollback-empty.sql` was rehearsed, followed by successful reapplication. It uses explicit DROP statements without CASCADE and refuses commerce records or meaningful audit history. Once real usage exists, preserve records and use separately reviewed forward recovery; do not erase the schema to roll back application code. Simply disabling the foundation flag closes its application entry points without touching data.

The local Supabase security advisor reports no new book-related warnings; its existing `public.set_updated_at` mutable-search-path warning is unrelated and unchanged. No global defaults, Auth settings or existing research grants were modified by the commerce candidate.

The full manuscript stays outside the repository's public/runtime content. The release manifest remains `NON-PUBLIC / RELEASE_REVIEW_REQUIRED` with `public_authorization: false`. No full content, protected manuscript manifest, download or provider dependency was imported.

Reference used for live session validation: [Supabase session identifiers and logout behavior](https://supabase.com/docs/guides/auth/sessions#how-to-ensure-an-access-token-jwt-cannot-be-used-after-a-user-signs-out).
