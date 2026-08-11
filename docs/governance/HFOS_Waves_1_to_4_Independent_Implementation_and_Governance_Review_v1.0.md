# HFOS Waves 1–4 Independent Implementation and Governance Review v1.0

**Review date:** 11 August 2026

**Repository:** `wpag-website-v1`

**Scope:** Commits `89dbe3e75688125a5846091a676dec2578bf781a` through `a015cd129d338023263654c8e0034d462303c8a3` on `feat/hfos-research-evidence-backbone`

**Review authority:** Independent implementation/governance assessment only
**Release effect:** None. This review does not open soft launch, authorize real participants, authorize evidence collection, authorize Pilot, or authorize Production.

## 1. Repository baseline

| Check | Independent result |
|---|---|
| Expected branch | PASS — `feat/hfos-research-evidence-backbone` |
| Expected HEAD | PASS — `a015cd129d338023263654c8e0034d462303c8a3` |
| Wave 1 ancestry | PASS — `89dbe3e75688125a5846091a676dec2578bf781a` is an ancestor |
| Wave 2 ancestry | PASS — `55eaaa6d3e01ded21195eddd078b4ee385bd9878` is an ancestor |
| Wave 3 ancestry | PASS — `83a0373ed44a751621bc4b479c042f93e6f6e035` is an ancestor |
| Wave 4 current HEAD | PASS — `a015cd129d338023263654c8e0034d462303c8a3` |
| Working tree at review entry | CLEAN |
| Branch history | UNCHANGED |

The only repository files created by this review are the two required Markdown review artifacts. No implementation file, migration, test, branch, commit, remote, database schema, or release state was modified.

## 2. Controlled authority gate

The following mandatory controlled hashes were calculated independently and matched exactly.

| Controlled artifact | SHA-256 | Result |
|---|---|---|
| HFOS Final Operational Readiness Review v1.0 | `fb48fdfbf2bade70ead8ace67f7621ff533e42258fe1e027df220d03e70fdfc2` | MATCH |
| HFOS Final Operational Readiness Blocker Register v1.0 | `2cefd1b33305a8f28a6558ca2c2cc381ab66d695a8e574455699c34b479d3633` | MATCH |
| Consent and Withdrawal Authority v0.2 | `7c07d9a18f943cca0692e77bef2c6b9cf53cd7c3e230889adae1e1c24121fb48` | MATCH |
| Consent and Withdrawal independent review | `290a015fb1e05dfe425441c4d3facf2676d7f9a2e23edb844bd56dddb7ddef05` | MATCH |
| Privacy and Data Governance Authority v0.1 | `b3118bf3b1259ab0e27f30b3c5e12e4de684cd06e93495f8a7cb0722799962a1` | MATCH |
| Privacy and Data Governance independent review | `db1378f58b4a8736a45f0e3d9bfdfba2c9343d475da85d9106a354743e92b7c4` | MATCH |
| Evidence and Outcome Schema Authority v0.1 | `a19c8eb45d08cae6562e529dc2ca002a5b5798fb0d34d3da745ad56ffc3574a8` | MATCH |
| Evidence and Outcome Schema independent review | `f6fbc31eed166b0c3914a1bd400e0d6469582131ef1ea0fe7d2225297fb242d1` | MATCH |
| Participant Lifecycle Readiness Authority v0.2 | `0f866efa709c69ae9a7bf6807a78df48a81e4659e22e45c10a70f1320378b4c4` | MATCH |
| Participant Lifecycle independent review | `6e665cf3971acfc3ea41be470337e44f85a2efd884722b350752fc7b87b60f57` | MATCH |
| Follow-Up and Outcome Adjudication Authority v0.1 | `eccde9dd754f48cec539ddd6a37c1d40c7808ef1619841122e172a945affec59` | MATCH |
| Follow-Up and Outcome independent review | `33a664f0d9a0eb29638c42649239defea448c24c5869683bd407e3c4c408fcc4` | MATCH |
| Audit and Withdrawal Trail Authority v0.1 | `958c0d3e973dcd0e72776053214706ac5a5e3b839f6acaf294008e416c2a64c4` | MATCH |
| Audit and Withdrawal independent review | `6866405ae10ababf9c843a1b00bc55b04535bd82b5b35cf0113df24b101458ce` | MATCH |
| Incident and Error Handling Authority v0.2 | `f4ee26764f149bf60e696044fc8db60529311675f719fc432cbe9681dc2f551b` | MATCH |
| Incident and Error Handling independent review | `6006890e2af263679dbf722be0dc2cbca4da944f7c4bc39b50ae796143d8911f` | MATCH |
| Statistical Research Design Authority v0.1 | `80a12b2f6d5cc5ce28a081427f21be90ede78e5cc04646c9de4236c5d5bc16a4` | MATCH |
| Statistical Research Design independent review | `532791ab1388c746eb1f5e377ea1d3e2d54b9b27affb0507311d66304c19bc9c` | MATCH |
| Wave 4 participant consent presentation v0.1 | `a8fedbe933d893fd7bbdf31c1b2351a49508cb83c660dac88fda3852ae93f744` | MATCH |

No mandatory hash failed and no version was substituted.

## 3. Independent method

The closure reports for Waves 1–4 were read, but their claims were not inherited. The review traced migrations `050`–`053`, database functions and constraints, repositories, services, API routes, participant/admin components, and tests; ran a clean local database rebuild; reproduced focused and full suites; and executed an additional transaction-rolled-back synthetic consent probe. Only synthetic identities were used.

## 4. Material findings

### F-01 — Required consent acknowledgements are not truth-enforced in the database RPC

**Severity:** MATERIAL / BLOCKING IMPLEMENTATION DEFECT

**Evidence:** `supabase/migrations/20260811210000_053_complete_wave4_release_readiness.sql:57-83` checks only that five JSON keys exist (`?&`). It does not require those values to be JSON Boolean `true`. The database table constraint at migration `050:113-119` requires only a non-empty acknowledgement object.

**Independent reproduction:** A local transaction presented consent and called `decide_wave4_synthetic_research_consent` with every required key set to `false`. The RPC completed, created a `GRANTED` record, and preserved `research_purpose=false`. Four probe assertions passed, proving the defect.

**Why blocking:** A privileged governed consent mutation can establish consent authority without affirmative acknowledgement. UI and service validation (`participant-research-journey-service.ts:11-13`) do not make the authority function deterministic against privileged or alternate server callers.
**Required correction:** In the critical database authority function, require the exact acknowledgement key set and require every required value to be JSON Boolean `true`; add database regression tests for false, null, string, numeric, missing, and unexpected acknowledgement values.

### F-02 — The participant page does not render the exact controlled consent presentation

**Severity:** MATERIAL / BLOCKING PRESENTATION DEFECT

**Evidence:** The controlled artifact is 76 lines and contains separate purpose, voluntariness, direct-scope, baseline, follow-up, privacy, withdrawal, results, contact, acknowledgement, and activation sections. `src/app/participant/research-participation/page.tsx:17-23` renders only two abbreviated paragraphs. The action component then permits the decision at `ResearchParticipationActions.tsx:31-35`.

**Why blocking:** The recorded consent version/hash purports to bind the controlled artifact, but the participant is not shown that exact content before the decision.
**Required correction:** Render the exact approved, version-bound controlled presentation before the action; expose its version; ensure the displayed content and recorded hash are one controlled source; add rendered-behavior/hash-binding tests.

### F-03 — Site-wide analytics require privacy/provider reconciliation on research routes

**Severity:** RELEASE BLOCKER / SECURITY-PRIVACY EVIDENCE GAP

**Evidence:** `src/app/layout.tsx:3-4,104-105` loads Google Analytics and Vercel Analytics globally, including authenticated research routes. No Waves 1–4 research mutation calls an AI service, and no research payload transfer to an AI path was found. However, research-page navigation/metadata may reach external analytics processors.
**Required correction:** Before any real participant route is enabled, either technically exclude authenticated participant/admin research routes from third-party analytics or approve and document the exact provider, data-flow, region, contract, data minimization, consent/privacy basis, and access boundary.

### F-04 — Wave 4 administrator overview is unbounded

**Severity:** NON-IMMEDIATE MATERIALITY / B1 OPERATIONAL-PERFORMANCE GAP

**Evidence:** `get_admin_research_wave4_overview` at migration `053:106-129` aggregates complete evidence, snapshot, follow-up, observation, event, outcome/adjudication, and audit histories into one response without limit, cursor, or governed operational cap.
**Required correction:** Establish bounded pagination or an explicitly governed small-cohort/per-record cap before real operation. No scale claim is made by this review.

### F-05 — Existing tests miss the invalid-affirmation and exact-presentation cases

**Severity:** BLOCKING TEST GAP

**Evidence:** Focused test `023` proves representative rejection and a valid all-true grant, but it never sends present keys with false/non-Boolean values and does not render/compare the exact participant presentation.
**Required correction:** Add database authority tests and runtime rendered tests covering F-01 and F-02. Repeat full regression and synthetic journeys after correction.

## 5. Master review matrix

| Area | Approved Requirement | Implemented Evidence | Independent Result | Blocking? | Closure Action |
|---|---|---|---|---|---|
| Research identity | Separate pseudonymous identity, governed linkage, immutable history | Migration `050:9-77`; identity/enrollment RPCs; test `020` | PASS for synthetic scope | No | Real deployment/enrollment activation remains separately gated. |
| Consent states/history | Seven canonical states, append-only successor history, exact version binding | Migration `050:79-125,388-436`; test `020` | PASS structurally | No | Preserve append-only transition model. |
| Consent affirmative act | Direct participant and affirmative required acknowledgements | Migration `053:57-83`; service validation | FAIL — F-01 | Yes | Truth-enforce all acknowledgements in the database RPC and test malformed values. |
| Exact consent presentation | Display exact controlled wording bound to version/hash | Artifact registry `053:3-37`; participant page/actions | FAIL — F-02 | Yes | Render exact approved controlled artifact and prove display/hash binding. |
| Consent gate | `OPEN/BLOCKED`; every non-`NONE` withdrawal and reconsent blocks | Migration `050:343-376`; tests `020` | PASS | No | Retest after consent correction. |
| Privacy gate | `OPEN/BLOCKED/UNRESOLVED`; unresolved is not open; canonical vocabulary | Migration `050:127-166,361-376,438-459`; tests `020` | PASS for synthetic scope | No | Close legal/provider and launch-policy dependencies. |
| Representative consent | Not authorized | Registry constraint `053:10-12`; direct participant check `053:65-70` | PASS | No | Keep first scope direct-consent only; do not infer capacity. |
| Withdrawal | Request immediately blocks; governed successor processing; no deletion promise | Migration `050:168-203,461-507`; participant route/UI; tests | PARTIAL | Yes | Approve disposition/retention procedure and complete operator workflow. |
| Evidence/version | Append-only item/version, provenance, value states, correction/supersession | Migration `051:26-76`; tests `021` | PASS for synthetic scope | No | Approve real evidence allowlist and deployment controls. |
| Snapshot | Immutable frozen manifest; correction requires successor context | Migration `051:77-114`; test `021` | PASS | No | Preserve immutability. |
| Baseline completion | Governed complete/current frozen snapshot required | Migration `051` baseline functions; test `021` | PASS for synthetic scope | No | Bind approved real protocol before activation. |
| Follow-up | Manual, separately consented, predecessor/sequence governed | Migration `051:115-140`; tests `021/023` | PASS in API/database; UI partial | Yes for real workflow | Complete minimum operator form or approve a controlled manual/API procedure. |
| Observation/event | Raw observation distinct from verified event; independent verification | Migration `051:141-173,381-406`; tests | PASS | No | Preserve actor separation and no causality/State inference. |
| Outcome/adjudication | Active taxonomy only, reserved outcomes rejected, independent adjudication | Migration `051:174-223,407+`; Wave 3 trigger; tests | PASS in database/API; UI partial | Yes for real workflow | Complete controlled operator procedure/form and deployment role assignment. |
| Incident | Nine states, complete 81 matrix, 25 allowed, 56 prohibited, invalid-result history, gate firewall | Migration `052:8-144,227-311`; test `022` | PASS | No | Preserve exact matrix and independence. |
| Audit | Append-only correlated coverage, privileged access, completeness/Incident binding | Migrations `050:205+`, `052:393-422`; tests | PASS architecturally | Yes for deployment evidence | Approve export/access procedure and independently verify deployed completeness. |
| Actor independence | Evidence/event/outcome/Incident restrictions enforced below UI | Migrations `051/052`; tests `021/022` | PASS in controlled database paths | Yes for deployment roles | Verify deployed role assignment, revocation, and auditor independence. |
| FSH operands | Only exact LOAD and FLOW operand identities | Migration `052:336-379`; test `022` | PASS | No | Preserve two-operand boundary. |
| FSH arithmetic | Exact eligible sums; `FLOW_TOTAL - LOAD_TOTAL`; no third operand/weight/coefficient/normalization; CAP nonnumeric | Migration `052:330-379`; test `022` | PASS | No | Preserve authority versions and deterministic checks. |
| FSH representation | Exact fixed point, no float, no unauthorized rounding, bounded overflow, canonical checksum | `numeric(24,4)` tables and execution checks in migration `052`; test `022` | PASS for intended controlled scope | No | Keep explicit scale rejection and range checks. |
| FSH blocked states | No result for missing/stale/disputed/restricted/unresolved/incomplete/mismatched/duplicate/unauthorized inputs | Execution gate and membership validation `052:336-379`; tests | PASS | No | Preserve fail-closed behavior. |
| System State firewall | Operative mapping count zero | `system_state_status='NOT_AUTHORIZED'`, participant release `BLOCKED`; source/test search | PASS — 0 operative mappings | No | Do not add classification logic. |
| Participant output suppression | No raw FSH, State, thresholds, predicates, hypotheses, Incident detail, or advice | Participant projection `053:85-104`; UI; mapping guards | PASS | No | Preserve factual-status-only projection. |
| Participant journey | Consent, status, withdrawal, baseline/follow-up factual state | Participant page/actions/routes | PARTIAL — exact wording and real baseline workflow absent | Yes | Close F-01/F-02 and implement approved real-scope baseline/evidence flow. |
| Admin journey | Governed status and APIs for all major families | Wave 3/4 APIs/cards and server services | PARTIAL | Yes | Add/approve minimum operator actions for follow-up, outcome, withdrawal, Incident, Audit, with bounded loading. |
| API/server authority | Authenticated identity/role checks, strict commands, no browser direct table writes | Server routes, services, service-role RPCs | PASS with F-01 exception | Yes | Correct database consent authority and retest alternate server callers. |
| RLS/security | FORCE RLS, revoked tables, fixed search path, service-role-only RPCs, immutable triggers | Migrations `050-053`; pgTAP | PASS locally | Yes for deployment evidence | Verify deployed grants, secrets, backup/restore, access review/revocation, private storage, and environment separation. |
| AI/third party | Zero authorized participant-data AI paths | No AI research integration found; wording/constraints prohibit AI | PASS for AI; analytics unresolved | Yes for provider boundary | Resolve global analytics on authenticated research routes. |
| Synthetic E2E | Normal and adverse journeys, gates, corrections, independence, suppression | Tests `020-023` | PARTIAL — standard suites pass but miss F-01/F-02 | Yes | Add missing cases and rerun independent E2E. |
| Release gate | Fail closed; no fake `OPEN` | Migration `052/053`; blocked activation test | PASS — current result `BLOCKED` | No (correctly blocking) | Close all B1 and obtain independent release approval; do not add an open path prematurely. |
| Performance sanity | No obvious release-blocking unbounded core load | Wave 4 overview full aggregates | PARTIAL — F-04 | Yes before real use | Add bounds/cursors or controlled operational caps. |

## 6. Waves 1–4 conclusions

### Research identity

The pseudonymous `participant_research_identities` record is distinct from `participants`; research tables carry the research identity/enrollment rather than duplicating direct identity. Unique linkage, restricted deletion, append-only histories, correlation identity, and server-side access controls are present. The scope is intentionally synthetic; a real enrollment path is not authorized.

### Consent and privacy

Canonical states, version/hash fields, successor history, reconsent, consent gate, privacy binding, canonical disposition vocabulary, and fail-closed privacy behavior are present. `UNRESOLVED` does not become `OPEN`. The affirmative-acknowledgement defect F-01 prevents implementation approval. The exact controlled wording is not rendered by the participant page (F-02).

### Withdrawal

`REQUESTED` immediately becomes controlling and blocks collection/follow-up. Verification, effective, processing, completed, and exception-review successors are available and audited; no silent reactivation or deletion promise was found. Exact real-world disposition/retention and operator completion remain unresolved.

### Evidence and snapshots

Evidence items, versions, corrections, supersession, source/provenance, value-state, confirmed-zero, missingness, and snapshots are append-only. Frozen snapshots do not mutate when evidence is corrected. Baseline completion uses a governed frozen complete/current snapshot. Real evidence categories and deployment handling remain blocked.

### Follow-up, events, and outcomes

Follow-up is manual and separately consent-gated. Raw observations and verified events are distinct. Outcome proposal and independent adjudication use active controlled vocabulary; reserved outcomes and State labels are rejected. Database/API foundations pass; the minimum real operator workflow is incomplete.

### Incident

The full nine-by-nine matrix is materialized: 81 pairs, 25 allowed, 56 prohibited/invalid. Invalid attempts return and audit `INCIDENT_TRANSITION_INVALID`. Reporting, containment, resolution, closure, restoration, and successor mechanics remain separate. Reporter/resolver/closer/restorer independence is enforced and tested.

### Audit

Material actions across all waves generate correlated append-only audit events, including rejected and privileged operations. Completeness assessment and Incident escalation are present. Deployed audit-access/export procedure and independent operational verification remain open.

### FSH

The implementation reconstructs only `FSH-OP-LOAD-CURRENT-AMOUNT-v0.1` and `FSH-OP-FLOW-CURRENT-AMOUNT-v0.1`. It computes exact within-family sums, assigns components unchanged, and computes `FSH = FLOW_TOTAL - LOAD_TOTAL`. No third operand, CAP numeric input, weight, coefficient, normalization, score, threshold, or State mapping was found. `numeric(24,4)` plus explicit scale/range validation provides exact fixed-point monetary arithmetic for this controlled scope; serialization and SHA-256 identity are deterministic. Invalid/missing/incomplete/currentness/authority/comparability states terminate before a result.

### State and output suppression

The operative FSH-to-State/STRESS-to-State mapping count is zero. Research results carry `NOT_AUTHORIZED` for System State and `BLOCKED` for participant release. Participant projections omit FSH, State, thresholds, predicates, hypotheses, Incidents, and advice.

### Release gate

The gate remains physically fail-closed. Activation attempts are rejected and audited. The current legitimate result is `BLOCKED`; no real enrollment/evidence, Pilot, or Production authority exists.

## 7. Consent wording decision

The separate wording review artifact issues:

`APPROVE HFOS PARTICIPANT RESEARCH CONSENT PRESENTATION v0.1 WITH NON-BLOCKING GOVERNANCE NOTES`

The text is faithful to Consent v0.2 and Privacy v0.1. This approval is limited to the exact wording and does not approve its current abbreviated UI rendering, implementation capture, legal sufficiency, locale, provider/data-flow posture, or release.

## 8. Independent test reproduction

| Verification | Independent result |
|---|---|
| Clean local Supabase reset | PASS — migrations `001` through `053` applied |
| Focused Wave 1 pgTAP (`020`) | PASS — 90 tests |
| Focused Wave 2 pgTAP (`021`) | PASS — 63 tests |
| Focused Wave 3 pgTAP (`022`) | PASS — 106 tests |
| Focused Wave 4 pgTAP (`023`) | PASS — 27 tests |
| Full participant-lifecycle pgTAP | PASS — 23 files / 2,258 tests |
| Additional false-acknowledgement probe | PASS as a defect reproduction — 4/4 assertions prove false values can create `GRANTED` |
| Application tests | PASS — 68 files / 615 tests |
| ESLint | PASS |
| TypeScript `--noEmit` | PASS |
| Production build | PASS — 70 routes/pages; initial sandbox attempt could not fetch Google fonts, authorized network rerun passed |
| Schema lint | PASS with two pre-existing warnings: unread `v_profile_id` and `v_complete_at` |
| `git diff --check` before review artifacts | PASS |

Passing standard suites do not negate F-01/F-02 because those cases are absent from the committed tests.

## 9. Independent SLR reconciliation

| ID | Independent result | Evidence / exact remaining closure action |
|---|---|---|
| SLR-01 | PARTIALLY CLOSED | Exact wording is approved by this review, but the UI does not render it and legal/locale approval remains. Render exact content, bind display to version/hash, and obtain controlled legal/locale approval. |
| SLR-02 | PARTIALLY CLOSED | Software enforces linked direct consent and excludes representative consent in synthetic scope. Define approved launch-jurisdiction direct-consent eligibility/capacity criteria and fail closed operationally. |
| SLR-03 | NOT CLOSED | Complete qualified review for the single intended launch jurisdiction and record controlling obligations. |
| SLR-04 | NOT CLOSED | Approve exact record-class retention, deletion, backup, legal-hold, and withdrawal-disposition schedule/procedure. |
| SLR-05 | NOT CLOSED | Approve and implement participant data-rights intake, identity verification, handling, response control, and Audit path. |
| SLR-06 | PARTIALLY CLOSED | Purpose restrictions exist; exact launch evidence allowlist/prohibited categories/restricted review/disposition remain. Approve and enforce that launch set. |
| SLR-07 | NOT CLOSED | Approve deployment regions, processor roles/contracts, data flows, subprocessors, transfer controls, and global analytics posture. |
| SLR-08 | PARTIALLY CLOSED | Incident mechanics exist. Approve jurisdiction-specific breach assessment/notification/lawful-disclosure and preservation procedure. |
| SLR-09 | PARTIALLY CLOSED | Research schema/migrations exist locally. Produce and approve exact deployment migration/rollback/evidence plan and verify the target deployment. |
| SLR-10 | PARTIALLY CLOSED | Research identity, linkage, and pre-enrollment gates exist, but environments and activation remain synthetic/blocked. Add only a separately authorized real-enrollment transition after all release dependencies close. |
| SLR-11 | PARTIALLY CLOSED | Canonical gates exist, but F-01 and F-02 prevent closure. Truth-enforce acknowledgements in the RPC, render exact wording, append the independent approval record, and close legal release. |
| SLR-12 | PARTIALLY CLOSED | Participant request/immediate block and successor states exist. Approve disposition and complete the controlled operator processing workflow through completion. |
| SLR-13 | CLOSED | Complete Incident tables, matrix, services/API/admin surface, gate protection, independence, successor, and audit tests are present. |
| SLR-14 | PARTIALLY CLOSED | Manual consent-scoped follow-up exists in database/service tests. Approve real protocol scope and minimum operator form/procedure. |
| SLR-15 | PARTIALLY CLOSED | Immutable observation/event/outcome/adjudication exists. Complete the controlled operator workflow and independently assign/verify reviewer roles. |
| SLR-16 | PARTIALLY CLOSED | Database same-actor controls exist. Verify deployment role assignments, privileged identity actions, access review/revocation, and independent audit roles. |
| SLR-17 | PARTIALLY CLOSED | Local auth/RLS/private foundations pass. Establish and evidence live boundary, secrets, storage, backup/restore, access review/revocation, analytics/processor handling, and security verification. |
| SLR-18 | PARTIALLY CLOSED | Unified immutable audit exists. Approve deployed export/access procedure and independently verify completeness/reconstruction. |
| SLR-19 | PARTIALLY CLOSED | Status, direct choice, follow-up status, and withdrawal UI exist. Correct exact consent display, add approved real baseline/evidence scope, and implement data-rights workflow. |
| SLR-20 | PARTIALLY CLOSED | Consolidated read views and APIs exist. Complete minimum operator actions/procedures and bound the unbounded Wave 4 overview. |
| SLR-21 | CLOSED | Exact internal versioned deterministic FSH is implemented and tested without unauthorized arithmetic. |
| SLR-22 | CLOSED | Final State, thresholds, predicates, diagnosis/advice, and participant FSH remain suppressed. |
| SLR-23 | PARTIALLY CLOSED | Standard synthetic suites pass, but F-01/F-02 cases were not tested. Add database malformed-ack tests and exact rendered-presentation E2E; rerun independent journeys. |
| SLR-24 | PARTIALLY CLOSED | The gate is correctly fail-closed. Bind verified closure evidence for every B1 item and obtain independent release approval; `UNRESOLVED` must never be treated as `OPEN`. |
| SLR-25 | DEFERRED B2 | Direct-consent-only scope avoids representative consent. Keep excluded until separate legal/consent authority exists. |
| SLR-26 | DEFERRED B2 | Frozen hypothesis-specific SAP/sample design is not required for a narrow operational/feasibility launch; required before confirmatory analysis. |
| SLR-27 | DEFERRED B2 | Threshold and STRESS validation/promotion remain unauthorized and do not block the narrow first operational cohort. |
| SLR-28 | DEFERRED B2 | Temporal/external validation remains a later research-maturity dependency. |
| SLR-29 | DEFERRED B2 | Manual follow-up is authorized; cadence/notification automation remains deferred. |
| SLR-30 | DEFERRED B3 | Final System State classification/UI remains unauthorized and unimplemented. |
| SLR-31 | DEFERRED B3 | Participant interpretation/advice remains unauthorized and unimplemented. |
| SLR-32 | DEFERRED B3 | AI/advanced participant-data analytics remain unauthorized; no research AI integration was found. |
| SLR-33 | DEFERRED B3 | Public case study/publication remains excluded. |
| SLR-34 | DEFERRED B3 | Production-scale/commercial tooling remains outside initial scope. |

## 10. B1 independent recount

| Measure | Count | IDs |
|---|---:|---|
| Original B1 | 24 | `SLR-01`–`SLR-24` |
| Independently CLOSED | 3 | `SLR-13`, `SLR-21`, `SLR-22` |
| PARTIALLY CLOSED | 17 | `SLR-01`, `02`, `06`, `08`–`12`, `14`–`20`, `23`, `24` |
| NOT CLOSED | 4 | `SLR-03`, `04`, `05`, `07` |
| Total remaining before first real participant | 21 | Every B1 except `SLR-13`, `21`, `22` |

Partial closure does not reduce the remaining count. Wave 4’s prior claim that `SLR-23` was closed is not sustained because the deterministic suite omitted the database false-acknowledgement path and exact participant-presentation binding.

## 11. B2 and B3 boundary

- `SLR-25` can be avoided only by preserving direct-consent-only scope; this is not a legal-capacity conclusion.
- `SLR-26`–`SLR-29` need not block a narrow operational/feasibility/exploratory first cohort because no confirmatory claims, threshold/predicate promotion, temporal/external validation, or automated cadence is authorized.
- `SLR-30`–`SLR-34` are correctly deferred. None is promoted into current release scope.
- B1 legal/privacy dependencies `SLR-02`–`08` remain pre-participant controlling under the current register; this review does not answer them.

## 12. Security and deployment status

Locally verified: server-derived participant/admin identity, role checks, fixed `search_path`, service-role-only new RPCs, FORCE RLS, revoked direct table access, immutable triggers, synthetic environment restriction, no participant FSH/State output, and blocked release.

Not verified and still blocking: target-environment grant/RLS equivalence; secrets inventory/rotation; dedicated live-research separation; private storage/upload allowlist for research evidence; backup/restore exercise; access register/review/revocation; privileged endpoint review; penetration/security assessment; audit export/reconstruction; deployment migration/rollback; processor/subprocessor/region/cross-border posture; and the authenticated-route analytics boundary. No security certification or scale validation is claimed.

## 13. Smallest final closure packet

Because material implementation defects exist, this packet is a required correction/re-review packet rather than an authorized release sprint:

1. **Consent control and participant content:** truth-enforce acknowledgements in the critical RPC; render the exact approved wording; append the wording-approval record; add direct regression/E2E tests.
2. **UI/workflow wiring:** complete or formally bind controlled manual procedures for withdrawal processing, follow-up, event/outcome adjudication, Incident/Audit operations, data-rights requests, and real baseline/evidence intake; bound Wave 4 overview loading.
3. **Legal/privacy/operational procedure:** close `SLR-02`–`08`, including jurisdiction, capacity criteria, retention/disposition, data rights, evidence allowlist, provider/processor/analytics, and breach/notification.
4. **Security/deployment evidence:** approve migration/rollback; verify target RLS/grants/secrets/storage/environment, backup/restore, access review/revocation, and privileged endpoints.
5. **Independent release evidence:** rerun corrected E2E and full suites, bind all 24 B1 results for the exact deployment/scope/version/roles, and obtain independent release approval.

## 14. Formal implementation decision

`HFOS WAVES 1–4 IMPLEMENTATION: REVISE — MATERIAL IMPLEMENTATION DEFECTS FOUND`

The exact controlled wording is governable, and most synthetic architecture is strong and fail-closed. Nevertheless, an RPC can record `GRANTED` with false required acknowledgements, and the participant decision page does not display the exact artifact whose hash is recorded. These are material consent-authority defects.

## 15. Next authority and preserved gates

`FINAL PRE-SOFT-LAUNCH REMEDIATION: NOT AUTHORIZED`

Under the Sprint 28 rule, that authority is not issued because implementation architecture does not pass this review. A narrowly scoped consent-control/presentation correction must be separately authorized, implemented, and independently re-reviewed first.

`REAL PARTICIPANT EVIDENCE COLLECTION: NOT AUTHORIZED`

`ACTUAL PARTICIPANT ENROLLMENT: NOT AUTHORIZED`

`SOFT_LAUNCH_RELEASE_GATE: BLOCKED`

`PILOT: NOT AUTHORIZED`

`PRODUCTION: NOT AUTHORIZED`
