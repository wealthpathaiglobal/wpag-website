import { supabaseAdmin } from "@/lib/supabase/admin";

export async function getParticipants() {
  const { data, error } = await supabaseAdmin
    .from("participants")
    .select(`
      id,
      participant_code,
      full_name,
      email,
      lifecycle_status,
      enrollment_date,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load participants: ${error.message}`);
  }

  return data ?? [];
}