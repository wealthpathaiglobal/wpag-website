# HFOS Sprint 28A — Material Defect Remediation Independent Review v1.0

## 1. Review identity

- Review type: targeted independent implementation and governance re-review
- Scope: Sprint 28A findings F-01 through F-04 and directly affected SLR items only
- Repository: `wpag-website-v1`
- Branch: `feat/hfos-research-evidence-backbone`
- Reviewed HEAD: `b5566114aa8124a783de6e89372504934f583545`
- Reviewed parent: `a015cd129d338023263654c8e0034d462303c8a3`
- Implementation files modified by review: none
- Real participant data used: none
- Probe data: synthetic, transaction-rolled-back

## 2. Input gate

| Controlled input | Expected SHA-256 | Independently calculated | Result |
| --- | --- | --- | --- |
| `HFOS_Waves_1_to_4_Independent_Implementation_and_Governance_Review_v1.0.md` | `aea2725facdcecbc79be596a96868eaec5e60b36020d8fe9efd0355458016d16` | `aea2725facdcecbc79be596a96868eaec5e60b36020d8fe9efd0355458016d16` | MATCH |
| `HFOS_WAVE_4_PARTICIPANT_RESEARCH_CONSENT_PRESENTATION_v0.1_Independent_Governance_Review_v1.0.md` | `d79d2e836d7841e1eb96366c1dfb295725f1cf2cd68758aaf76f2b470b6c3acb` | `d79d2e836d7841e1eb96366c1dfb295725f1cf2cd68758aaf76f2b470b6c3acb` | MATCH |
| `HFOS_WAVE_4_PARTICIPANT_RESEARCH_CONSENT_PRESENTATION_v0.1.md` | `a8fedbe933d893fd7bbdf31c1b2351a49508cb83c660dac88fda3852ae93f744` | `a8fedbe933d893fd7bbdf31c1b2351a49508cb83c660dac88fda3852ae93f744` | MATCH |
| `HFOS_SPRINT_28A_MATERIAL_DEFECT_REMEDIATION_CLOSURE.md` | repository identity at reviewed commit | `f7948f255aa319be8cc8de99d89b10d55e10ce3a75338e0d0268a210d67222a0` | PRESENT AT HEAD |

The expected branch and HEAD matched. Git ancestry contains the Wave 4 predecessor and Sprint 28A commit. The working tree was clean before this review artifact was created.

## 3. Material defect closure matrix

| Finding | Original defect | Remediation evidence | Independent result | Blocking? |
| --- | --- | --- | --- | --- |
| F-01 | Required acknowledgement keys could contain `false` and still produce `GRANTED`. | Exact five-key Boolean-true JSON comparison in migration 054; service exact-key/true validation; API type/shape validation; low-level service-role transition helper revoked; rejection Audit event. Independent five-false probe stayed `PRESENTED`. | CLOSED | No |
| F-02 | Participant page displayed an abbreviated summary rather than the controlled consent presentation. | Complete controlled participant wording component; exact artifact identity; immutable presentation/decision binding; approval identity; consent/privacy authority versions; timestamp; stale rejection. All 25 substantive controlled text units matched exactly. | CLOSED | No |
| F-03 | Google Analytics and Vercel Analytics loaded globally on governed routes. | Runtime route policy excludes `/participant`, `/participant/**`, `/admin`, and `/admin/**`; public routes retain analytics. Source search found no other automatic analytics hook. | CLOSED | No |
| F-04 | Wave 4 administrator overview aggregated complete growing histories. | Overview collections capped at 25; normalized governed history view; keyset pagination by timestamp and UUID; server maximum 100; UI continuation; append-only/no-loss regression. | CLOSED | No |

No new material defect was found within the authorized targeted scope.

## 4. F-01 — Consent truth review

### API and domain path

The participant API rejects malformed bodies, unknown fields, non-object acknowledgements, unknown acknowledgement keys, and non-Boolean values. The service then requires exactly the five canonical keys and requires every value to be Boolean `true` for `GRANTED`. Missing, false, and extra keys fail before repository mutation.

The API route delegates grant completeness/truth to the domain service rather than duplicating the full exact-value predicate in the route. Because every route mutation passes through that service and the database independently repeats the exact predicate, no false-grant bypass was identified. This layering point is a non-blocking maintainability note, not an authority defect.

### Database authority boundary

Migration 054 constructs one canonical JSON object containing exactly:

- `research_purpose = true`
- `voluntary_participation = true`
- `research_only_no_final_state = true`
- `privacy_data_use = true`
- `withdrawal_no_automatic_deletion = true`

For a grant, submitted JSON must be an object and must equal that object. JSON Boolean, type, completeness, and extra-key distinctions are therefore enforced. The prior generic consent transition helper is not executable by `service_role`; the governed Wave 4 RPC is the application mutation boundary.

### Independent reproduction

A separate transaction-rolled-back probe submitted all five required keys as Boolean `false`. Result:

- technical result: `CONSENT_ACKNOWLEDGEMENT_INVALID`
- current consent status after rejection: `PRESENTED`
- `GRANTED` rows created: 0
- decision bindings created: 0
- rejection Audit events: 1

Repository suite 024 additionally covers one false, all false, missing, string `"true"`, numeric `1`, null, malformed array, and extra-key cases.

## 5. F-02 — Exact presentation and binding review

The controlled Markdown artifact contains 25 non-heading substantive participant-presentation units. An independent fixed-string comparison found all 25 units unchanged in `ControlledResearchConsentPresentation.tsx`. Headings, paragraphs, acknowledgements, withdrawal limitations, research-only boundary, State suppression, and activation prohibitions are preserved. No additional substantive legal promise was found.

Presentation events immutably bind:

- controlled artifact row, version, and SHA-256;
- independent approval-event identity and review SHA-256;
- Consent Authority version;
- Privacy Authority version;
- presentation timestamp, actor, enrollment, and correlation identity.

Decision bindings separately preserve presentation-event identity, resulting consent identity, decision, artifact identity, authority versions, presentation/decision timestamps, actor, and correlation identity. These tables force RLS, revoke direct application-role access, and reject update/delete through immutable-history triggers.

### Independent A-to-B stale test

The review presented approved synthetic version A, then inserted a distinct synthetic version B plus a later approval event, and attempted a grant against A. Result:

- technical result: `CONSENT_PRESENTATION_STALE`
- current consent status: `PRESENTED`
- `GRANTED` rows created: 0
- decision bindings created: 0
- stale rejection Audit events: 1

The application service is additionally pinned to controlled v0.1 and compares the submitted presentation identity with the current participant journey before mutation. A future version therefore requires a coordinated controlled application update and cannot silently pass through the current participant route.

## 6. F-03 — Analytics firewall review

`GovernedAnalytics` returns no analytics components for the exact `/participant` or `/admin` path and every descendant. The repository source contains two analytics integrations: Google Analytics and Vercel Analytics. No other automatic analytics/telemetry SDK or route hook was found in application source.

Runtime production-build HTML observations:

| Route | Result | Google identifier | Vercel analytics marker |
| --- | --- | ---: | ---: |
| `/participant` | HTTP 200 | 0 | 0 |
| `/participant/research-participation` | unauthenticated redirect | 0 | 0 |
| `/admin/dashboard` | unauthenticated response | 0 | 0 |
| `/about` | HTTP 200 public control | 1 | 0 in initial server HTML |

The public control confirms Google Analytics remains available outside the excluded route families. Vercel Analytics was not emitted in the initial server HTML on any tested route; source-policy testing confirms it is not rendered on excluded paths. This review does not claim provider-side, browser-extension, DNS, proxy, deployment-region, contract, or full network certification.

`UNAPPROVED PARTICIPANT RESEARCH ANALYTICS PATHS: 0 / 2 reviewed third-party integrations`

## 7. F-04 — Administrator history bounds review

Migration 054 replaces both core administrator overview functions. Potentially growing returned collections are capped at 25, including Incident, FSH, Evidence Version, Snapshot, Follow-Up, Observation, Verified Event, Outcome, nested Adjudication, and Audit collections. Audit total count remains an aggregate count rather than history loading.

The separate history RPC covers Evidence, Snapshot, Follow-Up, Lifecycle, Observation, Verified Event, Outcome/Adjudication, Incident/Status, Audit, and FSH. It enforces:

- allowed family vocabulary;
- limit between 1 and 100;
- paired timestamp/UUID cursor;
- order by `(event_at DESC, event_id DESC)`;
- strict `<` continuation;
- `limit + 1` lookahead;
- next cursor derived from the final returned row; and
- privileged access Audit recording.

The administrator UI requests 25 rows, carries both cursor components, appends continued pages, and states that older authoritative history remains available. Independent pgTAP confirms two non-overlapping 10-row pages, continuation, over-limit rejection, all source rows preserved, and append-only mutation rejection.

Search found prior unbounded definitions in earlier migration history, but migration 054 replaces the active functions. No release-material unbounded collection remains in the active core Wave 3/Wave 4 administrator overview. No large-scale performance claim is made.

## 8. Migration 054 and regression assessment

Migration 054 is transaction-wrapped and narrowly scoped. It adds presentation-approval, presentation-event, decision-binding, and paginated-history structures; replaces the affected function contracts; and does not delete governed research evidence/history. New security-definer functions set `search_path=public,pg_catalog`. Tables force RLS, application roles have no direct table/view access, mutation/read RPCs are limited to `service_role`, and append-only controls remain.

The complete Wave 1–4 suite passes. No regression was found in Research ID separation, Consent/Privacy gates, withdrawal, reconsent, evidence versioning, snapshots, follow-up, adjudication, Incident, Audit, FSH, State suppression, or release firewall.

## 9. Independent verification results

| Verification | Result |
| --- | --- |
| Clean local Supabase reset through migration 054 | PASS |
| Independent false/stale/release probe | 10/10 PASS |
| Existing Wave 4 pgTAP 023 | 27/27 PASS |
| Focused Sprint 28A pgTAP 024 | 28/28 PASS |
| Full participant-lifecycle pgTAP | 24 files, 2,286/2,286 PASS |
| Focused application tests | 5 files, 20/20 PASS |
| Full application suite | 71 files, 629/629 PASS |
| ESLint | PASS |
| TypeScript `--noEmit` | PASS |
| Production build | PASS; 70 pages generated |
| Schema lint | Completed successfully; two pre-existing unused-variable warnings outside Sprint 28A |
| `git diff --check` | PASS |

The Vitest run emitted one pre-existing future Vite configuration-loader warning. It did not affect test results.

## 10. Affected SLR reconciliation

| SLR | Independent status | Basis |
| --- | --- | --- |
| SLR-01 | PARTIALLY CLOSED | Exact approved wording is now rendered and immutably bound. Controlled legal/locale approval remains. |
| SLR-07 | NOT CLOSED | Governed route analytics exclusion is closed, but deployment regions, processor roles/contracts, subprocessors, transfers, and full production data-flow posture remain. |
| SLR-11 | PARTIALLY CLOSED | Consent truth, exact wording, approval identity, version/hash/timestamp binding, reconsent, and stale rejection pass. Legal release remains. |
| SLR-17 | PARTIALLY CLOSED | Local RLS/grants and route exclusion pass. Live boundaries, secrets, storage, backup/restore, access review, processor handling, and independent security evidence remain. |
| SLR-19 | PARTIALLY CLOSED | Exact consent display/direct choice is closed. Approved real baseline/evidence scope and data-rights workflow remain. |
| SLR-20 | PARTIALLY CLOSED | F-04 is closed with bounded overview and deterministic continued history. Minimum remaining operator actions/procedures are not closed by this sprint. |
| SLR-23 | CLOSED | Missing false/malformed acknowledgement, exact presentation, binding, stale, analytics, pagination, and independent synthetic journey evidence now passes under clean re-execution. |
| SLR-24 | PARTIALLY CLOSED | Release assessment remains fail-closed. Remaining B1 evidence and an independent release-opening decision are absent. |

## 11. Remaining blockers

### B1 — Implementation / operational / security / release evidence

- Target-environment grant/RLS equivalence and migration/rollback verification.
- Secrets inventory, rotation, live/test separation, and private storage/evidence allowlist verification.
- Backup/restore exercise and evidence.
- Privileged access register, review, revocation, and endpoint verification.
- Audit export/reconstruction and independent security verification.
- Remaining controlled operator procedures/actions for withdrawal disposition, follow-up, outcome/adjudication, and access governance.
- Closure evidence for every remaining B1 item and a separate release-opening approval.

### B2 — Legal / privacy dependent

- Launch-jurisdiction legal review and direct-consent eligibility/capacity criteria.
- Record-class retention, deletion, backup, legal-hold, and withdrawal-disposition authority.
- Participant data-rights intake, identity verification, response, and Audit procedure.
- Exact launch evidence allowlist/restricted-category handling.
- Processor, subprocessor, region, contract, cross-border, and breach/notification authority.
- Representative-consent scope remains excluded; SLR-25 remains deferred while direct-consent-only scope is preserved.

### B3 — Later validation / deferred scope

- Confirmatory SAP/sample-size and threshold/predicate validation/promotion.
- Temporal/external validation and automated follow-up cadence.
- Final System State classification, participant interpretation/advice, AI participant-data analytics, public case studies, and production-scale/commercial tooling remain unauthorized or deferred.

## 12. Non-blocking notes

1. The API route type-checks acknowledgement values and delegates exact grant completeness/truth to the domain service. The database repeats the exact predicate, so no authorization bypass exists; keeping route and domain predicates visibly aligned would reduce future maintenance drift.
2. Runtime analytics evidence is limited to source review, route-policy tests, and initial production-build HTML. It is not a deployment/provider/network certification.
3. Schema lint reports two pre-existing unused local variables in functions predating Sprint 28A; neither affects this review scope.

## 13. Formal implementation decision

`HFOS WAVES 1–4 IMPLEMENTATION: APPROVED WITH NON-BLOCKING NOTES FOR FINAL PRE-SOFT-LAUNCH REMEDIATION`

## 14. Next authority

`FINAL PRE-SOFT-LAUNCH REMEDIATION: AUTHORIZED TO DEVELOP`

`REAL PARTICIPANT EVIDENCE COLLECTION: NOT AUTHORIZED`

`ACTUAL PARTICIPANT ENROLLMENT: NOT AUTHORIZED`

`SOFT_LAUNCH_RELEASE_GATE: BLOCKED`

`PILOT: NOT AUTHORIZED`

`PRODUCTION: NOT AUTHORIZED`
