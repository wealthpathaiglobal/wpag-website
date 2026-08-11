# HFOS Sprint 27 — Wave 4 Implementation Closure

**Classification:** Controlled implementation evidence / synthetic only

**Date:** 11 August 2026

**Authority:** NON-PILOT / NON-PRODUCTION / NO REAL PARTICIPANT ACTIVATION

## Controlled inputs and repository baseline

All mandatory authority and independent-review hashes identified by the Sprint 27 task were recomputed from the controlled local artifacts and matched exactly. The controlled Wave 1, Wave 2, and Wave 3 closure artifacts were also hash-verified. The repository began clean on `feat/hfos-research-evidence-backbone` at `83a0373ed44a751621bc4b479c042f93e6f6e035`; Wave 1 (`89dbe3e`), Wave 2 (`55eaaa6`), and Wave 3 (`83a0373e`) ancestry was present. No rebase, reset, merge, push, remote database access, or real-data processing occurred.

## Implementation

- Migration `053` registers the creation-side consent-presentation artifact, fixes its exact SHA-256 identity, forces RLS, removes direct grants, and makes the record append-only.
- Consent presentation is administrator-only and synthetic-only. Decisions are linked-participant-only, direct-consent-only, FSH-only, baseline-explicit, and follow-up-separate. Representative consent is unsupported.
- Participant projection is factual status only: consent, withdrawal, baseline, evidence count, follow-up status. Raw FSH is `SUPPRESSED`; release is `BLOCKED`.
- Participant UI provides controlled wording, grant/decline, separate follow-up choice, acknowledgement capture, current status, and explicit withdrawal request.
- Admin projection assembles evidence versions, snapshots, follow-ups, raw observations, verified events, outcomes/adjudications, audit events, actor permissions, wording-review status, and release status. Privileged access is audited.
- Admin UI presents the consolidated internal view and only displays actions allowed by the server-provided role posture. Presentation and deliberate negative release verification remain server/database governed.
- Activation attempts for real enrollment, real evidence collection, soft-launch opening, Pilot, and Production cannot activate anything. They return `ACTIVATION_NOT_AUTHORIZED / BLOCKED` and append an Audit event.
- Release evaluation remains physically fail-closed and records exact unresolved dependency codes.

## Participant-facing consent wording

Creation-side artifact: `docs/governance/HFOS_WAVE_4_PARTICIPANT_RESEARCH_CONSENT_PRESENTATION_v0.1.md`

SHA-256: `a8fedbe933d893fd7bbdf31c1b2351a49508cb83c660dac88fda3852ae93f744`

Status: `PENDING_INDEPENDENT_GOVERNANCE_REVIEW / SYNTHETIC_ONLY / NON-PILOT / NON-PRODUCTION`.

The wording covers purpose, voluntary/direct participation, FSH baseline scope, separate follow-up choice, withdrawal without an automatic deletion promise, restricted privacy/data use, no external sharing, no AI participant-data processing, and no State/diagnosis/advice/Pilot/Production claim. It is not self-approved and cannot enable real runtime activity.

## Synthetic end-to-end evidence

| Scenario | Result | Evidence |
|---|---|---|
| Normal journey | PASS | `023`: consent → privacy → evidence → snapshot → baseline → FSH → follow-up → observation → independent event verification → independent adjudication → audit → suppression → blocked release |
| Consent decline | PASS | `020`: decline produces a blocked consent gate and preserved history |
| Privacy unresolved/block | PASS | `020`/`021`: default privacy is unresolved; evidence operations require the complete compatible binding |
| Withdrawal | PASS | `020`/`021`: request immediately blocks collection/use and follow-up; all later states remain blocked and audited |
| Reconsent | PASS | `020`: material scope change creates `RECONSENT_REQUIRED`, blocks use, and preserves predecessor history |
| Incident | PASS | `022`: material gate effect, invalid transition, review, remediation, independent resolution, separate restoration, closure, successor, and audit correlation |
| Evidence correction | PASS | `021`/`022`: append-only version successor, unchanged frozen snapshot, successor snapshot and FSH result |
| Actor independence | PASS | `021`–`023`: self-verification, self-adjudication, self-resolution, and self-restoration paths fail |
| Final State suppression | PASS | `021`/`022`/`023`: no State vocabulary or raw FSH reaches participant projections; sign is not interpreted |
| Reserved STRESS/outcome | PASS | `021`: reserved event and final-State outcome vocabularies are rejected |
| Release firewall | PASS | `020`/`022`/`023`: real enrollment, evidence, soft-launch opening, Pilot, Production, and `OPEN` remain unavailable |

Synthetic identifiers are transaction-local and roll back after pgTAP. No participant data was used.

## Security and deployment evidence

- Authentication and participant/admin separation use existing server-side identity resolution.
- Every new RPC is `SECURITY DEFINER` with a fixed `public, pg_catalog` search path, internally checks actor authority, and is executable only by `service_role`.
- The new registry forces RLS, grants no direct table access, and is append-only.
- Participant identities are derived server-side; unsupported JSON fields and representative identifiers are rejected.
- Synthetic environments are the only accepted execution contexts. The persistent release firewall still blocks all real environments.
- No new storage access, upload path, external processor, analytics, or AI integration was added.
- No deployment penetration test, backup/restore exercise, access-revocation exercise, legal approval, or provider approval is claimed.
- The admin overview is one governed RPC per page request. Its bounded aggregate subqueries avoid application-layer N+1 calls; future volume/load characterization remains required.

## Verification

- Clean local Supabase reset: PASS; migrations `001`–`053` apply.
- Focused Wave 4 pgTAP: PASS, 27/27.
- Complete participant-lifecycle pgTAP: PASS, 23 files / 2,258 tests.
- Application suite: PASS, 68 files / 615 tests.
- ESLint: PASS, zero warnings/errors.
- TypeScript `--noEmit`: PASS.
- Production build: PASS, 70 pages; new participant/admin routes included.
- Schema lint: PASS with two pre-existing unused-variable warnings outside Wave 4 (`v_profile_id`, `v_complete_at`).
- `git diff --check`: PASS.

## Full blocker-register reconciliation

| ID | Status after Wave 4 | Evidence / remaining closure |
|---|---|---|
| SLR-01 | PARTIALLY CLOSED | Exact creation-side wording, hash, direct choice, and decline path exist; independent governance/legal approval is required. |
| SLR-02 | PARTIALLY CLOSED | Direct linked-participant consent is physically enforced and representative identifiers are rejected; jurisdiction-specific legal capacity criteria remain. |
| SLR-03 | NOT CLOSED | Qualified review for the intended single launch jurisdiction remains required. |
| SLR-04 | NOT CLOSED | Exact retention/deletion/backup/legal-hold schedule and operational procedure remain required. |
| SLR-05 | NOT CLOSED | Controlled data-rights intake and response procedure/UI remain required. |
| SLR-06 | PARTIALLY CLOSED | Purpose restriction and no external/AI use are enforced; launch evidence allowlist/prohibited categories/disposition controls remain. |
| SLR-07 | NOT CLOSED | Processor, hosting region, contracts, subprocessor, and cross-border approval remain required. |
| SLR-08 | PARTIALLY CLOSED | Governed Incident mechanics exist; jurisdictional breach/notification/lawful-disclosure procedure remains. |
| SLR-09 | PARTIALLY CLOSED | Waves 1–4 implement the research model/migrations; exact deployment migration evidence and approval remain. |
| SLR-10 | PARTIALLY CLOSED | Pseudonymous identity, linkage, enrollment record, and fail-closed gates exist; real enrollment remains unauthorized. |
| SLR-11 | PARTIALLY CLOSED | Canonical gates, direct capture, version/hash, reconsent, and server enforcement exist; wording approval and legal release remain. |
| SLR-12 | PARTIALLY CLOSED | Explicit participant request and immediate block are implemented; exact privacy disposition and operational completion procedure remain. |
| SLR-13 | CLOSED | Manual Incident lifecycle, gates, independence, restoration, successor, API, view, and audit are implemented/tested. |
| SLR-14 | PARTIALLY CLOSED | Manual consent-scoped follow-up is implemented/tested; approved real protocol/release scope remains. |
| SLR-15 | PARTIALLY CLOSED | Immutable observation/event/outcome/adjudication and independence exist; complete operator form workflow remains limited to governed APIs/read view. |
| SLR-16 | PARTIALLY CLOSED | Database/API same-actor restrictions and role projections exist; deployment role assignment/access review and independent verification remain. |
| SLR-17 | PARTIALLY CLOSED | Auth/RLS/private foundations and synthetic separation exist; live boundary, backup/restore, secrets, access review/revocation, and security verification remain. |
| SLR-18 | PARTIALLY CLOSED | Unified immutable event coverage and reconstruction exist; exact deployment export/access procedure and independent audit verification remain. |
| SLR-19 | PARTIALLY CLOSED | Research status, direct consent/decline, follow-up status, and withdrawal UI exist; data-rights workflow and approved real baseline/evidence scope remain. |
| SLR-20 | PARTIALLY CLOSED | Consolidated role-aware read view and governed APIs exist; full operational forms for every follow-up/outcome/Incident step remain limited. |
| SLR-21 | CLOSED | Exact internal, deterministic, immutable, versioned research-only FSH is implemented and tested. |
| SLR-22 | CLOSED | Final State, thresholds, predicates, advice, and participant FSH remain physically suppressed. |
| SLR-23 | CLOSED | Deterministic normal and adverse synthetic journeys, permissions, lifecycle, correction, independence, formula, and suppression pass across `020`–`023`. |
| SLR-24 | PARTIALLY CLOSED | Three-state fail-closed assessment/evidence exists; all B1 evidence, exact deployment verification, independent review, and release approval remain. |
| SLR-25 | DEFERRED B2 | Representative consent remains excluded; separate authority is required before scope expansion. |
| SLR-26 | DEFERRED B2 | Hypothesis-specific frozen SAP/sample design remains required before confirmatory analysis. |
| SLR-27 | DEFERRED B2 | Threshold/STRESS validation and promotion remain unauthorized. |
| SLR-28 | DEFERRED B2 | Temporal/external validation remains a later research-maturity dependency. |
| SLR-29 | DEFERRED B2 | Follow-up remains manual; no cadence/notification automation was introduced. |
| SLR-30 | DEFERRED B3 | Final System State UI/classification was not built. |
| SLR-31 | DEFERRED B3 | Participant interpretation/advice was not built. |
| SLR-32 | DEFERRED B3 | No AI or advanced analytics participant-data path was introduced. |
| SLR-33 | DEFERRED B3 | No public case-study/publication path was introduced. |
| SLR-34 | DEFERRED B3 | Production-scale tooling and commercial outputs remain out of scope. |

## B1 reconciliation

- B1 originally: **24**.
- B1 closed before Wave 4: **3** (`SLR-13`, `SLR-21`, `SLR-22`).
- B1 closed in Wave 4: **1** (`SLR-23`).
- B1 partially closed after Wave 4: **16** (`SLR-01`, `02`, `06`, `08`, `09`–`12`, `14`–`20`, `24`; with `13`, `21`–`23` counted closed, not partial).
- B1 not closed: **4** (`SLR-03`, `04`, `05`, `07`; unresolved portions of every partial entry also remain release-controlling).
- B1 remaining before a real participant: **20** (every B1 except `SLR-13`, `21`, `22`, `23`). Each exact closure action remains the action stated in the controlled blocker register and the table above.

## Current release assessment and next gate

`SOFT_LAUNCH_RELEASE_GATE: BLOCKED`

Exact current reason codes: `CONSENT_WORDING_PENDING_INDEPENDENT_REVIEW`, `LEGAL_PRIVACY_DEPENDENCY_UNRESOLVED`, `DEPLOYMENT_SECURITY_REVIEW_REQUIRED`, `B1_BLOCKERS_REMAIN`, `INDEPENDENT_IMPLEMENTATION_REVIEW_REQUIRED`, `RELEASE_APPROVAL_MISSING`.

The implementation is technically ready to be submitted for the targeted independent implementation/governance review; it is not ready for release.

`IMPLEMENTATION REVIEW: READY`

## Preserved authority boundary

`REAL PARTICIPANT EVIDENCE COLLECTION: NOT AUTHORIZED`

`ACTUAL PARTICIPANT ENROLLMENT: NOT AUTHORIZED`

`SOFT_LAUNCH_RELEASE_GATE: BLOCKED`

`PILOT: NOT AUTHORIZED`

`PRODUCTION: NOT AUTHORIZED`

Commit identity is the single focused Wave 4 commit that adds this closure artifact and is reported in the implementation handoff; no push is authorized.
