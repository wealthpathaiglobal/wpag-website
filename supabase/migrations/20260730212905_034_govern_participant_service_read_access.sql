begin;

-- Normalize participant read privileges before applying the approved
-- server-side projection.
revoke select on table public.participants
from public, anon, authenticated, service_role;

revoke select (
    id,
    participant_code,
    auth_user_id,
    application_id,
    lifecycle_status,
    research_status,
    enrollment_date,
    completion_date,
    withdrawal_date,
    withdrawal_reason,
    internal_notes,
    created_at,
    updated_at,
    deleted_at,
    created_by,
    updated_by
)
on public.participants
from public, anon, authenticated, service_role;

grant select (
    id,
    participant_code,
    auth_user_id,
    application_id,
    lifecycle_status,
    research_status,
    enrollment_date,
    created_at,
    deleted_at
)
on public.participants
to service_role;

comment on table public.participants is
'Central participant master record. Direct service-role reads are restricted to an approved projection; participant writes remain governed by dedicated functions.';

-- Participant profile projection used by the administrative participant list.
revoke select on table public.participant_profiles
from public, anon, authenticated, service_role;

revoke select (
    id,
    participant_id,
    first_name,
    middle_name,
    last_name,
    preferred_name,
    date_of_birth,
    gender,
    marital_status,
    email,
    phone_country_code,
    phone_number,
    country_code,
    state,
    district,
    city,
    postal_code,
    education_level,
    occupation,
    employment_status,
    household_size,
    dependents,
    emergency_contact_name,
    emergency_contact_relationship,
    emergency_contact_phone,
    profile_completed,
    profile_completed_at,
    created_at,
    updated_at,
    deleted_at,
    created_by,
    updated_by
)
on public.participant_profiles
from public, anon, authenticated, service_role;

grant select (
    participant_id,
    first_name,
    middle_name,
    last_name,
    preferred_name,
    email
)
on public.participant_profiles
to service_role;

comment on table public.participant_profiles is
'Current editable participant profile. Direct service-role reads are restricted to the administrative participant-list projection.';

-- Application projection used by participant detail and invitation prechecks.
revoke select on table public.applications
from public, anon, authenticated, service_role;

revoke select (
    id,
    application_code,
    auth_user_id,
    full_name,
    email,
    phone_country_code,
    phone_number,
    country_code,
    state_or_region,
    city,
    age_group,
    employment_status,
    application_reason,
    financial_challenges,
    expectations,
    referral_source,
    status,
    submitted_at,
    reviewed_at,
    reviewed_by,
    converted_at,
    internal_notes,
    source_ip,
    user_agent,
    created_at,
    updated_at,
    deleted_at,
    created_by,
    updated_by
)
on public.applications
from public, anon, authenticated, service_role;

grant select (
    id,
    application_code,
    full_name,
    email,
    phone_country_code,
    phone_number,
    country_code,
    state_or_region,
    city
)
on public.applications
to service_role;

comment on table public.applications is
'Applications submitted for WPAG participation. Direct service-role reads from participant administration are restricted to an approved identity and contact projection.';

-- Append-only lifecycle history projection used by participant detail.
revoke select on table public.participant_lifecycle_history
from public, anon, authenticated, service_role;

revoke select (
    id,
    participant_id,
    from_status,
    to_status,
    transition_reason,
    changed_by,
    changed_at,
    metadata
)
on public.participant_lifecycle_history
from public, anon, authenticated, service_role;

grant select (
    id,
    participant_id,
    from_status,
    to_status,
    transition_reason,
    changed_at,
    changed_by,
    metadata
)
on public.participant_lifecycle_history
to service_role;

comment on table public.participant_lifecycle_history is
'Immutable participant lifecycle history. Service-role reads use the approved administrative timeline projection; mutation remains prohibited.';

-- Invitation status projection used by participant detail. Provider
-- diagnostics in last_error remain excluded.
revoke select on table public.participant_invitations
from public, anon, authenticated, service_role;

revoke select (
    id,
    participant_id,
    email,
    auth_user_id,
    status,
    invited_at,
    accepted_at,
    revoked_at,
    expires_at,
    invitation_attempts,
    last_error,
    invited_by,
    created_at,
    updated_at
)
on public.participant_invitations
from public, anon, authenticated, service_role;

grant select (
    id,
    participant_id,
    status,
    invited_at,
    expires_at,
    auth_user_id,
    created_at
)
on public.participant_invitations
to service_role;

comment on table public.participant_invitations is
'Auditable participant invitation lifecycle. Direct service-role reads are restricted to an approved status projection and exclude provider diagnostics.';

commit;
