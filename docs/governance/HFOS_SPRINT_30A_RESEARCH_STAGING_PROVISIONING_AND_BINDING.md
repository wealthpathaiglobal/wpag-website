# HFOS Sprint 30A — Research Staging Provisioning and Binding

**Classification:** Controlled provisioning evidence / non-release authority

**Evidence date:** 2026-08-11

**Repository branch:** `feat/hfos-research-evidence-backbone`

**Sprint 30A continuation HEAD:** `ef450c3e69670503175f1658723796b56e1d9afe`

**Data boundary:** synthetic-data-only; no Production data cloned or accessed

**Release gate:** `BLOCKED`

## 1. Controlled input gate

| Artifact | Required SHA-256 | Result |
| --- | --- | --- |
| Sprint 30 Research Staging Environment Readiness | `fd9bdbcced54c7ea3606833761d20deb6a61b52062c961793afe69d1e305c907` | MATCH |
| Updated Pre-Soft-Launch Legal Review Packet v1.0 | `de74501eeae44a8e3030b0a054231efc1ad0253be21687b6dbf1ba6c54ee9de3` | MATCH |

The working tree was clean and Sprint 30 ancestry was intact at the original input gate.

## 2. Staging project identity

The organization owner manually provisioned the dedicated project. Independent Supabase project inventory then confirmed its identity and health.

| Field | Staging value |
| --- | --- |
| Project name | `wpag-research-staging` |
| Project reference | `dllefpzhmelflbmopdas` |
| Organization | Wealth Path AI Global |
| Region | `ap-south-1` / South Asia (Mumbai) |
| Compute | Nano |
| Status | `ACTIVE_HEALTHY` |
| Classification | HFOS Research Staging / synthetic-data-only |
| Starting migration state | No remote migrations |

Production remains a separate project:

| Field | Production value |
| --- | --- |
| Project name | `wpag-production` |
| Project reference | `ujitsgycbnswvomlqetr` |
| Region | `ap-south-1` |

No Production link, migration, repair, reset, schema, data, storage, domain, or configuration mutation was performed.

`PRODUCTION MODIFIED: NO`

## 3. Billing and authority

The staging project was manually provisioned by the organization owner under the Wealth Path AI Global Free organization using Nano compute. Codex did not create a paid resource, change a subscription, add a payment method, or alter billing configuration.

`PAID PROVISIONING OCCURRED BY CODEX: NO`

## 4. Credential custody

The existing authenticated Supabase CLI session was used to link and migrate staging without printing or committing a password, access token, anon key, service-role key, connection string, or project URL containing credentials.

- Production credentials were not reused.
- No secret-bearing file was added to Git.
- The repository contains only a non-secret environment contract.
- Service-role and Vercel encrypted-environment custody remain pending because no Vercel target or owner was supplied.

`STAGING CLI CREDENTIAL CUSTODY: AUTHENTICATED LOCAL SESSION / NO SECRET COMMITTED`

## 5. Supabase binding

The repository workflow was explicitly linked to `dllefpzhmelflbmopdas`. The local ignored Supabase link metadata identifies:

- ref: `dllefpzhmelflbmopdas`;
- name: `wpag-research-staging`;
- organization: Wealth Path AI Global.

Project identity was checked before remote mutation. The Production project was not linked or mutated during this continuation.

`SUPABASE STAGING BINDING: ESTABLISHED`

## 6. Controlled migration application

Pre-application dry run identified exactly 56 pending local migrations. The complete fresh-project chain was then applied transactionally in controlled order through:

`20260812010000_055_add_pre_soft_launch_request_routing.sql`

Final remote ledger verification reports 56 matching local/remote versions and zero missing migrations.

`STAGING MIGRATIONS THROUGH 055: APPLIED`

## 7. Schema parity

Bidirectional schema diff was run between the migration-built shadow schema and linked staging for `public` and `storage`.

No table, column, constraint, index, function, trigger, RLS, policy, or storage-schema drift was reported. The only variance is a hosted-project security hardening difference: staging revokes `UPDATE` on five code-generation sequences, and matching default privileges, from `anon`, `authenticated`, and `service_role`, while the migration shadow grants it. The affected sequences are:

- `application_code_seq`
- `consent_code_seq`
- `participant_code_seq`
- `participant_research_code_seq`
- `staff_code_seq`

The reverse diff proposes granting those privileges, confirming staging is more restrictive. No migration was added to weaken that posture.

`SCHEMA PARITY: VERIFIED WITH ONE PROVIDER-HARDENED SEQUENCE-PRIVILEGE VARIANCE`

## 8. RLS, grants, function security, and immutability

A read-only remote catalog probe completed 10/10 checks successfully:

1. all 36 Wave 1–4 research tables exist;
2. all 36 have RLS enabled and forced;
3. `anon` has no direct DML privilege on research tables;
4. `authenticated` has no direct DML privilege on research tables;
5. `service_role` uses governed RPCs rather than direct research-table DML;
6. research `SECURITY DEFINER` functions pin `search_path`;
7. the release-gate physical domain excludes `OPEN`;
8. the activation RPC returns only `ACTIVATION_NOT_AUTHORIZED` / `BLOCKED`;
9. no browser storage policy references `assessment-evidence`;
10. immutable research histories have update/delete protection triggers.

The remote CLI test login was also denied direct reads of protected research tables, consistent with revoked direct privileges.

Remote database lint completed successfully with two existing non-blocking PL/pgSQL warnings: unused variables `v_profile_id` and `v_complete_at`. No migration error or security lint failure was reported.

## 9. Storage posture

Read-only staging storage metadata confirms:

| Bucket | Public | Size limit | MIME allowlist | Objects |
| --- | --- | --- | --- | --- |
| `assessment-evidence` | `false` | 10 MiB | PDF, JPEG, PNG | 0 |
| `preliminary-report-artifacts` | `false` | 10 MiB | PDF | 0 |

There is no browser policy exposing `assessment-evidence`. No real or Production object was cloned or accessed.

`STAGING STORAGE: PROVISIONED, PRIVATE, EMPTY`

## 10. Release blocking

The five seeded release-firewall rows remain fail-closed:

- `synthetic_development`: enrollment and evidence `BLOCKED`;
- `synthetic_test`: enrollment and evidence `BLOCKED`;
- `controlled_research`: enrollment and evidence `NOT_AUTHORIZED`;
- `pilot`: all activation `NOT_AUTHORIZED`;
- `production`: all activation `NOT_AUTHORIZED`.

There are no release-gate assessment rows and therefore no `OPEN` assessment. The table constraint permits only `BLOCKED` or `UNRESOLVED`; the activation RPC is hard-coded to reject activation. Seeded participant-consent presentation authority also retains `real_activation_status = BLOCKED`.

`SOFT_LAUNCH_RELEASE_GATE: BLOCKED`

## 11. Synthetic-only state

The remote public-data inspection contains no participants, participant research identities, research enrollments, evidence, incidents, FSH results, or release assessments. Only controlled migration seed/configuration records are present.

`REAL PARTICIPANT DATA PRESENT: NO`

## 12. Test evidence and limitation

- Local Sprint 30 regression evidence remains 25 pgTAP files / 2,310 passing assertions.
- The remote catalog security probe passes 10/10.
- The full hosted pgTAP suite could not enter its assertions because Supabase's remote CLI test login does not resolve `plan()` / `no_plan()` from the `extensions` schema.
- A dedicated probe confirmed that the staging `pgtap` extension exists in `extensions` and contains both functions. This is a hosted CLI test-runner namespace/usage limitation, not a missing migration.

The full remote 2,310-assertion result is therefore `NOT VERIFIED`; it is not represented as passing.

## 13. Backup capability

Provider backup inventory reports:

- backups: none;
- PITR: disabled;
- WAL-G: enabled;
- region: `ap-south-1`.

No restore was attempted. Recovery capability remains unverified until a provider-supported snapshot/restore path is available and tested.

`STAGING RECOVERY VERIFICATION: NOT PERFORMED`

## 14. Vercel staging binding and environment separation

- `.vercel/project.json`: absent;
- Vercel CLI: unavailable;
- Vercel token/environment owner: unavailable;
- exact preview/staging project: not identified;
- Production domain routing: not modified;
- Production Supabase credentials: not reused.

The non-secret contract preserves `HFOS_RESEARCH_STAGING`, synthetic-only data, analytics exclusions for `/participant/**` and `/admin/**`, and all release/participant gates as blocked or not authorized.

`VERCEL STAGING BINDING: NOT ESTABLISHED`

## 15. Remaining blockers

1. Identify the exact Vercel preview/staging project and encrypted-environment owner.
2. Bind only staging Supabase values in that non-Production Vercel environment without exposing secrets or changing Production routing.
3. Resolve the hosted pgTAP test-role namespace/usage limitation or run the full suite through an approved privileged staging test mechanism.
4. Execute deployed synthetic E2E, cross-actor, RPC, storage download/upload, and browser-security verification against the bound staging deployment.
5. Establish and test a provider-supported staging backup/restore method.

## 16. Next authority and formal decision

Database migration and initial security verification were explicitly authorized by the organization owner and completed. Full Sprint 30A binding is not closed because the mandatory Vercel staging target and custody owner are unavailable.

`STAGING DATABASE MIGRATION / INITIAL SECURITY VERIFICATION: COMPLETED`

`STAGING RESTORE / DEPLOYED-E2E VERIFICATION: NOT AUTHORIZED`

`REAL PARTICIPANT EVIDENCE COLLECTION: NOT AUTHORIZED`

`ACTUAL PARTICIPANT ENROLLMENT: NOT AUTHORIZED`

`SOFT_LAUNCH_RELEASE_GATE: BLOCKED`

`PILOT: NOT AUTHORIZED`

`PRODUCTION: NOT AUTHORIZED`

`RESEARCH STAGING PROJECT PROVISIONING BLOCKED — EXTERNAL AUTHORITY / ACCESS REQUIRED`
