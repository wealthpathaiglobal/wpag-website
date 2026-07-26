# Coding Standards

---

# Document Information

| Field | Value |
|--------|-------|
| Document Name | Coding Standards |
| Version | v1.0 |
| Status | Active |
| Document Type | Engineering Standard |
| Classification | Internal |
| Owner | Founder |
| Organization | Wealth Path AI Global (WPAG) |
| Created | |
| Last Updated | |
| Effective Date | |
| Next Review Date | |

---

# 1. Purpose

This document defines the official coding standards for the Wealth Path AI Global (WPAG) platform.

Its purpose is to ensure that all source code is consistent, maintainable, secure, readable, and scalable throughout the lifecycle of the platform.

---

# 2. Scope

These standards apply to all application code including:

- Frontend
- Backend
- APIs
- Database access
- Services
- Utilities
- Infrastructure scripts
- Automated tests

---

# 3. General Principles

Engineering code shall prioritise:

- Readability
- Simplicity
- Maintainability
- Consistency
- Reusability
- Security
- Performance

Code should be written for future maintainers as well as current developers.

---

# 4. Project Structure

Project folders shall have clear responsibilities.

Examples include:

- app/
- components/
- features/
- services/
- lib/
- hooks/
- types/
- utils/
- styles/
- docs/

Business logic shall remain outside presentation components wherever practical.

---

# 5. Naming Conventions

## Files

- kebab-case for general files
- PascalCase for React components where appropriate

Examples:

- participant-card.tsx
- assessment-service.ts
- UserProfile.tsx

---

## Variables

Use descriptive camelCase names.

Example:

participantScore

Avoid abbreviations unless widely understood.

---

## Functions

Function names should describe behaviour.

Examples:

calculateAssessment()

createParticipant()

generateReport()

---

## Components

React components shall use PascalCase.

Example:

ParticipantDashboard

AssessmentSummary

---

## Constants

Constants shall use UPPER_SNAKE_CASE where globally shared.

Example:

MAX_UPLOAD_SIZE

DEFAULT_TIMEOUT

---

# 6. TypeScript Standards

- Prefer explicit typing.
- Avoid unnecessary use of any.
- Use interfaces and types appropriately.
- Enable strict TypeScript settings.
- Reuse shared types whenever practical.

---

# 7. React & Next.js Standards

- Keep components focused on a single responsibility.
- Prefer server components unless client-side behaviour is required.
- Minimise unnecessary client-side state.
- Separate UI from business logic.

---

# 8. Error Handling

Errors shall:

- Be handled consistently.
- Provide meaningful messages.
- Avoid exposing sensitive implementation details.
- Be logged appropriately.

Unexpected exceptions shall not be silently ignored.

---

# 9. Logging

Logging should assist troubleshooting.

Avoid logging:

- Passwords
- Tokens
- Personal sensitive information
- Secrets

---

# 10. Comments

Comments should explain:

- Why something exists
- Non-obvious business rules
- Important architectural decisions

Avoid comments that merely repeat the code.

---

# 11. Formatting

Maintain consistent formatting across the project.

Use project formatting tools where configured.

Avoid unnecessary formatting differences.

---

# 12. Imports

Imports should be:

- Organised logically
- Free from unused dependencies
- Consistent throughout the project

---

# 13. Environment Variables

Secrets shall never be hardcoded.

Environment-specific configuration shall use environment variables.

Sensitive values shall never be committed to Git.

---

# 14. Performance

Engineering should consider:

- Efficient rendering
- Database query optimisation
- Lazy loading where appropriate
- Code splitting
- Caching strategies

Optimisation should follow measurement rather than assumption.

---

# 15. Security

Follow secure coding practices including:

- Input validation
- Output encoding
- Authentication checks
- Authorization checks
- Principle of least privilege
- Secure handling of user data

---

# 16. AI-Assisted Development

AI-generated code shall:

- Be reviewed before acceptance.
- Follow project coding standards.
- Be tested.
- Be understood by the engineer integrating it.

AI assistance does not replace engineering review.

---

# 17. Code Review Checklist

Before merging code, verify:

- Coding standards followed
- Documentation updated
- Tests completed
- No sensitive information committed
- Error handling implemented
- Security considerations addressed
- Performance impact considered

---

# 18. Related Documents

- Engineering Standards
- Architecture Decision Records
- Database Standards
- API Standards
- Security Standards
- Testing Standards

---

# 19. Approval

| Role | Name | Status |
|------|------|--------|
| Founder | Srinivas Goud | Approved |

---

# 20. Change History

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | | Initial Version |
