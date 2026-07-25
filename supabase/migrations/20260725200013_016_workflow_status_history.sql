-- ============================================================================
-- DB-016: Workflow Status History
-- ============================================================================
-- Purpose:
-- Stores an immutable chronological history of workflow status transitions
-- across the participant lifecycle.
-- One status transition = one row.
-- ============================================================================

CREATE TABLE public.workflow_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    entity_type text NOT NULL
        CHECK (
            entity_type IN (
                'application',
                'eligibility_review',
                'consent',
                'participant_profile',
                'assessment_session',
                'assessment',
                'assessment_document',
                'assessment_review'
            )
        ),

    entity_id uuid NOT NULL,

    previous_status text,

    current_status text NOT NULL,

    transition_reason text,

    changed_by uuid,

    changed_at timestamptz NOT NULL DEFAULT now(),

    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

    created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_wsh_entity
ON public.workflow_status_history (entity_type, entity_id);

CREATE INDEX idx_wsh_current_status
ON public.workflow_status_history (current_status);

CREATE INDEX idx_wsh_changed_at
ON public.workflow_status_history (changed_at);

CREATE INDEX idx_wsh_created_at
ON public.workflow_status_history (created_at);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.workflow_status_history IS
'Immutable history of workflow status transitions across the WPAG platform.';

COMMENT ON COLUMN public.workflow_status_history.entity_type IS
'Type of entity whose workflow status changed.';

COMMENT ON COLUMN public.workflow_status_history.entity_id IS
'Identifier of the related entity record.';

COMMENT ON COLUMN public.workflow_status_history.previous_status IS
'Workflow status before the transition.';

COMMENT ON COLUMN public.workflow_status_history.current_status IS
'Workflow status after the transition.';

COMMENT ON COLUMN public.workflow_status_history.transition_reason IS
'Reason or explanation for the status transition.';

COMMENT ON COLUMN public.workflow_status_history.changed_by IS
'User responsible for the status change.';

COMMENT ON COLUMN public.workflow_status_history.changed_at IS
'Timestamp when the workflow status changed.';

COMMENT ON COLUMN public.workflow_status_history.metadata IS
'Additional structured metadata associated with the transition.';

COMMENT ON COLUMN public.workflow_status_history.created_at IS
'Timestamp when this history record was created.';
