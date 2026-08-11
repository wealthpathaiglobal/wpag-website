# HFOS Sprint 30B — Vercel Staging and Deployed E2E Readiness

**Classification:** Controlled deployment evidence / synthetic only / non-release authority  
**Evidence date:** 2026-08-11  
**Repository branch:** `feat/hfos-research-evidence-backbone`  
**Deployed source commit:** `fcffd7f31112c680d8cc195cb9937b817697d338`  
**Release gate:** `BLOCKED`

## 1. Controlled input and repository gate

The Sprint 30A provisioning artifact matched its required SHA-256:

`d65fdd02eb35f1d6de6d13b12c9a9551999a2aa32478c9ea7977d9810e4c3fc8`

The authorized branch was clean at exact commit `fcffd7f31112c680d8cc195cb9937b817697d338` before it was pushed. The remote branch did not previously exist. The push created only `feat/hfos-research-evidence-backbone`; it did not update `main`.

## 2. Vercel identities

| Classification | Identity |
| --- | --- |
| Vercel team | `wealthpathaiglobal` / Hobby |
| Vercel project | `wpag-website` |
| Production branch | `main` |
| Production source at verification | `b1fbbc4c8c9d9ba6a3ff658094da13777db3caf0` |
| Production domain | `www.wealthpathaiglobal.com` |
| Research staging class | Vercel Preview tied to `feat/hfos-research-evidence-backbone` |
| Stable Preview alias | `https://wpag-website-git-feat-hfos-research-e-68d5de-wealthpathaiglobal.vercel.app` |
| Final Preview deployment | `https://wpag-website-cghrry08b-wealthpathaiglobal.vercel.app` |
| Final Preview deployment ID | `HrQ5rSPCdzui7RwQzp6hPJ1Ydfzc` |

The Preview is protected by Vercel authentication and returns `x-robots-tag: noindex` to an unauthenticated external request. It was never promoted to Production and no Production domain was assigned to it.

## 3. Environment ownership and credential custody

The Wealth Path AI Global Vercel organization owner controls project environment variables. Staging Supabase credential issue, rotation, and revocation remain under the authenticated Wealth Path AI Global Supabase organization account. Values were entered through Vercel's encrypted environment-variable interface and were not printed, written to repository files, or committed.

`SUPABASE_SERVICE_ROLE_KEY` is a server-side variable only. No `NEXT_PUBLIC_` alias was created for it.

## 4. Environment-variable separation

| Variable | Production-effective scope | Preview-effective scope | Result |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Original value retained; Production + Development | New staging value; Preview only | PASS |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Original value retained; Production + Development | New staging value; Preview only | PASS |
| `SUPABASE_SERVICE_ROLE_KEY` | Original sensitive value retained; Production only | New sensitive staging value; Preview only | PASS |
| `NEXT_PUBLIC_SITE_URL` | Original value retained; Production + Development | Stable non-Production branch alias; Preview only | PASS |
| `HFOS_ENVIRONMENT` | Not changed | `STAGING`; Preview only | PASS |
| `SOFT_LAUNCH_RELEASE_GATE` | Not changed | `BLOCKED`; Preview only | PASS |

The revealed Production Supabase URL remained exactly:

`https://ujitsgycbnswvomlqetr.supabase.co`

The Preview Supabase URL was set exactly to:

`https://dllefpzhmelflbmopdas.supabase.co`

The prior Production-bound values were not rotated or replaced. Preview was removed from their scopes before the staging values were added. Production remained selected throughout each scope edit.

## 5. Deployment result

The exact authorized commit was deployed first to identify Vercel's stable branch alias. `NEXT_PUBLIC_SITE_URL` was then bound to that non-Production alias and the exact Preview deployment was redeployed with the latest Preview settings. The redeploy dialog was explicitly set to `Preview`, selected the feature-branch deployment, and showed only the Preview alias as an assigned domain.

The final deployment reached `Ready` and the authenticated Preview URL rendered the WPAG application successfully.

## 6. Analytics firewall

Runtime DOM inspection on the deployed Preview found zero Google Analytics and zero Vercel Analytics scripts on:

- `/participant`
- `/admin/dashboard`

This agrees with the deployed `GovernedAnalytics` route-prefix policy for `/participant/**` and `/admin/**`.

`RESEARCH-ROUTE ANALYTICS SUPPRESSION: VERIFIED`

## 7. Storage verification

A synthetic-only minimal PDF was uploaded to the staging `assessment-evidence` bucket using staging server authority.

| Check | Result |
| --- | --- |
| Staging project reference | `dllefpzhmelflbmopdas` |
| MIME | `application/pdf` |
| SHA-256 | `c65a989be49524b96baf05d6686bba3c2981a690c079f7862246688f420a81db` |
| Initial upload | PASS |
| Server-authorized retrieval | PASS |
| Anonymous retrieval | DENIED |
| Same-path second upload | DENIED (`400`) |
| Immutable no-overwrite behavior | PASS |

The storage probe used no real participant content. Governed participant ownership, administrator document projection, restricted-evidence behavior, and cross-participant download denial remain unverified because no governed synthetic participant/document context could be safely established with the available hosted role.

## 8. Authentication, route, and E2E status

The public participant landing route rendered successfully. Full synthetic authentication and the required participant/admin journey were not completed.

The safe setup attempt created temporary synthetic Auth identities only. It then stopped when `service_role` was denied direct read/write access to `staff_roles` / `staff_members`, as designed. A second setup attempt using the linked hosted test login was likewise denied direct write access. Its transaction did not persist staff, participant, enrollment, consent, evidence, snapshot, FSH, withdrawal, or Audit rows. All five unused synthetic Auth identities were deleted after the attempt.

No privileged bypass, migration, schema alteration, grant change, or Production write was used to defeat the governed boundary.

The deployed `/admin/dashboard` route currently returns HTTP 500 for an unauthenticated request because an `AuthenticationError` escapes server-page handling. Runtime logs confirmed the error. This is fail-closed with respect to data disclosure, but it is not an acceptable completed administrator authentication-path verification.

The following deployed journey items remain **NOT VERIFIED**:

1. synthetic participant login;
2. synthetic administrator login;
3. participant/admin separation under authenticated sessions;
4. exact consent presentation and grant through the deployed application;
5. governed research evidence and snapshot creation through deployed boundaries;
6. deployed internal FSH calculation;
7. withdrawal blocking;
8. Audit reconstruction;
9. authenticated release-activation rejection;
10. actor-independence and cross-participant application-level denials.

## 9. Release firewall

The Preview environment has `SOFT_LAUNCH_RELEASE_GATE=BLOCKED`. Sprint 30A independently verified that the staging database physical release-gate domain excludes `OPEN` and that activation RPCs fail closed. No Preview variable, route, deployment action, domain assignment, or storage operation opened or bypassed the gate.

`SOFT_LAUNCH_RELEASE_GATE: BLOCKED`

## 10. Production safety

- Production Vercel project identity: unchanged.
- Production branch and source deployment: unchanged.
- Production domain routing: unchanged.
- Production Supabase URL: independently rechecked and unchanged.
- Production environment-variable values: not rotated, replaced, or deleted.
- Production Supabase project: not linked, migrated, seeded, queried for participant data, or modified.
- Preview was not promoted to Production.

`PRODUCTION MODIFIED: NO`

## 11. Backup, hosted pgTAP, and recovery

`BACKUP / RESTORE VERIFICATION: NOT COMPLETE`

Staging still has no provider backup and PITR remains disabled. No restore was attempted.

The hosted pgTAP limitation remains: the linked remote CLI test role does not resolve the `extensions`-schema pgTAP planning functions and also cannot act as a privileged synthetic fixture seeder. This is not represented as a database failure or a passing full remote pgTAP run.

## 12. B1 technical reconciliation

| Item | Status | Evidence / remaining condition |
| --- | --- | --- |
| Exact non-Production Vercel identity | CLOSED | Preview project, branch, deployment, aliases, and source commit identified |
| Staging-only Supabase binding | CLOSED | Preview-specific URL/anon/service-role values; Production URL independently retained |
| Production separation | CLOSED | No Production deployment, domain, branch, variable value, or database mutation |
| Release firewall | CLOSED for configuration; PARTIALLY CLOSED for deployed authenticated exercise | Environment and database gates remain blocked; authenticated activation attempt not run |
| Analytics suppression | CLOSED | Deployed `/participant` and `/admin` route families showed no GA/Vercel Analytics scripts |
| Storage privacy and immutable path | PARTIALLY CLOSED | Server retrieval, anonymous denial, and no-overwrite pass; governed participant/admin projections remain unverified |
| Synthetic authentication | NOT CLOSED | No authorized hosted seeding path for staff/participant fixtures |
| Complete deployed synthetic journey | NOT CLOSED | Consent through Audit and withdrawal sequence not executed |
| Administrator route behavior | NOT CLOSED | Unauthenticated `/admin/dashboard` returns HTTP 500 instead of governed handling |
| Hosted full pgTAP | NOT CLOSED | Hosted test-role namespace/privilege limitation remains |
| Staging backup and restore | NOT CLOSED | No backup/PITR/restore evidence |

## 13. B2 preservation

Jurisdiction, retention/disposition, participant rights, processors/regions/transfers, breach/notification, and evidence allowlist legal adequacy remain unresolved. No Sprint 30B action changes those dependencies.

## 14. Formal decision and next authority

`VERCEL RESEARCH STAGING NOT READY — TECHNICAL / ACCESS BLOCKERS REMAIN`

`FINAL PRE-SOFT-LAUNCH TECHNICAL READINESS REVIEW: NOT AUTHORIZED`

Narrowest next action: establish an approved, auditable staging fixture-seeding mechanism that can create synthetic staff/participant authority without weakening application grants, correct unauthenticated administrator-page handling, then rerun the complete deployed synthetic journey and authenticated negative checks.

`REAL PARTICIPANT EVIDENCE COLLECTION: NOT AUTHORIZED`

`ACTUAL PARTICIPANT ENROLLMENT: NOT AUTHORIZED`

`SOFT_LAUNCH_RELEASE_GATE: BLOCKED`

`PILOT: NOT AUTHORIZED`

`PRODUCTION: NOT AUTHORIZED`
