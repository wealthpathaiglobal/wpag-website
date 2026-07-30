-- ============================================================================
-- WEALTH PATH AI GLOBAL (WPAG)
-- Domain: Authentication
-- Migration: 019_auth_user_link
-- Purpose:
-- Link participant_profiles with Supabase Auth (auth.users)
-- ============================================================================
-- Notes:
-- - One authenticated user ↔ one participant profile
-- - Authentication remains managed by Supabase Auth
-- - Participant data remains managed by WPAG
-- ============================================================================

alter table public.participant_profiles
add column if not exists auth_user_id uuid;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'participant_profiles_auth_user_id_fkey'
    ) then
        alter table public.participant_profiles
        add constraint participant_profiles_auth_user_id_fkey
        foreign key (auth_user_id)
        references auth.users(id)
        on delete set null;
    end if;
end
$$;

create unique index if not exists
idx_participant_profiles_auth_user_id
on public.participant_profiles(auth_user_id);

comment on column public.participant_profiles.auth_user_id is
'Links the participant profile to the corresponding Supabase Auth user.';
