# Git Workflow

---

# Document Information

| Field | Value |
|--------|-------|
| Document Name | Git Workflow |
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

This document defines the official Git workflow for the Wealth Path AI Global (WPAG) platform.

Its purpose is to ensure that all source code, documentation, database changes, and releases are version controlled using a consistent, traceable, and reproducible process.

---

# 2. Scope

This workflow applies to:

- Source code
- Database migrations
- Documentation
- Configuration
- Infrastructure
- Tests
- Release management

---

# 3. Branch Strategy

WPAG shall use a structured branching model.

Typical branches include:

- main
- develop (future, if adopted)
- feature/*
- bugfix/*
- hotfix/*
- release/*
- sprint-* (for structured development phases)

Production code shall only reach the main branch through an approved workflow.

---

# 4. Commit Standards

Every commit should:

- Have a clear purpose
- Represent a logical unit of work
- Be small enough to review
- Leave the repository in a working state

Recommended commit types:

- feat:
- fix:
- docs:
- refactor:
- test:
- chore:
- perf:
- ci:

Examples:

- feat(auth): implement participant login
- docs(architecture): add ADR-011
- fix(database): correct foreign key constraint

---

# 5. Development Workflow

The standard workflow is:

1. Update local repository
2. Create or switch to the working branch
3. Implement changes
4. Test changes
5. Update documentation
6. Review changes
7. Stage files
8. Commit
9. Push to remote repository

---

# 6. Database Migration Workflow

Database changes shall follow:

1. Create migration
2. Review SQL
3. Validate locally
4. Dry run
5. Deploy migration
6. Verify deployment
7. Commit migration
8. Push repository

Database schema changes shall never bypass the migration system.

---

# 7. Documentation Workflow

Significant engineering changes shall include documentation updates.

Examples:

- ADRs
- Engineering Standards
- API documentation
- Database documentation
- Changelog

Documentation should be committed together with the related implementation where practical.

---

# 8. Code Review

Before merging:

- Verify coding standards
- Verify testing
- Verify documentation
- Verify security implications
- Verify migration safety
- Verify no sensitive information is committed

---

# 9. Release Workflow

A release should include:

- Completed implementation
- Successful testing
- Documentation updates
- Version updates
- Changelog updates
- Deployment validation

---

# 10. Rollback Strategy

Every significant deployment should have a rollback plan.

Rollback procedures should consider:

- Application code
- Database changes
- Configuration
- Infrastructure

Rollback steps should be documented before production deployment.

---

# 11. Repository Hygiene

The repository should remain:

- Organised
- Well documented
- Free from unnecessary files
- Free from secrets
- Free from generated artefacts unless intentionally version controlled

---

# 12. Related Documents

- Engineering Standards
- Coding Standards
- ADR-002 Database Strategy
- Testing Standards
- Release Process

---

# 13. Approval

| Role | Name | Status |
|------|------|--------|
| Founder | Srinivas Goud | Approved |

---

# 14. Change History

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | | Initial Version |
