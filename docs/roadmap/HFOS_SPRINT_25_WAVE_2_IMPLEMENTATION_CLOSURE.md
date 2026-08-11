# HFOS Sprint 25 — Wave 2 Implementation Closure

## Control status

- Classification: controlled implementation evidence
- Scope: synthetic development/test only
- Starting commit: `89dbe3e75688125a5846091a676dec2578bf781a`
- Branch: `feat/hfos-research-evidence-backbone`
- Wave 1 ancestry: verified
- Real participant enrollment/evidence, soft launch, Pilot, Production, participant interpretation, final System State, statistical analysis, and formula execution: not authorized

## Controlled inputs

All directly relied-on controlled artifacts were read locally and independently hashed before implementation.

| Controlled artifact | SHA-256 | Result |
| --- | --- | --- |
| Final Operational Readiness Review v1.0 | `fb48fdfbf2bade70ead8ace67f7621ff533e42258fe1e027df220d03e70fdfc2` | Exact |
| Final Operational Readiness Blocker Register v1.0 | `2cefd1b33305a8f28a6558ca2c2cc381ab66d695a8e574455699c34b479d3633` | Exact |
| Research Evidence and Outcome Schema Authority v0.1 | `a19c8eb45d08cae6562e529dc2ca002a5b5798fb0d34d3da745ad56ffc3574a8` | Exact |
| Evidence/Outcome Schema independent review | `f6fbc31eed166b0c3914a1bd400e0d6469582131ef1ea0fe7d2225297fb242d1` | Exact |
| Participant Lifecycle Readiness Authority v0.2 | `0f866efa709c69ae9a7bf6807a78df48a81e4659e22e45c10a70f1320378b4c4` | Exact |
| Lifecycle independent review | `6e665cf3971acfc3ea41be470337e44f85a2efd884722b350752fc7b87b60f57` | Exact |
| Follow-Up and Outcome Adjudication Authority v0.1 | `eccde9dd754f48cec539ddd6a37c1d40c7808ef1619841122e172a945affec59` | Exact |
| Follow-Up/Outcome independent review | `33a664f0d9a0eb29638c42649239defea448c24c5869683bd407e3c4c408fcc4` | Exact |
| Consent and Withdrawal Authority v0.2 | `7c07d9a18f943cca0692e77bef2c6b9cf53cd7c3e230889adae1e1c24121fb48` | Exact |
| Consent/Withdrawal independent review | `290a015fb1e05dfe425441c4d3facf2676d7f9a2e23edb844bd56dddb7ddef05` | Exact |
| Privacy and Data Governance Authority v0.1 | `b3118bf3b1259ab0e27f30b3c5e12e4de684cd06e93495f8a7cb0722799962a1` | Exact |
| Privacy independent review | `db1378f58b4a8736a45f0e3d9bfba2c9343d475da85d9106a354743e92b7c4` | Exact |
| Audit and Withdrawal Trail Authority v0.1 | `958c0d3e973dcd0e72776053214706ac5a5e3b839f6acaf294008e416c2a64c4` | Exact |
| Audit independent review | `6866405ae10ababf9c843a1b00bc55b04535bd82b5b35cf0113df24b101458ce` | Exact |
| Incident and Error Handling Authority v0.2 | `f4ee26764f149bf60e696044fc8db60529311675f719fc432cbe9681dc2f551b` | Exact |
| Incident independent review | `6006890e2af263679dbf722be0dc2cbca4da944f7c4bc39b50ae796143d8911f` | Exact |
| Statistical Research Design Authority v0.1 | `80a12b2f6d5cc5ce28a081427f21be90ede78e5cc04646c9de4236c5d5bc16a4` | Exact |
| Statistical-design independent review | `532791ab1388c746eb1f5e377ea1d3e2d54b9b27affb0507311d66304c19bc9c` | Exact |

## Migration

Migration `051_govern_research_evidence_backbone` is additive. It introduces append-only, FORCE-RLS structures for:

- research evaluations;
- research evidence items and explicit immutable versions;
- frozen evidence-version snapshots and manifest members;
- manual, consent-scoped follow-up history;
- raw observations and separately verified events;
- research outcomes, event manifests, and independent adjudication records.

All direct table privileges are revoked from `anon`, `authenticated`, and `service_role`. Material mutation is exposed only through `SECURITY DEFINER` functions with a fixed `public, pg_catalog` search path. The release-firewall integrity check is required for every synthetic operation.

## Reuse / adapt / new

| Decision | Physical structure | Treatment |
| --- | --- | --- |
| Reuse | `assessment_documents` | Remains governed file/document identity and verification source |
| Reuse | `file_version_history` | Remains immutable physical file-version authority |
| Reuse | `evidence_verification_history` | Remains evidence verification history; no duplicate created |
| Reuse | Wave 1 research identities, enrollment, consent, privacy, withdrawal, audit, firewall | Authoritative gates and lineage |
| Adapt | research evidence item/version | Nullable typed adapters bind mature document/file versions when the source is documentary |
| New | immutable research snapshot/member manifest | Exact governed evidence-version freeze and succession |
| New | follow-up/evaluation records | Manual synthetic sequence; no cadence |
| New | observation/event/outcome/adjudication | Exact active taxonomies and same-actor restrictions |

## Governed behavior

- `CONFIRMED_ZERO` requires numeric zero. `PRESENT` requires an explicit non-null value. Missing/invalid/stale/conflicting/unresolved/not-applicable states cannot contain a value.
- Corrections create immutable successor evidence versions. A frozen snapshot never changes; later evidence requires a successor snapshot.
- `BASELINE_COMPLETE` requires a complete, current, frozen baseline snapshot and does not transition to `ACTIVE_RESEARCH`.
- Follow-up creation requires explicit follow-up consent, an open privacy gate, a frozen predecessor snapshot, manual initiation, and deterministic sequence/predecessor lineage.
- Raw observations remain non-adjudicated. Event verification requires an active objective event class and an independent eligible verifier.
- Outcomes require verified-event manifests. Reserved outcomes and `Stable`, `Under Pressure`, and `Fragile` are rejected. Disagreement/escalation produces `OUTCOME_UNRESOLVED`, not a majority result.
- Outcome proposer, dependent event verifier, and final adjudicator cannot be the same actor.
- STRESS remains categorical under `HFOS-STRESS-DOMAIN / v0.2`; no scalar, operative bands, predicate membership, or State mapping was added.
- All material Wave 2 actions append to the existing research audit stream.

## Application layer

Added typed internal repository/service contracts for evidence creation/correction, snapshot freeze, baseline completion, follow-up creation/completion, observation recording, event verification, outcome proposal, and outcome adjudication. These contracts are server-side only. No participant endpoint or UI was opened.

## Verification

| Check | Result |
| --- | --- |
| Clean local Supabase reset through migration 051 | PASS |
| Focused Wave 2 pgTAP | PASS — 63/63 |
| Clean-reset lifecycle pgTAP suite | PASS — 21 files, 2,125 tests |
| Application tests | PASS — 61 files, 586 tests |
| ESLint | PASS |
| TypeScript `--noEmit` | PASS |
| Production build | PASS — 68 pages |
| Schema lint | PASS with two pre-existing warnings in migrations 035/042; no Wave 2 issue |
| `git diff --check` | PASS |

The unscoped `supabase test db` command also discovers upgrade-path fixture/verification SQL that is designed to be run against pre-migration checkpoints rather than the already fully migrated schema. That combined invocation reported legacy-fixture ordering failures. The clean-reset 21-file operational pgTAP suite and the separately focused Wave 2 suite pass. No upgrade fixture was modified or hidden.

## Sprint 23 blocker mapping

| Blocker | Status | Wave 2 evidence / remaining boundary |
| --- | --- | --- |
| SLR-06 | PARTIALLY CLOSED | Purpose/privacy bindings enforced; launch evidence-category/legal allowlist remains external |
| SLR-09 | PARTIALLY CLOSED | Research evidence, snapshot, follow-up, event, outcome model implemented; incidents/current projections remain Wave 3 |
| SLR-12 | PARTIALLY CLOSED | Withdrawal blocks new Wave 2 collection; complete disposition operations remain later authority/implementation |
| SLR-14 | PARTIALLY CLOSED | Manual synthetic follow-up entity and consent gate implemented; real protocol release remains blocked |
| SLR-15 | PARTIALLY CLOSED | Immutable observation/event/outcome/adjudication backbone implemented; operational reviewer UI remains later |
| SLR-16 | PARTIALLY CLOSED | Minimum database same-actor restrictions implemented; advanced audit/identity-link separation remains Wave 3 |
| SLR-18 | PARTIALLY CLOSED | Wave 2 material audit hooks added; unified incident/access/export/formula/release operationalization remains open |
| SLR-20 | NOT CLOSED | No broad admin/reviewer workspace was added in this foundation wave |
| SLR-23 | PARTIALLY CLOSED | Deterministic Wave 1/Wave 2 tests pass; formula, incident, final release, and complete synthetic journey remain open |
| SLR-24 | NOT CLOSED | Firewall remains blocked; no release evidence packet or independent opening decision exists |

No B1 blocker is represented as fully closed by Wave 2 alone.

## Wave 1 regression

Research-ID separation, consent, privacy, withdrawal, reconsent, append-only audit, and release suppression remain intact. Wave 1 pgTAP is included in the passing clean-reset suite.

## Wave 3 boundary

Still excluded: full incident management, unified audit operations, governed FSH execution, System State release architecture, advanced actor-independence administration, statistical processing, participant outputs, and release-gate opening.

## Authority statement

`REAL PARTICIPANT EVIDENCE COLLECTION: NOT AUTHORIZED`

`ACTUAL PARTICIPANT ENROLLMENT: NOT AUTHORIZED`

`SOFT_LAUNCH_RELEASE_GATE: BLOCKED`

`PILOT: NOT AUTHORIZED`

`PRODUCTION: NOT AUTHORIZED`
