-- ============================================================================
-- WEALTH PATH AI GLOBAL (WPAG)
-- Domain: Participant Enrollment and Lifecycle
-- Migration: 029_participant_lifecycle_transition_functions
-- Purpose:
-- Validate and execute controlled participant lifecycle transitions while
-- recording immutable lifecycle history.
-- ============================================================================

create or replace function public.transition_participant_lifecycle(
    p_participant_id uuid,
    p_to_status text,
    p_changed_by uuid default null,
    p_reason text default null,
    p_metadata jsonb default '{}'::jsonb
)
returns public.participants
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
    v_participant public.participants%rowtype;
    v_from_status text;
    v_reason text;
begin
    -- ----------------------------------------------------------------------
    -- Input validation
    -- ----------------------------------------------------------------------

    if p_participant_id is null then
        raise exception 'Participant ID is required.';
    end if;

    if p_to_status is null or btrim(p_to_status) = '' then
        raise exception 'Target lifecycle status is required.';
    end if;

    if p_to_status not in (
        'pending_enrollment',
        'active',
        'paused',
        'completed',
        'withdrawn',
        'archived'
    ) then
        raise exception
            'Invalid participant lifecycle status: %',
            p_to_status;
    end if;

    if p_metadata is null
       or jsonb_typeof(p_metadata) <> 'object' then
        raise exception 'Metadata must be a JSON object.';
    end if;

    -- ----------------------------------------------------------------------
    -- Lock and load participant
    -- ----------------------------------------------------------------------

    select *
      into v_participant
      from public.participants
     where id = p_participant_id
     for update;

    if not found then
        raise exception 'Participant not found.';
    end if;

    if v_participant.deleted_at is not null then
        raise exception 'Deleted participants cannot transition.';
    end if;

    v_from_status := v_participant.lifecycle_status;
    v_reason := nullif(btrim(coalesce(p_reason, '')), '');

    if v_from_status = p_to_status then
        raise exception
            'Participant already has lifecycle status: %',
            p_to_status;
    end if;

    -- ----------------------------------------------------------------------
    -- Transition validation
    -- ----------------------------------------------------------------------

    if not (
        (
            v_from_status = 'pending_enrollment'
            and p_to_status in (
                'active',
                'withdrawn',
                'archived'
            )
        )
        or (
            v_from_status = 'active'
            and p_to_status in (
                'paused',
                'completed',
                'withdrawn',
                'archived'
            )
        )
        or (
            v_from_status = 'paused'
            and p_to_status in (
                'active',
                'withdrawn',
                'archived'
            )
        )
        or (
            v_from_status = 'completed'
            and p_to_status = 'archived'
        )
        or (
            v_from_status = 'withdrawn'
            and p_to_status = 'archived'
        )
    ) then
        raise exception
            'Invalid lifecycle transition: % -> %',
            v_from_status,
            p_to_status;
    end if;

    if p_to_status = 'withdrawn'
       and v_reason is null then
        raise exception 'Withdrawal reason is required.';
    end if;

    -- ----------------------------------------------------------------------
    -- Authorize and apply lifecycle transition
    -- ----------------------------------------------------------------------

    perform set_config(
        'wpag.transition_context',
        'participant_lifecycle',
        true
    );

    begin
        update public.participants
           set lifecycle_status = p_to_status,

               enrollment_date = case
                   when p_to_status = 'active'
                        and enrollment_date is null
                       then current_date
                   else enrollment_date
               end,

               completion_date = case
                   when p_to_status = 'completed'
                       then current_date
                   else completion_date
               end,

               withdrawal_date = case
                   when p_to_status = 'withdrawn'
                       then current_date
                   else withdrawal_date
               end,

               withdrawal_reason = case
                   when p_to_status = 'withdrawn'
                       then v_reason
                   else withdrawal_reason
               end,

               updated_by = p_changed_by

         where id = p_participant_id

         returning *
              into v_participant;

        perform set_config(
            'wpag.transition_context',
            '',
            true
        );

    exception
        when others then
            perform set_config(
                'wpag.transition_context',
            '',
                true
            );

            raise;
    end;

    -- ----------------------------------------------------------------------
    -- Record immutable lifecycle history
    -- ----------------------------------------------------------------------

    insert into public.participant_lifecycle_history (
        participant_id,
        from_status,
        to_status,
        transition_reason,
        changed_by,
        metadata
    )
    values (
        p_participant_id,
        v_from_status,
        p_to_status,
        v_reason,
        p_changed_by,
        p_metadata
    );

    return v_participant;
end;
$$;

comment on function public.transition_participant_lifecycle(
    uuid,
    text,
    uuid,
    text,
    jsonb
) is
'Executes validated participant lifecycle transitions and records immutable audit history.';
