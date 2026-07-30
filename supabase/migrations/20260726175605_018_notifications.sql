-- ============================================================================
-- DB-018: Notifications Engine
-- Wealth Path AI Global (WPAG)
-- Version: 1.0
-- ============================================================================

BEGIN;

-- ============================================================================
-- Table: notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    recipient_type TEXT NOT NULL CHECK (
        recipient_type IN (
            'participant',
            'admin',
            'system'
        )
    ),

    recipient_id UUID,

    notification_type TEXT NOT NULL,

    title TEXT NOT NULL,

    message TEXT NOT NULL,

    priority TEXT NOT NULL DEFAULT 'normal' CHECK (
        priority IN (
            'low',
            'normal',
            'high',
            'critical'
        )
    ),

    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'queued',
            'sent',
            'failed',
            'read'
        )
    ),

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    read_at TIMESTAMPTZ,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())

);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_notifications_recipient
ON public.notifications(recipient_type, recipient_id);

CREATE INDEX idx_notifications_status
ON public.notifications(status);

CREATE INDEX idx_notifications_priority
ON public.notifications(priority);

CREATE INDEX idx_notifications_created_at
ON public.notifications(created_at DESC);

CREATE INDEX idx_notifications_is_read
ON public.notifications(is_read);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.notifications IS
'Central notification engine for participants, administrators and system events.';

COMMENT ON COLUMN public.notifications.recipient_type IS
'Recipient category.';

COMMENT ON COLUMN public.notifications.recipient_id IS
'Recipient identifier.';

COMMENT ON COLUMN public.notifications.notification_type IS
'Business notification classification.';

COMMENT ON COLUMN public.notifications.priority IS
'Notification priority level.';

COMMENT ON COLUMN public.notifications.status IS
'Delivery lifecycle status.';

COMMENT ON COLUMN public.notifications.metadata IS
'Structured notification metadata.';

COMMIT;
