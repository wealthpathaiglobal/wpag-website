# HFOS Pre-Soft-Launch Operator Runbook v1.0

**Classification:** Controlled operational runbook / non-executable release authority
**Scope:** Future small direct-consent operational/feasibility/exploratory research cohort
**Current authority:** Synthetic verification only
**Release gate:** `BLOCKED`

This runbook describes deterministic manual operations. It does not authorize enrollment, evidence collection, legal conclusions, fixed response times, automated cadence, Pilot, or Production.

## Environment boundary

| Environment | Permitted data | Current use |
| --- | --- | --- |
| Local development | Synthetic/test identities and files only | Development and local pgTAP/application tests |
| Automated test | Transaction-rolled-back synthetic fixtures only | Deterministic CI/local regression |
| Synthetic/staging research verification | Synthetic identities only in a separately identified target | **NOT VERIFIED / no safe target established** |
| Future controlled research | Real participant data only after independent release approval | **NOT AUTHORIZED** |

Never copy real participant records into local or test environments. The checkout is linked to a project named `wpag-production`; it must be treated as read-only during remediation and is not a synthetic test target.

## Stop conditions

Stop enrollment, collection, processing, or release if any required gate is `BLOCKED` or `UNRESOLVED`; consent/privacy authority is missing, stale, or conflicting; withdrawal or Incident restrictions apply; access is uncertain; the target version differs from the release packet; or the independent release decision is absent. `UNRESOLVED` never means `OPEN`.

## Manual operator procedures

### Enrollment and direct consent

1. Confirm the person is within the separately legally approved direct-consent-only scope. Do not infer capacity.
2. Reject minors, representative-consent cases, dependent-adult representations, or uncertainty; record the exclusion reason without collecting research evidence.
3. Present only the controlled consent artifact bound to its approved version/hash and authority versions.
4. Record an affirmative direct choice or decline through the governed participant route. Never enter consent on a participant's behalf.
5. Confirm the current consent and privacy gates. Do not proceed while the release gate remains blocked.

### Consent issue

Stop collection; preserve the immutable presentation/decision history; record the issue as a complaint/Incident where applicable; require a new governed presentation for stale or superseded wording; escalate legal wording questions without answering them operationally.

### Withdrawal request

Use the participant withdrawal action. Receipt immediately creates a controlling use/collection block. An administrator verifies and advances the append-only withdrawal states; processes the separately approved privacy disposition; preserves minimum Audit history; and records any exception without promising automatic deletion.

### Privacy, access, correction, or complaint request

The participant submits `ACCESS_REQUEST`, `CORRECTION_REQUEST`, `PRIVACY_QUESTION`, or `COMPLAINT_INCIDENT` through the governed request intake. An administrator routes it to the deterministic operational class, records `ROUTED`, `IN_REVIEW`, `ESCALATED`, or `COMPLETED` events, and keeps legal entitlement/deadline fields unresolved until qualified review. A correction produces a new evidence version; it never mutates prior evidence.

### Evidence handling

Until a legally approved evidence-category allowlist exists, real research evidence collection is excluded. For synthetic verification, use private storage, immutable object paths, allowed MIME types, checksum/size verification, ownership-scoped access, administrator-only governed verification, and append-only file/evidence versions. Never overwrite an object or expose storage paths/checksums to participants.

### Follow-up and outcomes

Only an authorized operator manually initiates a consent-scoped, purpose/version-bound follow-up. No automatic 30/90/180 cadence is authorized. Preserve raw observation, independent verification, outcome proposal, independent adjudication, disagreement/unresolved handling, and immutable history. System State labels are not outcome truth.

### Incident

Report → contain → block affected gates → review → remediate → independent restoration/closure → Audit. Do not restore a protected gate based only on the incident reporter. A complaint may be routed to Incident operations but does not itself manufacture an Incident finding.

### Outcome adjudication

Require the governed evidence/event manifest and an eligible independent adjudicator. Preserve proposed, disputed, rejected, changed, unresolved, and confirmed histories. Do not emit participant interpretation, diagnosis, advice, or final State.

### Access review and revocation

Before release, export the active staff/role/service-account inventory without participant content; confirm active status, expiry, least privilege, and reviewer independence; record reviewer, date, target environment, and exceptions. Revoke research access by deactivating the applicable staff role/account through the authorized identity platform; do not delete research history. Participant research use is stopped through withdrawal/privacy/Incident gates; platform account disablement, if required, is a separately authorized identity operation. Re-run denial tests after revocation.

### Audit reconstruction

For one synthetic identity, reconstruct: restricted identity linkage → consent presentation/decision → privacy binding → enrollment → evidence/version → snapshot → FSH → follow-up/observation/event/outcome → withdrawal or Incident → release assessment. Confirm correlation IDs, authority versions, actor roles, timestamps, append-only chains, release `BLOCKED`, and participant FSH/State suppression.

### Release stop and escalation

Any operator may stop the process. Only an independent Soft-Launch Release Review can authorize a later gate change. No administrator UI/API in this version can open the gate. Preserve the release assessment and reasons; do not bypass through direct SQL or service credentials.

## Deployment and migration procedure

1. Identify an approved non-Production verification target and confirm an independent backup/restore prerequisite.
2. Record target identity, migration ledger, application commit, environment variables by name (never values), storage bucket policy, and access register.
3. Apply all migrations in timestamp order. For the current branch this includes all predecessors and `050`–`055`; never skip history or mark an unapplied migration as applied.
4. Stop on a missing/extra migration, failed transaction, schema-lint blocking finding, grant/RLS difference, or backup uncertainty.
5. Use forward-fix for governed append-only data. Do not destructively roll back a populated research database. A rollback is permitted only for an uncommitted failed transaction or a separately tested restore of an approved backup.
6. Run pgTAP, application, authorization, storage, analytics-firewall, and release-block tests against synthetic data.
7. Bind exact results into a new release evidence packet and obtain independent review.

## Recovery

Provider backup availability is **NOT VERIFIED** and no restore was executed in Sprint 29. Before any real participant: establish responsible recovery actors, approved backup scope/retention, target region, restore runbook, a synthetic restore exercise, integrity comparison, and withdrawal/restriction reconciliation. A provider feature description is not a restore test.

## Preserved boundaries

`AI PARTICIPANT-DATA PROCESSING: NOT AUTHORIZED`
`REAL PARTICIPANT EVIDENCE COLLECTION: NOT AUTHORIZED`
`ACTUAL PARTICIPANT ENROLLMENT: NOT AUTHORIZED`
`SOFT_LAUNCH_RELEASE_GATE: BLOCKED`
`PILOT: NOT AUTHORIZED`
`PRODUCTION: NOT AUTHORIZED`
