# HFOS Pre-Soft-Launch Security Review v1.0

**Classification:** Scoped implementation security review / not a penetration-test certification
**Reviewed branch baseline:** `feat/hfos-research-evidence-backbone` at `b5566114aa8124a783de6e89372504934f583545`
**Data used:** Source, local schema, and synthetic tests only
**Release status:** `BLOCKED`

## Scope and method

Reviewed authentication, server authorization, RLS/FORCE RLS, RPC grants, storage, environment variables by name, privileged flows, direct-consent and withdrawal gates, append-only Audit, research analytics suppression, release activation, and request routing. The linked remote migration ledger was read only. No remote participant row, object, secret value, or Production data was accessed or changed.

## Findings

| ID | Classification | Finding | Evidence / closure condition |
| --- | --- | --- | --- |
| SEC-01 | BLOCKING | No approved synthetic/staging research target is identified. This checkout is linked to `wpag-production`, while no Vercel target link exists. | Establish exact non-Production verification and future controlled-research boundaries; independently verify config and deployment. |
| SEC-02 | BLOCKING | The linked remote database is materially behind the branch: it ends at migration `20260729013000`; migrations `031`–`055`, including all research controls, are unapplied. | Back up, review, and apply the complete ordered ledger to an approved target; verify RLS/grants/RPCs/storage after deployment. |
| SEC-03 | BLOCKING | Provider backup/restore capability, responsible recovery actor, and a successful synthetic restore are not verified. | Complete a target-specific restore exercise and reconcile immutable history plus withdrawal/restrictions. |
| SEC-04 | BLOCKING | Privileged remote access inventory, stale account review, service-account review, and revocation execution are not available from local evidence. | Complete and sign a target access review; test revocation and post-revocation denial. |
| SEC-05 | BLOCKING | Supabase/Vercel regions, processor/subprocessor posture, contracts/transfers, remote SMTP, and breach notification authority are unresolved. | Qualified legal/provider approval bound to exact target and data flow. |
| SEC-06 | BLOCKING | The real evidence-category allowlist is not approved. MIME validation is not a legal/sensitivity allowlist. | Approve the minimized categories and restricted handling or exclude evidence collection. |
| SEC-07 | NON-BLOCKING | Service-role secret is used only in the server admin client and `.env.local` is ignored; no tracked environment/secret file was found. | Preserve server-only configuration and independently inspect deployed environment scopes without recording values. |
| SEC-08 | NON-BLOCKING | Participant/admin route analytics are fail-closed in source and tests; public analytics remain. | Reconfirm using browser/network evidence on the exact deployed target. |
| SEC-09 | NON-BLOCKING | Participant request intake now derives identities server-side, restricts admin routing, preserves append-only Audit, and states no legal entitlement/deadline. | Independent review of migration `055` and exact deployment required. |
| SEC-10 | LATER | Capacity/load evidence is limited to bounded histories, indexes, and basic query structure; no scale claim is supported. | Run target-specific load/concurrency tests before any material scale expansion. |

## Negative-control coverage

| Required negative | Deterministic evidence |
| --- | --- |
| Cross-participant research access denied | pgTAP `020`, `023`, `025`; participant services derive actor/participant server-side |
| Participant denied administrator routes/actions | Role-protected Next routes plus pgTAP grant/RPC denials |
| Unauthorized staff role denied mutation | pgTAP `022`–`025`; administrator/reviewer role checks inside security-definer RPCs |
| Direct identity linkage restricted | RLS/revoked tables and governed identity/linkage RPCs in migration `050` |
| Cross-participant evidence storage denied | pgTAP `017`–`019`; private bucket and ownership-scoped signed download |
| Sensitive privileged RPC denied | Explicit revoke-all and service-role-only grants; internal role checks |
| Server-only secret absent client-side | Tracked-file/env-name review; `SUPABASE_SERVICE_ROLE_KEY` imported only by server admin client |
| Release override denied | pgTAP `022`–`025`; activation function returns not authorized; no `OPEN` assessment |
| Withdrawal bypass denied | pgTAP `020`/`023`; non-`NONE` withdrawal blocks consent/collection/use gates |
| Actor independence bypass denied | pgTAP `021`–`023`; recorder/verifier/adjudicator/Incident restoration restrictions |

## Storage and integrity

Local migrations define private `assessment-evidence` storage, immutable reservation/object paths, checksum/MIME/size verification, single-use finalization, version lineage, participant ownership, administrator verification, and restricted downloads. Remote equivalence is **not established** because migrations `047`–`055` are not applied to the linked project.

## Secrets and integrations

No tracked `.env`, credentials, generated build directory, or secret-named file was found. `.env.local` is ignored and contains the required Supabase variable names; values were not recorded in this artifact. The application has no OpenAI/Anthropic/AI runtime dependency or participant-data transmission path. Supabase local Studio references an optional `OPENAI_API_KEY` environment variable; this is not an application authorization and must not be configured for participant-data processing.

## Security decision

Local implementation controls are suitable for continued synthetic remediation and independent review. Exact-target deployment, recovery, access, processor, legal/privacy, and evidence-scope blockers prevent first-participant authorization.

`AI PARTICIPANT-DATA PROCESSING: NOT AUTHORIZED`
`REAL PARTICIPANT EVIDENCE COLLECTION: NOT AUTHORIZED`
`ACTUAL PARTICIPANT ENROLLMENT: NOT AUTHORIZED`
`SOFT_LAUNCH_RELEASE_GATE: BLOCKED`
