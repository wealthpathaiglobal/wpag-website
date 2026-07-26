# Architecture Decision Record (ADR)

---

# Document Information

| Field | Value |
|--------|-------|
| ADR ID | ADR-007 |
| Title | Notification Strategy |
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

This Architecture Decision Record defines the official notification strategy for the Wealth Path AI Global (WPAG) platform.

Its purpose is to establish a consistent, scalable, and reliable framework for delivering notifications to users while supporting future communication channels and maintaining a clear separation between business events and notification delivery.

---

# 2. Context

WPAG communicates with multiple categories of users, including participants, administrators, researchers, and future organisational staff.

The platform will generate notifications for events such as:

- Account activities
- Participant workflow updates
- Assessment progress
- Evidence review
- Administrative actions
- System announcements
- Security events

The notification system must support multiple delivery channels without requiring changes to business logic.

---

# 3. Decision

WPAG adopts an event-driven notification architecture.

Business services shall generate notification events.

A dedicated notification service shall process those events and deliver notifications through one or more communication channels.

Supported channels include:

- In-app notifications
- Email
- Future push notifications
- Future SMS notifications

Notification delivery shall be independent of the business transaction that generated the event.

Notification preferences shall be configurable where appropriate.

Delivery status shall be tracked for operational monitoring.

---

# 4. Rationale

This strategy provides:

- Separation of concerns
- Improved scalability
- Easier maintenance
- Support for multiple delivery channels
- Better operational monitoring
- Flexible future expansion

Separating notification processing from business logic reduces system coupling and simplifies future enhancements.

---

# 5. Consequences

## Positive

- Consistent notification handling
- Multiple communication channels
- Easier feature expansion
- Improved user experience
- Better monitoring of message delivery

## Trade-offs

- Additional notification infrastructure
- More operational components to manage

## Risks

- Failed deliveries require retry mechanisms.
- Duplicate notifications must be prevented.
- Notification volume must be monitored to avoid excessive system load.

## Future Considerations

Future enhancements may include:

- Notification templates
- Scheduled notifications
- Digest notifications
- User notification preferences
- Multi-language notifications
- External messaging integrations

---

# 6. Implementation Impact

Affected Areas:

- Backend
- APIs
- Database
- Email Services
- Notification Services
- Frontend
- Administration
- Documentation

Implementation Notes:

Business services shall publish notification events rather than sending notifications directly.

Notification processing should support retries, delivery tracking, and future extensibility.

---

# 7. Related Documents

- ADR-001 Platform Architecture
- ADR-002 Database Strategy
- ADR-003 Authentication Strategy
- ADR-004 Authorization Strategy
- ADR-005 Storage Strategy
- ADR-006 Audit Strategy

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
