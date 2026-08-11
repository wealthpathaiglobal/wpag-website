# HFOS Sprint 30C — Deployed Staging Verification Closure

## 1. Document identity

- Artifact: `HFOS_SPRINT_30C_DEPLOYED_STAGING_VERIFICATION_CLOSURE.md`
- Verification date: 2026-08-11 (Asia/Kolkata)
- Scope: synthetic-only deployed staging technical verification
- Staging project: `wpag-research-staging` (`dllefpzhmelflbmopdas`)
- Production project: `wpag-production` (`ujitsgycbnswvomlqetr`)
- Production disposition: not linked, not migrated, not queried, and not modified
- Controlled Sprint 30B input SHA-256: `a711a85a5a2ae4ec47f8cf48807efaf31417de28c489f44e728bcadd5792f994` — exact match

## 2. Repository and deployment identity

- Branch: `feat/hfos-research-evidence-backbone`
- Authorized and pushed commit: `a0e94666a493c1a1518c106543de6375f45e682b`
- Remote feature branch at deployed verification: `a0e94666a493c1a1518c106543de6375f45e682b`
- Remote `origin/main`: `b1fbbc4c8c9d9ba6a3ff658094da13777db3caf0`
- `main` modification/push: none
- Vercel deployment ID: `2bNgQgNBh45P2opwuYRR6fHHhd3B`
- Immutable deployment URL: `https://wpag-website-8rd3kieu6-wealthpathaiglobal.vercel.app`
- Branch Preview URL: `https://wpag-website-git-feat-hfos-research-e-68d5de-wealthpathaiglobal.vercel.app`
- Deployment type: non-Production Vercel Preview
- Preview Supabase binding: staging project `dllefpzhmelflbmopdas` only
- Preview environment: `HFOS_ENVIRONMENT=STAGING`
- Preview release posture: `SOFT_LAUNCH_RELEASE_GATE=BLOCKED`
- Production domain, deployment, environment variables, and Supabase binding: unchanged

The deployed application code remains the exact authorized commit. Sprint 30C database closure migrations 056–058 were applied only to the linked staging project and are present in the local controlled source set. They were not pushed to Git because the user's push authorization was restricted to the exact commit above.

## 3. Synthetic fixture design and closure

The fixture mechanism is operator-only, deterministic, auditable, reversible, and hard-bound to all of the following:

- `HFOS_ENVIRONMENT=STAGING`
- project reference `dllefpzhmelflbmopdas`
- PostgREST host `dllefpzhmelflbmopdas.supabase.co`
- `SOFT_LAUNCH_RELEASE_GATE=BLOCKED`
- synthetic email domain `synthetic.invalid`
- service-role execution only

The controlled run `closure-a0e9466` used six synthetic identities:

- administrator/reviewer A
- administrator/reviewer B
- independent reviewer-only C
- unauthorized support-only staff actor
- participant A
- participant B

The third reviewer was required by the already-governed same-actor prohibitions: evidence/observation creation, event verification, and outcome adjudication could not all be performed by the two original qualified actors without weakening independence. No independence rule was relaxed.

Migrations:

- `20260812030000_056_govern_sprint30c_staging_fixtures.sql` — exact-host staging-only staff fixture creation/revocation
- `20260812050000_057_add_sprint30c_independent_reviewer_fixture.sql` — reviewer-only third actor
- `20260812070000_058_grant_governed_staff_self_projection.sql` — non-sensitive self-only staff projection needed by deployed administrator access

Authenticated callers receive only `id`, `auth_user_id`, `staff_code`, `full_name`, `email`, and `status` from their own staff row under the existing `staff_members_select_own` RLS policy. `internal_notes`, cross-staff reads, and all direct mutations remain unavailable.

Cleanup completed after verification:

- all six synthetic logins return HTTP 400;
- all four synthetic staff role checks return `false`;
- fixture activation and revocation audit history remains preserved;
- governed research and audit history was not deleted.

## 4. Admin authentication defect and deployed result

Root cause 1 was application handling: a normal unauthenticated `AuthenticationError` escaped the administrator layout and produced HTTP 500. Commit `a0e9466` introduced the governed result:

- unauthenticated: redirect to `/auth/login?next=%2Fadmin%2Fdashboard`;
- authenticated non-administrator: non-disclosing not-found response;
- unexpected infrastructure/database error: rethrown, never concealed as an auth result.

The final protected-Preview matrix was executed through Vercel's authenticated deployment curl against the immutable deployment:

| Actor | Result |
| --- | --- |
| Unauthenticated | HTTP 307 to the exact login route |
| Authorized administrator A | HTTP 200; Admin Dashboard present |
| Authenticated support-only staff | HTTP 404 |
| Authenticated participant A | HTTP 404 |

Root cause 2, found during the final deployed recheck, was a missing SQL column privilege on `staff_members`: the administrator had the correct governed role but the server-side self-staff projection returned PostgreSQL `42501`. Migration 058 grants only the non-sensitive columns required by the existing self-only RLS policy. After migration 058, the administrator result changed from redirect to the governed HTTP 200 dashboard response; the two unauthorized actor results remained HTTP 404.

Local auth-policy tests also cover unauthenticated, participant, unauthorized staff, authorized administrator, expired/invalid session, unexpected database error, and fixture role topology.

## 5. Deployed authenticated synthetic E2E

The full synthetic flow was exercised against staging through the governed deployed/API/RPC contracts:

1. synthetic participant authentication;
2. consent presentation and direct consent grant;
3. privacy/readiness gate assessment;
4. synthetic research context without actual participant enrollment activation;
5. append-only evidence and corrected evidence version;
6. frozen baseline snapshot;
7. internal FSH calculation;
8. follow-up evidence and follow-up snapshot;
9. proposed outcome, verified event, and independent adjudication;
10. withdrawal request;
11. audit-integrity assessment;
12. participant/admin and participant/participant separation;
13. explicit release-activation denial.

Observed governed data included:

- two synthetic research identities/enrollments, both still `pending_enrollment`;
- five evidence versions across four evidence items;
- two frozen snapshots;
- two follow-up records;
- two FSH results;
- one governed incident;
- thirty research control audit events in the final recovery export;
- one independently confirmed adjudication by reviewer C.

Participant-facing projection remained `FACTUAL_STATUS_ONLY`; raw FSH and System State were suppressed. Both FSH results remained `participant_release_status=BLOCKED` and `system_state_status=NOT_AUTHORIZED`.

## 6. Security-negative and separation results

| Check | Deployed result |
| --- | --- |
| Participant A reads participant B | denied (`P1001`) |
| Participant B reads participant A | denied (`P1001`) |
| Participant A mutates participant B withdrawal | denied (`P1001`) |
| Participant accesses admin route | HTTP 404 |
| Support-only staff accesses admin route | HTTP 404 |
| Same actor verifies own event | denied; separate actor required |
| Prior actor adjudicates outcome | denied (`P1001`) |
| Independent reviewer C adjudicates | allowed |
| Immutable research evidence update | HTTP 403 |
| Evidence creation after withdrawal | denied (`P1001`) |
| `SOFT_LAUNCH_OPEN` activation attempt | `ACTIVATION_NOT_AUTHORIZED` / `BLOCKED` |
| Participant System State exposure | none; `NOT_AUTHORIZED` |
| Participant raw-FSH exposure | none; suppressed by participant-safe projection |

The audit-integrity assessment returned `COMPLETE` with no missing required event types. The synthetic incident retained an `UNRESOLVED` release-gate effect.

## 7. Storage regression

The `assessment-evidence` storage boundary was rechecked with synthetic content only:

- bucket exists and remains private (`public=false`);
- server-side synthetic upload succeeded;
- overwrite with `x-upsert=false` was rejected;
- service-role private retrieval succeeded;
- anonymous retrieval was denied;
- participant A retrieval was denied;
- participant B retrieval was denied;
- temporary synthetic storage object was removed after verification.

No signed URL, storage path, checksum, service-role key, or Production credential was disclosed.

## 8. Hosted pgTAP decision

Full hosted pgTAP was not falsely claimed. The hosted temporary database login role cannot resolve unqualified pgTAP functions, and explicit `extensions.no_plan()` is denied because that role lacks safe use of the provider-managed `extensions` schema. Granting or weakening hosted privileges only to run tests was rejected.

Technical sufficiency was established through:

- a clean local reset through migration 058;
- the complete current-schema pgTAP suite: 28 files / 2,341 tests / PASS;
- focused fixture, reviewer-independence, and staff-self-projection pgTAP tests;
- linked-staging migration parity through `20260812070000`;
- deployed role/RLS/auth/storage/immutability/cross-participant/release probes;
- the full authenticated synthetic E2E.

This is accepted as the Sprint 30C controlled equivalent. Provider-hosted pgTAP remains a platform/tooling limitation, not an unreported test execution.

## 9. Logical recovery evidence

Provider capabilities on Free/Nano remain:

- provider backups: none;
- PITR: disabled;
- WAL-G: enabled, but no user-accessible physical restore target.

No physical/PITR recovery is claimed. The strongest available non-destructive alternative was completed:

1. exported the linked staging `auth`, `public`, and `storage` schema;
2. exported staging data containing synthetic governed records;
3. restored both into a fresh isolated local Supabase Postgres database, `sprint30c_recovery`;
4. loaded circular-FK data with replication triggers disabled only for the isolated restore session;
5. returned the session to normal trigger behavior;
6. verified governed relationships and closing privileges.

Temporary export identities:

- schema SHA-256: `01ea7e3e7dd02cbb9ea7e60ce0525600a0504651baaa332c6971d74f4ead5763`
- data SHA-256: `7b283e27e4e2fb318798da4b97a2107a576bb5135f9bab677df7db2a94ee0ea1`

Recovered counts and integrity:

| Recovered object | Count / result |
| --- | --- |
| Synthetic Auth identities | 6 |
| Consent records | 4 |
| Withdrawal records | 3 |
| Evidence items / versions | 4 / 5 |
| Snapshots | 2 |
| Research control audit events | 30 |
| Incidents | 1 |
| FSH results | 2 |
| Consent, withdrawal, evidence, predecessor, snapshot, audit, incident, and FSH checked orphans | 0 |
| FSH results release-blocked | 2 |
| FSH results System State not authorized | 2 |
| Authenticated self-ID projection granted | true |
| Authenticated internal-notes projection granted | false |

## 10. Analytics regression

The deployed research route contained no WPAG product analytics request for:

- Vercel Web Analytics (`/_vercel/insights`);
- Vercel Speed Insights;
- Google Tag Manager;
- Google Analytics / `gtag.js`.

The only observed Vercel script was the Preview feedback toolbar supplied by the protected Vercel Preview environment; it is not product analytics instrumentation in the application.

## 11. Release firewall

The deployed release assessment remained `BLOCKED`. Recorded blocking reasons included:

- `LEGAL_PRIVACY_DEPENDENCY_UNRESOLVED`
- `DEPLOYMENT_SECURITY_REVIEW_REQUIRED`
- `B1_BLOCKERS_REMAIN`
- `INDEPENDENT_REMEDIATION_REVIEW_REQUIRED`
- `RELEASE_APPROVAL_MISSING`

An explicit `SOFT_LAUNCH_OPEN` attempt returned `ACTIVATION_NOT_AUTHORIZED`. Sprint 30C does not remove legal, governance, independent-review, or release-approval gates.

## 12. Local regression and repository hygiene

- Clean Supabase reset through migration 058: PASS
- Current-schema pgTAP: 28 files / 2,341 tests / PASS
- Application suite: 76 files / 652 tests / PASS
- Focused Sprint 30C auth/fixture tests: PASS
- ESLint: PASS
- TypeScript `--noEmit`: PASS
- Production build: PASS
- `git diff --check`: PASS
- Schema lint: two pre-existing unused-variable warnings only (`v_profile_id`, `v_complete_at`); no new Sprint 30C schema warning
- Secrets or environment files staged/committed: none
- Production project linked: false
- Staging project linked: true
- Local and staging migrations: exact parity through migration 058

The aggregate database-test command that mixes already-migrated current-schema tests with pre-047 upgrade fixtures is not a valid clean-state orchestration: those fixtures are designed for their dedicated pre-migration harness. The complete current-schema suite was therefore run separately after a clean reset and passed in full. No upgrade-path success was inferred from the invalid mixed invocation.

## 13. B1 technical reconciliation

| Blocker | Status | Closure evidence |
| --- | --- | --- |
| T-01 safe hosted synthetic fixtures | CLOSED | exact-host staging-only service-role fixtures, role matrix, audit trail, deterministic revocation |
| T-02 `/admin/dashboard` unauthenticated 500 | CLOSED | deployed HTTP 307 login redirect; authorized admin HTTP 200; unauthorized actors HTTP 404 |
| T-03 hosted verification incomplete | CLOSED WITH CONTROLLED EQUIVALENT | hosted privilege limitation documented; clean local full pgTAP plus comprehensive deployed probes and E2E |
| T-04 recovery evidence incomplete | CLOSED WITH LOGICAL RECOVERY | post-058 schema/data export, fresh isolated restore, zero checked relationship orphans; no physical/PITR claim |

B2 legal/privacy and all independent governance/release approvals remain outside Sprint 30C and unchanged.

## 14. Authority boundary

`REAL PARTICIPANT EVIDENCE COLLECTION: NOT AUTHORIZED`

`ACTUAL PARTICIPANT ENROLLMENT: NOT AUTHORIZED`

`SOFT_LAUNCH_RELEASE_GATE: BLOCKED`

`PILOT: NOT AUTHORIZED`

`PRODUCTION: NOT AUTHORIZED`

No real participant data was used. No Production project, migration, environment variable, domain, deployment, routing, or credential was modified.

## 15. Technical readiness decision

`DEPLOYED STAGING TECHNICAL VERIFICATION COMPLETE — FINAL PRE-SOFT-LAUNCH TECHNICAL REVIEW AUTHORIZED`

This decision authorizes only the final technical review. It does not authorize participant enrollment, evidence collection, soft launch, Pilot, Production, or release-gate activation.
