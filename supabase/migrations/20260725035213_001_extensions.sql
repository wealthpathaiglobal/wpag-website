-- ============================================================================
-- WEALTH PATH AI GLOBAL (WPAG)
-- Migration: 001_extensions
-- Purpose: Enable PostgreSQL extensions required by the WPAG platform.
-- Status: Initial production foundation
-- ============================================================================

-- Provides cryptographic functions and gen_random_uuid().
create extension if not exists pgcrypto
with schema extensions;

-- Provides case-insensitive text fields, useful for email addresses.
create extension if not exists citext
with schema extensions;
