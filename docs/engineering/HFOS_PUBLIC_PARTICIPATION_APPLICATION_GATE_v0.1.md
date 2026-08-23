# HFOS Public Participation Application Gate v0.1

Status: Implementation note — non-authoritative

## Current enforced boundary

Public participant application acceptance is enabled only when the server-side
`SOFT_LAUNCH_RELEASE_GATE` value is exactly `OPEN`. Every other value,
including a missing value, `BLOCKED`, and `UNRESOLVED`, fails closed before
the application service or database write boundary is reached.

The current release state remains `BLOCKED`. This implementation note does not
authorize recruitment, participant enrollment, consent activation, evidence
collection, Pilot, Production, or any release-gate change.

## Eligibility verification dependency

The current preliminary eligibility questionnaire is evaluated in the browser
and does not produce a server-verifiable eligibility decision. The release gate
is therefore the mandatory present control preventing application acceptance.

Before public application acceptance is independently authorized, the project
must decide and govern whether application acceptance requires a durable,
server-verifiable eligibility context. The current browser result must not be
treated as proof of eligibility. This note does not define new eligibility
criteria, change existing eligibility semantics, or authorize an eligibility
implementation.

Decision status: PENDING GOVERNANCE CONFIRMATION BEFORE PUBLIC OPEN.
