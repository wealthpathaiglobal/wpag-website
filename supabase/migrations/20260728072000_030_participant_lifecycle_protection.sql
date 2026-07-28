-- ============================================================================
-- WEALTH PATH AI GLOBAL (WPAG)
-- Domain: Participant Enrollment and Lifecycle
-- Migration: 030_participant_lifecycle_protection
-- Purpose:
-- Prevent direct participant lifecycle status updates outside the controlled
-- lifecycle transition engine and restrict transition execution to trusted
-- server-side infrastructure.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Lifecycle status protection
-- --------------------------------------------------------------------------

create or replace function public.protect_participant_lifecycle_status()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
    if new.lifecycle_status is not distinct from old.lifecycle_status then
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
            'Participant lifecycle status must be changed through transition_participant_lifecycle().';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_participants_protect_lifecycle_status
on public.participants;

create trigger trg_participants_protect_lifecycle_status
before update of lifecycle_status
on public.participants
for each row
execute function public.protect_participant_lifecycle_status();

-- --------------------------------------------------------------------------
-- Transition function permissions
-- Server-side service role only.
-- --------------------------------------------------------------------------

revoke all
on function public.transition_participant_lifecycle(
    uuid,
    text,
    uuid,
    text,
    jsonb
)
from public;

revoke all
on function public.transition_participant_lifecycle(
    uuid,
    text,
    uuid,
    text,
    jsonb
)
from anon;

revoke all
on function public.transition_participant_lifecycle(
    uuid,
    text,
    uuid,
    text,
    jsonb
)
from authenticated;

grant execute
on function public.transition_participant_lifecycle(
    uuid,
    text,
    uuid,
    text,
    jsonb
)
to service_role;

-- --------------------------------------------------------------------------
-- Documentation
-- --------------------------------------------------------------------------

comment on function public.protect_participant_lifecycle_status() is
'Prevents direct participant lifecycle status updates unless executed through the approved lifecycle transition engine.';

comment on trigger trg_participants_protect_lifecycle_status
on public.participants is
'Protects participant lifecycle integrity by requiring the controlled transition context.';
