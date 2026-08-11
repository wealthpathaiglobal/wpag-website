# HFOS Sprint 30A — Research Staging Provisioning and Binding

**Classification:** Controlled provisioning evidence / non-release authority
**Evidence date:** 2026-08-11
**Repository branch:** `feat/hfos-research-evidence-backbone`
**Starting HEAD:** `436a5c3f12e5318ca840b0aad2e7403d5db8d64f`
**Data boundary:** no participant data accessed; no synthetic remote data created
**Release gate:** `BLOCKED`

## 1. Controlled input gate

| Artifact | Required SHA-256 | Result |
| --- | --- | --- |
| Sprint 30 Research Staging Environment Readiness | `fd9bdbcced54c7ea3606833761d20deb6a61b52062c961793afe69d1e305c907` | MATCH |
| Updated Pre-Soft-Launch Legal Review Packet v1.0 | `de74501eeae44a8e3030b0a054231efc1ad0253be21687b6dbf1ba6c54ee9de3` | MATCH |

The working tree was clean and Sprint 30 ancestry was intact at the input gate.

## 2. Supabase project inventory

Read-only project inventory returned exactly one accessible Supabase project:

| Field | Value |
| --- | --- |
| Project name | `wpag-production` |
| Project reference | `ujitsgycbnswvomlqetr` |
| Organization | `msxkudbptgvzahccdraw` / Wealth Path AI Global |
| Region | `ap-south-1` |
| Status | `ACTIVE_HEALTHY` |
| Classification | Production |

No `wpag-research-staging`, staging, research, or development project exists in the accessible inventory.

`PRODUCTION MODIFIED: NO`

## 3. Billing and external-authority gate

Current official Supabase billing documentation states that Free-plan users may have two active Free projects. The organization currently exposes one project. However:

- the Supabase CLI project and organization responses do not expose this organization's subscription plan;
- the available browser session is not authenticated to the Supabase dashboard;
- the project-creation command requires a database password and may require a compute-size/billing selection depending on the organization's plan;
- no explicit paid provisioning approval, subscription-plan evidence, or credential-custody owner is supplied by the controlled packet.

Official factual references:

- <https://supabase.com/pricing>
- <https://supabase.com/docs/guides/platform/billing-on-supabase>

The task's provisioning stop condition therefore applies. No potentially chargeable resource was created and no payment method, plan, spend cap, or invoice state was changed.

`PAID PROVISIONING OCCURRED: NO`

## 4. Credential custody

No staging credentials exist. No password, URL, anon key, service-role key, connection string, or access token was created, printed, copied, committed, or reused from Production.

Before project creation, an authorized owner must bind:

1. database-password generation and recovery custody;
2. Supabase service-role key custody;
3. Vercel encrypted environment ownership;
4. named administrators permitted to retrieve or rotate secrets;
5. revocation and emergency rotation responsibility.

The service-role key must remain server-only. Production credentials may not be reused.

`STAGING CREDENTIAL CUSTODY: NOT ESTABLISHED`

## 5. Prepared non-secret configuration contract

The repository now contains:

`config/hfos-research-staging.environment.example.json`

SHA-256: `25ce75265fb4cb11be8f0c3aa952db0c6ad1ec4161c6ef9259d4a6e61b3412df`

It records, without secret values:

- `HFOS_RESEARCH_STAGING` environment identity;
- synthetic-only data policy;
- required project name and preferred `ap-south-1` region;
- explicit prohibition on Production project `ujitsgycbnswvomlqetr`;
- required secret names and custody prohibitions;
- intended Vercel preview/staging binding;
- analytics exclusions for `/participant/**` and `/admin/**`;
- migration target through `055`;
- release and participant gates fixed to blocked/not authorized.

This contract does not bind a live environment and contains no credential.

## 6. Supabase binding

- Current repository link: Production `ujitsgycbnswvomlqetr`.
- Staging link: not created.
- Production link mutation: not performed.
- Staging CLI binding: not possible without a project reference and approved database credential.
- Ambiguous binding was not introduced.

`SUPABASE STAGING BINDING: NOT ESTABLISHED`

## 7. Vercel staging binding

- `.vercel/project.json`: absent.
- `VERCEL_TOKEN`: absent from the execution environment.
- Exact Vercel project/environment/region: not identified.
- Production domain routing: not modified.
- Staging Supabase secrets: not available to bind.

`VERCEL STAGING BINDING: NOT ESTABLISHED`

## 8. Migration result

Expected local chain:

- 56 timestamped migration files;
- final migration `20260812010000_055_add_pre_soft_launch_request_routing.sql`.

Sprint 30 already proved clean local application through `055` and 25 pgTAP files / 2,310 passing tests. Sprint 30A did not apply, repair, mark, revert, or push any remote migration.

- Staging starting state: no project.
- Staging ending state: no project.
- Migration through `055`: NOT APPLIED.
- Final staging ledger: unavailable.
- Schema parity: NOT VERIFIED.

## 9. Storage posture

The expected local schema provisions private governed evidence storage and passes synthetic storage authorization tests. No staging bucket exists. No Production object or participant evidence was accessed or cloned.

`STAGING STORAGE: NOT PROVISIONED`

## 10. Initial staging security result

Target-level testing could not be performed without a target. The following remain unavailable on staging:

- participant cross-access denial;
- administrator-role denial;
- FORCE RLS and grant inspection;
- governed RPC execution;
- actor-independence rejection;
- release-firewall bypass rejection;
- storage ownership and cross-participant denial.

Local regression evidence remains valid but is not substituted for deployed staging proof.

`INITIAL STAGING SECURITY VERIFICATION: NOT PERFORMED`

## 11. Backup capability

No staging project exists, so staging backup, PITR, snapshot, restoration, and retention capabilities cannot be discovered or tested. The Production backup metadata from Sprint 30 is not treated as staging evidence.

`STAGING RECOVERY CAPABILITY: NOT VERIFIED`

## 12. Environment separation and release firewall

The non-secret contract distinguishes local, test, intended staging, and Production identities. It preserves:

- synthetic-only staging;
- no Production credential reuse;
- no Production domain mutation;
- research-route analytics exclusion;
- no participant-data analytics transmission;
- `SOFT_LAUNCH_RELEASE_GATE: BLOCKED`.

No runtime environment was changed.

## 13. Remaining blockers

1. Confirm the Supabase organization's subscription plan and that a second project will incur no unapproved charge, or provide explicit paid provisioning authority.
2. Approve the minimum project class and selected region `ap-south-1` as an operational choice without treating it as legal approval.
3. Name the owner and mechanism for database-password, service-role, and CLI credential custody/recovery.
4. Provide an authenticated/authorized Supabase provisioning session with project-creation permission.
5. Identify or authorize the Vercel preview/staging project and encrypted environment ownership.
6. After provisioning, bind only staging credentials, apply all 56 migrations through `055`, and verify ledger/schema parity.
7. Provision synthetic storage and run initial target security checks.
8. Discover actual staging backup/PITR/restore controls.

## 14. Next authority

Because the project was not provisioned or bound:

`STAGING MIGRATION / SECURITY / RESTORE / DEPLOYED-E2E VERIFICATION: NOT AUTHORIZED`

`REAL PARTICIPANT EVIDENCE COLLECTION: NOT AUTHORIZED`

`ACTUAL PARTICIPANT ENROLLMENT: NOT AUTHORIZED`

`SOFT_LAUNCH_RELEASE_GATE: BLOCKED`

`PILOT: NOT AUTHORIZED`

`PRODUCTION: NOT AUTHORIZED`

## 15. Narrowest next action

An authorized Supabase organization owner must confirm the current subscription/no-cost project allowance and approve credential custody. An authorized Vercel owner must identify the staging/preview project and encrypted environment owner. Once those external gates are recorded, create `wpag-research-staging` in `ap-south-1` without touching Production.

## 16. Formal decision

`RESEARCH STAGING PROJECT PROVISIONING BLOCKED — EXTERNAL AUTHORITY / ACCESS REQUIRED`
