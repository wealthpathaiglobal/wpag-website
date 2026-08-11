# HFOS Sprint 30 — Research Staging Environment Readiness

**Classification:** Controlled environment-readiness evidence / non-release authority
**Evidence date:** 2026-08-11
**Repository branch:** `feat/hfos-research-evidence-backbone`
**Starting HEAD:** `a115697694c19925d23bff857e2248bc50efdd22`
**Data boundary:** local synthetic/test data only
**Release gate:** `BLOCKED`

## 1. Controlled input verification

| Artifact | Required SHA-256 | Result |
| --- | --- | --- |
| Release Evidence Packet v1.0 | `03c3a790d7f9b249c5155530b1ac7924805cde1471ab1962d2787320cb19cc82` | MATCH |
| Operator Runbook v1.0 | `1ce080b7b0d22a38a602bc62a2ba4f4345e6185962a093d00522b65b3cf4802a` | MATCH |
| Legal Review Packet v1.0, pre-Sprint-30 identity | `e2be4d3f10218d893f250b882beb45f75ddf7bb6137175ae4579adcec2d48296` | MATCH before factual Sprint 30 update |
| Security Review v1.0 | `f2640f0339279652059c11b028ce4cb23b206015236711fdf693d60128cdd2ba` | MATCH |
| Sprint 29 closure | `c2d4a233cfb858a4db8d3270bf93693055253202d58645d5ec495256edd82819` | MATCH |

The repository was clean at the input gate. Sprint 28A and Sprint 29 ancestry was present. No controlled input mismatch occurred.

The legal packet was then updated only with the factual Sprint 30 environment evidence. Its resulting SHA-256 is `de74501eeae44a8e3030b0a054231efc1ad0253be21687b6dbf1ba6c54ee9de3`.

## 2. Target identity and classification

Read-only Supabase Management metadata returned exactly one accessible project:

| Field | Observed value |
| --- | --- |
| Name | `wpag-production` |
| Project reference | `ujitsgycbnswvomlqetr` |
| Organization | `msxkudbptgvzahccdraw` |
| Region | `ap-south-1` |
| PostgreSQL | engine 17 / reported version `17.6.1.147` |
| Provider status | `ACTIVE_HEALTHY` |
| Classification | `PRODUCTION` |

The controlled project name is direct Production classification evidence. It is not a safe destructive or synthetic staging target. It was not modified.

`CURRENT LINKED TARGET MODIFIED: NO`

## 3. Safe research/staging target determination

No separate staging, development, or research Supabase project exists in the accessible organization inventory. No `.vercel/project.json` exists, and no exact deployed staging application is bound in the repository.

Creating a new Supabase project requires:

- selection of an instance size with possible billing effect;
- issuance and custody of a new database credential;
- subsequent application-hosting and environment-secret binding.

The controlled Sprint 30 packet supplies neither billing authority nor credential-custody instructions. A potentially chargeable external resource was therefore not created, and Production was not reused for convenience.

`HFOS RESEARCH STAGING TARGET: NOT ESTABLISHED`

## 4. Environment binding

| Environment | Bound target | Evidence status |
| --- | --- | --- |
| Local development | Local Supabase containers and local Next.js runtime | VERIFIED; synthetic only |
| Automated test | Local reset plus pgTAP/Vitest fixtures | VERIFIED; synthetic only |
| Research staging | None | NOT ESTABLISHED |
| Future real research/live | No approved target | NOT AUTHORIZED |
| Production website/data | Supabase `wpag-production`; application deployment not exactly bound | MUST NOT BE USED FOR SPRINT 30 STAGING |

## 5. Migration state

### Local expected state

- 56 timestamped migration files exist.
- A clean local synthetic reset applied the complete chain through `20260812010000_055_add_pre_soft_launch_request_routing.sql` successfully.
- The post-reset full database suite passed: 25 files / 2,310 tests.

### Linked Production state

- Read-only remote ledger ends at `20260729013000`.
- The 25 controlled migrations numbered `031` through `055` have no remote ledger entry.
- No migration was pushed, repaired, reverted, or marked applied remotely.

### Staging state

- Starting state: no target.
- Ending state: no target.
- Schema parity: cannot be established without a safe target.

`REMOTE PRODUCTION MIGRATION: NOT PERFORMED`

## 6. Schema, RLS, grants, and RPC evidence

Local source and clean-reset tests continue to verify FORCE RLS, participant isolation, administrator checks, governed RPC execution, restricted direct writes, release blocking, withdrawal restrictions, actor independence, immutable histories, and hardened function search paths.

No safe deployed staging database exists on which these controls can be independently re-executed. Consequently:

- staging schema parity: NOT VERIFIED;
- staging FORCE RLS: NOT VERIFIED;
- staging grants/RPC permissions: NOT VERIFIED;
- staging unauthorized mutation rejection: NOT VERIFIED;
- staging service-role boundary: NOT VERIFIED.

Local proof is not substituted for target proof.

## 7. Synthetic access and storage evidence

The local full pgTAP suite covers cross-participant denial, participant/admin privilege separation, withdrawal blocking, actor-independence restrictions, release-firewall rejection, evidence-bucket privacy, version integrity, governed upload/finalization, and restricted evidence access.

No target-level synthetic identity, file, signed URL, storage object, or participant journey was created because no safe staging target exists. Production storage and identities were not accessed for synthetic verification.

## 8. Secrets and configuration

- `.env.local` is ignored and contains separate server/client variable names; no value was recorded in this artifact.
- `SUPABASE_SERVICE_ROLE_KEY` remains server-side by code boundary; no privileged key was printed or committed.
- The present local configuration resolves to the Production project, so it is unsuitable for staging.
- No staging Supabase URL, anon key, service-role key, storage configuration, email configuration, or hosting environment exists.
- No Vercel token or project binding is present in the execution environment.
- The release-candidate configuration remains `gateStatus=BLOCKED`.

## 9. Backup and recovery

Read-only Production backup metadata reports:

- region: `ap-south-1`;
- `walg_enabled=true`;
- `pitr_enabled=false`;
- no physical backups listed by the CLI response.

This metadata does not prove recoverability. No backup was created and no Production restore was attempted. Because no staging target exists:

- synthetic backup/restore: NOT PERFORMED;
- consent/evidence/Audit/Incident/FSH recovery reconciliation: NOT PERFORMED;
- restoration owner and runbook execution: NOT VERIFIED.

Migration recovery remains governed by preflight target classification, verified backup prerequisite, stop-on-first-failure, no blind history repair, and forward-fix/rebuild on staging. It was not exercised remotely.

## 10. Access review and revocation

- Accessible Supabase project inventory: one Production project.
- Exact organization members, project privileged users, service-account custodians, and hosting administrators: NOT VERIFIED.
- Synthetic participant revocation: covered locally only.
- Synthetic administrator and privileged-research revocation on staging: NOT PERFORMED.
- Immutable history preservation after target revocation: NOT VERIFIED on a deployed target.

## 11. Deployment and analytics firewall

Source and prior local runtime evidence show participant/admin route analytics suppression and public-route analytics presence. There is no exact staging deployment on which network requests can be inspected.

- deployed `/participant/**` analytics firewall: NOT VERIFIED;
- deployed `/admin/**` analytics firewall: NOT VERIFIED;
- deployed release-gate response: NOT VERIFIED;
- deployed synthetic journey: NOT PERFORMED;
- target performance sanity: NOT PERFORMED;
- scale certification: NOT CLAIMED.

The repository release candidate remains mechanically blocked. No configuration was changed to open it.

## 12. Processor and region facts

- Database/authentication/storage provider: Supabase.
- Existing Production Supabase region: `ap-south-1`.
- Intended application provider inferred from dependencies: Vercel; exact deployment/project/region is not bound.
- Remote SMTP/email processor: NOT VERIFIED.
- Research-route analytics exclusion: verified in source/local runtime only, not on staging.
- Processor contracts, subprocessors, transfers, legal purposes, retention, and approval: UNRESOLVED.

These are factual environment observations, not legal conclusions.

## 13. B1 reconciliation

| ID | Sprint 30 status | Exact remaining condition |
| --- | --- | --- |
| SLR-01 | PARTIALLY CLOSED | Qualified consent/locale approval for one selected jurisdiction. |
| SLR-02 | NOT CLOSED | Direct-consent eligibility/capacity authority. |
| SLR-03 | NOT CLOSED | Select one launch jurisdiction and complete qualified review. |
| SLR-04 | PARTIALLY CLOSED | Approved retention, backup, hold, withdrawal, and disposition schedules. |
| SLR-05 | PARTIALLY CLOSED | Rights, verification, deadlines, handling, and escalation authority. |
| SLR-06 | NOT CLOSED | Approved first-cohort evidence allowlist/restrictions. |
| SLR-07 | NOT CLOSED | Approve exact processors/contracts/subprocessors/transfers and bind a safe staging/live target. Existing Production region is now factually identified only. |
| SLR-08 | PARTIALLY CLOSED | Jurisdictional Incident/breach/disclosure authority and timing. |
| SLR-09 | CLOSED | Controlled local schema through `055`; deployment remains governed by SLR-17/24. |
| SLR-10 | CLOSED | Pseudonymous identity and enrollment gates. |
| SLR-11 | PARTIALLY CLOSED | Qualified legal release plus exact deployed target proof. |
| SLR-12 | PARTIALLY CLOSED | Target disposition/backup reconciliation and restore exercise. |
| SLR-13 | CLOSED | Governed Incident lifecycle and blocking. |
| SLR-14 | CLOSED BY CONTROLLED SCOPE | Manual consent-scoped follow-up only. |
| SLR-15 | CLOSED | Immutable observation/event/outcome adjudication. |
| SLR-16 | CLOSED | Research role and same-actor controls. |
| SLR-17 | NOT CLOSED | Create an authorized synthetic staging target; migrate through `055`; verify parity, security, storage, backup/restore, access, revocation, analytics, release gate, and deployed journey. |
| SLR-18 | CLOSED | Unified immutable Audit and bounded reconstruction. |
| SLR-19 | PARTIALLY CLOSED | Legal release, evidence scope, and deployed portal proof. |
| SLR-20 | PARTIALLY CLOSED | Execute the operator runbook on the approved target and roles. |
| SLR-21 | CLOSED | Internal research-only FSH and provenance. |
| SLR-22 | CLOSED | Final State/interpretation/advice suppression. |
| SLR-23 | CLOSED | Independent regression evidence remains controlled. |
| SLR-24 | PARTIALLY CLOSED | Close remaining B1 on exact target and obtain independent approval. |

Counts remain: 10 CLOSED, 9 PARTIALLY CLOSED, 5 NOT CLOSED. Fourteen partial/not-closed B1 conditions remain pre-participant blockers.

## 14. B2 and B3 preservation

- `SLR-25`: representative/minor cases remain excluded.
- `SLR-26`: frozen hypothesis-specific statistical plan/sample design remains later.
- `SLR-27`: threshold/STRESS validation remains unauthorized.
- `SLR-28`: temporal/external validation remains later.
- `SLR-29`: automated cadence remains excluded; manual-first only.
- `SLR-30`–`SLR-34`: final State, interpretation/advice, AI/advanced analytics, public case studies, and Production-scale/commercial tooling remain excluded.

Deployment facts do not convert any legal/privacy item into approval.

## 15. Exact technical blockers

1. No authorized, synthetic-only research/staging Supabase project exists.
2. Project creation requires unresolved billing/instance-size authority and credential-custody handling.
3. No staging application-hosting target or environment-secret binding exists.
4. Migrations `031`–`055` cannot be applied or parity-tested on staging.
5. Target RLS/grants/RPC/storage negative tests cannot be run.
6. Target backup/restore and migration-failure recovery cannot be exercised.
7. Target privileged-access inventory and revocation cannot be evidenced.
8. Deployed analytics, release gate, journey, and performance sanity cannot be verified.

## 16. Readiness determination

Material technical B1 conditions remain. Independent release review is not authorized.

`INDEPENDENT SOFT-LAUNCH RELEASE REVIEW: NOT AUTHORIZED`

`REAL PARTICIPANT EVIDENCE COLLECTION: NOT AUTHORIZED`

`ACTUAL PARTICIPANT ENROLLMENT: NOT AUTHORIZED`

`SOFT_LAUNCH_RELEASE_GATE: BLOCKED`

`PILOT: NOT AUTHORIZED`

`PRODUCTION: NOT AUTHORIZED`

## 17. Narrowest next action

Obtain explicit authority for a new synthetic-only Supabase project, including approved project size/billing, region, database-credential custody, named privileged owners, and application-hosting target. Then execute migrations, target security/storage tests, restore/revocation exercises, analytics inspection, and the synthetic deployed journey without touching Production.

## 18. Formal decision

`RESEARCH STAGING ENVIRONMENT NOT READY — TECHNICAL BLOCKERS REMAIN`
