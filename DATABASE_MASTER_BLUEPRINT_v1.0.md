# WPAG Production Database Master Blueprint
Version: v1.0

---

# Project

Wealth Path AI Global (WPAG)

Database Platform:
Supabase PostgreSQL

Branch:
sprint-02-production-foundation

Status:
Production

---

# Purpose

This document is the master architectural blueprint for the WPAG production database.

It defines every production database module, implementation order, dependencies, and deployment status.

This document is the single authoritative reference for all future database development.

---

# Design Principles

- Production First
- One Module = One Migration
- One Responsibility per Table
- Immutable Raw Data
- Append-only History
- Evidence-based Architecture
- Auditability by Default
- Backward Compatibility
- Version Controlled
- Production Reviewed Before Deployment

---

# Migration Workflow

Design

↓

SQL Review

↓

Migration Creation

↓

Lint

↓

Dry Run

↓

Production Deployment

↓

Verification

↓

Git Commit

↓

GitHub Push

---

# Production Module Roadmap

## Phase 1 — Foundation

| DB | Module | Status |
|----|--------|--------|
| DB-001 | Extensions | ✅ Complete |
| DB-002 | Common Functions | ✅ Complete |

---

## Phase 2 — Participant Lifecycle

| DB | Module | Status |
|----|--------|--------|
| DB-003 | Participants | ✅ Complete |
| DB-004 | Applications | ✅ Complete |
| DB-005 | Eligibility Reviews | ✅ Complete |
| DB-006 | Consents | ✅ Complete |
| DB-007 | Participant Relationships | ✅ Complete |
| DB-008 | Participant Profiles | ✅ Complete |

---

## Phase 3 — Assessment Engine

| DB | Module | Status |
|----|--------|--------|
| DB-009 | Assessment Sessions | ✅ Complete |
| DB-010 | Assessments | ✅ Complete |
| DB-011 | Assessment Answers | ✅ Complete |
| DB-012 | Assessment Documents | ✅ Complete |
| DB-013 | Assessment Reviews | ✅ Complete |
| DB-014 | Assessment Audit Log | ✅ Complete |
| DB-015 | Evidence Verification History | ✅ Complete |
| DB-016 | Workflow Status History | ✅ Complete |

---

## Phase 4 — Operations

| DB | Module | Status |
|----|--------|--------|
| DB-017 | Tasks & Assignments | Planned |
| DB-018 | Notifications | Planned |
| DB-019 | File Version History | Planned |
| DB-020 | Activity Timeline | Planned |

---

## Phase 5 — HFOS Engine

| DB | Module | Status |
|----|--------|--------|
| DB-021 | HFOS Diagnosis | Planned |
| DB-022 | HFOS Indicators | Planned |
| DB-023 | HFOS Scores | Planned |
| DB-024 | HFOS Risk Factors | Planned |
| DB-025 | HFOS Treatment Plans | Planned |
| DB-026 | HFOS Follow-ups | Planned |
| DB-027 | HFOS Progress Reviews | Planned |

---

## Phase 6 — Security

| DB | Module | Status |
|----|--------|--------|
| DB-028 | Users | Planned |
| DB-029 | Roles | Planned |
| DB-030 | Permissions | Planned |
| DB-031 | User Role Assignments | Planned |
| DB-032 | API Keys | Planned |
| DB-033 | System Configuration | Planned |
| DB-034 | Feature Flags | Planned |

---

## Phase 7 — Reporting

| DB | Module | Status |
|----|--------|--------|
| DB-035 | Report Jobs | Planned |
| DB-036 | Export History | Planned |
| DB-037 | Analytics Snapshots | Planned |
| DB-038 | Dashboard Cache | Planned |

---

## Phase 8 — Reference Data

| DB | Module | Status |
|----|--------|--------|
| DB-039 | Lookup Values | Planned |
| DB-040 | Countries & Regions | Planned |
| DB-041 | Occupations | Planned |
| DB-042 | Income Categories | Planned |
| DB-043 | Expense Categories | Planned |

---

# Current Production Progress

Completed Modules:

16

Remaining Modules:

27

Total Planned Modules:

43

---

# Production Standards

Every migration must satisfy the following requirements before deployment.

- SQL reviewed
- Naming conventions followed
- Foreign keys validated
- Constraints validated
- Indexes reviewed
- Comments included
- Lint passed
- Dry run passed
- Production deployment successful
- Migration verification completed
- Git committed
- GitHub pushed

---

# Governance Rule

No production schema changes may bypass this blueprint.

Every new database module must:

1. Be added to this blueprint.
2. Receive architectural approval.
3. Follow the standard production deployment workflow.
4. Be version controlled.
5. Be fully verified after deployment.

---

END OF DOCUMENT
