-- ============================================================================
-- DB-019: File Version History
-- Wealth Path AI Global (WPAG)
-- Version: 1.0
-- ============================================================================

BEGIN;

-- ============================================================================
-- Table: file_version_history
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.file_version_history (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    file_id UUID NOT NULL,

    version_number INTEGER NOT NULL CHECK (version_number > 0),

    storage_path TEXT NOT NULL,

    file_name TEXT NOT NULL,

    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes >= 0),

    mime_type TEXT NOT NULL,

    checksum TEXT,

    change_summary TEXT,

    created_by UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    UNIQUE (file_id, version_number)

);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_file_version_history_file
ON public.file_version_history(file_id);

CREATE INDEX idx_file_version_history_created_at
ON public.file_version_history(created_at DESC);

CREATE INDEX idx_file_version_history_created_by
ON public.file_version_history(created_by);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.file_version_history IS
'Maintains immutable version history for uploaded files and evidence documents.';

COMMENT ON COLUMN public.file_version_history.file_id IS
'Logical identifier shared by all versions of the same file.';

COMMENT ON COLUMN public.file_version_history.version_number IS
'Sequential version number starting at 1.';

COMMENT ON COLUMN public.file_version_history.storage_path IS
'Storage location for this version.';

COMMENT ON COLUMN public.file_version_history.checksum IS
'Optional checksum for integrity verification.';

COMMENT ON COLUMN public.file_version_history.change_summary IS
'Human-readable description of changes in this version.';

COMMENT ON COLUMN public.file_version_history.metadata IS
'Additional structured metadata for future extensions.';

COMMIT;
