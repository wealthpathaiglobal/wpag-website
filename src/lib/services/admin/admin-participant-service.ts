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
      created_at,
      enrollment_date
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load participants: ${error.message}`);
  }

  return data;
}