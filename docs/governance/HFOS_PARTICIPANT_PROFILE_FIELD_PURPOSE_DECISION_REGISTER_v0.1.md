# HFOS Participant Profile Field-Purpose Decision Register v0.1

## Document control

| Field | Value |
| --- | --- |
| Classification | Research / Privacy / Legal Decision-Preparation Draft |
| Authority | UNAPPROVED / NON-EXECUTABLE |
| Repository baseline | `e4891215c0dd2ede3348bf22389bb3669aaea34b` |
| Scope | Read-only inventory of the current participant-profile collection surface and identifiable repository consumers |
| Explicit boundary | This register does not authorize collection, retention, requiredness, removal, schema change, migration, or participant-data processing. |

## Purpose and method

This register records the current implementation state so that research, privacy, and legal reviewers can decide whether each field has a sufficient purpose and whether its current requiredness is justified. It does not infer a legal basis. “Current documented purpose” reproduces or summarizes only purpose language currently visible in the participant profile interface or an identifiable repository consumer. Absence of a consumer or purpose is recorded rather than filled by assumption.

Necessity classifications are product/repository findings only:

- **Clearly Necessary** — a direct current account, identity/display, or governed assessment consumer is identifiable.
- **Potentially Necessary but Basis Needs Confirmation** — a plausible current product purpose exists, but controlled purpose/necessity authority is insufficient or the downstream consumer is indirect.
- **No Current Necessity Found** — no current downstream consumer or controlled repository purpose sufficient to support collection at this stage was identified.

## Field-purpose decision register

| Profile field | Current requiredness | Storage column/source | Current consumer | Current documented purpose | Necessity classification | Third-party-data status | Decision pending |
| --- | --- | --- | --- | --- | --- | --- | --- |
| First name (`firstName`) | Required for profile completion | `participant_profiles.first_name` | Participant/admin identity display and participant name resolution | Identity section: identify and address the participant | Clearly Necessary | No | No current consumer gap identified; formal approval of this register remains pending |
| Middle name (`middleName`) | Optional | `participant_profiles.middle_name` | Included in resolved full name when no preferred name is used | Identity section only; no field-specific purpose text | Potentially Necessary but Basis Needs Confirmation | No | Yes — confirm identity/display necessity |
| Last name (`lastName`) | Required for profile completion | `participant_profiles.last_name` | Participant/admin identity display and participant name resolution | Identity section: identify and address the participant | Clearly Necessary | No | No current consumer gap identified; formal approval of this register remains pending |
| Preferred name (`preferredName`) | Optional | `participant_profiles.preferred_name` | Preferred participant display name when present | Identity section: how WPAG addresses the participant | Potentially Necessary but Basis Needs Confirmation | No | Yes — confirm display-purpose authority |
| Date of birth (`dateOfBirth`) | Required for profile completion | `participant_profiles.date_of_birth` | Profile persistence; no direct downstream use of this stored profile value identified | UI helper: maintain an accurate participant identity record | No Current Necessity Found | No | Yes — identity purpose and requiredness require confirmation |
| Gender (`gender`) | Required for profile completion | `participant_profiles.gender` | Profile persistence; assessment collects its own separate answer | UI helper: record how the participant wants this represented | No Current Necessity Found | No | Yes — current-stage research/product purpose requires confirmation |
| Marital status (`maritalStatus`) | Required for profile completion | `participant_profiles.marital_status` | Profile persistence; assessment collects its own separate answer | UI helper: part of household context | Potentially Necessary but Basis Needs Confirmation | No | Yes — confirm whether profile-level collection is needed in addition to assessment collection |
| Email (`email`) | Read-only account field; not one of the 17 completion fields | `participant_profiles.email` and linked Supabase Auth identity | Authentication, account linkage, participant/admin identity display | UI label: managed through the participant account | Clearly Necessary | No | No current consumer gap identified; formal approval of this register remains pending |
| Phone country code (`phoneCountryCode`) | Required for profile completion | `participant_profiles.phone_country_code` | Profile persistence; originating application data may populate it; no later governed profile consumer identified | Contact/address section only; no field-specific purpose text | Potentially Necessary but Basis Needs Confirmation | No | Yes — communications/safety purpose and requiredness require confirmation |
| Phone number (`phoneNumber`) | Required for profile completion | `participant_profiles.phone_number` | Profile persistence; originating application data may populate it; no later governed profile consumer identified | Contact/address section only; no field-specific purpose text | Potentially Necessary but Basis Needs Confirmation | No | Yes — communications/safety purpose and requiredness require confirmation |
| Country code (`countryCode`) | Required for profile completion | `participant_profiles.country_code` | Copied into a newly created assessment as governed country context | Contact/location context | Clearly Necessary | No | No current consumer gap identified; formal approval of this register remains pending |
| State or province (`state`) | Required for profile completion | `participant_profiles.state` | Profile persistence; assessment collects its own separate answer | Contact/address section only; no field-specific purpose text | No Current Necessity Found | No | Yes — current-stage purpose and requiredness require confirmation |
| District (`district`) | Optional | `participant_profiles.district` | Profile persistence only; no downstream consumer identified | Contact/address section only; no field-specific purpose text | No Current Necessity Found | No | Yes — collection purpose requires confirmation |
| City (`city`) | Required for profile completion | `participant_profiles.city` | Profile persistence; assessment collects its own separate answer | Contact/address section only; no field-specific purpose text | No Current Necessity Found | No | Yes — current-stage purpose and requiredness require confirmation |
| Postal code (`postalCode`) | Required for profile completion | `participant_profiles.postal_code` | Profile persistence; assessment has a separate optional answer | Contact/address section only; no field-specific purpose text | No Current Necessity Found | No | Yes — current-stage purpose and requiredness require confirmation |
| Education level (`educationLevel`) | Optional | `participant_profiles.education_level` | Profile persistence only; no downstream consumer identified | Context section says the fields describe current personal and household context | No Current Necessity Found | No | Yes — research/product purpose requires confirmation |
| Occupation (`occupation`) | Optional | `participant_profiles.occupation` | Profile persistence; assessment collects its own separate answer | Context section says the fields describe current personal and household context | Potentially Necessary but Basis Needs Confirmation | No | Yes — confirm whether profile-level collection is needed in addition to assessment collection |
| Employment status (`employmentStatus`) | Required for profile completion | `participant_profiles.employment_status` | Profile persistence; assessment collects its own separate answer | Context section says the fields describe current personal and household context | Potentially Necessary but Basis Needs Confirmation | No | Yes — confirm duplicate collection purpose and requiredness |
| Household members (`householdSize`) | Required for profile completion | `participant_profiles.household_size` | Copied into a newly created assessment as governed household size | UI helper: number of people who are part of the household | Clearly Necessary | No — aggregate household count, not a named third party | No current consumer gap identified; formal approval of this register remains pending |
| Financial dependants (`dependents`) | Required for profile completion | `participant_profiles.dependents` | Copied into a newly created assessment as governed dependant count | UI helper: number of people currently financially dependent on the participant | Clearly Necessary | No — aggregate dependant count, not a named third party | No current consumer gap identified; formal approval of this register remains pending |
| Emergency contact name (`emergencyContactName`) | Required for profile completion | `participant_profiles.emergency_contact_name` | Profile persistence; no operative emergency-contact consumer or workflow identified | Emergency section: someone WPAG could contact in an urgent participant-related situation | No Current Necessity Found | Yes — identifies another person | Yes — third-party collection, operative purpose, notice/authority, and requiredness require confirmation |
| Emergency contact relationship (`emergencyContactRelationship`) | Required for profile completion | `participant_profiles.emergency_contact_relationship` | Profile persistence; no operative emergency-contact consumer or workflow identified | Emergency-contact relationship; no field-specific purpose beyond section statement | No Current Necessity Found | Yes — information about another person | Yes — third-party collection, operative purpose, notice/authority, and requiredness require confirmation |
| Emergency contact phone (`emergencyContactPhone`) | Required for profile completion | `participant_profiles.emergency_contact_phone` | Profile persistence; no operative emergency-contact consumer or workflow identified | Emergency contact in international phone format | No Current Necessity Found | Yes — contact data of another person | Yes — third-party collection, operative purpose, notice/authority, and requiredness require confirmation |

## Current consumer trace

| Consumer area | Current behavior |
| --- | --- |
| Profile UI and completion | The UI and service require 17 editable fields before `profile_completed` can be set. Saving an incomplete draft remains separate from completion. |
| Name resolution | Participant/admin views resolve preferred or full participant names from profile name fields. |
| Assessment creation | `country_code`, `household_size`, and `dependents` are copied from the profile into a newly created assessment. |
| Assessment questionnaire | Several demographic/context questions are collected independently in the assessment; repository evidence does not establish that their separate profile copies are consumed by the assessment. |
| Emergency contact | Storage and validation exist, but no operative contact workflow or downstream consumer was identified. |

## Decision queue

The following current required fields can block profile completion while their present-stage necessity remains unconfirmed: date of birth, gender, marital status, phone country code, phone number, state/province, city, postal code, employment status, emergency contact name, emergency contact relationship, and emergency contact phone.

The emergency-contact fields require a distinct third-party-data decision. No removal, optionality change, or collection authorization follows from this finding.

## Repository evidence reviewed

- `src/app/participant/profile/ParticipantProfileClient.tsx`
- `src/lib/services/participant/participant-profile-service.ts`
- `src/lib/repositories/participant/participant-profile-repository.ts`
- `src/lib/types/participant/participant-profile.ts`
- `supabase/migrations/20260725145703_008_participant_profiles.sql`
- `supabase/migrations/20260801125015_041_govern_participant_profile_self_service.sql`
- `supabase/migrations/20260801134527_042_govern_participant_assessment_persistence.sql`

## Authority statement

`HFOS Participant Profile Field-Purpose Decision Register v0.1 remains UNAPPROVED / NON-EXECUTABLE and creates no authority to change participant-profile collection or requiredness.`
