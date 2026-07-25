-- ============================================================================
-- WEALTH PATH AI GLOBAL (WPAG)
-- Migration: 002_common_functions
-- Purpose: Common database functions used across all WPAG tables.
-- ============================================================================

-- Automatically updates the updated_at column whenever a row changes.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

comment on function public.set_updated_at is
'Automatically updates the updated_at timestamp before UPDATE operations.';