-- ============================================================================
-- DB-017: Tasks and Assignments
-- ============================================================================
-- Purpose:
-- Stores operational tasks assigned to reviewers, administrators, or other
-- platform users. Each task is independently tracked through its lifecycle.
-- ============================================================================

CREATE TABLE public.tasks_and_assignments (
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

    task_type text NOT NULL,

    title text NOT NULL,

    description text,

    assigned_to uuid,

    assigned_by uuid,

    priority text NOT NULL DEFAULT 'normal'
        CHECK (
            priority IN (
                'low',
                'normal',
                'high',
                'critical'
            )
        ),

    status text NOT NULL DEFAULT 'open'
        CHECK (
            status IN (
                'open',
                'in_progress',
                'on_hold',
                'completed',
                'cancelled'
            )
        ),

    due_at timestamptz,

    completed_at timestamptz,

    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

    created_at timestamptz NOT NULL DEFAULT now(),

    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_taa_entity
ON public.tasks_and_assignments (entity_type, entity_id);

CREATE INDEX idx_taa_assigned_to
ON public.tasks_and_assignments (assigned_to);

CREATE INDEX idx_taa_status
ON public.tasks_and_assignments (status);

CREATE INDEX idx_taa_priority
ON public.tasks_and_assignments (priority);

CREATE INDEX idx_taa_due_at
ON public.tasks_and_assignments (due_at);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.tasks_and_assignments IS
'Operational tasks assigned to platform users.';

COMMENT ON COLUMN public.tasks_and_assignments.entity_type IS
'Type of entity associated with the task.';

COMMENT ON COLUMN public.tasks_and_assignments.entity_id IS
'Identifier of the associated entity.';

COMMENT ON COLUMN public.tasks_and_assignments.task_type IS
'Category of operational task.';

COMMENT ON COLUMN public.tasks_and_assignments.title IS
'Short task title.';

COMMENT ON COLUMN public.tasks_and_assignments.description IS
'Detailed task description.';

COMMENT ON COLUMN public.tasks_and_assignments.assigned_to IS
'User assigned to complete the task.';

COMMENT ON COLUMN public.tasks_and_assignments.assigned_by IS
'User who created or assigned the task.';

COMMENT ON COLUMN public.tasks_and_assignments.priority IS
'Task priority.';

COMMENT ON COLUMN public.tasks_and_assignments.status IS
'Current task status.';

COMMENT ON COLUMN public.tasks_and_assignments.due_at IS
'Task due date and time.';

COMMENT ON COLUMN public.tasks_and_assignments.completed_at IS
'Timestamp when the task was completed.';

COMMENT ON COLUMN public.tasks_and_assignments.metadata IS
'Additional structured metadata associated with the task.';

COMMENT ON COLUMN public.tasks_and_assignments.created_at IS
'Timestamp when the task was created.';

COMMENT ON COLUMN public.tasks_and_assignments.updated_at IS
'Timestamp when the task was last updated.';
