# Architecture Decision Record (ADR)

---

# Document Information

| Field | Value |
|--------|-------|
| ADR ID | ADR-002 |
| Title | Database Strategy |
| Version | v1.0 |
| Status | Accepted |
| Document Type | Architecture Decision Record |
| Classification | Internal |
| Owner | Founder |
| Organization | Wealth Path AI Global (WPAG) |
| Created | |
| Last Updated | |
| Effective Date | |
| Next Review Date | |

---

# 1. Purpose

This Architecture Decision Record defines the official database strategy for the Wealth Path AI Global (WPAG) platform.

It establishes the principles governing database design, schema management, migrations, data integrity, scalability, security, and long-term maintainability.

---

# 2. Context

WPAG manages institutional data including participant information, assessments, evidence, reports, tasks, notifications, and audit records.

The database must provide:

- Reliable data storage
- Strong data integrity
- Controlled schema evolution
- High maintainability
- Production-ready deployment practices
- Future scalability

Database design should support long-term platform growth without requiring major structural redesign.

---

# 3. Decision

WPAG adopts the following database strategy:

- PostgreSQL is the primary relational database.
- Supabase is the managed backend platform.
- Database schema changes are managed through version-controlled SQL migrations.
- Every database change shall be committed to source control.
- Business logic shall primarily reside within the application layer.
- The database is responsible for persistence, relationships, constraints, indexes, and transactional consistency.
- Production database changes shall follow an approved migration workflow.

---

# 4. Rationale

This strategy provides:

- Reliable relational data management
- ACID transaction support
- Strong referential integrity
- Controlled schema evolution
- Easy rollback planning
- Long-term maintainability
- Team collaboration through version control
- Consistent production deployments

---

# 5. Consequences

## Positive

- Predictable database evolution
- Stable production deployments
- Improved governance
- Easier auditing
- Better scalability

## Trade-offs

- Additional planning before schema changes
- More disciplined deployment process

## Risks

- Poorly designed migrations may affect production if not reviewed.

## Future Considerations

Future database expansion may include:

- Performance optimisation
- Read replicas
- Partitioning
- Archival strategies
- Advanced analytics
- AI-related data models

---

# 6. Implementation Impact

Affected Areas:

- Database
- Backend
- APIs
- Authentication
- Authorization
- Reporting
- Audit
- Documentation

Implementation Notes:

All schema modifications shall be introduced through reviewed migration files and tracked in version control.

---

# 7. Related Documents

- ADR-001 Platform Architecture
- Database Architecture
- Engineering Standards
- Sprint-02 Production Database Migrations

---

# 8. Approval

| Role | Name | Status |
|------|------|--------|
| Founder | Srinivas Goud | Approved |

---

# 9. Change History

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | | Initial Version |
