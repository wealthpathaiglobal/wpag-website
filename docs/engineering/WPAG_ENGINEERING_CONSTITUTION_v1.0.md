# WPAG Engineering Constitution

---

## Document Control

| Field | Value |
|---|---|
| Document Name | WPAG Engineering Constitution |
| Version | v1.0 |
| Status | Approved |
| Document Type | Engineering Governance Constitution |
| Classification | Internal |
| Owner | Founder |
| Organization | Wealth Path AI Global |
| Created Date | 30 July 2026 |
| Effective Date | 30 July 2026 |
| Last Reviewed Date | 30 July 2026 |
| Next Review Date | 30 July 2027 |
| Approval Authority | Founder |
| Supersedes | The proposed WPAG Engineering Constitution v1.0 audit draft; this document governs existing engineering standards where conflicts arise |

### Revision History

| Version | Date | Status | Description | Approval Authority |
|---|---|---|---|---|
| v1.0 | 30 July 2026 | Approved | Initial approved Engineering Constitution incorporating repository audit and Founder review | Founder |

---

## Preamble

Wealth Path AI Global (WPAG) is being built as a long-term research and
development institution. Its software must preserve participant trust,
research integrity, institutional knowledge, and operational continuity across
changes in people, technologies, vendors, and decades.

This Constitution establishes the governing engineering principles for WPAG.
It is intended to remain durable while allowing subordinate standards,
procedures, and implementation details to evolve through evidence and
controlled change.

The Constitution does not require unnecessary enterprise complexity. WPAG
shall prefer the simplest architecture that is secure, maintainable,
testable, observable, and capable of meeting demonstrated needs.

---

# Part I — Purpose, Scope, and Governance

## 1. Purpose

This Constitution:

- establishes the permanent parent standard for WPAG software engineering;
- defines mandatory architectural, quality, security, and governance rules;
- preserves the strongest parts of the current repository;
- identifies current gaps without requiring a mass rewrite; and
- provides an incremental path from the present repository to the approved
  standard.

**Justification:** A durable parent standard prevents local conventions and
short-term implementation choices from becoming contradictory institutional
policy.

## 2. Scope

This Constitution applies to:

- public websites and applications;
- participant and administrative platforms;
- research, HFOS, evidence, and assessment systems;
- APIs and integrations;
- database schemas, functions, migrations, and storage;
- authentication, authorization, security, and audit controls;
- infrastructure, deployments, observability, and incident response;
- tests, documentation, and engineering governance; and
- all human- or AI-assisted contributions to WPAG repositories.

## 3. Governance Hierarchy

WPAG engineering governance follows this order:

1. **Engineering Constitution** — the governing parent standard.
2. **Architecture Decision Records (ADRs)** — approved architectural
   decisions within the Constitution.
3. **Engineering standards** — implementation rules for coding, APIs,
   databases, security, testing, releases, and related disciplines.
4. **Standard Operating Procedures (SOPs)** — repeatable operational
   procedures.
5. **Checklists** — execution controls used to verify compliance.

Lower-level documents must not contradict higher-level documents. When a
conflict exists, the higher-level document governs until the lower-level
document is aligned.

**Justification:** A defined hierarchy prevents multiple documents from
claiming equal authority and producing incompatible instructions.

## 4. Rule Status

This document uses three implementation states:

- **Already follows standard** — substantially present and should be
  preserved.
- **Needs improvement** — required for current reliability, consistency, or
  governance.
- **Future recommendation** — appropriate when scale or operational need
  justifies adoption.

Status describes current implementation maturity. It does not reduce the
authority of a governing rule after its planned adoption phase.

---

# Part II — Current Repository Findings

## 5. Repository Baseline

The audit reviewed:

- the complete tracked folder and file structure;
- Git branches and commit history;
- Next.js pages, layouts, route handlers, and middleware;
- components, hooks, services, repositories, and types;
- authentication and authorization modules;
- Supabase clients and approximately 30 database migrations;
- API, coding, database, security, testing, review, Git, and release
  standards;
- ten ADRs and the ADR index/template;
- project overview, architecture, changelog, development log, roadmaps, and
  the WPAG Digital Constitution.

At the audit point, the repository contained approximately 25,000 lines of
TypeScript, TSX, and CSS. Strict TypeScript and lint checks passed. The
production build remained dependent on network access to Google Fonts.

## 6. Current Strengths

### 6.1 Architecture

- **Already follows standard:** Next.js App Router conventions are used
  consistently.
  **Justification:** Framework conventions reduce custom routing and
  maintenance burden.
- **Already follows standard:** A route → service → repository → database
  structure has emerged for important workflows.
  **Justification:** This separates transport, business logic, and data access.
- **Already follows standard:** Server and privileged Supabase clients are
  separated from browser clients.
  **Justification:** Privileged credentials must never reach client bundles.
- **Already follows standard:** Security-sensitive lifecycle transitions use
  database functions and history tables.
  **Justification:** Transactional enforcement improves integrity and
  auditability.

### 6.2 Database

- **Already follows standard:** The schema makes strong use of UUID keys,
  constraints, foreign keys, indexes, audit fields, soft deletion, triggers,
  and comments.
  **Justification:** Integrity encoded in PostgreSQL remains effective across
  all application callers.
- **Already follows standard:** Important tables enable RLS, and newer
  security-definer functions constrain `search_path` and grants.
  **Justification:** Database access must follow least privilege.
- **Already follows standard:** Lifecycle, workflow, evidence, and audit
  history are modeled explicitly.
  **Justification:** Institutional and research records require traceability.

### 6.3 Engineering Governance

- **Already follows standard:** ADRs, engineering standards, security rules,
  review criteria, testing expectations, and release guidance exist in the
  repository.
  **Justification:** Version-controlled governance preserves institutional
  knowledge.
- **Already follows standard:** Recent commits increasingly use Conventional
  Commit syntax and major integrations use pull requests.
  **Justification:** Structured history supports review and change tracking.
- **Already follows standard:** Environment files, keys, build outputs,
  Supabase temporary files, and migration backups are ignored.
  **Justification:** Secrets and transient artifacts must remain outside
  version control.

## 7. Current Weaknesses and Technical Debt

- **Needs improvement:** No automated unit, integration, E2E, database, or
  authorization test suite exists.
  **Justification:** Critical workflows cannot be protected from regression by
  manual verification alone.
- **Needs improvement:** No repository CI workflow enforces documented quality
  gates.
  **Justification:** Standards that depend solely on memory will be applied
  inconsistently.
- **Needs improvement:** Several pages and complex forms exceed 1,000 lines and
  mix presentation, local state, and validation.
  **Justification:** Mixed responsibilities increase change risk.
- **Needs improvement:** API envelopes, validation, and error-to-HTTP mapping
  are inconsistent.
  **Justification:** Clients and monitoring need predictable contracts.
- **Needs improvement:** Raw diagnostic logging remains in authentication and
  invitation paths.
  **Justification:** Logs can expose identity or operational data.
- **Needs improvement:** Authentication and display helpers are duplicated.
  **Justification:** Duplicate behavior drifts over time.
- **Needs improvement:** Some services query Supabase directly while other
  domains use repositories.
  **Justification:** Multiple data-access patterns weaken discoverability and
  testing.
- **Needs improvement:** Some repositories use `select("*")` and manual type
  assertions.
  **Justification:** Broad projections and unchecked casts weaken data
  contracts.
- **Needs improvement:** Project, architecture, roadmap, changelog, and
  database blueprint documents are stale.
  **Justification:** Incorrect documentation is an institutional risk.
- **Needs improvement:** Most ADRs are indexed as planned even where their
  decisions are already implemented.
  **Justification:** Decision status must reflect operational reality.

## 8. Current Inconsistencies and Duplicate Patterns

### 8.1 Naming and folders

- React components use both PascalCase and kebab-case filenames.
- Shared UI exists under both `src/ui` and `src/components`.
- Domain types exist under both service folders and type folders.
- Server API orchestration exists under route handlers and `src/lib/api`.
- Admin database access occurs in both services and repositories.

### 8.2 Repeated behavior

- `getCurrentUser()` has separate staff and participant implementations.
- `StatusRow`, `FieldError`, `formatDate`, `formatStatus`, and status-class
  functions recur in multiple files.
- API routes repeat JSON parsing, error mapping, and response construction.

### 8.3 Database and Git

- Migration module number `023` is reused.
- Logical migration `027` has a later timestamp than migrations `028–030`.
- The database master blueprint no longer matches implemented modules.
- The current participant feature commit was created on a branch named for
  invitation debugging.
- Local and remote integration histories have shown divergence.

**Justification:** These findings do not require a mass rewrite. They define
where new work must become consistent and where incremental cleanup should be
prioritized.

## 9. Governance Gaps

- Governance documents have blank created, effective, reviewed, and next-review
  dates.
- No explicit hierarchy previously resolved conflicts between the Digital
  Constitution, ADRs, engineering standards, and checklists.
- No visible CI, branch-protection evidence, `CODEOWNERS`, PR template, or
  automated release controls exist in the repository.
- Testing, monitoring, security scanning, accessibility enforcement, and
  incident procedures are documented mainly as intentions rather than
  executable controls.

---

# Part III — Governing Engineering Rules

## 10. Engineering Philosophy

- **Already follows standard:** Institution before product.
  **Justification:** Software must strengthen WPAG rather than exist as an
  isolated short-lived product.
- **Already follows standard:** Structure before speed.
  **Justification:** Participant and research systems accumulate long-term
  consequences.
- **Needs improvement:** Simplicity is the default; abstractions require a
  demonstrated need.
  **Justification:** Premature enterprise complexity creates maintenance cost
  without improving outcomes.
- **Needs improvement:** Correctness, security, clarity, recoverability, and
  evidence take priority over feature velocity.
  **Justification:** Trust and research integrity are more valuable than
  short-term delivery speed.
- **Future recommendation:** Every generation of the platform must be
  understandable without relying on its original authors.
  **Justification:** Institutional continuity must survive personnel turnover.

## 11. Institutional Stability Policy

- Every major engineering decision must consider at least ten-year
  maintainability.
  **Justification:** Major choices can outlive the project phase and the people
  who selected them.
- Prefer durable, widely understood standards over short-term convenience.
  **Justification:** Durable standards reduce migration and knowledge-transfer
  risk.
- Avoid dependencies or abstractions that create unnecessary institutional
  risk, lock-in, abandonment exposure, or specialist dependence.
  **Justification:** A dependency must provide more durable value than the risk
  it introduces.
- Critical knowledge must be documented and must not depend on one person.
  **Justification:** No individual may become a single point of institutional
  failure.
- Material vendor choices must document data portability, exit conditions, and
  replacement implications.
  **Justification:** Century-scale continuity requires the ability to move.

## 12. Architectural Principles

- **Already follows standard:** Use a modular monolith until evidence supports
  independent service deployment.
  **Justification:** The current system benefits from simple deployment and
  transactional consistency.
- **Needs improvement:** Dependencies normally flow from UI/routes to services,
  repositories, and database clients.
  **Justification:** Predictable dependency direction reduces coupling.
- **Needs improvement:** Presentation, orchestration, data access, and
  database enforcement must remain separate where behavior is material.
  **Justification:** Each layer can then be tested and changed independently.
- **Needs improvement:** Security-critical invariants should be enforced at
  multiple appropriate boundaries.
  **Justification:** No single caller or validation layer should be able to
  bypass essential controls.
- **Future recommendation:** Services may be separated only for demonstrated
  scaling, availability, jurisdiction, isolation, or ownership requirements.
  **Justification:** Distribution adds failure modes and operational cost.

## 13. Repository Evolution Policy

- New modules must follow an approved existing pattern unless an ADR approves a
  new pattern.
  **Justification:** Consistency makes growth predictable.
- Do not create new folders, layers, naming styles, or abstractions for an
  isolated feature.
  **Justification:** One-off structures fragment the repository.
- Repository growth must remain predictable and discoverable.
  **Justification:** Maintainers must be able to infer where code belongs.
- Refactoring must be incremental and independently verifiable, not a mass
  rewrite.
  **Justification:** Incremental change preserves working behavior and
  rollback options.
- Existing stable architecture must be preserved unless evidence shows a
  material problem.
  **Justification:** Stability has value and should not be traded for aesthetic
  uniformity alone.
- New standards apply immediately to new code; existing code is aligned when
  touched or through approved remediation work.
  **Justification:** This prevents both continued drift and disruptive
  repository-wide churn.

## 14. Repository Structure Standard

The existing domain-oriented structure remains valid:

```text
src/
  app/
  components/
  hooks/
  lib/
    api/
    auth/
    repositories/
    services/
    supabase/
    types/
  styles/
supabase/
  migrations/
docs/
  architecture/
  engineering/
  roadmap/
```

- **Already follows standard:** Next.js route-special files remain under
  `src/app`.
  **Justification:** Framework conventions should not be replaced.
- **Needs improvement:** New code must use an existing canonical folder before
  proposing another.
  **Justification:** A small number of predictable locations improves
  discoverability.
- **Future recommendation:** `features/<domain>` is optional and must not be
  introduced now as a mandatory repository-wide structure. It may be approved
  when a domain has multiple reusable components, services, repositories,
  schemas, and consumers.
  **Justification:** Feature organization becomes valuable only when domain
  cohesion is stronger than the current layer-oriented organization.
- **Future recommendation:** Adoption of `features/<domain>` must be
  incremental and must define how it interoperates with existing folders.
  **Justification:** Optional evolution must not create two unexplained
  architectures.

## 15. Folder Organization Standard

- A module must have one canonical home.
  **Justification:** Multiple homes increase search cost and duplication.
- Route-local components may remain beside their route when they have one
  consumer.
  **Justification:** Colocation is appropriate for private route
  implementation.
- Shared reusable components belong under `src/components`; domain services,
  repositories, and types remain under their established `src/lib` domains
  unless an ADR approves a feature structure.
  **Justification:** This preserves the stable architecture.
- `src/ui` and `src/components` should be aligned incrementally when relevant
  files are touched; no mass move is required.
  **Justification:** One eventual component hierarchy is desirable, but
  immediate renaming has little functional value.

## 16. File Naming Standard

- React component files use `PascalCase.tsx`.
  **Justification:** Component files become immediately recognizable.
- React component exports use PascalCase.
  **Justification:** This follows React conventions.
- Hook files use `useSomething.ts` or `useSomething.tsx` when JSX is required.
  **Justification:** The `use` prefix communicates React hook semantics.
- Utilities and non-component TypeScript files use `kebab-case.ts`.
  **Justification:** One convention for non-component modules avoids
  ambiguity.
- Next.js reserved files remain `page.tsx`, `route.ts`, `layout.tsx`,
  `loading.tsx`, and `error.tsx`.
  **Justification:** These names are defined by the framework.
- SQL identifiers and migration suffixes use snake_case.
  **Justification:** This matches PostgreSQL conventions.
- Existing stable filenames must not be mass-renamed. Rename only as part of a
  relevant change with verified import and deployment impact.
  **Justification:** Naming consistency does not justify broad regression and
  history noise.

## 17. Component Standard

- Components should normally remain below approximately 300–500 lines as a
  maintainability guideline, not a hard limit.
  **Justification:** Size is a useful signal but does not alone determine
  quality.
- Larger complex forms or dashboards are acceptable when clearly sectioned,
  cohesive, and maintainable.
  **Justification:** Artificial splitting can make a single workflow harder to
  understand.
- Split a file when rendering, state, validation, orchestration, and data
  access become mixed.
  **Justification:** Mixed responsibilities, not line count alone, create
  maintenance risk.
- Server Components are the default; Client Components are used for browser
  interaction and client state.
  **Justification:** This limits client JavaScript and protects server-only
  operations.
- Props use explicit, minimal domain shapes.
  **Justification:** Passing full database rows increases coupling and
  exposure.
- Repeated UI primitives should be shared after reuse is demonstrated.
  **Justification:** Proven reuse prevents visual and accessibility drift
  without premature abstraction.

## 18. Service Layer Standard

- Services own business rules, workflow orchestration, and transaction
  coordination.
  **Justification:** Business behavior must remain independent of HTTP and UI.
- Services must not return framework responses or render components.
  **Justification:** Transport-independent services are easier to test and
  reuse.
- Services use domain-specific inputs, outputs, and errors.
  **Justification:** Stable domain contracts isolate transport and schema
  changes.
- A pass-through service is retained only when it establishes a meaningful
  domain boundary or expected orchestration point.
  **Justification:** Indirection without responsibility reduces clarity.

## 19. Repository Layer Standard

- Repositories own database queries, persistence details, and row mapping.
  **Justification:** Centralized data access limits schema coupling.
- Services must not query Supabase directly when an approved repository exists
  for that responsibility.
  **Justification:** Bypassing repositories produces competing patterns.
- Production repositories use explicit projections rather than `select("*")`.
  **Justification:** Explicit fields reduce accidental data exposure and
  contract expansion.
- Database rows must be validated or mapped into domain types rather than
  trusted solely through assertions.
  **Justification:** Runtime data can differ from manually declared types.
- Repository errors expose safe operation context, not sensitive record
  contents.
  **Justification:** Diagnostics must not create a privacy leak.

## 20. API Design Standard

APIs should converge incrementally on:

```ts
type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
    requestId?: string;
  };
};
```

- API responses must use consistent success and error envelopes within an API
  generation.
  **Justification:** Clients should not need endpoint-specific error parsing.
- Resource-oriented routes are preferred; explicit commands are valid for
  state-machine actions such as lifecycle transitions.
  **Justification:** Domain commands are sometimes clearer and safer than
  generic CRUD.
- Authentication maps to `401`, authorization to `403`, validation to
  `400`/`422`, missing resources to `404`, conflicts to `409`, and unexpected
  failures to `500`.
  **Justification:** Correct status semantics improve clients and monitoring.
- External/public APIs require versioning when backward compatibility cannot
  otherwise be preserved. Internal same-deployment routes need not be
  versioned prematurely.
  **Justification:** Versioning is useful for independent consumers, not as
  ceremony.
- Collections must become paginated before growth can make unbounded reads
  unsafe.
  **Justification:** Data growth must not silently degrade reliability.

## 21. Database Design Standard

- PostgreSQL/Supabase remains the canonical transactional datastore.
  **Justification:** It provides integrity, transactions, RLS, and mature
  operational tooling.
- Tables use UUID primary keys, appropriate foreign keys, constraints,
  indexes, audit timestamps, and comments.
  **Justification:** Integrity and meaning should be encoded in the schema.
- Significant institutional events use immutable or append-only history.
  **Justification:** Participant and research actions require traceability.
- Every mutable table must document ownership, lifecycle, deletion, retention,
  and audit requirements.
  **Justification:** Data governance must be explicit.
- Every RLS-enabled table must have approved policies or a documented
  server-only/service-role access decision.
  **Justification:** Enabling RLS without documenting the access model is
  incomplete.
- Partitioning, replicas, caches, and specialized datastores require measured
  need.
  **Justification:** Operational complexity must solve an observed problem.

## 22. Migration Standard

- Each migration filename uses a unique timestamp and descriptive snake_case
  suffix. Logical module identifiers, if used, must not be reused.
  **Justification:** Every schema change needs an unambiguous identity.
- Applied migrations are immutable; corrections use forward-fix migrations.
  **Justification:** Rewriting history causes environment drift.
- Each migration documents purpose, dependencies, security effect, data risk,
  verification, and rollback or forward-fix strategy.
  **Justification:** A migration must be operable, not merely executable.
- CI must eventually apply migrations to a clean database and run database
  tests.
  **Justification:** Sequential validity requires execution evidence.
- Destructive changes use expand → migrate → verify → contract where
  applicable.
  **Justification:** Staged evolution protects data and rolling deployments.

## 23. Validation Standard

- Validate and normalize every external input at the application boundary.
  **Justification:** External input is untrusted.
- Adopt one runtime schema-validation approach for API and form contracts.
  **Justification:** TypeScript assertions do not validate runtime data.
- Reuse schemas between client and server when their semantics are identical.
  **Justification:** Shared rules prevent contradictory validation.
- Reject unknown fields for security-sensitive mutations.
  **Justification:** Silent mass assignment can modify unintended state.
- Database constraints remain the final integrity boundary.
  **Justification:** Non-web callers may reach the database.

## 24. TypeScript Standard

- Strict TypeScript is mandatory.
  **Justification:** Strictness detects ambiguity before runtime.
- Avoid `any`, unchecked assertions, and unvalidated JSON casts.
  **Justification:** Assertions can conceal uncertainty rather than resolve it.
- Use discriminated unions for workflow states and service results.
  **Justification:** Impossible states become harder to represent.
- Generate Supabase database types and map them into domain types when Phase 2
  is adopted.
  **Justification:** Generated contracts reduce schema drift while domain
  models preserve business boundaries.
- Disable `allowJs` when confirmed that JavaScript source support is not
  required.
  **Justification:** A TypeScript repository should enforce its intended
  language boundary.

## 25. Error Handling Standard

- Use a small error taxonomy covering validation, authentication,
  authorization, not-found, conflict, dependency, and internal failures.
  **Justification:** Stable categories support predictable transport mapping.
- Never expose raw database or provider errors to users.
  **Justification:** Internal details may reveal sensitive implementation
  information.
- Preserve root causes internally with safe context.
  **Justification:** User-safe messages must not destroy diagnostic evidence.
- Do not catch errors only to log and rethrow unless additional safe context is
  added once.
  **Justification:** Duplicate logging obscures the original event.
- Boundary errors should eventually include request identifiers.
  **Justification:** Correlation enables investigation without exposing
  private data.

## 26. Authentication Standard

- Supabase Auth remains the canonical identity provider until an ADR approves
  a replacement.
  **Justification:** A single identity authority prevents fragmented accounts.
- Protected server operations validate the session through server-side user
  resolution.
  **Justification:** Client state is not proof of identity.
- The repository must converge on one shared current-auth-user resolver.
  **Justification:** Duplicate identity logic can drift.
- Callback redirects must permit only validated internal paths.
  **Justification:** This prevents open redirects.
- Authentication errors must not hide database or operational failures.
  **Justification:** Misclassification impedes recovery and diagnosis.
- Privileged staff MFA should be introduced before broad production
  administration.
  **Justification:** Staff accounts carry disproportionate risk.

## 27. Authorization Standard

- Authorization is deny-by-default and enforced server-side.
  **Justification:** UI visibility is not an access control.
- Role and permission checks should use typed, canonical identifiers.
  **Justification:** Typos should not become authorization behavior.
- Protected routes declare authorization at their entry point.
  **Justification:** Reviewers must see the trust boundary immediately.
- Participant access requires resource ownership checks in addition to any
  role.
  **Justification:** A valid identity does not imply access to every record.
- Database authorization functions and RLS require automated policy tests in
  Phase 2.
  **Justification:** Authorization regressions are high-impact.

## 28. Security Standard

- Secrets remain outside Git, and privileged clients remain server-only.
  **Justification:** Credential exposure compromises the entire platform.
- Remove or redact diagnostics containing user, staff, invitation, database,
  or participant data.
  **Justification:** Logs are a secondary data store and security boundary.
- CI must add dependency, secret, and static-analysis scanning incrementally.
  **Justification:** Manual review cannot track all known vulnerabilities.
- Public applications, authentication-adjacent operations, invitations, and
  administrative mutations require risk-appropriate abuse controls.
  **Justification:** These are sensitive, automatable boundaries.
- Data must be classified as public, internal, confidential, or restricted
  participant data.
  **Justification:** Controls and retention should match sensitivity.
- Threat modelling and independent review become mandatory before material
  real-world participant financial data is processed at scale.
  **Justification:** Risk grows with data sensitivity and usage.

## 29. Logging Standard

- Use structured server logging instead of ad hoc `console.*` calls in
  production paths.
  **Justification:** Structured logs support search, severity, and redaction.
- Logs include an event name, severity, safe identifiers, result, request ID,
  and duration when relevant.
  **Justification:** Consistent fields improve operations.
- Never log tokens, passwords, invitation links, full participant records,
  financial answers, or raw provider payloads.
  **Justification:** Logs must not become an uncontrolled data replica.
- Operational logs and immutable business audit records remain separate.
  **Justification:** They have different evidentiary, retention, and access
  requirements.

## 30. Testing Standard

- Unit tests cover validators, mappings, state rules, and pure helpers.
  **Justification:** Fast tests protect deterministic behavior.
- Integration tests cover repositories, services, database functions, RLS, and
  API contracts.
  **Justification:** Most serious defects occur between layers.
- E2E tests cover login, password recovery, invitation acceptance, application
  review, participant creation, lifecycle transitions, and protected
  participant access.
  **Justification:** These are critical institutional journeys.
- Bug fixes include regression tests where practical.
  **Justification:** A corrected defect should not recur silently.
- Coverage targets must be risk-based after the initial test suite exists.
  **Justification:** A global percentage does not prove meaningful behavior.

## 31. Documentation Standard

- Engineering documentation is version-controlled and updated with the change
  it describes.
  **Justification:** Deferred documentation becomes inaccurate documentation.
- Governance documents include owner, status, dates, review cycle, approval,
  and revision history.
  **Justification:** Undated standards cannot be governed.
- ADR statuses must reflect reality: proposed, accepted, superseded,
  deprecated, or rejected.
  **Justification:** Maintainers need to know which decisions govern.
- The README must eventually document setup, environment-variable names,
  commands, architecture, tests, migrations, and deployment.
  **Justification:** Repository continuity requires an operational entry point.
- Durable formats such as Markdown, SQL, and diagrams-as-code are preferred.
  **Justification:** Institutional knowledge must survive tool changes.

## 32. Git Workflow

- Use short-lived branches from an up-to-date protected `main`.
  **Justification:** A simple trunk-based workflow fits current scale.
- `main` must remain releasable.
  **Justification:** One trustworthy integration branch reduces ambiguity.
- Production changes merge through reviewed pull requests with required
  checks, except approved emergency procedures.
  **Justification:** Governance should be enforced rather than remembered.
- The branch must be updated with its target before final review under one
  documented merge policy.
  **Justification:** Review must cover what will actually merge.
- Long-lived release branches should be introduced only when multiple
  production versions require support.
  **Justification:** Current scale does not justify GitFlow complexity.

## 33. Branch Naming Convention

Use:

```text
feature/<domain>-<short-description>
fix/<domain>-<short-description>
refactor/<domain>-<short-description>
docs/<short-description>
test/<domain>-<short-description>
chore/<short-description>
hotfix/<short-description>
migration/<short-description>
```

- Branch purpose must match its contents.
  **Justification:** Reviewers and operators should understand scope from the
  branch name.
- Merged branches are deleted after verification.
  **Justification:** Stale branches obscure active work.
- Ticket identifiers are added only if a durable issue tracker becomes
  authoritative.
  **Justification:** Unresolvable IDs do not preserve knowledge.

## 34. Commit Message Convention

Use Conventional Commits:

```text
type(scope): imperative summary
```

Allowed types are `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`,
`build`, `ci`, and `revert`.

- Scopes use stable domains such as `participant`, `auth`, `admin`, `db`, or
  `docs`.
  **Justification:** Stable scopes make history searchable.
- A commit represents one coherent change.
  **Justification:** Atomic changes are reviewable and revertible.
- Breaking changes use `!` and a `BREAKING CHANGE` footer.
  **Justification:** Compatibility impact must be machine-readable.

## 35. Pull Request Standard

Every pull request includes:

- purpose and scope;
- requirement or issue reference where available;
- architecture, security, privacy, and database impact;
- test and build evidence;
- screenshots for material UI changes;
- deployment and rollback or forward-fix notes;
- documentation changes; and
- known limitations.

- Pull requests should remain reviewable and be decomposed when their scope
  prevents effective review.
  **Justification:** Review quality matters more than an arbitrary line-count
  target.
- Emergency changes use an expedited path but require retrospective review and
  documentation.
  **Justification:** Urgency may shorten process but must not erase
  accountability.

## 36. Code Review Checklist

Reviewers confirm:

1. Scope matches the approved request.
2. Existing architecture and naming patterns are preserved.
3. Validation exists at trust boundaries.
4. Authentication, authorization, and ownership are explicit.
5. No secrets or sensitive data are exposed.
6. Errors are classified and safely mapped.
7. Database constraints, RLS, grants, and migrations are correct.
8. Queries are explicit, bounded, and indexed where necessary.
9. Types do not rely on unjustified assertions.
10. Tests cover material success and failure paths.
11. Accessibility is preserved.
12. Documentation is current.
13. Logging is safe.
14. Compatibility and rollback/forward-fix plans are credible.
15. Required CI checks pass.

**Justification:** A repeatable checklist converts policy into review evidence.

## 37. Release Process

- Required release gates are clean source state, lint, typecheck, tests,
  production build, migration verification, security checks, deployment plan,
  and rollback/forward-fix plan.
  **Justification:** Releases must be repeatable and auditable.
- Database and application deployment order must preserve compatibility.
  **Justification:** Different versions may coexist during rollout.
- Post-release checks cover authentication, authorization, core APIs,
  database connectivity, and critical journeys.
  **Justification:** Deployment success does not prove operational success.
- Promotion and release automation should be introduced incrementally in Phase
  3.
  **Justification:** Automation is valuable after reliable tests and gates
  exist.

## 38. Versioning Strategy

- Production releases use semantic versioning: `MAJOR.MINOR.PATCH`.
  **Justification:** Releases need a durable compatibility signal.
- Database migrations remain an immutable sequence independent of package
  versions.
  **Justification:** Schema history has its own lifecycle.
- Public API versions change only for breaking contracts.
  **Justification:** Unnecessary versions increase maintenance.
- Release history must remain machine-readable and human-readable.
  **Justification:** Operators and future researchers need interpretable
  provenance.

## 39. Backward Compatibility Policy

- Routine releases must not break participant records, research evidence, HFOS
  assessments, lifecycle history, or audit records.
  **Justification:** These are durable institutional records, not disposable
  application state.
- Breaking changes require a migration strategy, compatibility window, impact
  analysis, rollback or forward-fix plan, and explicit approval.
  **Justification:** Breaking changes must be deliberate and recoverable.
- Database evolution should use expand → migrate → verify → contract where
  applicable.
  **Justification:** Staged change protects data and mixed-version
  deployments.
- Historical records must remain interpretable after schema and software
  evolution.
  **Justification:** Research, audit, and participant history lose value if
  their original meaning is lost.
- Changes to enumerations, units, formulas, scoring, or interpretation rules
  must preserve the version or context under which historical data was
  created.
  **Justification:** Later software must not silently reinterpret earlier
  evidence.

## 40. Deprecation Policy

- Deprecation requires replacement guidance, announcement date, owner,
  removal target, and impact analysis.
  **Justification:** Consumers need time and clarity to migrate.
- Public contracts receive a compatibility window before removal except for
  urgent security action.
  **Justification:** Stability is part of institutional trust.
- Database fields follow expand-and-contract removal.
  **Justification:** Immediate deletion risks data loss and deployment failure.
- Historical documentation for removed behavior is preserved.
  **Justification:** Past records must remain explainable.

## 41. Performance Guidelines

- Prefer server rendering, bounded queries, explicit projections, and
  justified indexes.
  **Justification:** Efficient defaults postpone architectural complexity.
- Measure before optimizing and record the metric being improved.
  **Justification:** Speculative optimization creates unproven complexity.
- Establish budgets for page JavaScript, user-perceived performance, API
  latency, and slow queries as monitoring matures.
  **Justification:** Performance requires measurable boundaries.
- Caching requires ownership, invalidation, privacy, and staleness rules.
  **Justification:** Incorrect participant or financial state is worse than a
  slower response.

## 42. Accessibility Guidelines

- Target WCAG 2.2 AA for public, participant, and administrative experiences.
  **Justification:** Accessibility is an institutional obligation.
- Use semantic HTML, visible focus, keyboard support, labels, error summaries,
  and accessible status announcements.
  **Justification:** Visual presentation alone does not create an accessible
  workflow.
- Phase 3 introduces automated checks plus manual keyboard and screen-reader
  review for critical journeys.
  **Justification:** Automation cannot detect all usability barriers.
- Existing accessible form behavior must be preserved during refactoring.
  **Justification:** Improvements must not regress current users.

## 43. Internationalization Readiness

- Dates, times, currencies, countries, and languages use explicit standard
  representations.
  **Justification:** Global records must not depend on an implicit locale.
- Store timestamps in UTC-compatible formats and format using explicit locale
  and timezone.
  **Justification:** Display context must not alter stored meaning.
- Use ISO country, language, and currency codes and never infer currency solely
  from locale.
  **Justification:** Financial meaning must remain explicit.
- User-facing text should remain separable from business rules as domains
  mature.
  **Justification:** Embedded text makes later translation expensive.
- An i18n framework is adopted when a second supported language is scheduled,
  not before.
  **Justification:** Readiness is valuable; premature infrastructure is not.

## 44. Scalability Principles

- Scale the modular monolith and PostgreSQL foundation before distributing the
  system.
  **Justification:** Simple architecture is easier to operate correctly.
- Design bounded queries, pagination, idempotent commands, and explicit state
  transitions before growth makes them urgent.
  **Justification:** These foundations are inexpensive early and valuable
  later.
- Long-running or retryable work moves out of request lifecycles when measured
  behavior requires it.
  **Justification:** Web requests are not reliable job processors.
- Queues, replicas, search engines, warehouses, or microservices require
  evidence and an ADR.
  **Justification:** Each introduces new ownership and failure modes.
- Maintain export and vendor-exit capability for identity, database, storage,
  and hosting.
  **Justification:** Institutional continuity requires portability.

## 45. Coding Do's and Don'ts

### Do

- write explicit, typed, cohesive functions;
- validate external input;
- enforce invariants in services and the database;
- use explicit query projections;
- preserve safe error causes;
- prefer Server Components;
- add regression tests;
- keep changes narrow;
- update documentation with implementation; and
- record material architectural decisions.

### Don't

- query privileged data from presentation components;
- expose service-role credentials to clients;
- log participant records, financial data, or authentication secrets;
- use `select("*")` in production repositories;
- cast unvalidated JSON into trusted types;
- create pass-through layers without a boundary purpose;
- create one-off folder or naming patterns;
- edit applied migrations;
- mix unrelated changes in one branch or commit; or
- add infrastructure for hypothetical scale.

**Justification:** These rules preserve the repository's strongest patterns and
directly address observed drift.

## 46. Definition of Done

A change is complete only when:

1. acceptance criteria are satisfied;
2. architecture and naming standards are followed;
3. security, privacy, and compatibility impact are reviewed;
4. validation and authorization are complete;
5. risk-appropriate tests pass;
6. lint and TypeScript pass;
7. the production build passes in an appropriate environment;
8. migrations are verified where applicable;
9. accessibility is checked;
10. documentation and ADRs are current;
11. deployment and rollback or forward-fix plans exist;
12. logging, monitoring, and audit implications are addressed;
13. required review and CI checks pass; and
14. no critical defect or unexplained warning remains.

**Justification:** “Implemented” is not equivalent to safe, documented,
reviewed, and operable.

## 47. Change Management Process

Changes are classified as:

- **Routine** — local implementation without public contract or architectural
  effect.
- **Significant** — cross-domain, security, database, or public-contract
  change.
- **Constitutional** — changes this Constitution or a foundational rule.
- **Emergency** — immediate production or security remediation.

Rules:

- Significant changes require an ADR or explicit amendment to an accepted ADR.
  **Justification:** Material decisions require durable rationale.
- Constitutional changes require proposal, impact analysis, Founder approval,
  effective date, and revision history.
  **Justification:** Foundational rules should evolve deliberately.
- Emergency changes require the minimum safe review, recoverability, and a
  retrospective record.
  **Justification:** Urgency must not erase accountability.
- This Constitution is reviewed annually and after major incidents or platform
  transitions.
  **Justification:** Stable governance still requires evidence-based
  refinement.
- Rules and decisions are superseded explicitly rather than silently
  rewritten.
  **Justification:** Future maintainers must understand institutional
  evolution.

---

# Part IV — Engineering Assessment

## 48. Engineering Scores

Scores reflect repository evidence at the time of the v1.0 audit.

| Measure | Score | Interpretation |
|---|---:|---|
| Engineering maturity | 52/100 | Strong foundations and written intent; limited automation and operational proof |
| Repository quality | 68/100 | Good technology and database baseline; inconsistent organization and enforcement |
| Maintainability | 54/100 | Strict TypeScript and emerging layers help; large files, duplication, stale documentation, and absent tests reduce confidence |
| Scalability | 57/100 | Sound Next.js/PostgreSQL foundation; bounded APIs, jobs, observability, and test evidence remain incomplete |
| Technical debt burden | 58/100 | Moderate-to-high debt; for this measure, 100 represents severe debt |

## 49. Top 20 Priority Improvements

1. Create CI gates for lint, TypeScript, tests, build, and migration
   verification.
2. Establish initial tests for authentication, authorization, applications,
   participant creation, invitations, and lifecycle transitions.
3. Remove raw diagnostic logging and introduce redacted structured logging.
4. Enforce branch-purpose alignment, pull-request review, and protected-main
   checks.
5. Correct stale project, roadmap, ADR, changelog, and database documentation.
6. Standardize API success/error envelopes.
7. Adopt one runtime validation approach for every API boundary.
8. Generate Supabase database types and reduce unsafe assertions.
9. Replace `select("*")` with explicit repository projections.
10. Publish a canonical migration registry addressing duplicate logical
    identifiers without rewriting applied migrations.
11. Add database tests for functions, constraints, RLS, grants, invitations,
    and lifecycle transitions.
12. Converge on one shared authenticated-user resolver.
13. Define and test participant-profile persistence architecture before
    implementation.
14. Incrementally separate mixed responsibilities in the largest forms and
    dashboards when those files are changed.
15. Consolidate proven duplicate UI and formatting helpers.
16. Add WCAG 2.2 AA checks for critical workflows.
17. Introduce structured observability and request correlation.
18. Add rate limiting and abuse controls to sensitive endpoints.
19. Automate repeatable release verification and promotion.
20. Establish internationalization-ready date, time, country, language, and
    currency conventions.

---

# Part V — Incremental Adoption Roadmap

## 50. Adoption Principles

- No immediate mass refactoring is authorized by this Constitution.
  **Justification:** Governance approval should reduce risk, not trigger broad
  instability.
- Improvements are applied to new work, touched areas, and separately approved
  remediation tasks.
  **Justification:** Incremental adoption preserves delivery and
  recoverability.
- Each phase must produce working, reviewable, and measurable improvements.
  **Justification:** Adoption should be verified through evidence.
- Stable architecture remains in place unless a material problem and approved
  alternative are documented.
  **Justification:** Change requires more than stylistic preference.

## 51. Phase 1 — Safety and Governance Foundation

Priority outcomes:

1. CI gates for lint, TypeScript, an initial test command, and production
   builds.
2. Initial automated tests for the most critical authentication,
   authorization, invitation, application, and lifecycle paths.
3. Logging cleanup, including removal of raw identity/staff diagnostics and
   adoption of a minimal structured logging boundary.
4. Branch and pull-request governance, including protected `main`, branch
   naming, PR evidence, and required checks.
5. Documentation correction, including ADR statuses, project overview,
   architecture, roadmap, changelog, database blueprint, document dates, and
   governance hierarchy.

**Exit evidence:** Required checks run automatically; critical tests exist;
unsafe diagnostic logs are removed; branch/PR rules are documented and
enforced; governing documentation reflects reality.

## 52. Phase 2 — Contract and Data Integrity

Priority outcomes:

1. Standard API success/error envelopes and HTTP error mapping.
2. Standardized runtime validation for API boundaries.
3. Generated database types with explicit domain mapping.
4. Explicit repository projections replacing broad selection.
5. A canonical migration registry and automated database tests for schema
   creation, functions, RLS, grants, and critical transitions.

**Exit evidence:** API contracts are predictable; runtime inputs are validated;
schema/type drift is detected; repositories expose only required fields;
migrations and security behavior execute successfully against a clean test
database.

## 53. Phase 3 — Operational Maturity

Priority outcomes:

1. Accessibility enforcement through automated and manual critical-flow
   checks.
2. Structured observability, correlation identifiers, safe metrics, and alert
   ownership.
3. Rate limiting and abuse controls for sensitive endpoints.
4. Release automation with staging/promotion, migration ordering, smoke tests,
   and rollback or forward-fix evidence.
5. Internationalization readiness for dates, times, country/language codes,
   currency semantics, and separable user-facing text.

**Exit evidence:** Accessibility gates are active; production behavior is
observable; sensitive endpoints have abuse controls; releases are repeatable;
global data semantics are explicit.

---

# Part VI — Subordinate Document Alignment

## 54. Required Alignment

The following documents remain valuable but become subordinate to this
Constitution and must later be aligned:

- `docs/engineering/ENGINEERING_STANDARDS.md`
- `docs/engineering/CODING_STANDARDS.md`
- `docs/engineering/API_STANDARDS.md`
- `docs/engineering/DATABASE_STANDARDS.md`
- `docs/engineering/SECURITY_STANDARDS.md`
- `docs/engineering/TESTING_STANDARDS.md`
- `docs/engineering/GIT_WORKFLOW.md`
- `docs/engineering/RELEASE_PROCESS.md`
- `docs/engineering/CODE_REVIEW_CHECKLIST.md`
- `docs/architecture/adr/README.md`
- `docs/architecture/adr/ADR-001_Platform_Architecture.md` through
  `ADR-010_Documentation_Standard.md`

`docs/06_WPAG_Digital_Constitution.md` remains the broader institutional and
digital-values constitution. This Engineering Constitution is subordinate to
those institutional values but is the parent standard for software
engineering governance.

## 55. Known Document Conflicts

1. The current coding standard permits either kebab-case or PascalCase for
   component files; this Constitution establishes PascalCase component files
   while prohibiting immediate mass renaming.
2. The current coding standard lists `features/` as an example project folder;
   this Constitution clarifies that `features/<domain>` is optional and future,
   not mandatory.
3. Existing Git guidance uses feature-branch concepts, but observed branch
   purpose and branch contents have diverged; this Constitution requires
   purpose alignment and short-lived branches from `main`.
4. Existing API standards call for versioning broadly; this Constitution
   limits mandatory versioning to independently consumed contracts and
   breaking public changes.
5. Existing testing and release standards describe controls that are not
   currently implemented; the adoption roadmap makes their implementation
   incremental and evidence-based.
6. The ADR index marks most decisions as planned even when implementation has
   begun; statuses must be reconciled.
7. Existing engineering documents do not define a clear authority hierarchy;
   this Constitution now governs conflicts.

---

# Approval

This Constitution is approved by the Founder as the governing parent standard
for WPAG software engineering. Amendments must follow the constitutional change
management process defined above.
