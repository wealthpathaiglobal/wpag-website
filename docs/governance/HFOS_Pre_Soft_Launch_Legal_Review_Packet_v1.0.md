# HFOS Pre-Soft-Launch Legal Review Packet v1.0

**Classification:** Controlled question packet / no legal conclusions
**Jurisdiction authority:** `UNRESOLVED`
**Launch authority:** `NOT AUTHORIZED`

This packet asks only for the decisions needed before a first controlled participant. It is not legal advice and does not infer law from the founder's location, a participant's location, cloud regions, or deployment names.

## Proposed narrowed operational scope for review

- One jurisdiction selected and recorded by qualified review.
- Direct consent only; minors, representatives, and uncertain-capacity cases excluded fail-closed.
- Operational/feasibility/exploratory research only; no validation, diagnosis, advice, final System State, Pilot, Production, or public case study.
- Manual follow-up only; no automatic cadence.
- No AI participant-data processing or unapproved sharing.
- Real evidence excluded until a minimum category allowlist is approved.
- Release remains blocked until all decisions are bound to the exact target, protocol, consent version, processors, role set, and implementation commit.

## Decisions requested from qualified counsel/privacy authority

1. What single jurisdiction and applicable legal framework control the intended first cohort, organization, hosting, and research activity?
2. What objective direct-consent eligibility/capacity criteria and uncertainty escalation must operators apply? Confirm the exclusion of minors and representative consent.
3. Is the exact controlled consent/information presentation legally sufficient for the approved purpose, locale, affirmative act, decline, reconsent, withdrawal limitation, and contact route?
4. For each record class `RC-01`–`RC-06`, what retention period, trigger, deletion/de-identification/disposition action, backup treatment, legal-hold rule, and minimum Audit preservation apply?
5. What participant access, correction, restriction, objection, privacy-question, and complaint rights apply; how is identity verified; who responds; what deadlines/escalations apply; and what must be audited?
6. Which exact financial/supporting evidence categories may enter the first cohort; which are prohibited; which require enhanced restriction; and what correction/disposition controls apply?
7. For Supabase, Vercel, storage, authentication/email, and any other service, what controller/processor roles, agreements, subprocessors, regions, transfer mechanisms, and approved purposes apply?
8. What hosting/database/storage regions must be selected and how must cross-border transfers be controlled?
9. What Incident/breach assessment, containment, notification decision, timing, recipient, evidence preservation, and escalation requirements apply?
10. What lawful disclosure/legal-hold process applies, who may authorize it, and how are participant-use restrictions reconciled?
11. Does withdrawal require deletion, restriction, de-identification, retained minimum Audit, or another class-specific disposition, including backups and immutable records?
12. Are any additional disclosures or exclusions required for direct-consent-only operational/feasibility research?

## Processor/data-flow register for review

| Service | Observed purpose | Potential data class | Region/config evidence | Authority status | Pre-participant effect |
| --- | --- | --- | --- | --- | --- |
| Supabase project `wpag-production` (`ujitsgycbnswvomlqetr`) | Authentication, PostgreSQL, private storage, server RPC | Identity, financial evidence, research records, Audit | Supabase Management metadata identifies `ap-south-1`, PostgreSQL 17, active/healthy. The account exposes no separate staging project. Physical-backup metadata reports `walg_enabled=true`, `pitr_enabled=false`, no listed physical backups; restoration was not exercised. Contracts, subprocessors, transfer authority, retention, and legal adequacy remain **NOT VERIFIED**. | Legal/provider review required | **BLOCKING**; this target was classified Production and was not modified during Sprint 30. |
| Vercel | Intended Next.js hosting; Vercel Analytics package on public routes | Request metadata; participant data if app is deployed there | No `.vercel` project link; deployment/region **NOT VERIFIED** | Legal/provider and target verification required | **BLOCKING** |
| Supabase Auth email / external email provider | Invitations/authentication messages | Email, identity/linkage metadata | Local Mailpit configured; remote SMTP/provider **NOT VERIFIED** | Review required before participant messaging | **BLOCKING if used** |
| Supabase Storage | Assessment/evidence objects | Restricted financial evidence and file metadata | Private `assessment-evidence` architecture exists locally; remote migration absent | Part of Supabase review; allowlist unresolved | **BLOCKING** |
| Google Analytics | Public-route analytics | Public route/device metadata | Hard-coded public GA identifier; governed participant/admin routes excluded in code | Must remain excluded from research routes; provider review for public site separate | Non-blocking only if deployment exclusion is independently confirmed |
| Vercel Analytics | Public-route analytics | Public route/device metadata | Package present; governed participant/admin routes excluded in code | Same firewall requirement | Non-blocking only if deployment exclusion is independently confirmed |
| AI services | None authorized in participant workflow | Participant research data prohibited | No application AI SDK/path found; local Supabase Studio has optional env reference only | `NOT AUTHORIZED` | Any participant-data use is **BLOCKING/PROHIBITED** |

## Sprint 30 factual environment update

- Read-only project inventory on 2026-08-11 returned one Supabase project only: `wpag-production`, reference `ujitsgycbnswvomlqetr`, region `ap-south-1`.
- That target is classified Production by controlled project metadata and was not migrated, reset, seeded, linked to a staging deployment, or otherwise modified.
- Its remote migration ledger ends at `20260729013000`; the 25 controlled local migrations numbered `031` through `055` are absent remotely.
- No `.vercel/project.json` or other exact application-deployment binding is present in the repository.
- No separate synthetic-only research/staging target exists in the accessible project inventory.
- Creation of a new Supabase project requires a project size/billing selection and a new database credential. Neither billing nor credential-custody authority is supplied by the controlled packet, so no resource was created.
- These are factual deployment inputs only. They do not answer any jurisdiction, legal-basis, controller/processor, transfer, retention, consent, rights, or breach-notification question above.

## Required response format

Return a controlled decision for each question with jurisdiction, scope, effective date, owner, approved wording or schedule where applicable, processor/region identity, limitations, successor review trigger, and artifact/version/hash. Unknown or conditional answers remain release-blocking.

`REAL PARTICIPANT EVIDENCE COLLECTION: NOT AUTHORIZED`
`ACTUAL PARTICIPANT ENROLLMENT: NOT AUTHORIZED`
`SOFT_LAUNCH_RELEASE_GATE: BLOCKED`
