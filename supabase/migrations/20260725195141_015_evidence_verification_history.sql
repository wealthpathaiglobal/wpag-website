-- ============================================================================
-- DB-015: Evidence Verification History
-- ============================================================================
-- Purpose:
-- Stores an immutable chronological history of evidence verification events.
-- One verification event = one row.
-- ============================================================================

CREATE TABLE public.evidence_verification_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    assessment_document_id uuid NOT NULL
        REFERENCES public.assessment_documents(id)
        ON DELETE CASCADE,

    assessment_review_id uuid
        REFERENCES public.assessment_reviews(id)
        ON DELETE SET NULL,

    verification_event text NOT NULL
        CHECK (
            verification_event IN (
                'submitted',
                'verification_started',
                'information_requested',
                'resubmitted',
                'verified',
                'rejected',
                'expired'
            )
        ),

    verification_status text NOT NULL
        CHECK (
            verification_status IN (
                'pending',
                'in_progress',
                'approved',
                'rejected',
                'expired'
            )
        ),

    verification_result text,

    verified_by uuid,

    verified_at timestamptz,

    comments text,

    internal_notes text,

    supporting_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

    created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_evh_document
ON public.evidence_verification_history (assessment_document_id);

CREATE INDEX idx_evh_review
ON public.evidence_verification_history (assessment_review_id);

CREATE INDEX idx_evh_event
ON public.evidence_verification_history (verification_event);

CREATE INDEX idx_evh_status
ON public.evidence_verification_history (verification_status);

CREATE INDEX idx_evh_created_at
ON public.evidence_verification_history (created_at);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.evidence_verification_history IS
'Immutable history of evidence verification events.';

COMMENT ON COLUMN public.evidence_verification_history.assessment_document_id IS
'Associated assessment document.';

COMMENT ON COLUMN public.evidence_verification_history.assessment_review_id IS
'Associated assessment review when applicable.';

COMMENT ON COLUMN public.evidence_verification_history.verification_event IS
'Verification lifecycle event.';

COMMENT ON COLUMN public.evidence_verification_history.verification_status IS
'Verification status after this event.';

COMMENT ON COLUMN public.evidence_verification_history.verification_result IS
'Outcome or decision summary.';

COMMENT ON COLUMN public.evidence_verification_history.verified_by IS
'Reviewer responsible for the event.';

COMMENT ON COLUMN public.evidence_verification_history.verified_at IS
'Timestamp when verification occurred.';

COMMENT ON COLUMN public.evidence_verification_history.comments IS
'Participant-visible comments.';

COMMENT ON COLUMN public.evidence_verification_history.internal_notes IS
'Internal reviewer notes.';

COMMENT ON COLUMN public.evidence_verification_history.supporting_metadata IS
'Additional structured metadata for the verification event.';

COMMENT ON COLUMN public.evidence_verification_history.created_at IS
'Timestamp when the history record was created.';
