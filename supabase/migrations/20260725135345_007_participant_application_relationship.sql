-- ============================================================================
-- WEALTH PATH AI GLOBAL (WPAG)
-- Domain: Participant Management
-- Migration: 007_participant_application_relationship
-- Purpose: Establish the authoritative application-to-participant relationship.
-- ============================================================================

alter table public.participants
    add constraint participants_application_id_fkey
    foreign key (application_id)
    references public.applications(id)
    on update cascade
    on delete restrict;

create index participants_application_id_idx
    on public.participants(application_id)
    where application_id is not null
      and deleted_at is null;

comment on column public.participants.application_id is
'Original approved WPAG application from which the participant record was created.';
