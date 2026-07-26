# Database Standards

---

# Document Information

| Field | Value |
|--------|-------|
| Document Name | Database Standards |
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

This document defines the official database engineering standards for the Wealth Path AI Global (WPAG) platform.

Its purpose is to ensure that database design, schema evolution, migrations, security, and performance remain consistent, maintainable, and scalable throughout the platform lifecycle.

---

# 2. Scope

These standards apply to:

- PostgreSQL database design
- Supabase database implementation
- Tables
- Views
- Functions
- Triggers
- Indexes
- Constraints
- Migrations
- Row Level Security (RLS)

---

# 3. Design Principles

Database engineering shall prioritise:

- Simplicity
- Data integrity
- Normalisation where appropriate
- Scalability
- Performance
- Security
- Maintainability
- Auditability

Business logic should primarily remain within the application layer.

---

# 4. Naming Standards

## Tables

Use plural snake_case.

Examples:

- participants
- assessments
- notifications
- audit_logs

---

## Columns

Use snake_case.

Examples:

- participant_id
- created_at
- updated_at
- assessment_status

---

## Primary Keys

Every table shall have a primary key.

Default:

- id (UUID)

---

## Foreign Keys

Foreign keys should clearly reference the related table.

Examples:

- participant_id
- assessment_id
- user_id

---

# 5. Data Types

Choose the most appropriate data type.

Examples:

- UUID for identifiers
- TIMESTAMPTZ for timestamps
- BOOLEAN for true/false values
- JSONB only where flexible structured data is required

Avoid unnecessarily large data types.

---

# 6. Constraints

Use database constraints to enforce integrity.

Examples:

- PRIMARY KEY
- FOREIGN KEY
- NOT NULL
- UNIQUE
- CHECK

Business rules requiring application context should remain in the application layer.

---

# 7. Indexing

Indexes should be created for:

- Primary keys
- Foreign keys
- Frequently filtered columns
- Frequently sorted columns
- High-volume lookup fields

Indexes should be reviewed periodically to balance query performance and write overhead.

---

# 8. Migration Standards

All schema changes shall be implemented through version-controlled migration files.

Migration workflow:

1. Create migration
2. Review SQL
3. Validate locally
4. Dry run
5. Deploy
6. Verify
7. Commit
8. Push

Direct modification of production schemas outside the migration process is prohibited.

---

# 9. Row Level Security (RLS)

RLS shall be enabled for tables containing protected data.

Policies should follow:

- Least privilege
- Explicit access rules
- Role-based access
- Secure defaults

RLS policies shall be reviewed during security assessments.

---

# 10. Audit Fields

Where applicable, tables should include standard audit fields.

Typical fields include:

- created_at
- updated_at
- created_by
- updated_by

Additional audit requirements shall follow ADR-006 (Audit Strategy).

---

# 11. Soft Deletes

Where business requirements require historical retention, prefer soft deletes.

Typical fields:

- deleted_at
- deleted_by

Physical deletion should be limited to approved operational scenarios.

---

# 12. Performance

Database performance should consider:

- Query efficiency
- Appropriate indexing
- Execution plans
- Connection management
- Transaction scope
- Avoiding unnecessary database round trips

Performance optimisation should be based on measurement.

---

# 13. Backup and Recovery

Database operations shall support:

- Regular backups
- Recovery validation
- Disaster recovery planning
- Data integrity verification

Recovery procedures should be documented and periodically reviewed.

---

# 14. Documentation

Database changes shall include updates to:

- Database documentation
- ER diagrams (where applicable)
- Migration history
- Related ADRs
- Engineering documentation

---

# 15. Related Documents

- ADR-002 Database Strategy
- ADR-006 Audit Strategy
- Engineering Standards
- Git Workflow
- Security Standards

---

# 16. Approval

| Role | Name | Status |
|------|------|--------|
| Founder | Srinivas Goud | Approved |

---

# 17. Change History

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | | Initial Version |
