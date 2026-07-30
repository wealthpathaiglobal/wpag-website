begin;

-- ============================================================================
-- WEALTH PATH AI GLOBAL (WPAG)
-- Domain: Participant Enrollment and Lifecycle
-- Migration: 033_harden_participant_lifecycle_protection
-- Purpose:
-- Protect every lifecycle-controlled participant field and enforce append-only
-- participant lifecycle history.
-- ============================================================================

create or replace function public.protect_participant_lifecycle_status()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
    if not (
        new.lifecycle_status is distinct from old.lifecycle_status
        or new.enrollment_date is distinct from old.enrollment_date
        or new.completion_date is distinct from old.completion_date
        or new.withdrawal_date is distinct from old.withdrawal_date
        or new.withdrawal_reason is distinct from old.withdrawal_reason
    ) then
        return new;
    end if;

    if coalesce(
        current_setting(
            'wpag.transition_context',
            true
        ),
        ''
    ) <> 'participant_lifecycle' then
        raise exception
            'Participant lifecycle-controlled fields must be changed through transition_participant_lifecycle().';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_participants_protect_lifecycle_status
on public.participants;

create trigger trg_participants_protect_lifecycle_status
before update of
    lifecycle_status,
    enrollment_date,
    completion_date,
    withdrawal_date,
    withdrawal_reason
on public.participants
for each row
execute function public.protect_participant_lifecycle_status();

create or replace function public.prevent_participant_lifecycle_history_mutation()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
    raise exception 'Participant lifecycle history is immutable.';
end;
$$;

drop trigger if exists trg_participant_lifecycle_history_immutable
on public.participant_lifecycle_history;

create trigger trg_participant_lifecycle_history_immutable
before update or delete
on public.participant_lifecycle_history
for each row
execute function public.prevent_participant_lifecycle_history_mutation();

comment on function public.protect_participant_lifecycle_status() is
'Lifecycle-controlled participant fields may change only through the governed transition path.';

comment on trigger trg_participants_protect_lifecycle_status
on public.participants is
'Protects lifecycle-controlled participant fields by requiring the governed transition path.';

comment on function public.prevent_participant_lifecycle_history_mutation() is
'Enforces append-only participant lifecycle history by rejecting updates and deletes. Exceptional repairs require a separately reviewed forward migration.';

comment on trigger trg_participant_lifecycle_history_immutable
on public.participant_lifecycle_history is
'Prevents participant lifecycle history updates and deletes. Exceptional repairs require a separately reviewed forward migration.';

commit;
