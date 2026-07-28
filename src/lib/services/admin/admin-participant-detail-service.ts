import { supabaseAdmin } from "@/lib/supabase/admin";

export async function getParticipantDetail(participantId: string) {
  const { data: participant, error: participantError } = await supabaseAdmin
    .from("participants")
    .select(`
      id,
      participant_code,
      full_name,
      email,
      lifecycle_status,
      enrollment_date,
      created_at,
      auth_user_id
    `)
    .eq("id", participantId)
    .single();

  if (participantError) {
    throw new Error(
      `Failed to load participant: ${participantError.message}`
    );
  }

  const { data: lifecycleHistory, error: lifecycleError } =
    await supabaseAdmin
      .from("participant_lifecycle_history")
      .select(`
        id,
        from_status,
        to_status,
        transition_reason,
        changed_at,
        changed_by,
        metadata
      `)
      .eq("participant_id", participantId)
      .order("changed_at", { ascending: false });

  if (lifecycleError) {
    throw new Error(
      `Failed to load lifecycle history: ${lifecycleError.message}`
    );
  }

  return {
    participant,
    lifecycleHistory: lifecycleHistory ?? [],
  };
}