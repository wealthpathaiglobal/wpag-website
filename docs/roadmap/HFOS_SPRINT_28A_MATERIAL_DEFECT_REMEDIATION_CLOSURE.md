# HFOS Sprint 28A — Material Defect Remediation Closure

## Control status

- Classification: implementation closure record
- Branch: `feat/hfos-research-evidence-backbone`
- Starting HEAD: `a015cd129d338023263654c8e0034d462303c8a3`
- Commit identity: the focused commit containing this record, with message `fix(research): close consent and release-readiness defects`; its resulting SHA-1 is reported in the execution response because a commit cannot contain its own hash.
- Scope: synthetic/test remediation only
- Release status: `BLOCKED`

## Controlled inputs

| Input | Verified SHA-256 |
| --- | --- |
| `HFOS_Waves_1_to_4_Independent_Implementation_and_Governance_Review_v1.0.md` | `aea2725facdcecbc79be596a96868eaec5e60b36020d8fe9efd0355458016d16` |
| `HFOS_WAVE_4_PARTICIPANT_RESEARCH_CONSENT_PRESENTATION_v0.1_Independent_Governance_Review_v1.0.md` | `d79d2e836d7841e1eb96366c1dfb295725f1cf2cd68758aaf76f2b470b6c3acb` |
| `HFOS_WAVE_4_PARTICIPANT_RESEARCH_CONSENT_PRESENTATION_v0.1.md` | `a8fedbe933d893fd7bbdf31c1b2351a49508cb83c660dac88fda3852ae93f744` |

All three hashes matched before repository modification. The independent review artifacts are preserved under `docs/governance` in accordance with the repository's existing controlled-artifact convention.

## Defect closure

### F-01 — Consent acknowledgement truth

Migration `054` replaces the Wave 4 consent decision boundary. A grant now requires exact JSON equality to the five canonical acknowledgement keys with Boolean `true` values. False, missing, null, string, numeric, array, and extra-key payloads cannot create a grant. Rejected governed RPC attempts produce append-only `CONSENT_DECISION_REJECTED` audit events. The low-level consent-transition helper is no longer executable by `service_role`.

Status: **IMPLEMENTED — PENDING TARGETED INDEPENDENT RE-REVIEW**.

### F-02 — Exact controlled consent presentation

The participant research page now deterministically renders every substantive participant-presentation section, required acknowledgement, and activation boundary from the exact controlled artifact. Presentation and decision are immutably bound to:

- presentation event identity;
- artifact version and SHA-256;
- independent approval-event identity;
- Consent Authority version;
- Privacy Authority version; and
- presentation timestamp.

A changed or tampered binding returns `CONSENT_PRESENTATION_STALE`, leaves consent at `PRESENTED`, records an audit event, and requires a new governed presentation. Re-consent creates a new presentation event rather than mutating history.

Status: **IMPLEMENTED — PENDING TARGETED INDEPENDENT RE-REVIEW**.

### F-03 — Research-route analytics firewall

Google Analytics and Vercel Analytics remain available for public routes but are not rendered for these fail-closed route families:

- `/participant` and every descendant;
- `/admin` and every descendant.

The route policy is runtime-tested for both excluded and retained public paths. This is a code-level transmission boundary: no network-level, provider-side, deployment-region, processor-contract, or external-configuration assurance is claimed.

Status: **IMPLEMENTED FOR ROUTE EXCLUSION — BROADER SLR-07/SLR-17 DEPENDENCIES REMAIN**.

### F-04 — Administrator history bounds

Core Wave 3 and Wave 4 administrator overview collections are capped at the latest 25 entries. A separate governed history RPC provides deterministic keyset pagination by `(event_at, event_id)`, a default UI page size of 25, a server maximum of 100, and continuation for:

- evidence/version history;
- snapshot history;
- follow-up history;
- lifecycle history;
- observation history;
- verified-event history;
- outcome/adjudication history;
- incident/status history;
- Audit history; and
- FSH result/status history.

The pagination layer is read-only. It neither deletes nor mutates authoritative rows, and the interface explicitly indicates that older history remains available.

Status: **IMPLEMENTED — PENDING TARGETED INDEPENDENT RE-REVIEW**.

## Verification evidence

| Gate | Result |
| --- | --- |
| Controlled input hashes | 3/3 exact matches |
| Clean local Supabase reset through migration `054` | PASS |
| Existing Wave 4 pgTAP suite `023` | 27/27 PASS |
| Focused Sprint 28A pgTAP suite `024` | 28/28 PASS |
| Full participant-lifecycle pgTAP | 24 files, 2,286 tests PASS |
| Focused application regression | 5 files, 20 tests PASS |
| Full application suite | 71 files, 629 tests PASS |
| ESLint | PASS |
| TypeScript `--noEmit` | PASS |
| Production build | PASS (70 pages generated) |
| Schema lint | PASS with two pre-existing unused-variable warnings in migrations before Sprint 28A |
| `git diff --check` | PASS |

The focused consent suite covers all-true grant, one false, all false, missing key, string `"true"`, numeric `1`, null, malformed array, extra-key payload, non-mutation, rejection audit, stale binding, grant, re-consent, append-only enforcement, cursor continuation, non-overlap, maximum-bound rejection, no history mutation, and fail-closed release.

## SLR blocker mapping

This implementation does not self-close governance blockers; the controlled status remains subject to targeted independent re-review.

| SLR ID | Status after implementation | Sprint 28A effect / remaining closure condition |
| --- | --- | --- |
| `SLR-01` | PARTIALLY CLOSED | Exact controlled participant wording is rendered and bound. Legal/locale approval remains. |
| `SLR-07` | NOT CLOSED | Authenticated participant/admin route analytics are excluded. Provider, region, contract, transfer, and full deployment data-flow governance remain. |
| `SLR-11` | PARTIALLY CLOSED | F-01/F-02 technical defects are remediated. Targeted independent re-review and legal release remain. |
| `SLR-17` | PARTIALLY CLOSED | Route-level analytics exclusion is implemented. Live security, secrets, storage, backup/restore, access review, processor handling, and security verification remain. |
| `SLR-19` | PARTIALLY CLOSED | Exact consent display is remediated. Approved real baseline/evidence scope and data-rights workflow remain. |
| `SLR-20` | PARTIALLY CLOSED | F-04 is remediated with bounded overview and navigable histories. Minimum operator actions/procedures remain. |
| `SLR-23` | PARTIALLY CLOSED | Missing deterministic false-acknowledgement, binding, stale, rendering, analytics, and pagination regressions are added. Independent rerun/review remains. |
| `SLR-24` | PARTIALLY CLOSED | The release gate remains physically fail-closed and records remediation re-review as required. All remaining B1 evidence and independent release approval remain. |

Independent review findings F-01 through F-04 are implementation-remediated. None is represented as independently closed by this creation-side closure record.

## Remaining blockers

- Targeted independent implementation and governance re-review of Sprint 28A.
- Deployment/security evidence, including target grant/RLS equivalence, secrets, environment separation, private storage, backup/restore, access review/revocation, privileged endpoints, security testing, migration/rollback, and audit reconstruction.
- Legal/privacy B1 dependencies `SLR-02`–`SLR-08`, including jurisdiction, direct-consent eligibility/capacity criteria, retention/disposition, data rights, evidence categories, processors/analytics, and breach/notification.
- Remaining operational B1 conditions identified in `SLR-09`–`SLR-20`, `SLR-23`, and `SLR-24` that are outside this narrow remediation.
- Deferred B2/B3 scope remains deferred and is not promoted by this implementation.

## Authority boundary

`FINAL PRE-SOFT-LAUNCH REMEDIATION: NOT YET AUTHORIZED PENDING TARGETED RE-REVIEW`

`REAL PARTICIPANT EVIDENCE COLLECTION: NOT AUTHORIZED`

`ACTUAL PARTICIPANT ENROLLMENT: NOT AUTHORIZED`

`SOFT_LAUNCH_RELEASE_GATE: BLOCKED`

`PILOT: NOT AUTHORIZED`

`PRODUCTION: NOT AUTHORIZED`
