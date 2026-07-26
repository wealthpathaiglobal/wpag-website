# Architecture Decision Record (ADR)

---

# Document Information

| Field | Value |
|--------|-------|
| ADR ID | ADR-005 |
| Title | Storage Strategy |
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

This Architecture Decision Record defines the official storage strategy for the Wealth Path AI Global (WPAG) platform.

Its purpose is to establish a secure, scalable, and maintainable approach for storing participant documents, evidence, reports, media files, and other digital assets throughout the lifecycle of the platform.

---

# 2. Context

WPAG manages both structured data and unstructured files.

Examples include:

- Participant evidence
- Supporting documents
- Generated reports
- Images
- Attachments
- Future media assets

These files must remain securely stored, accessible only to authorised users, and linked reliably to the platform database.

---

# 3. Decision

WPAG adopts Supabase Storage as the official object storage solution.

The storage strategy shall follow these principles:

- Object storage is separate from the relational database.
- Database tables store file metadata only.
- Binary files are stored in storage buckets.
- Every uploaded file is associated with its database record.
- Access to stored files is protected through authentication and authorisation controls.
- Storage buckets shall be organised according to business purpose.

Example bucket categories may include:

- participant-documents
- evidence
- reports
- system-assets
- temporary-uploads

---

# 4. Rationale

This strategy provides:

- Better scalability
- Improved performance
- Lower database size
- Simplified backup strategies
- Secure file access
- Easier lifecycle management
- Clear separation between structured data and file storage

Keeping files outside the relational database improves long-term maintainability and platform performance.

---

# 5. Consequences

## Positive

- Scalable file management
- Simplified storage administration
- Improved performance
- Better security controls
- Easier future expansion

## Trade-offs

- File metadata and object storage must remain synchronised.
- Storage permissions require careful configuration.

## Risks

- Incorrect storage policies may expose sensitive files.
- Orphaned files may occur if lifecycle processes are not managed correctly.

## Future Considerations

Future enhancements may include:

- File versioning
- Virus scanning
- Automatic image optimisation
- Archive storage
- Retention policies
- Encrypted storage for highly sensitive evidence

---

# 6. Implementation Impact

Affected Areas:

- Storage
- Database
- Backend
- APIs
- Security
- Participant Portal
- Administration
- Documentation

Implementation Notes:

The database shall reference storage objects through metadata.

Files shall never be duplicated unnecessarily, and storage access shall always be governed by authentication and authorisation policies.

---

# 7. Related Documents

- ADR-001 Platform Architecture
- ADR-002 Database Strategy
- ADR-003 Authentication Strategy
- ADR-004 Authorization Strategy
- Security Architecture

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
