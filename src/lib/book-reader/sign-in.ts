import type { SupabaseClient } from "@supabase/supabase-js";

// Reuse the existing Auth identity. Never sign up, invite, or create a user as a fallback.
export function signInExistingBookReader(client: SupabaseClient, email: string, password: string) {
  return client.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
}
