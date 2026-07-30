# Architecture Decision Record (ADR)

---

# Document Information

| Field | Value |
|--------|-------|
| ADR ID | ADR-004 |
| Title | Authorization Strategy |
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

This Architecture Decision Record defines the authorization strategy for the Wealth Path AI Global (WPAG) platform.

Its purpose is to establish how authenticated users are granted access to platform resources based on their assigned roles and permissions while protecting sensitive information and maintaining institutional governance.

---

# 2. Context

Authentication confirms a user's identity.

Authorization determines what an authenticated user is permitted to access or modify.

WPAG contains multiple categories of users with different responsibilities, including:

- Participants
- Administrators
- Researchers
- Future organizational staff

The platform requires a consistent authorization model that protects sensitive data while supporting future expansion.

---

# 3. Decision

WPAG adopts Role-Based Access Control (RBAC) as its primary authorization model.

Authorization shall be implemented using:

- Defined user roles
- Least-privilege access
- Server-side permission validation
- Database Row Level Security (RLS)
- Application-level authorization checks

Every authenticated request shall be evaluated before access to protected resources is granted.

Authorization determines **what a user can do**, not **who the user is**.

---

# 4. Rationale

This strategy provides:

- Strong security boundaries
- Clear separation of responsibilities
- Easier administration
- Improved scalability
- Consistent access control
- Better compliance and governance
- Support for future organizational growth

Separating authorization from authentication simplifies maintenance and reduces security risks.

---

# 5. Consequences

## Positive

- Consistent permission management
- Reduced risk of unauthorized access
- Easier role administration
- Improved auditability

## Trade-offs

- Additional role management
- More access-control testing

## Risks

- Incorrect role assignments may expose or restrict access inappropriately.
- Authorization rules must remain synchronized between the application and database.

## Future Considerations

Future enhancements may include:

- Fine-grained permissions
- Department-based roles
- Temporary delegated access
- Approval workflows
- Attribute-Based Access Control (ABAC) where appropriate

---

# 6. Implementation Impact

Affected Areas:

- Authentication
- Authorization
- Backend
- Database
- APIs
- Security
- Administration
- Documentation

Implementation Notes:

Authorization shall be enforced at both the application layer and database layer.

Database Row Level Security (RLS) shall protect sensitive data wherever applicable.

---

# 7. Related Documents

- ADR-001 Platform Architecture
- ADR-002 Database Strategy
- ADR-003 Authentication Strategy
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
