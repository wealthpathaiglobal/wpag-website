-- ============================================================================
-- DB-020: Activity Timeline
-- Wealth Path AI Global (WPAG)
-- Version: 1.0
-- ============================================================================

BEGIN;

-- ============================================================================
-- Table: activity_timeline
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.activity_timeline (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    entity_type TEXT NOT NULL,

    entity_id UUID NOT NULL,

    actor_type TEXT NOT NULL CHECK (
        actor_type IN (
            'participant',
            'admin',
            'system'
        )
    ),

    actor_id UUID,

    event_type TEXT NOT NULL,

    event_title TEXT NOT NULL,

    event_description TEXT,

    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb

);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_activity_timeline_entity
ON public.activity_timeline(entity_type, entity_id);

CREATE INDEX idx_activity_timeline_actor
ON public.activity_timeline(actor_type, actor_id);

CREATE INDEX idx_activity_timeline_event_type
ON public.activity_timeline(event_type);

CREATE INDEX idx_activity_timeline_timestamp
ON public.activity_timeline(event_timestamp DESC);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.activity_timeline IS
'Central chronological audit timeline for participants, assessments, evidence, reports, notifications and system activities.';

COMMENT ON COLUMN public.activity_timeline.entity_type IS
'Business entity associated with the event.';

COMMENT ON COLUMN public.activity_timeline.entity_id IS
'Identifier of the related business entity.';

COMMENT ON COLUMN public.activity_timeline.actor_type IS
'Originator of the activity.';

COMMENT ON COLUMN public.activity_timeline.actor_id IS
'Identifier of the user or system responsible for the event.';

COMMENT ON COLUMN public.activity_timeline.event_type IS
'Machine-readable event classification.';

COMMENT ON COLUMN public.activity_timeline.event_title IS
'Short human-readable event summary.';

COMMENT ON COLUMN public.activity_timeline.event_description IS
'Detailed description of the recorded event.';

COMMENT ON COLUMN public.activity_timeline.metadata IS
'Extensible structured metadata associated with the event.';

COMMIT;
